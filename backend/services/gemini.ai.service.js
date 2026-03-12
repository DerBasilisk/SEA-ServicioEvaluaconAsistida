const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateQuestions({
  subjectName, unitName, lessonName, topicHint,
  difficulty = "easy", subjectContext = "", count = 5,
  allowedTypes = ["multiple_choice", "true_false", "fill_blank", "order_items", "match_pairs"],
}) {
  const difficultyMap = {
    easy: "básico, para alguien que recién aprende el tema",
    medium: "intermedio, asumiendo conocimientos básicos previos",
    hard: "avanzado, requiere razonamiento y aplicación profunda del concepto",
  };

  const typesDescription = {
    multiple_choice: 'opción múltiple con 4 opciones (solo 1 correcta). Campo "options": array de {text, isCorrect, explanation}',
    true_false: 'verdadero/falso. Campo "correctBoolean": true o false',
    fill_blank: 'completar el espacio en blanco (usar ___ en el prompt). Campo "correctAnswers": array de strings aceptados',
    order_items: 'ordenar elementos en secuencia correcta. Campo "items": array de strings en el orden CORRECTO',
    match_pairs: 'relacionar columnas. Campo "pairs": array de {left, right}',
  };

  const allowedDescriptions = allowedTypes.map((t) => `- ${t}: ${typesDescription[t]}`).join("\n");

  const prompt = `Eres un experto pedagogo especializado en crear ejercicios educativos interactivos al estilo Duolingo.
${subjectContext}

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con un array JSON válido. Sin texto adicional, sin markdown, sin explicaciones fuera del JSON.
2. Cada pregunta debe tener: type, prompt, difficulty, xpValue, explanation, tags, y los campos específicos del tipo.
3. Las preguntas deben ser claras, precisas y adecuadas para el nivel indicado.
4. Las explicaciones post-respuesta deben ser educativas y concisas (máximo 2 oraciones).
5. Los tags deben ser palabras clave del tema (2-4 tags por pregunta).
6. xpValue: easy=2, medium=3, hard=5.

Genera ${count} preguntas de práctica sobre:
- Materia: ${subjectName}
- Unidad: ${unitName}
- Lección: ${lessonName}
- Tema específico: ${topicHint}
- Nivel de dificultad: ${difficulty} (${difficultyMap[difficulty]})

Tipos de pregunta permitidos (varía los tipos):
${allowedDescriptions}

Devuelve exactamente este formato JSON:
[
  {
    "type": "multiple_choice",
    "prompt": "¿Cuál es el resultado de 2x = 8?",
    "difficulty": "easy",
    "xpValue": 2,
    "explanation": "Dividiendo ambos lados por 2, obtenemos x = 4.",
    "tags": ["ecuaciones", "algebra"],
    "options": [
      {"text": "x = 2", "isCorrect": false, "explanation": "Incorrecto: 2*2=4, no 8"},
      {"text": "x = 4", "isCorrect": true, "explanation": "Correcto: 2*4=8"},
      {"text": "x = 6", "isCorrect": false, "explanation": "Incorrecto: 2*6=12, no 8"},
      {"text": "x = 16", "isCorrect": false, "explanation": "Incorrecto: confundiste multiplicar con dividir"}
    ]
  }
]`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Error parseando respuesta de IA: ${err.message}\nRespuesta: ${cleaned}`);
  }

  if (!Array.isArray(questions)) throw new Error("La IA no devolvió un array de preguntas");

  return questions.map((q) => ({
    ...q,
    isAIGenerated: true,
    aiModel: "gemini-1.5-flash",
    aiGeneratedAt: new Date(),
    isReviewed: false,
    isActive: false,
  }));
}

async function generateHint(question) {
  const prompt = `Genera una pista breve (máximo 20 palabras) para esta pregunta educativa, sin revelar la respuesta directamente:
Pregunta: "${question.prompt}"
Tipo: ${question.type}
Responde SOLO con la pista, sin texto adicional.`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim() || null;
}

async function evaluateFillBlankAnswer(questionPrompt, userAnswer, correctAnswers) {
  const prompt = `Eres un evaluador educativo. Determiná si la respuesta del estudiante es correcta considerando variantes válidas.

Pregunta: "${questionPrompt}"
Respuestas correctas aceptadas: ${correctAnswers.join(", ")}
Respuesta del estudiante: "${userAnswer}"

Considerá como correcta si:
- Es semánticamente equivalente (ej: "dos" = "2")
- Tiene diferencia de tildes (ej: "matematica" = "matemática") 
- Es un sinónimo válido en contexto educativo
- Tiene mayúsculas/minúsculas distintas
- Tiene espacios extra

Responde ÚNICAMENTE con: true o false`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim().toLowerCase();
  return text === "true";
}

module.exports = { generateQuestions, generateHint, evaluateFillBlankAnswer };