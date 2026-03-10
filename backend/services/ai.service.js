const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Genera preguntas para una lección usando Claude.
 *
 * @param {Object} params
 * @param {string} params.subjectName        - Nombre de la materia (ej: "Matemática")
 * @param {string} params.unitName           - Nombre de la unidad (ej: "Álgebra básica")
 * @param {string} params.lessonName         - Nombre de la lección (ej: "Ecuaciones de 1er grado")
 * @param {string} params.topicHint          - Descripción específica del tema
 * @param {string} params.difficulty         - "easy" | "medium" | "hard"
 * @param {string} params.subjectContext     - Contexto base de la materia (aiPromptContext)
 * @param {number} params.count              - Cantidad de preguntas a generar (default: 5)
 * @param {string[]} params.allowedTypes     - Tipos permitidos (default: todos)
 * @returns {Promise<Object[]>} Array de preguntas listas para insertar en MongoDB
 */
async function generateQuestions({
  subjectName,
  unitName,
  lessonName,
  topicHint,
  difficulty = "easy",
  subjectContext = "",
  count = 5,
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

  const allowedDescriptions = allowedTypes
    .map((t) => `- ${t}: ${typesDescription[t]}`)
    .join("\n");

  const systemPrompt = `Eres un experto pedagogo especializado en crear ejercicios educativos interactivos al estilo Duolingo.
${subjectContext}

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con un array JSON válido. Sin texto adicional, sin markdown, sin explicaciones fuera del JSON.
2. Cada pregunta debe tener: type, prompt, difficulty, xpValue, explanation, tags, y los campos específicos del tipo.
3. Las preguntas deben ser claras, precisas y adecuadas para el nivel indicado.
4. Las explicaciones post-respuesta deben ser educativas y concisas (máximo 2 oraciones).
5. Los tags deben ser palabras clave del tema (2-4 tags por pregunta).
6. xpValue: easy=2, medium=3, hard=5.`;

  const userPrompt = `Genera ${count} preguntas de práctica sobre:
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

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const rawText = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Limpiar posibles backticks de markdown
  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  let questions;
  try {
    questions = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Error parseando respuesta de IA: ${err.message}\nRespuesta: ${cleaned}`);
  }

  if (!Array.isArray(questions)) {
    throw new Error("La IA no devolvió un array de preguntas");
  }

  // Marcar como generadas por IA
  return questions.map((q) => ({
    ...q,
    isAIGenerated: true,
    aiModel: "claude-sonnet-4-20250514",
    aiGeneratedAt: new Date(),
    isReviewed: false, // requieren revisión de admin
    isActive: false,   // inactivas hasta ser revisadas
  }));
}

/**
 * Genera una pista (hint) para una pregunta existente usando IA.
 */
async function generateHint(question) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Genera una pista breve (máximo 20 palabras) para esta pregunta educativa, sin revelar la respuesta directamente:
        
Pregunta: "${question.prompt}"
Tipo: ${question.type}

Responde SOLO con la pista, sin texto adicional.`,
      },
    ],
  });

  return response.content[0]?.text?.trim() || null;
}

/**
 * Evalúa una respuesta de fill_blank con IA cuando no coincide exactamente.
 * Útil para respuestas semánticamente correctas con distinta ortografía.
 */
async function evaluateFillBlankAnswer(prompt, userAnswer, correctAnswers) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Pregunta: "${prompt}"
Respuestas correctas: ${correctAnswers.join(", ")}
Respuesta del estudiante: "${userAnswer}"

¿La respuesta del estudiante es semánticamente correcta o equivalente a alguna respuesta correcta?
Responde SOLO con: "true" o "false"`,
      },
    ],
  });

  const result = response.content[0]?.text?.trim().toLowerCase();
  return result === "true";
}

module.exports = {
  generateQuestions,
  generateHint,
  evaluateFillBlankAnswer,
};
