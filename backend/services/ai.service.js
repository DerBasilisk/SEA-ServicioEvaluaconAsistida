// backend/services/ai/ai.service.js
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Circuit Breaker ──────────────────────────────────────────────────────────
// Si un proveedor falla muchas veces seguidas, se "abre" y deja de usarse
// por un tiempo, evitando acumular errores 429 innecesarios.

class CircuitBreaker {
  constructor(name, { failureThreshold = 3, resetTimeMs = 60_000 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeMs = resetTimeMs;
    this.failures = 0;
    this.openedAt = null;
  }

  get isOpen() {
    if (this.openedAt && Date.now() - this.openedAt > this.resetTimeMs) {
      // Ventana de reset: intentar de nuevo (half-open)
      this.failures = 0;
      this.openedAt = null;
      console.log(`🔄 Circuit breaker [${this.name}] reset → intentando de nuevo`);
    }
    return this.openedAt !== null;
  }

  recordSuccess() {
    this.failures = 0;
    this.openedAt = null;
  }

  recordFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
      console.warn(
        `⛔ Circuit breaker [${this.name}] ABIERTO por ${this.resetTimeMs / 1000}s después de ${this.failures} fallos`
      );
    }
  }
}

const geminiBreaker = new CircuitBreaker('Gemini', { failureThreshold: 3, resetTimeMs: 60_000 });

const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean);

const groqPool = GROQ_KEYS.map(apiKey => ({
  client: new Groq({ apiKey }),
  breaker: new CircuitBreaker(`Groq-${apiKey.slice(-6)}`),
}));

let groqPoolIndex = 0;

function getNextGroqClient() {
  // Busca la siguiente key que NO esté con el circuit breaker abierto
  for (let i = 0; i < groqPool.length; i++) {
    const entry = groqPool[groqPoolIndex];
    groqPoolIndex = (groqPoolIndex + 1) % groqPool.length;
    if (!entry.breaker.isOpen) return entry;
  }
  throw new Error('Todas las keys de Groq están saturadas');
}
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.0-flash';

// ─── Helpers de texto ─────────────────────────────────────────────────────────

const cleanJsonResponse = (text) =>
  text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

const parseJsonSafely = (text) => {
  try {
    let parsed = JSON.parse(text);
    if (parsed.preguntas) return parsed.preguntas;
    if (parsed.questions) return parsed.questions;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
};

const normalizeText = (str = '') =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Caché simple en memoria ──────────────────────────────────────────────────
// Evita llamadas repetidas para hints y slides con los mismos parámetros.
// En producción puedes reemplazar esto con Redis.

const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, { value, ts: Date.now() });
  // Evitar que la caché crezca indefinidamente
  if (cache.size > 500) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    cache.delete(oldest[0]);
  }
}

// ─── Cola de concurrencia ─────────────────────────────────────────────────────
// Limita cuántas llamadas a la IA pueden correr EN PARALELO.
// Ajusta MAX_CONCURRENT según los límites de tu plan (empieza con 3).

const MAX_CONCURRENT = 3;
let activeRequests = 0;
const requestQueue = [];

function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    drainQueue();
  });
}

function drainQueue() {
  while (activeRequests < MAX_CONCURRENT && requestQueue.length > 0) {
    const { fn, resolve, reject } = requestQueue.shift();
    activeRequests++;
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeRequests--;
        drainQueue();
      });
  }
}


// ─── Backoff exponencial ──────────────────────────────────────────────────────

async function withExponentialBackoff(fn, { maxRetries = 3, baseDelayMs = 1000, label = '' } = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('rate');
      const isLastAttempt = attempt === maxRetries;

      if (!isRateLimit || isLastAttempt) throw error;

      // Exponential backoff: 1s, 2s, 4s, 8s...  + jitter aleatorio
      const waitMs = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 500;
      console.warn(`⏳ [${label}] Rate limit (intento ${attempt}/${maxRetries}), esperando ${Math.round(waitMs)}ms...`);
      await delay(waitMs);
    }
  }
}

