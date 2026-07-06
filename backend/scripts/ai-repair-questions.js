/**
 * ai-repair-questions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Toma el reporte JSON generado por repair-questions.js (o consulta la BD
 * directamente) y usa Groq (con Gemini como fallback) para corregir cada
 * pregunta problemática, entendiendo el motivo específico de cada error.
 *
 * Flujo:
 *   1. Carga preguntas que necesitan revisión (desde reporte o BD)
 *   2. Por cada pregunta: envía a Groq/Gemini la pregunta completa + errores
 *   3. La IA devuelve SOLO el JSON con los campos corregidos
 *   4. Se valida la respuesta antes de aplicarla
 *   5. Se guarda en MongoDB y se marca isReviewed = true
 *
 * Uso:
 *   node ai-repair-questions.js                          → desde BD (preguntas IA no revisadas)
 *   node ai-repair-questions.js --report <archivo.json>  → desde reporte previo
 *   node ai-repair-questions.js --dry-run                → no guarda, solo muestra correcciones
 *   node ai-repair-questions.js --lesson <lessonId>      → filtra por lección
 *   node ai-repair-questions.js --concurrency 3          → peticiones paralelas (default: 2)
 *
 * Requiere en .env:
 *   MONGO_URI=...
 *   GROQ_API_KEY_1=...
 *   GROQ_API_KEY_2=...   (opcional)
 *   GROQ_API_KEY_3=...   (opcional)
 *   GEMINI_API_KEY=...
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose      = require("mongoose");
const Groq          = require("groq-sdk");
const { GoogleGenAI } = require("@google/genai");
const fs            = require("fs");
const path          = require("path");

// ── Colores ANSI ─────────────────────────────────────────────────────────────
const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  red:     "\x1b[31m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
  cyan:    "\x1b[36m",
  gray:    "\x1b[90m",
};
const log = {
  info:  (msg) => console.log(`${C.blue}ℹ${C.reset}  ${msg}`),
  ok:    (msg) => console.log(`${C.green}✔${C.reset}  ${msg}`),
  warn:  (msg) => console.log(`${C.yellow}⚠${C.reset}  ${msg}`),
  error: (msg) => console.log(`${C.red}✖${C.reset}  ${msg}`),
  ai:    (msg) => console.log(`${C.magenta}✦${C.reset}  ${msg}`),
  fix:   (msg) => console.log(`${C.cyan}⟳${C.reset}  ${msg}`),
  title: (msg) => console.log(`\n${C.bold}${C.blue}══ ${msg} ══${C.reset}`),
  sep:   ()    => console.log(`${C.gray}${"─".repeat(70)}${C.reset}`),
  sub:   (msg) => console.log(`  ${C.gray}${msg}${C.reset}`),
};

// ── Argumentos CLI ────────────────────────────────────────────────────────────
const args           = process.argv.slice(2);
const DRY_RUN        = args.includes("--dry-run");
const reportIdx      = args.indexOf("--report");
const REPORT_FILE    = reportIdx      !== -1 ? args[reportIdx      + 1] : null;
const lessonIdx      = args.indexOf("--lesson");
const LESSON_ID      = lessonIdx      !== -1 ? args[lessonIdx      + 1] : null;
const concurrencyIdx = args.indexOf("--concurrency");
const CONCURRENCY    = concurrencyIdx !== -1 ? parseInt(args[concurrencyIdx + 1], 10) : 2;

// ── Estadísticas ──────────────────────────────────────────────────────────────
const stats = { total: 0, aiFixed: 0, failed: 0, skipped: 0 };

// ═══════════════════════════════════════════════════════════════════════════════
//  PROVEEDORES DE IA  (Groq primero · Gemini como fallback)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Circuit Breaker ───────────────────────────────────────────────────────────
class CircuitBreaker {
  constructor(name, { failureThreshold = 3, resetTimeMs = 60_000 } = {}) {
    this.name             = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeMs      = resetTimeMs;
    this.failures         = 0;
    this.openedAt         = null;
  }

  get isOpen() {
    if (this.openedAt && Date.now() - this.openedAt > this.resetTimeMs) {
      this.failures = 0;
      this.openedAt = null;
      log.info(`Circuit breaker [${this.name}] reset → intentando de nuevo`);
    }
    return this.openedAt !== null;
  }

  recordSuccess() { this.failures = 0; this.openedAt = null; }

  recordFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = Date.now();
      log.warn(`Circuit breaker [${this.name}] ABIERTO por ${this.resetTimeMs / 12000}s`);
    }
  }
}

// ── Pool de Groq (múltiples API keys con round-robin) ─────────────────────────
const GROQ_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean);

if (GROQ_KEYS.length === 0) {
  log.error("No hay ninguna GROQ_API_KEY_* definida en .env");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  log.warn("GEMINI_API_KEY no definida — Gemini no estará disponible como fallback");
}

const groqPool = GROQ_KEYS.map((apiKey) => ({
  client:  new Groq({ apiKey }),
  breaker: new CircuitBreaker(`Groq-${apiKey.slice(-6)}`),
}));

let groqPoolIndex = 0;

function getNextGroqEntry() {
  for (let i = 0; i < groqPool.length; i++) {
    const entry = groqPool[groqPoolIndex];
    groqPoolIndex = (groqPoolIndex + 1) % groqPool.length;
    if (!entry.breaker.isOpen) return entry;
  }
  throw new Error("Todas las keys de Groq están saturadas (circuit breakers abiertos)");
}

const gemini        = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;
const geminiBreaker = new CircuitBreaker("Gemini", { failureThreshold: 3, resetTimeMs: 60_000 });

const GROQ_MODEL   = "llama-3.1-8b-instant";
const GEMINI_MODEL = "gemini-2.0-flash";

// ── Modelo usado para marcar en BD ────────────────────────────────────────────
// Se sobreescribe en tiempo de ejecución según quien responda primero.
let lastModelUsed = GROQ_MODEL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withExponentialBackoff(fn, { maxRetries = 3, baseDelayMs = 1000, label = "" } = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit  = err?.status === 429 || err?.message?.includes("rate");
      const isLastAttempt = attempt === maxRetries;
      if (!isRateLimit || isLastAttempt) throw err;
      const waitMs = baseDelayMs * 2 ** (attempt - 1) + Math.random() * 500;
      log.warn(`[${label}] Rate limit (intento ${attempt}/${maxRetries}), esperando ${Math.round(waitMs)}ms...`);
      await sleep(waitMs);
    }
  }
}

// ── Cola de concurrencia global ───────────────────────────────────────────────
const MAX_CONCURRENT = CONCURRENCY;
let activeRequests   = 0;
const requestQueue   = [];

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
      .finally(() => { activeRequests--; drainQueue(); });
  }
}

// ── Llamada a Groq (JSON forzado por response_format) ────────────────────────
async function callGroqRaw(prompt) {
  const entry = getNextGroqEntry();
  try {
    const completion = await entry.client.chat.completions.create({
      model:           GROQ_MODEL,
      messages:        [{ role: "user", content: prompt }],
      temperature:     0.3,          // baja temperatura para correcciones precisas
      max_tokens:      2000,
      response_format: { type: "json_object" },
    });
    entry.breaker.recordSuccess();
    lastModelUsed = GROQ_MODEL;
    return completion.choices[0].message.content;
  } catch (err) {
    entry.breaker.recordFailure();
    throw err;
  }
}

// ── Llamada a Gemini (fallback) ───────────────────────────────────────────────
async function callGeminiRaw(prompt) {
  if (!gemini)           throw new Error("Gemini no configurado (falta GEMINI_API_KEY)");
  if (geminiBreaker.isOpen) throw new Error("Gemini circuit breaker abierto");

  try {
    const result = await gemini.models.generateContent({
      model:    GEMINI_MODEL,
      contents: prompt,
      generationConfig: { temperature: 0.3 },
    });
    geminiBreaker.recordSuccess();
    lastModelUsed = GEMINI_MODEL;
    return result.text;
  } catch (err) {
    geminiBreaker.recordFailure();
    throw err;
  }
}

// ── callAI: Groq primero, Gemini como fallback ────────────────────────────────
async function callAI(prompt) {
  return enqueueRequest(async () => {
    // Intento con Groq
    try {
      return await withExponentialBackoff(
        () => callGroqRaw(prompt),
        { maxRetries: 2, baseDelayMs: 60000, label: "Groq" }
      );
    } catch (err) {
      log.warn(`Groq falló definitivamente → usando Gemini como fallback (${err.message})`);
    }

    // Fallback Gemini
    if (!gemini || geminiBreaker.isOpen) {
      throw new Error("Groq falló y Gemini no está disponible");
    }

    return await withExponentialBackoff(
      () => callGeminiRaw(prompt),
      { maxRetries: 2, baseDelayMs: 60000, label: "Gemini" }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROMPT  (sistema + usuario fusionados en uno, compatible con Groq/Gemini)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Groq y Gemini no tienen un campo "system" separado en esta integración,
 * así que combinamos el rol de sistema y el mensaje del usuario en un único
 * prompt estructurado con secciones claras.
 */
