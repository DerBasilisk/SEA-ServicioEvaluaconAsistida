// backend/services/ai/ai.service.js
const Groq = require('groq-sdk');
const { GoogleGenAI } = require('@google/genai');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GROQ_MODEL = "llama-3.3-70b-versatile";

const cleanJsonResponse = (text) => 
  text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

const parseJsonSafely = (text) => {
  try {
    let parsed = JSON.parse(text);
    if (parsed.preguntas) return parsed.preguntas;
    if (parsed.questions) return parsed.questions;
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  }
};

async function callGroq(prompt) {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.75,
    max_tokens: 3200,
    response_format: { type: "json_object" }
  });
  return completion.choices[0].message.content;
}

async function callAI(prompt) {
  try {
    return await callGroq(prompt);
  } catch (error) {
    console.warn("⚠️ Groq falló → fallback a Gemini");
    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const result = await model.generateContent(prompt);
    return result.response.text();
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
  difficulty = "easy",
  count = 4,
  allowedTypes = ["multiple_choice", "true_false", "fill_blank", "match_pairs", "sentence_builder", "free_text", "typing"]
}) {

  const prompt = `Eres un profesor experto creando preguntas para simulador de exámenes.

Materia: ${subjectName}
Unidad: ${unitName}
Lección: ${lessonName}
Tema: ${topicHint}
Dificultad: ${difficulty}

Genera exactamente ${count} preguntas variadas usando solo estos tipos: ${allowedTypes.join(", ")}.

REGLAS ESTRICTAS (cumplelas todas):
- Responde SOLO con un array JSON válido.
- Cada pregunta debe tener: type, prompt, difficulty, xpValue, explanation, hint, conceptExplanation, tags
- xpValue: 2=easy, 3=medium, 5=hard
- hint: máximo 15 palabras, pista estratégica
- explanation: educativa, NUNCA revela la respuesta
- conceptExplanation: concepto general + ejemplo DIFERENTE

REGLA CRÍTICA PARA MATCH_PAIRS:
- El campo "pairs" debe ser un array de objetos: [{ "left": "...", "right": "..." }]
- TODOS los valores de "right" DEBEN SER ÚNICOS (no pueden repetirse).
- Si el tema hace que muchos den el mismo resultado (ej: 4+3, 5+2, 1+6 → todos 7), usa otro tipo de pregunta o cambia los números para que los resultados sean distintos.

Reglas por tipo:
- multiple_choice → exactamente 4 opciones: [{text, isCorrect, explanation}]
- true_false → correctBoolean
- fill_blank → correctAnswers: array
- match_pairs → pairs con right ÚNICOS
- sentence_builder → items en orden correcto
- free_text → no hay respuestas correctas, se evalúa con IA después
- typing: "prompt" debe ser la instrucción (ej: "Transcribe el siguiente fragmento"), "typingText" debe ser el texto corto a escribir (máx ~150 caracteres), No necesita "options" ni "correctAnswer"

¡IMPORTANTE! Si el tema es muy específico y no da para 4 preguntas distintas, inventa un contexto o ejemplo relacionado para crear variedad. Por ejemplo, si la lección es sobre "La fotosíntesis en plantas acuáticas", puedes crear preguntas sobre "¿Qué pigmento es responsable de la fotosíntesis?" o "¿Cómo afecta la luz a la fotosíntesis en el agua?" para diversificar.

¡Nunca generes match_pairs con valores repetidos en la columna derecha!

Devuelve solo el array JSON.`;

  console.log(`📤 Generando ${count} preguntas sobre "${topicHint}"...`);

  // === Reintento automático si hay match_pairs con duplicados ===
  let questions = [];
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    const rawText = await callAI(prompt);
    const cleaned = cleanJsonResponse(rawText);
    questions = parseJsonSafely(cleaned);

    if (!Array.isArray(questions) || questions.length === 0) {
      continue;
    }

    // Validación específica para match_pairs
    const hasDuplicateRight = questions.some(q => {
      if (q.type !== "match_pairs" || !Array.isArray(q.pairs)) return false;
      const rights = q.pairs.map(p => p.right);
      return new Set(rights).size !== rights.length; // hay duplicados
    });

    if (!hasDuplicateRight) {
      console.log(`✅ Generadas ${questions.length} preguntas correctamente (sin duplicados en match_pairs)`);
      break;
    }

    console.warn(`⚠️ Intento ${attempts}: match_pairs con valores duplicados → reintentando...`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No se pudieron generar preguntas válidas después de varios intentos");
  }

  return questions.map(q => ({
    ...q,
    isAIGenerated: true,
    aiModel: GROQ_MODEL,
    aiGeneratedAt: new Date(),
    isReviewed: false,
    isActive: false,
  }));
}

