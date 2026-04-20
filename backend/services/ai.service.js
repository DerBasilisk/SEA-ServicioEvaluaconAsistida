// backend/services/ai/ai.service.js
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GEMINI_MODEL = "gemini-2.0-flash";

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

/**
 * Normaliza una cadena para comparación:
 * quita tildes, pasa a minúsculas, elimina espacios extra.
 */
const normalizeText = (str = '') =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// ─── Reglas específicas por materia ──────────────────────────────────────────

/**
 * Devuelve instrucciones adicionales para el prompt según la materia.
 * Se usa aiPromptContext del modelo Subject como fuente principal;
 * estas reglas añaden restricciones de formato específicas por tipo.
 */
function getSubjectRules(subjectName = '', aiPromptContext = '') {
  const name = subjectName.toLowerCase();
  const rules = [];

  // Contexto de materia (viene del campo Subject.aiPromptContext)
  if (aiPromptContext && aiPromptContext.trim()) {
    rules.push(`CONTEXTO DE MATERIA: ${aiPromptContext.trim()}`);
  }

  // Reglas adicionales según nombre de la materia
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

/**
 * Verifica que las preguntas no tengan problemas de calidad:
 * - match_pairs con valores derechos duplicados
 * - multiple_choice con opciones de texto duplicado
 * - multiple_choice sin exactamente una respuesta correcta
 * - preguntas con prompt duplicado entre sí
 */
function validateQuestions(questions) {
  const issues = [];

  const prompts = questions.map(q => normalizeText(q.prompt));
  const uniquePrompts = new Set(prompts);
  if (uniquePrompts.size !== prompts.length) {
    issues.push('duplicate_prompts');
  }

  for (const q of questions) {
    if (q.type === 'match_pairs' && Array.isArray(q.pairs)) {
      const rights = q.pairs.map(p => normalizeText(p.right));
      if (new Set(rights).size !== rights.length) {
        issues.push('match_pairs_duplicate_right');
        break;
      }
    }

    if (q.type === 'multiple_choice' && Array.isArray(q.options)) {
      const texts = q.options.map(o => normalizeText(o.text));
      if (new Set(texts).size !== texts.length) {
        issues.push('multiple_choice_duplicate_options');
        break;
      }
      const correctCount = q.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        issues.push('multiple_choice_wrong_correct_count');
        break;
      }
    }
  }

  return issues; // array vacío = todo ok
}

// ─── Enriquecer correctAnswers con variantes sin tilde ───────────────────────

/**
 * Para preguntas fill_blank: añade automáticamente la versión
 * sin tildes de cada respuesta correcta, para que "México" y
 * "Mexico" sean ambas aceptadas sin depender de la IA.
 */
function enrichCorrectAnswers(questions) {
  return questions.map(q => {
    if (q.type !== 'fill_blank' || !Array.isArray(q.correctAnswers)) return q;

    const extended = new Set();
    for (const ans of q.correctAnswers) {
      extended.add(ans.trim());
      extended.add(ans.trim().toLowerCase());
      const normalized = normalizeText(ans);
      extended.add(normalized);
      // Capitalizado sin tilde (ej: "Mexico")
      extended.add(normalized.charAt(0).toUpperCase() + normalized.slice(1));
    }
    return { ...q, correctAnswers: [...extended] };
  });
}

// ─── Llamadas a IA ───────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    max_tokens: 3200,
    response_format: { type: 'json_object' },
  });
  return completion.choices[0].message.content;
}

async function callAI(prompt, { temperature } = {}) {
  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      generationConfig: temperature ? { temperature } : undefined,
    });
    return result.text;
  } catch (error) {
    console.warn('⚠️ Gemini falló → fallback a Groq:', error.message);
    return await callGroq(prompt);
  }
}

/* =============================================
   1. GENERAR PREGUNTAS (Principal)
   ============================================= */
