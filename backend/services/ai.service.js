const Groq = require("groq-sdk");

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

const chat = async (prompt) => {
  const result = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return result.choices[0].message.content;
};

/**
 * Genera preguntas con explicación de concepto y pista incluidas.
 */
async function generateQuestions({
  subjectName, unitName, lessonName, topicHint,
  difficulty = "easy", subjectContext = "", count = 5,
  allowedTypes = ["multiple_choice", "true_false", "fill_blank", "order_items", "match_pairs", "sentence_builder"],
}) {
  const difficultyMap = {
    easy: "básico, para alguien que recién aprende el tema",
    medium: "intermedio, asumiendo conocimientos básicos previos",
    hard: "avanzado, requiere razonamiento y aplicación profunda del concepto",
  };

  const typesDescription = {
    multiple_choice:  'opción múltiple con 4 opciones (solo 1 correcta). Campo "options": array de {text, isCorrect, explanation}',
    true_false:       'verdadero/falso. Campo "correctBoolean": true o false',
    fill_blank:       'completar el espacio en blanco (usar ___ en el prompt). Campo "correctAnswers": array de strings aceptados',
    order_items:      'ordenar elementos en secuencia correcta. Campo "items": array de strings en el orden CORRECTO',
    match_pairs:      'relacionar columnas. Campo "pairs": array de {left, right}. IMPORTANTE: todos los valores de "right" deben ser únicos entre sí.',
    sentence_builder: 'completar oración eligiendo palabras. Campo "wordBank": array con las palabras correctas MÁS 2-3 distractores. Campo "correctAnswers": array de strings en orden correcto.',
  };

  const allowedDescriptions = allowedTypes.map((t) => `- ${t}: ${typesDescription[t]}`).join("\n");

  const prompt = `Eres un experto pedagogo especializado en crear ejercicios educativos interactivos al estilo Duolingo.
${subjectContext}

REGLAS OBLIGATORIAS:
1. Responde ÚNICAMENTE con un array JSON válido. Sin texto adicional, sin markdown, sin explicaciones fuera del JSON.
2. Cada pregunta debe tener TODOS estos campos: type, prompt, difficulty, xpValue, explanation, hint, conceptExplanation, tags, y los campos específicos del tipo.
3. Las preguntas deben ser claras, precisas y adecuadas para el nivel indicado.
4. "explanation": explicación post-respuesta educativa y concisa (máx 2 oraciones). Se muestra DESPUÉS de responder.
5. "hint": pista pedagógica (máx 15 palabras) que guía el PROCESO DE PENSAMIENTO sin repetir la pregunta ni revelar la respuesta. Debe sugerir una estrategia o técnica para llegar a la solución. Ejemplos buenos: 'Contá desde el número más grande y agregá el otro de a uno', 'Pensá en objetos cotidianos para visualizarlo'. Ejemplos MALOS (prohibidos): repetir los números de la pregunta, decir directamente qué operación hacer.
6. "conceptExplanation": explicación del concepto matemático o lingüístico general (máx 3 oraciones), sin mencionar los números o palabras específicas de la pregunta. Debe enseñar el concepto de forma general con un ejemplo DIFERENTE al de la pregunta. Ejemplo: si la pregunta es '3+4', explicar qué es la suma con el ejemplo '2+2=4'.
7. Los tags deben ser palabras clave del tema (2-4 tags por pregunta).
8. xpValue: easy=2, medium=3, hard=5.
9. Para match_pairs: los valores del lado derecho deben ser TODOS DISTINTOS. Si los resultados son iguales, usá otro tipo de pregunta.
10. Usá artículos gramaticalmente correctos en español. Verificá el género de cada sustantivo antes de asignarle "el" o "la" (ej: "la miel", "el mono", "la mano").
11."difficulty" debe ser exactamente uno de: "easy", "medium", "hard". NUNCA usar "advanced", "beginner", "intermediate" u otros valores.
12. Para sentence_builder: el prompt DEBE contener al menos un ___ que indique dónde va cada palabra de correctAnswers. Ejemplo: "El ___ es de color rojo" con correctAnswers: ["tomate"]. NUNCA generar sentence_builder sin ___ en el prompt.
13. Para sentence_builder: la cantidad de ___ debe ser acorde a la cantidad de palabra de correctAnswers, Ejemplo: "El color ___ de ___ se perdio" con correctAnswers: ["rojo"] y ["Maria"]. NUNCA generar sentence_builder que no cuenten con cantidad igual de ___ y correctAnswers

Genera ${count} preguntas de práctica sobre:
- Materia: ${subjectName}
- Unidad: ${unitName}
- Lección: ${lessonName}
- Tema específico: ${topicHint}
- Nivel de dificultad: ${difficulty} (${difficultyMap[difficulty]})

Tipos de pregunta permitidos (varía los tipos):
${allowedDescriptions}

Devuelve exactamente este formato JSON (sin markdown, sin texto extra):
[
  {
    "type": "multiple_choice",
    "prompt": "¿Cuánto es 3 + 4?",
    "difficulty": "easy",
    "xpValue": 2,
    "explanation": "3 + 4 = 7. Podés contarlo con los dedos: 3 y luego 4 más.",
    "hint": "Contá desde el número más grande y sumá el otro, por ejemplo 5 mas 4 es igual a 9 por que empiezas en 5 y aregas mas: 5, 6, 7, 8, 9.",
    "conceptExplanation": "La suma une dos grupos de objetos. Si tenés 3 manzanas y agregás 4 más, contás todos juntos para saber cuántos hay en total.",
    "tags": ["suma", "números"],
    "options": [
      {"text": "6", "isCorrect": false, "explanation": "Incorrecto: 3+4 no es 6, solo sumaste 3 no 4"},
      {"text": "7", "isCorrect": true,  "explanation": "Correcto: 3+4=7"},
      {"text": "8", "isCorrect": false, "explanation": "Incorrecto: 3+4 no es 8, sumaste 5 no 4"},
      {"text": "5", "isCorrect": false, "explanation": "Incorrecto: 3+4 no es 5, solo sumaste 2 no 4"}
    ]
  }
]`;

  const rawText = await chat(prompt);
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "}}").trim();

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
    aiModel: MODEL,
    aiGeneratedAt: new Date(),
    isReviewed: false,
    isActive: false,
  }));
}