/**
 * Evalúa una respuesta abierta (free_text) usando Groq
 */
async function evaluateOpenResponse({
  prompt,
  userAnswer,
  evaluationCriteria,
  maxScore = 10,
  isCodeExercise = false
}) {
  const promptAI = `
Eres un profesor experto. Evalúa la siguiente respuesta del estudiante.

**Pregunta / Tarea:**  
${prompt}

**Criterios de evaluación:**  
${evaluationCriteria}

**Respuesta del estudiante:**  
${userAnswer}

${isCodeExercise ? "Es un ejercicio de código Python. Verifica que el código sea correcto, eficiente y cumpla con la tarea." : ""}

Responde **ÚNICAMENTE** con un JSON válido con esta estructura exacta:
{
  "score": número del 0 al ${maxScore},
  "approved": true o false,
  "feedback": "explicación clara y educativa para el estudiante",
  "strengths": "puntos fuertes",
  "improvements": "qué se puede mejorar"
}
`;

  try {
    const result = await callGroq(promptAI);
    const parsed = JSON.parse(cleanJsonResponse(result));
    return parsed;
  } catch (err) {
    console.error("Error evaluando respuesta abierta:", err);
    return {
      score: 0,
      approved: false,
      feedback: "No se pudo evaluar la respuesta en este momento.",
      strengths: "",
      improvements: ""
    };
  }
}

/* =============================================
   2. GENERAR SLIDES DE TEORÍA
   ============================================= */
async function generateTheorySlides({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  difficulty = "easy"
}) {
  const slideCount = difficulty === "easy" ? 1 : 2;

  const prompt = `Genera ${slideCount} slides de teoría introductoria clara y visual.

Materia: ${subjectName} - ${unitName}
Lección: ${lessonName}
Tema: ${topicHint}
Dificultad: ${difficulty}

Responde ÚNICAMENTE con un array JSON con este formato:
[
  {
    "title": "Título corto y atractivo (máx 6 palabras)",
    "content": "Contenido claro de 3-5 oraciones",
    "example": "Ejemplo opcional",
    "icon": "emoji relacionado"
  }
]

Usa lenguaje sencillo y ejemplos cotidianos.`;

  const rawText = await callAI(prompt);
  const cleaned = cleanJsonResponse(rawText);

  try {
    const slides = parseJsonSafely(cleaned);
    return Array.isArray(slides) ? slides : [];
  } catch (err) {
    console.error("Error parseando slides:", err.message);
    return [];
  }
}

/* =============================================
   3. GENERAR HINT (Pista)
   ============================================= */
async function generateHint(question) {
  const prompt = `Genera una pista útil (máximo 15 palabras) para esta pregunta educativa.
No reveles la respuesta. Enfócate en la estrategia de resolución.

Pregunta: "${question.prompt}"
Tipo: ${question.type}

Devuelve solo la pista, sin texto adicional.`;

  try {
    const text = await callAI(prompt);
    return text.trim().replace(/^["']|["']$/g, ''); // limpia comillas
  } catch (error) {
    return "Piensa paso a paso antes de responder";
  }
}

/* =============================================
   4. EVALUAR FILL BLANK (con variantes)
   ============================================= */
async function evaluateFillBlankAnswer(questionPrompt, userAnswer, correctAnswers) {
  const prompt = `Eres un evaluador estricto pero justo.

Pregunta: "${questionPrompt}"
Respuestas aceptadas: ${correctAnswers.join(" | ")}
Respuesta del estudiante: "${userAnswer}"

¿Es correcta considerando variantes aceptables (sinónimos, tildes, mayúsculas, espacios)?

Responde ÚNICAMENTE con la palabra: true o false`;

  try {
    const text = await callAI(prompt);
    return text.trim().toLowerCase().startsWith("true");
  } catch (error) {
    // Fallback seguro
    return correctAnswers.some(ans => 
      ans.toLowerCase().trim() === userAnswer.toLowerCase().trim()
    );
  }
}

// ==================== EXPORT ====================
module.exports = {
  generateQuestions,
  generateTheorySlides,
  generateHint,
  evaluateFillBlankAnswer,
  evaluateOpenResponse,
};