// ─── Llamadas a IA con circuit breaker ────────────────────────────────────────

async function callGroqRaw(prompt, temperature = 0.75) {
  const entry = getNextGroqClient(); // { client, breaker }

  try {
    const completion = await entry.client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: 3200,
      response_format: { type: 'json_object' },
    });
    entry.breaker.recordSuccess();
    return completion.choices[0].message.content;
  } catch (err) {
    entry.breaker.recordFailure();
    throw err;
  }
}

async function callGeminiRaw(prompt, temperature) {
  if (geminiBreaker.isOpen) throw new Error('Gemini circuit breaker abierto');

  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      generationConfig: temperature != null ? { temperature } : undefined,
    });
    geminiBreaker.recordSuccess();
    return result.text;
  } catch (err) {
    geminiBreaker.recordFailure();
    throw err;
  }
}

// ─── callAI: Gemini primero, Groq como fallback ───────────────────────────────
// Ambos con backoff exponencial y circuit breaker integrado.

// ✅ Después — el pool maneja su propio estado
async function callAI(prompt, { temperature } = {}) {
  return enqueueRequest(async () => {
    if (!geminiBreaker.isOpen) {
      try {
        return await withExponentialBackoff(
          () => callGeminiRaw(prompt, temperature),
          { maxRetries: 2, baseDelayMs: 1500, label: 'Gemini' }
        );
      } catch (err) {
        console.warn('⚠️ Gemini falló definitivamente → usando Groq como fallback');
      }
    } else {
      console.warn('⚡ Gemini circuit breaker abierto → usando Groq directamente');
    }

    // Sin groqBreaker — getNextGroqClient() ya lanza error si todos están abiertos
    return await withExponentialBackoff(
      () => callGroqRaw(prompt, temperature ?? 0.75),
      { maxRetries: 2, baseDelayMs: 1000, label: 'Groq' }
    );
  });
}

// callGroq público: también pasa por la cola y tiene backoff
async function callGroq(prompt, temperature = 0.75) {
  return enqueueRequest(() =>
    withExponentialBackoff(() => callGroqRaw(prompt, temperature), {
      maxRetries: 2,
      baseDelayMs: 1000,
      label: 'Groq',
    })
  );
}

// ─── Reglas específicas por materia ──────────────────────────────────────────