function buildPrompt(question, issues) {
  const schemasByType = {
    multiple_choice: `{
  "prompt": "string — enunciado de la pregunta",
  "options": [
    { "text": "string", "isCorrect": true|false, "explanation": "string opcional" }
  ]
  // mínimo 2 opciones, exactamente UNA con isCorrect: true, sin textos duplicados
}`,
    true_false: `{
  "prompt": "string — enunciado como afirmación",
  "correctBoolean": true | false
}`,
    fill_blank: `{
  "prompt": "string — oración con ___ donde va la respuesta",
  "correctAnswers": ["respuesta1", "variante2"]
  // prompt DEBE contener exactamente ___ (tres guiones bajos)
}`,
    order_items: `{
  "prompt": "string — enunciado que pide ordenar",
  "items": ["elemento 1", "elemento 2", "elemento 3"]
  // items en ORDEN CORRECTO, mínimo 2
}`,
    match_pairs: `{
  "prompt": "string — instrucción para relacionar",
  "pairs": [{ "left": "columna izquierda", "right": "columna derecha" }]
  // mínimo 2 pares, valores de "right" únicos
}`,
    sentence_builder: `{
  "prompt": "string con ___ donde van las palabras",
  "wordBank": ["palabra1", "palabra2", "palabra3"]
  // wordBank.length >= cantidad de ___ en el prompt
}`,
    typing: `{
  "prompt": "string — instrucción para el ejercicio",
  "typingText": "string — texto EXACTO que el usuario debe tipear"
}`,
    code_python: `{
  "prompt": "string — descripción del problema",
  "testCases": [{
    "description": "string",
    "testType": "stdout" | "return",
    "expectedOutput": "string",
    "callCode": "string (solo si testType es 'return')"
  }]
}`,
    free_text: `{
  "prompt": "string — pregunta abierta",
  "evaluationCriteria": "string — criterios claros para evaluar"
}`,
  };

  const schema = schemasByType[question.type] || `{ "prompt": "string" }`;

  // Campos relevantes del documento (sin ruido de Mongoose)
  const relevantFields = {
    type:               question.type,
    prompt:             question.prompt,
    options:            question.options,
    correctBoolean:     question.correctBoolean,
    correctAnswers:     question.correctAnswers,
    correctAnswer:      question.correctAnswer,
    answer:             question.answer,
    items:              question.items,
    pairs:              question.pairs,
    leftItems:          question.leftItems,
    rightItems:         question.rightItems,
    wordBank:           question.wordBank,
    typingText:         question.typingText,
    testCases:          question.testCases,
    evaluationCriteria: question.evaluationCriteria,
    difficulty:         question.difficulty,
    hint:               question.hint,
  };

  const clean = Object.fromEntries(
    Object.entries(relevantFields).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

  return `Eres un especialista en corrección de preguntas educativas para la plataforma SEA.

Tu ÚNICA tarea: recibir una pregunta de tipo "${question.type}" con sus errores y devolver EXCLUSIVAMENTE un objeto JSON válido con los campos corregidos.

SCHEMA REQUERIDO para tipo "${question.type}":
${schema}

REGLAS ABSOLUTAS:
1. Responde SOLO con el JSON. Sin explicaciones, sin markdown, sin texto extra.
2. Corrige TODOS los errores listados.
3. Mantén el idioma original (español) y la dificultad de la pregunta.
4. NO inventes campos que no estén en el schema.
5. Para fill_blank / sentence_builder: el prompt DEBE contener ___ (tres guiones bajos).
6. Para match_pairs: cada par DEBE tener "left" y "right" con contenido real.
7. Para multiple_choice: exactamente UNA opción debe tener isCorrect: true.

═══════════════════════════
PREGUNTA A CORREGIR:
${JSON.stringify(clean, null, 2)}

ERRORES DETECTADOS:
${issues.map((i, n) => `${n + 1}. ${i}`).join("\n")}
═══════════════════════════

Devuelve SOLO el JSON corregido con los campos del schema:`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VALIDACIÓN POST-IA
// ═══════════════════════════════════════════════════════════════════════════════

function validateAIResponse(type, data) {
  if (typeof data !== "object" || data === null)
    return { valid: false, reason: "la respuesta no es un objeto JSON" };

  switch (type) {
    case "multiple_choice": {
      if (!Array.isArray(data.options) || data.options.length < 2)
        return { valid: false, reason: "options debe ser array con ≥2 elementos" };
      const correctCount = data.options.filter((o) => o.isCorrect === true).length;
      if (correctCount !== 1)
        return { valid: false, reason: `debe haber exactamente 1 opción correcta, hay ${correctCount}` };
      if (data.options.some((o) => !o.text?.trim()))
        return { valid: false, reason: "alguna opción tiene text vacío" };
      break;
    }
    case "true_false":
      if (typeof data.correctBoolean !== "boolean")
        return { valid: false, reason: "correctBoolean debe ser boolean" };
      break;
    case "fill_blank":
      if (typeof data.prompt !== "string" || !data.prompt.includes("___"))
        return { valid: false, reason: 'prompt debe contener "___"' };
      if (!Array.isArray(data.correctAnswers) || data.correctAnswers.length === 0)
        return { valid: false, reason: "correctAnswers debe ser array no vacío" };
      break;
    case "order_items":
      if (!Array.isArray(data.items) || data.items.length < 2)
        return { valid: false, reason: "items debe ser array con ≥2 elementos" };
      break;
    case "match_pairs":
      if (!Array.isArray(data.pairs) || data.pairs.length < 2)
        return { valid: false, reason: "pairs debe ser array con ≥2 elementos" };
      if (data.pairs.some((p) => !p.left?.trim() || !p.right?.trim()))
        return { valid: false, reason: "todos los pares deben tener left y right" };
      break;
    case "sentence_builder":
      if (typeof data.prompt !== "string" || !data.prompt.includes("___"))
        return { valid: false, reason: 'prompt debe contener "___"' };
      if (!Array.isArray(data.wordBank) || data.wordBank.length < 2)
        return { valid: false, reason: "wordBank debe ser array con ≥2 palabras" };
      {
        const blanks = (data.prompt.match(/___/g) || []).length;
        if (data.wordBank.length < blanks)
          return { valid: false, reason: `wordBank (${data.wordBank.length}) < huecos (${blanks})` };
      }
      break;
    case "typing":
      if (!data.typingText?.trim())
        return { valid: false, reason: "typingText está vacío" };
      break;
    case "code_python":
      if (!Array.isArray(data.testCases) || data.testCases.length === 0)
        return { valid: false, reason: "testCases debe ser array no vacío" };
      if (data.testCases.some((tc) => !tc.expectedOutput?.trim()))
        return { valid: false, reason: "todos los testCases deben tener expectedOutput" };
      break;
    case "free_text":
      if (!data.prompt?.trim())
        return { valid: false, reason: "prompt está vacío" };
      break;
  }

  if (!data.prompt?.trim() && type !== "multiple_choice")
    return { valid: false, reason: "prompt está vacío" };

  return { valid: true, reason: "" };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PARSEO SEGURO DEL JSON
// ═══════════════════════════════════════════════════════════════════════════════

function parseAIJSON(raw) {
  // Limpiar posibles bloques markdown ```json ... ```
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  // Extraer el primer objeto JSON del texto
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROCESADOR DE UNA PREGUNTA
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_AI_RETRIES = 3;

async function repairWithAI(question, issues) {
  let prompt    = buildPrompt(question, issues);
  let lastError = "";

  for (let attempt = 1; attempt <= MAX_AI_RETRIES; attempt++) {
    const label = `[${question.type}] ${String(question._id)} (intento ${attempt}/${MAX_AI_RETRIES})`;

    log.ai(`Consultando IA para: ${label}`);
    log.sub(`Errores: ${issues.join(" | ")}`);

    let rawResponse;
    try {
      rawResponse = await callAI(prompt);
    } catch (err) {
      log.error(`Error de API en ${label}: ${err.message}`);
      lastError = err.message;
      await sleep(3000);
      continue;
    }

    // Parsear JSON
    let parsed;
    try {
      parsed = parseAIJSON(rawResponse);
    } catch {
      lastError = `JSON inválido: ${rawResponse.slice(0, 120)}`;
      log.warn(`Intento ${attempt}: IA devolvió JSON inválido. Reintentando con feedback...`);
      prompt = buildPrompt(question, issues) +
        `\n\nNOTA: Tu respuesta anterior no fue JSON válido. Devuelve SOLO el objeto JSON, sin ningún otro texto.`;
      continue;
    }

    // Validar estructura
    const { valid, reason } = validateAIResponse(question.type, parsed);
    if (!valid) {
      lastError = `Validación fallida: ${reason}`;
      log.warn(`Intento ${attempt}: ${lastError}. Reintentando con feedback...`);
      prompt = buildPrompt(question, issues) +
        `\n\nNOTA: Tu corrección anterior falló la validación: ${reason}\nCorrige específicamente ese problema y devuelve SOLO el JSON.`;
      continue;
    }

    log.ok(`IA corrigió correctamente: ${label} (vía ${lastModelUsed})`);
    return { success: true, patch: parsed, model: lastModelUsed };
  }

  return { success: false, error: lastError };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PROCESAMIENTO EN LOTE
// ═══════════════════════════════════════════════════════════════════════════════

async function processBatch(Question, batch) {
  return Promise.all(
    batch.map(async ({ question, issues }) => {
      try {
        const { success, patch, error, model } = await repairWithAI(question, issues);

        if (!success) {
          log.error(`Sin corrección para ${question._id}: ${error}`);
          stats.failed++;
          return { id: question._id, success: false, error };
        }

        if (!DRY_RUN) {
          await Question.findByIdAndUpdate(
            question._id,
            {
              $set: {
                ...patch,
                isReviewed:    true,
                isActive:      true,
                aiModel:       model,
                aiGeneratedAt: new Date(),
              },
            },
            { runValidators: false }
          );
          log.fix(`Guardado en BD: ${question._id}`);
        } else {
          log.fix(`[DRY-RUN] Patch calculado para ${question._id}:`);
          console.log(
            JSON.stringify(patch, null, 2)
              .split("\n")
              .map((l) => `    ${l}`)
              .join("\n")
          );
        }

        stats.aiFixed++;
        return { id: question._id, success: true, patch };

      } catch (err) {
        log.error(`Error inesperado en ${question._id}: ${err.message}`);
        stats.failed++;
        return { id: question._id, success: false, error: err.message };
      }
    })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DIAGNÓSTICO RÁPIDO
// ═══════════════════════════════════════════════════════════════════════════════

function quickDiagnose(q) {
  const issues = [];

  switch (q.type) {
    case "multiple_choice": {
      const opts = q.options || [];
      if (opts.length < 2) { issues.push(`Solo ${opts.length} opción/es (mínimo 2)`); break; }
      if (!opts.some((o) => o.isCorrect === true))        issues.push("Ninguna opción marcada como isCorrect: true");
      if (opts.some((o) => typeof o.isCorrect !== "boolean")) issues.push("isCorrect no es booleano en alguna opción");
      if (opts.some((o) => !o.text?.trim()))               issues.push("Alguna opción tiene texto vacío");
      const texts = opts.map((o) => (o.text || "").toLowerCase().trim());
      if (new Set(texts).size !== texts.length)            issues.push("Opciones con texto duplicado");
      break;
    }
    case "true_false":
      if (q.correctBoolean == null)                issues.push("correctBoolean es null o undefined");
      else if (typeof q.correctBoolean !== "boolean") issues.push(`correctBoolean es "${q.correctBoolean}" (debe ser booleano)`);
      break;
    case "fill_blank":
      if (!q.prompt?.includes("___"))  issues.push('El prompt no contiene el placeholder "___"');
      if (!q.correctAnswers?.length)   issues.push("correctAnswers está vacío");
      break;
    case "order_items":
      if (!q.items || q.items.length < 2) issues.push(`Solo ${q.items?.length ?? 0} ítem/s (mínimo 2)`);
      break;
    case "match_pairs":
      if (!q.pairs || q.pairs.length < 2) issues.push(`Solo ${q.pairs?.length ?? 0} par/es (mínimo 2)`);
      else if (q.pairs.some((p) => !p.left?.trim() || !p.right?.trim())) issues.push("Algún par tiene left o right vacío");
      break;
    case "sentence_builder":
      if (!q.prompt?.includes("___"))                        issues.push('El prompt no contiene "___"');
      if (!q.wordBank?.length || q.wordBank.length < 2)      issues.push(`wordBank insuficiente (${q.wordBank?.length ?? 0} palabras)`);
      break;
    case "typing":
      if (!q.typingText?.trim()) issues.push("typingText está vacío");
      break;
    case "code_python":
      if (!q.testCases?.length)                                    issues.push("testCases está vacío");
      else if (q.testCases.some((tc) => !tc.expectedOutput?.trim())) issues.push("Algún testCase no tiene expectedOutput");
      break;
    case "free_text":
      if (!q.prompt?.trim()) issues.push("prompt está vacío");
      break;
    default:
      issues.push(`Tipo desconocido: "${q.type}"`);
  }

  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  log.title("SEA — Reparación de Preguntas con IA (Groq + Gemini)");

  if (DRY_RUN)   log.warn("MODO DRY-RUN: no se guardará nada en la BD");
  if (LESSON_ID) log.info(`Filtrando por lección: ${LESSON_ID}`);
  log.info(`Concurrencia: ${CONCURRENCY} preguntas simultáneas`);
  log.info(`Groq keys disponibles: ${GROQ_KEYS.length} | Gemini: ${gemini ? "✓" : "✗"}`);

  // ── MongoDB ─────────────────────────────────────────────────────────────────
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/sea";
  log.info("Conectando a MongoDB...");
  await mongoose.connect(MONGO_URI);
  log.ok("Conectado");

  const Question = require("../models/question");

  // ── Cargar preguntas ────────────────────────────────────────────────────────
  let questionsToFix = [];

  if (REPORT_FILE) {
    log.info(`Cargando reporte: ${REPORT_FILE}`);
    const reportData = JSON.parse(fs.readFileSync(path.resolve(REPORT_FILE), "utf-8"));
    const ids  = reportData.map((r) => r.id);
    const docs = await Question.find({ _id: { $in: ids } }).lean();

    questionsToFix = docs.map((doc) => {
      const entry = reportData.find((r) => String(r.id) === String(doc._id));
      return { question: doc, issues: entry?.issues || [] };
    });
    log.info(`Preguntas cargadas desde reporte: ${questionsToFix.length}`);

  } else {
    const filter = { isAIGenerated: true, isReviewed: false };
    if (LESSON_ID) filter.lesson = LESSON_ID;

    const docs = await Question.find(filter).lean();
    log.info(`Preguntas IA sin revisar encontradas: ${docs.length}`);

    questionsToFix = docs
      .map((q) => ({ question: q, issues: quickDiagnose(q) }))
      .filter(({ issues }) => issues.length > 0);

    const clean = docs.length - questionsToFix.length;
    if (clean > 0) {
      log.ok(`${clean} preguntas ya están correctas (sin errores detectados)`);
      stats.skipped = clean;
    }
  }

  stats.total = questionsToFix.length;

  if (stats.total === 0) {
    log.ok("No hay preguntas con errores que procesar. ¡Todo está limpio!");
    await mongoose.disconnect();
    return;
  }

  // ── Resumen previo ──────────────────────────────────────────────────────────
  log.sep();
  log.info(`Preguntas con errores a corregir: ${C.bold}${stats.total}${C.reset}`);

  const byType = {};
  for (const { question } of questionsToFix) {
    byType[question.type] = (byType[question.type] || 0) + 1;
  }
  for (const [t, n] of Object.entries(byType)) {
    log.sub(`${t.padEnd(22)} ${n} pregunta(s)`);
  }
  log.sep();

  // ── Procesamiento en lotes ──────────────────────────────────────────────────
  const allResults = [];

  for (let i = 0; i < questionsToFix.length; i += CONCURRENCY) {
    const batch       = questionsToFix.slice(i, i + CONCURRENCY);
    const batchNum    = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(questionsToFix.length / CONCURRENCY);

    log.title(`Lote ${batchNum}/${totalBatches} (${batch.length} preguntas)`);

    const results = await processBatch(Question, batch);
    allResults.push(...results);

    if (i + CONCURRENCY < questionsToFix.length) {
      log.sub("Pausa de 2m entre lotes...");
      await sleep(120000);
    }
  }

  // ── Resumen final ──────────────────────────────────────────────────────────
  log.sep();
  log.title("RESUMEN FINAL");
  console.log(`  Total procesadas   : ${C.bold}${stats.total}${C.reset}`);
  console.log(`  Corregidas por IA  : ${C.green}${stats.aiFixed}${C.reset}${DRY_RUN ? " (simulado)" : ""}`);
  console.log(`  Fallidas           : ${C.red}${stats.failed}${C.reset}`);
  console.log(`  Sin errores        : ${C.gray}${stats.skipped}${C.reset}`);

  // ── Exportar errores persistentes ─────────────────────────────────────────
  const failed = allResults.filter((r) => !r.success);
  if (failed.length > 0) {
    const failedReport = failed.map((r) => {
      const entry = questionsToFix.find(({ question }) => String(question._id) === String(r.id));
      return {
        id:     String(r.id),
        type:   entry?.question?.type,
        prompt: entry?.question?.prompt?.slice(0, 100),
        issues: entry?.issues,
        error:  r.error,
      };
    });
    const reportPath = `./ai-repair-failed-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(failedReport, null, 2));
    log.warn(`\n${failed.length} pregunta(s) no pudieron corregirse. Reporte: ${reportPath}`);
  }

  await mongoose.disconnect();
  log.ok("\nDesconectado de MongoDB. Proceso completado.");
}

main().catch((err) => {
  log.error(`Error fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});