/**
 * Genera slides de teoría para mostrar antes de las preguntas.
 * 1 slide para fácil, 2 para difícil.
 */
async function generateTheorySlides({
  subjectName, unitName, lessonName, topicHint,
  difficulty = "easy", subjectContext = "",
}) {
  const slideCount = ["medium", "hard"].includes(difficulty) ? 2 : 1;

  const prompt = `Eres un experto pedagogo. Genera ${slideCount} slide(s) de teoría introductoria para una lección educativa.
${subjectContext}

Lección: ${lessonName} (${subjectName} - ${unitName})
Tema: ${topicHint}
Dificultad: ${difficulty}

REGLAS:
1. Responde ÚNICAMENTE con un array JSON válido. Sin markdown, sin texto extra.
2. Cada slide debe ser claro, visual y fácil de entender para un estudiante.
3. Usá ejemplos concretos y cotidianos.
4. NO hagas las preguntas del ejercicio, solo explicá el concepto.
5. El título debe ser corto (máx 5 palabras).
6. El contenido debe ser entre 3 y 5 oraciones simples.
7. Podés incluir un ejemplo simple en "example".

Formato:
[
  {
    "title": "¿Qué es la suma?",
    "content": "La suma es juntar dos o más grupos de cosas para saber cuántas hay en total. Por ejemplo, si tenés 2 lápices y te dan 3 más, ahora tenés 5 lápices.",
    "example": "2 + 3 = 5",
    "icon": "➕"
  }
]`;

  const rawText = await chat(prompt);
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  try {
    const slides = JSON.parse(cleaned);
    return Array.isArray(slides) ? slides : [];
  } catch {
    return [];
  }
}

async function generateHint(question) {
  const prompt = `Genera una pista breve (máximo 20 palabras) para esta pregunta educativa, utiliza un ejemplo similar al ejercicio y ve paso por paso para dicho proceso logico si lo requiere, sin revelar la respuesta directamente:
Pregunta: "${question.prompt}"
Tipo: ${question.type}
Responde SOLO con la pista, y explicando el paso a paso del proceso logico con un ejercicio alternativo, sin texto adicional a ese.`;
  return await chat(prompt);
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

Responde ÚNICAMENTE con la palabra: true o false`;

  const text = await chat(prompt);
  return text.trim().toLowerCase().startsWith("true");
}

module.exports = { generateQuestions, generateTheorySlides, generateHint, evaluateFillBlankAnswer };