function getSubjectRules(subjectName = '', aiPromptContext = '') {
  const name = subjectName.toLowerCase();
  const rules = [];

  if (aiPromptContext && aiPromptContext.trim()) {
    rules.push(`CONTEXTO DE MATERIA: ${aiPromptContext.trim()}`);
  }

  if (name.includes('mecanograf')) {
    rules.push(
      'Esta es una materia de MECANOGRAFÍA. Las preguntas deben ser sobre técnica dactilar, postura, zonas del teclado, dedos asignados a cada tecla, y conceptos de velocidad/precisión (PPM).',
      'NO generes preguntas de programación ni de informática general.',
      'Para "typing": el typingText debe ser una secuencia corta de letras o palabras que ejerciten la zona del teclado mencionada en la lección.',
      'Evita preguntas cuya respuesta sea solo un número sin contexto (ej: "¿Cuántas teclas tiene?") — en cambio pregunta sobre el uso específico de esas teclas.'
    );
  } else if (name.includes('python') || name.includes('programac') || name.includes('informát')) {
    rules.push(
      'Esta es una materia de PROGRAMACIÓN. Prioriza preguntas de tipo "fill_blank" y "multiple_choice" con fragmentos de código reales.',
      'Para "fill_blank" el ___ debe reemplazar una palabra clave de Python (función, método, operador, tipo de dato).',
      'Para "typing" el typingText debe ser una línea de código Python corta y válida (máx 100 caracteres).',
      'Los distractores en multiple_choice deben ser errores comunes de sintaxis, no respuestas absurdas.',
      'Incluye al menos una pregunta sobre qué produce un fragmento de código (output).'
    );
  } else if (name.includes('matem') || name.includes('física') || name.includes('química')) {
    rules.push(
      'Esta es una materia de CIENCIAS EXACTAS. Las preguntas deben incluir al menos una que requiera cálculo o razonamiento cuantitativo.',
      'Para fill_blank con fórmulas, el ___ debe reemplazar una variable o número clave.',
      'Para match_pairs: empareja conceptos con definiciones O fórmulas con sus nombres, NUNCA dos operaciones matemáticas que den el mismo resultado.',
      'Los números en match_pairs deben estar elegidos de forma que todos los resultados de la columna derecha sean distintos entre sí.'
    );
  } else if (name.includes('historia') || name.includes('geografí')) {
    rules.push(
      'Esta es una materia de CIENCIAS SOCIALES. Varía los tipos: no pongas más de 2 preguntas de "¿En qué año...?"',
      'Prioriza preguntas sobre causas, consecuencias y relaciones entre eventos, no solo fechas.',
      'Para match_pairs: empareja eventos con sus consecuencias, personajes con sus hechos, o países con sus características.'
    );
  } else if (name.includes('project moon') || name.includes('trivia') || name.includes('videojuego') || name.includes('juego')) {
    rules.push(
      'Esta es una materia de TRIVIA/LORE. Las preguntas deben ser precisas y verificables dentro del universo del juego.',
      'Usa terminología oficial del juego (nombres de personajes, habilidades, facciones, mecánicas).',
      'Para true_false, usa afirmaciones que los fans expertos puedan debatir — no trivialidades obvias.',
      'Evita spoilers innecesarios en el hint; en cambio orienta sobre en qué parte del juego buscar.',
      'Para match_pairs: empareja personajes con sus facciones, Abnormalities con su clasificación, o Sinners con sus habilidades.'
    );
  } else if (name.includes('inglés') || name.includes('ingles') || name.includes('english')) {
    rules.push(
      'Esta es una materia de INGLÉS. Las preguntas deben estar EN INGLÉS (enunciados, opciones, explicaciones).',
      'Para fill_blank, el ___ debe reemplazar una palabra clave de vocabulario o una forma verbal.',
      'Para sentence_builder, los ítems deben ser palabras en inglés que formen una oración correcta.',
      'Los distractores en multiple_choice deben ser formas incorrectas plausibles (false friends, conjugaciones erróneas).'
    );
  } else if (name.includes('filosofía') || name.includes('ética') || name.includes('etica')) {
    rules.push(
      'Esta es una materia de FILOSOFÍA/ÉTICA. Prioriza preguntas conceptuales y de comprensión sobre memorización.',
      'Para true_false, usa afirmaciones filosóficas que requieran razonamiento, no solo recordar un nombre.',
      'Para free_text, plantea dilemas éticos breves y pide al estudiante que argumente su postura.'
    );
  }

  return rules;
}

// ─── Validaciones de calidad ──────────────────────────────────────────────────

function validateQuestions(questions) {
  const issues = [];

  const prompts = questions.map((q) => normalizeText(q.prompt));
  if (new Set(prompts).size !== prompts.length) issues.push('duplicate_prompts');

  for (const q of questions) {
    if (q.type === 'match_pairs' && Array.isArray(q.pairs)) {
      const rights = q.pairs.map((p) => normalizeText(p.right));
      if (new Set(rights).size !== rights.length) {
        issues.push('match_pairs_duplicate_right');
        break;
      }
    }
    if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
      const texts = q.options.map((o) => normalizeText(o.text));
      if (new Set(texts).size !== texts.length) {
        issues.push('multiple_choice_duplicate_options');
        break;
      }
      if (q.options.filter((o) => o.isCorrect).length !== 1) {
        issues.push('multiple_choice_wrong_correct_count');
        break;
      }
    }
  }

  return issues;
}

// ─── Enriquecer correctAnswers con variantes sin tilde ───────────────────────