async function generateQuestions({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  aiPromptContext = '',   // <-- viene de Subject.aiPromptContext
  difficulty = 'easy',
  count = 4,
  allowedTypes = ['multiple_choice', 'true_false', 'fill_blank', 'match_pairs', 'sentence_builder', 'free_text', 'typing'],
}) {
  // Temperatura más alta en hard para mayor variedad
  const temperature = difficulty === 'hard' ? 0.9 : 0.75;

  // Reglas específicas de la materia
  const subjectRules = getSubjectRules(subjectName, aiPromptContext);
  const subjectRulesBlock = subjectRules.length
    ? '\nREGLAS ESPECÍFICAS DE ESTA MATERIA:\n' + subjectRules.map(r => `- ${r}`).join('\n')
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
   - Si el tema es muy específico, crea preguntas sobre conceptos relacionados, ejemplos de aplicación o consecuencias del tema.

2. TILDES Y ORTOGRAFÍA
   - Las tildes NO son parte de la respuesta esperada. Trata "México" y "Mexico" como equivalentes.
   - En fill_blank: el campo "correctAnswers" debe incluir SIEMPRE la versión con tilde Y la versión sin tilde de cada respuesta.
     Ejemplo: ["ecuación", "ecuacion", "Ecuación", "Ecuacion"]
   - No pongas tildes en los distractores solo para hacer un distractor "incorrecto" — la diferencia debe ser conceptual.

3. MATCH_PAIRS — COLUMNA DERECHA ÚNICA
   - Todos los valores de "right" DEBEN SER DISTINTOS entre sí (no importa si son conceptos similares).
   - Si el tema matemático genera resultados iguales (ej: 3+4=7 y 2+5=7), usa OTRO tipo de pregunta.
   - Verifica mentalmente que ningún "right" se repita antes de escribir el JSON.

4. MULTIPLE_CHOICE — OPCIONES ÚNICAS
   - Las 4 opciones deben ser conceptualmente distintas, no variantes de la misma idea.
   - Exactamente UNA opción debe tener isCorrect: true.
   - Los distractores deben ser errores plausibles, no absurdos.

5. CAMPOS OBLIGATORIOS en cada pregunta:
   - type, prompt, difficulty, xpValue, explanation, hint, conceptExplanation, tags
   - xpValue: 2=easy, 3=medium, 5=hard
   - hint: máximo 15 palabras, pista estratégica (NO revela la respuesta)
   - explanation: educativa, explica POR QUÉ es correcta (NUNCA revela la respuesta antes de que el usuario intente)
   - conceptExplanation: explica el concepto general con un ejemplo DIFERENTE al de la pregunta
   - tags: array de 2-4 palabras clave del concepto

6. REGLAS POR TIPO:
   - multiple_choice → exactamente 4 opciones: [{text, isCorrect, explanation}]
   - true_false → correctBoolean (true o false)
   - fill_blank → correctAnswers: array con variantes (con tilde, sin tilde, mayúscula, minúscula)
   - match_pairs → pairs: [{left, right}] con todos los "right" ÚNICOS
   - sentence_builder → items: palabras/fragmentos en el ORDEN CORRECTO (se mostrarán mezclados)
   - free_text → sin respuesta correcta, se evalúa con IA; el prompt debe ser una pregunta abierta
   - typing → "prompt": instrucción al usuario, "typingText": texto corto a transcribir (máx 150 caracteres)

Responde SOLO con el array JSON. Sin texto antes ni después.`;

  console.log(`📤 Generando ${count} preguntas | Materia: "${subjectName}" | Tema: "${topicHint}" | Dificultad: ${difficulty}`);

  let questions = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    const rawText = await callAI(prompt, { temperature });
    const cleaned = cleanJsonResponse(rawText);
    questions = parseJsonSafely(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`⚠️ Intento ${attempts}: respuesta vacía o inválida`);
      continue;
    }

    const issues = validateQuestions(questions);

    if (issues.length === 0) {
      console.log(`✅ ${questions.length} preguntas válidas generadas (intento ${attempts})`);
      break;
    }

    console.warn(`⚠️ Intento ${attempts}: problemas detectados → ${issues.join(', ')} → reintentando...`);

    if (attempts === maxAttempts) {
      console.warn('⚠️ Máximo de intentos alcanzado, usando última respuesta con correcciones manuales');
      // Corrección manual de match_pairs con duplicados
      questions = questions.map(q => {
        if (q.type === 'match_pairs' && Array.isArray(q.pairs)) {
          const seen = new Set();
          q.pairs = q.pairs.filter(p => {
            const key = normalizeText(p.right);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
        return q;
      });
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No se pudieron generar preguntas válidas después de varios intentos');
  }

  // Enriquecer correctAnswers con variantes sin tilde
  questions = enrichCorrectAnswers(questions);

  return questions.map(q => ({
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
    const result = await callGroq(promptAI);
    return JSON.parse(cleanJsonResponse(result));
  } catch (err) {
    console.error('Error evaluando respuesta abierta:', err);
    return {
      score: 0,
      approved: false,
      feedback: 'No se pudo evaluar la respuesta en este momento.',
      strengths: '',
      improvements: '',
    };
  }
}

/* =============================================
   3. GENERAR SLIDES DE TEORÍA
   ============================================= */
async function generateTheorySlides({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  aiPromptContext = '',
  difficulty = 'easy',
}) {
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
    return Array.isArray(slides) ? slides : [];
  } catch (err) {
    console.error('Error parseando slides:', err.message);
    return [];
  }
}

/* =============================================
   4. GENERAR HINT (Pista)
   ============================================= */
async function generateHint(question) {
  const prompt = `Genera una pista útil (máximo 15 palabras) para esta pregunta educativa.
No reveles la respuesta. Enfócate en la estrategia de resolución o en qué parte del tema buscar.

Pregunta: "${question.prompt}"
Tipo: ${question.type}

Devuelve solo la pista, sin texto adicional ni comillas.`;

  try {
    const text = await callAI(prompt);
    return text.trim().replace(/^["']|["']$/g, '');
  } catch {
    return 'Piensa paso a paso antes de responder';
  }
}

/* =============================================
   5. EVALUAR FILL_BLANK (con normalización)
   ============================================= */
async function evaluateFillBlankAnswer(questionPrompt, userAnswer, correctAnswers) {
  // Primero: comparación directa normalizada (sin llamada a IA)
  const userNorm = normalizeText(userAnswer);
  const directMatch = correctAnswers.some(ans => normalizeText(ans) === userNorm);

  if (directMatch) return true;

  // Si no hay match directo, consultar a la IA para sinónimos/variantes
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

// ─── Exportar normalizeText para uso en controllers ──────────────────────────
module.exports = {
  generateQuestions,
  generateTheorySlides,
  generateHint,
  evaluateFillBlankAnswer,
  evaluateOpenResponse,
  normalizeText,
};