function enrichCorrectAnswers(questions) {
  return questions.map((q) => {
    if (q.type !== 'fill_blank' || !Array.isArray(q.correctAnswers)) return q;

    const extended = new Set();
    for (const ans of q.correctAnswers) {
      extended.add(ans.trim());
      extended.add(ans.trim().toLowerCase());
      const normalized = normalizeText(ans);
      extended.add(normalized);
      extended.add(normalized.charAt(0).toUpperCase() + normalized.slice(1));
    }
    return { ...q, correctAnswers: [...extended] };
  });
}

/* =============================================
   1. GENERAR PREGUNTAS (Principal)
   ============================================= */

async function generateQuestions({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  aiPromptContext = '',
  difficulty = 'easy',
  count = 4,
  allowedTypes = ['multiple_choice', 'true_false', 'fill_blank', 'match_pairs', 'sentence_builder', 'free_text', 'typing'],
}) {
  const temperature = difficulty === 'hard' ? 0.9 : 0.75;

  const subjectRules = getSubjectRules(subjectName, aiPromptContext);
  const subjectRulesBlock = subjectRules.length
    ? '\nREGLAS ESPECÍFICAS DE ESTA MATERIA:\n' + subjectRules.map((r) => `- ${r}`).join('\n')
    : '';

  const prompt = `Eres un profesor experto creando preguntas para un simulador de exámenes.

Materia: ${subjectName}
Unidad: ${unitName}
Lección: ${lessonName}
Tema específico: ${topicHint}
Dificultad: ${difficulty}
${subjectRulesBlock}

Genera exactamente ${count} preguntas VARIADAS usando solo estos tipos: ${allowedTypes.join(', ')}.

══════════════════════════════════════════
REGLAS GLOBALES (obligatorias en TODAS las preguntas):
══════════════════════════════════════════

1. UNICIDAD DE PREGUNTAS
   - Cada pregunta debe cubrir un ASPECTO DIFERENTE del tema.
   - Está PROHIBIDO repetir el mismo concepto con diferente redacción.

2. TILDES Y ORTOGRAFÍA
   - Las tildes NO son parte de la respuesta esperada.
   - En fill_blank: correctAnswers debe incluir versión con tilde Y sin tilde.
     Ejemplo: ["ecuación", "ecuacion", "Ecuación", "Ecuacion"]

3. MATCH_PAIRS — COLUMNA DERECHA ÚNICA
   - Todos los valores de "right" DEBEN SER DISTINTOS entre sí.

4. MULTIPLE_CHOICE — OPCIONES ÚNICAS
   - Exactamente UNA opción debe tener isCorrect: true.

5. CAMPOS OBLIGATORIOS en cada pregunta:
   - type, prompt, difficulty, xpValue, explanation, hint, conceptExplanation, tags
   - xpValue: 2=easy, 3=medium, 5=hard
   - hint: máximo 15 palabras, pista estratégica (NO revela la respuesta)

6. REGLAS POR TIPO:
   - multiple_choice → exactamente 4 opciones: [{text, isCorrect, explanation}]
   - true_false → correctBoolean (true o false)
   - fill_blank → correctAnswers: array con variantes (con tilde, sin tilde, mayúscula, minúscula)
   - match_pairs → pairs: [{left, right}] con todos los "right" ÚNICOS
   - sentence_builder → { "prompt": "oración con ___ para cada hueco (mín 2 huecos)", "wordBank": ["palabra1", "palabra2", "palabra3", "palabra_extra_distractor"], "correctOrder": [0, 1, 2] }
   -   OBLIGATORIO: wordBank debe tener MÍNIMO 4 palabras (las correctas + al menos 1 distractor).
   -   correctOrder es el array de índices de wordBank en el orden correcto.
   - typing → "prompt": instrucción al usuario, "typingText": texto corto a transcribir (máx 150 caracteres)

Responde SOLO con el array JSON. Sin texto antes ni después.`;

  console.log(`📤 Generando ${count} preguntas | Materia: "${subjectName}" | Tema: "${topicHint}" | Dificultad: ${difficulty}`);

  const MAX_ATTEMPTS = 3;
  let questions = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rawText = await callAI(prompt, { temperature });
    const cleaned = cleanJsonResponse(rawText);
    questions = parseJsonSafely(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`⚠️ Intento ${attempt}: respuesta vacía o inválida`);
      continue;
    }

    const issues = validateQuestions(questions);

    if (issues.length === 0) {
      console.log(`✅ ${questions.length} preguntas válidas (intento ${attempt})`);
      break;
    }

    console.warn(`⚠️ Intento ${attempt}: ${issues.join(', ')} → reintentando...`);

    if (attempt === MAX_ATTEMPTS) {
      console.warn('⚠️ Máximo de intentos, aplicando correcciones manuales');
      questions = questions.map((q) => {
        if (q.type === 'match_pairs' && Array.isArray(q.pairs)) {
          const seen = new Set();
          q.pairs = q.pairs.filter((p) => {
            const key = normalizeText(p.right);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        return q;
      }).filter(q => {
        // Descartar sentence_builder con wordBank insuficiente en vez de lanzar error
        if (q.type === 'sentence_builder') {
          const ok = Array.isArray(q.wordBank) && q.wordBank.length >= 2;
          if (!ok) console.warn('⚠️ sentence_builder descartada por wordBank insuficiente');
          return ok;
        }
        return true;
      });
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No se pudieron generar preguntas válidas después de varios intentos');
  }

  questions = enrichCorrectAnswers(questions);

  return questions.map((q) => ({
    ...q,
    isAIGenerated: true,
    aiModel: GEMINI_MODEL,
    aiGeneratedAt: new Date(),
    isReviewed: false,
    isActive: false,
  }));
}

/* =============================================
   2. EVALUAR RESPUESTA ABIERTA (free_text)
   ============================================= */

async function evaluateOpenResponse({
  prompt,
  userAnswer,
  evaluationCriteria,
  maxScore = 10,
  isCodeExercise = false,
}) {
  const promptAI = `
Eres un profesor experto. Evalúa la siguiente respuesta del estudiante.

**Pregunta / Tarea:**
${prompt}

**Criterios de evaluación:**
${evaluationCriteria}

**Respuesta del estudiante:**
${userAnswer}

${isCodeExercise ? 'Es un ejercicio de código Python. Verifica que el código sea correcto, eficiente y cumpla con la tarea. Sé estricto con la sintaxis pero tolerante con el estilo.' : ''}

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "score": número del 0 al ${maxScore},
  "approved": true o false,
  "feedback": "explicación clara y educativa para el estudiante",
  "strengths": "puntos fuertes de la respuesta",
  "improvements": "qué se puede mejorar"
}`;

  try {
    // Groq es más rápido para evaluaciones cortas → úsalo primero aquí
    // Si falla, callAI hará el fallback automáticamente
    const result = await callGroq(promptAI);
    return JSON.parse(cleanJsonResponse(result));
  } catch (err) {
    console.warn('⚠️ Groq falló en evaluación, probando Gemini:', err.message);
    try {
      const result = await callAI(promptAI);
      return JSON.parse(cleanJsonResponse(result));
    } catch (err2) {
      console.error('Error evaluando respuesta abierta:', err2);
      return {
        score: 0,
        approved: false,
        feedback: 'No se pudo evaluar la respuesta en este momento.',
        strengths: '',
        improvements: '',
      };
    }
  }
}

/* =============================================
   3. GENERAR SLIDES DE TEORÍA (con caché)
   ============================================= */

async function generateTheorySlides({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  aiPromptContext = '',
  difficulty = 'easy',
}) {
  // Clave de caché: mismo tema + dificultad → mismo resultado
  const cacheKey = `slides:${normalizeText(subjectName)}:${normalizeText(lessonName)}:${normalizeText(topicHint)}:${difficulty}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log('⚡ Slides desde caché');
    return cached;
  }

  const slideCount = difficulty === 'easy' ? 1 : 2;
  const contextBlock = aiPromptContext ? `\nContexto: ${aiPromptContext}` : '';

  const prompt = `Genera ${slideCount} slides de teoría introductoria clara y visual.

Materia: ${subjectName} - ${unitName}${contextBlock}
Lección: ${lessonName}
Tema: ${topicHint}
Dificultad: ${difficulty}

Responde ÚNICAMENTE con un array JSON con este formato:
[
  {
    "title": "Título corto y atractivo (máx 6 palabras)",
    "content": "Contenido claro de 3-5 oraciones",
    "example": "Ejemplo concreto y cotidiano",
    "icon": "emoji relacionado"
  }
]

Usa lenguaje sencillo y ejemplos cotidianos. Adapta el nivel a la dificultad indicada.`;

  const rawText = await callAI(prompt);
  const cleaned = cleanJsonResponse(rawText);

  try {
    const slides = parseJsonSafely(cleaned);
    const result = Array.isArray(slides) ? slides : [];
    cacheSet(cacheKey, result);
    return result;
  } catch (err) {
    console.error('Error parseando slides:', err.message);
    return [];
  }
}

/* =============================================
   4. GENERAR HINT (con caché)
   ============================================= */

async function generateHint(question) {
  // Misma pregunta → mismo hint → cachear
  const cacheKey = `hint:${normalizeText(question.prompt)}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    console.log('⚡ Hint desde caché');
    return cached;
  }

  const prompt = `Genera una pista útil (máximo 15 palabras) para esta pregunta educativa.
No reveles la respuesta. Enfócate en la estrategia de resolución o en qué parte del tema buscar.

Pregunta: "${question.prompt}"
Tipo: ${question.type}

Devuelve solo la pista, sin texto adicional ni comillas.`;

  try {
    const text = await callAI(prompt);
    const hint = text.trim().replace(/^["']|["']$/g, '');
    cacheSet(cacheKey, hint);
    return hint;
  } catch {
    return 'Piensa paso a paso antes de responder';
  }
}

/* =============================================
   5. EVALUAR FILL_BLANK (optimizado)
   ============================================= */

async function evaluateFillBlankAnswer(questionPrompt, userAnswer, correctAnswers) {
  // Comparación directa normalizada (sin IA)
  const userNorm = normalizeText(userAnswer);
  const directMatch = correctAnswers.some((ans) => normalizeText(ans) === userNorm);
  if (directMatch) return true;

  // Comparación por contenido (sin IA): userAnswer está dentro de alguna respuesta correcta
  // Útil para respuestas parciales muy cercanas
  const partialMatch = correctAnswers.some((ans) => {
    const ansNorm = normalizeText(ans);
    return ansNorm.includes(userNorm) || userNorm.includes(ansNorm);
  });

  // Si hay un partial match muy cercano, evitar la llamada a IA para casos obvios
  if (partialMatch && Math.abs(userNorm.length - normalizeText(correctAnswers[0]).length) <= 2) {
    return true;
  }

  // Solo consultar IA si la respuesta es realmente ambigua
  const prompt = `Eres un evaluador estricto pero justo para un examen educativo.

Pregunta: "${questionPrompt}"
Respuestas aceptadas: ${correctAnswers.join(' | ')}
Respuesta del estudiante: "${userAnswer}"

¿Es correcta la respuesta del estudiante?
Considera como correcto:
- Variantes con/sin tilde (México = Mexico)
- Mayúsculas/minúsculas
- Espacios extra
- Abreviaciones reconocidas
NO consideres correctos:
- Sinónimos que cambien el concepto
- Respuestas parciales que omitan información clave

Responde ÚNICAMENTE con: true o false`;

  try {
    const text = await callAI(prompt);
    return text.trim().toLowerCase().startsWith('true');
  } catch {
    return false;
  }
}

// ─── Exportar ─────────────────────────────────────────────────────────────────
module.exports = {
  generateQuestions,
  generateTheorySlides,
  generateHint,
  evaluateFillBlankAnswer,
  evaluateOpenResponse,
  normalizeText,
};