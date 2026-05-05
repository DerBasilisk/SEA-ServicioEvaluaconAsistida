/**
 * repair-questions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Script de diagnóstico y reparación automática para preguntas generadas por IA
 * en SEA (Simulador de Examen Asistido).
 *
 * Uso:
 *   node repair-questions.js            → analiza y repara todas las preguntas IA no revisadas
 *   node repair-questions.js --dry-run  → solo diagnóstico, sin guardar cambios
 *   node repair-questions.js --all      → incluye preguntas ya revisadas
 *   node repair-questions.js --lesson <lessonId>  → filtra por lección
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Colores ANSI para consola ────────────────────────────────────────────────
const C = {
  reset: "\x1b[0m",
  bold:  "\x1b[1m",
  red:   "\x1b[31m",
  green: "\x1b[32m",
  yellow:"\x1b[33m",
  blue:  "\x1b[34m",
  cyan:  "\x1b[36m",
  gray:  "\x1b[90m",
};
const log = {
  info:  (msg) => console.log(`${C.blue}ℹ${C.reset}  ${msg}`),
  ok:    (msg) => console.log(`${C.green}✔${C.reset}  ${msg}`),
  warn:  (msg) => console.log(`${C.yellow}⚠${C.reset}  ${msg}`),
  error: (msg) => console.log(`${C.red}✖${C.reset}  ${msg}`),
  fix:   (msg) => console.log(`${C.cyan}⟳${C.reset}  ${msg}`),
  title: (msg) => console.log(`\n${C.bold}${C.blue}══ ${msg} ══${C.reset}`),
  sep:   ()    => console.log(`${C.gray}${"─".repeat(70)}${C.reset}`),
};

// ── Argumentos CLI ───────────────────────────────────────────────────────────
const args        = process.argv.slice(2);
const DRY_RUN     = args.includes("--dry-run");
const INCLUDE_ALL = args.includes("--all");
const lessonIdx   = args.indexOf("--lesson");
const LESSON_ID   = lessonIdx !== -1 ? args[lessonIdx + 1] : null;

// ── Estadísticas globales ────────────────────────────────────────────────────
const stats = {
  total:       0,
  autoFixed:   0,
  manualNeeded:0,
  alreadyOk:   0,
  skipped:     0,
};

// ═══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normaliza texto: minúsculas, sin tildes, sin espacios extremos.
 */
const normalize = (str = "") =>
  str.toLowerCase()
     .normalize("NFD")
     .replace(/[\u0300-\u036f]/g, "")
     .trim();

/**
 * Detecta si una cadena representa un valor booleano de verdad.
 */
const isTrueish = (v) =>
  v === true  || v === "true"  || normalize(String(v)) === "verdadero" ||
  normalize(String(v)) === "true";

const isFalseish = (v) =>
  v === false || v === "false" || normalize(String(v)) === "falso" ||
  normalize(String(v)) === "false";

/**
 * Intenta extraer un booleano de múltiples formatos que la IA suele generar.
 * Retorna true | false | null si no se puede determinar.
 */
function parseBoolean(val) {
  if (typeof val === "boolean") return val;
  if (isTrueish(val))  return true;
  if (isFalseish(val)) return false;
  return null;
}

/**
 * Dado un objeto question plano (sin instancia Mongoose),
 * devuelve { issues[], fixes{}, canAutoFix: bool }
 */
function diagnose(q) {
  const issues = [];   // descripción de cada problema detectado
  const fixes  = {};   // campos a sobrescribir en MongoDB ($set)
  let canAutoFix = true;

  // ─── Campos básicos comunes ────────────────────────────────────────────────
  if (!q.prompt || !q.prompt.trim()) {
    issues.push("prompt vacío o ausente");
    canAutoFix = false;
  }

  // ─── Por tipo ─────────────────────────────────────────────────────────────
  switch (q.type) {

    // ══════════════════════════════════════════════════════════════════════════
    case "multiple_choice": {
      const opts = q.options || [];

      // — Sin opciones o muy pocas —
      if (opts.length < 2) {
        issues.push(`solo ${opts.length} opción/es (mínimo 2)`);
        canAutoFix = false;
        break;
      }

      // — Corregir isCorrect desde variantes que la IA usa —
      //   Posibles keys: correct, isCorrect, correct_answer, answer
      let changed = false;
      const repairedOpts = opts.map((o) => {
        const opt = { ...o };

        // Si falta isCorrect, intentar inferirlo desde campos alternativos
        if (typeof opt.isCorrect === "undefined") {
          if (typeof opt.correct !== "undefined") {
            opt.isCorrect = Boolean(opt.correct);
            delete opt.correct;
            changed = true;
          } else {
            opt.isCorrect = false; // default seguro
            changed = true;
          }
        }

        // Normalizar a booleano real
        if (typeof opt.isCorrect !== "boolean") {
          opt.isCorrect = parseBoolean(opt.isCorrect) ?? false;
          changed = true;
        }

        // Texto vacío
        if (!opt.text || !opt.text.trim()) {
          issues.push("opción con texto vacío");
          canAutoFix = false;
        }

        return opt;
      });

      // — Sin ninguna opción correcta —
      const hasCorrect = repairedOpts.some((o) => o.isCorrect === true);
      if (!hasCorrect) {
        issues.push("ninguna opción marcada como correcta");

        // Intento de rescate: si el prompt menciona la opción A/B/C/D o el texto de una opción
        const promptLower = normalize(q.prompt);
        const rescued = repairedOpts.findIndex((o) => promptLower.includes(normalize(o.text)));
        if (rescued !== -1) {
          repairedOpts[rescued].isCorrect = true;
          issues.push(`→ se marcó como correcta la opción que aparece en el prompt: "${repairedOpts[rescued].text}"`);
          changed = true;
        } else {
          canAutoFix = false;
        }
      }

      // — Opciones duplicadas —
      const texts = repairedOpts.map((o) => normalize(o.text));
      const unique = new Set(texts);
      if (unique.size !== texts.length) {
        issues.push("opciones con texto duplicado");
        canAutoFix = false;
      }

      if (changed && canAutoFix) {
        fixes.options = repairedOpts;
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "true_false": {
      const cb = q.correctBoolean;

      if (cb === null || cb === undefined) {
        // Intentar rescatar desde campos alternativos comunes de la IA
        const candidates = [q.answer, q.correctAnswer, q.correct];
        let resolved = null;
        for (const c of candidates) {
          if (c !== undefined && c !== null) {
            resolved = parseBoolean(c);
            if (resolved !== null) break;
          }
        }

        if (resolved !== null) {
          issues.push(`correctBoolean ausente; inferido como ${resolved} desde campo alternativo`);
          fixes.correctBoolean = resolved;
        } else {
          issues.push("correctBoolean ausente y no se pudo inferir");
          canAutoFix = false;
        }
      } else if (typeof cb !== "boolean") {
        const parsed = parseBoolean(cb);
        if (parsed !== null) {
          issues.push(`correctBoolean es string "${cb}"; convertido a booleano ${parsed}`);
          fixes.correctBoolean = parsed;
        } else {
          issues.push(`correctBoolean tiene valor inválido: "${cb}"`);
          canAutoFix = false;
        }
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "fill_blank": {
      // — prompt debe tener ___ —
      if (!q.prompt.includes("___")) {
        issues.push('prompt no contiene placeholder "___"');

        // Intentar encontrar el hueco en el prompt: palabras entre corchetes, paréntesis vacíos, etc.
        const guessPattern = /\[.*?\]|\(.*?\)|\{\s*\}|_+/;
        const match = q.prompt.match(guessPattern);
        if (match) {
          const repairedPrompt = q.prompt.replace(guessPattern, "___");
          issues.push(`→ placeholder detectado "${match[0]}", reemplazado por "___"`);
          fixes.prompt = repairedPrompt;
        } else {
          canAutoFix = false;
        }
      }

      // — correctAnswers debe ser array no vacío —
      const ca = q.correctAnswers;
      if (!ca || ca.length === 0) {
        // Intentar rescatar desde: correctAnswer (singular), answer, answers
        const fallback =
          (q.correctAnswer && [q.correctAnswer]) ||
          (q.answer        && [q.answer])        ||
          (q.answers       && (Array.isArray(q.answers) ? q.answers : [q.answers]));

        if (fallback && fallback.length > 0) {
          issues.push(`correctAnswers vacío; rescatado desde campo alternativo: [${fallback.join(", ")}]`);
          fixes.correctAnswers = fallback.map((a) => String(a).trim()).filter(Boolean);
        } else {
          issues.push("correctAnswers vacío y no se encontró respaldo");
          canAutoFix = false;
        }
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "order_items": {
      const items = q.items || [];

      if (items.length < 2) {
        // Intentar rescatar desde options (la IA a veces usa ese campo)
        if (q.options && q.options.length >= 2) {
          const rescued = q.options.map((o) =>
            typeof o === "string" ? o : (o.text || String(o))
          );
          issues.push(`items insuficientes (${items.length}); rescatados ${rescued.length} ítems desde "options"`);
          fixes.items   = rescued;
          fixes.options = []; // limpiar campo incorrecto
        } else if (q.wordBank && q.wordBank.length >= 2) {
          issues.push(`items insuficientes; rescatados desde wordBank`);
          fixes.items    = [...q.wordBank];
          fixes.wordBank = [];
        } else {
          issues.push(`items insuficientes (${items.length}); se necesitan mínimo 2`);
          canAutoFix = false;
        }
        break;
      }

      // Asegurarse que items sean strings
      const nonStrings = items.filter((i) => typeof i !== "string");
      if (nonStrings.length > 0) {
        issues.push("algunos items no son strings; convirtiendo");
        fixes.items = items.map((i) =>
          typeof i === "string" ? i : (i.text || i.label || String(i))
        );
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "match_pairs": {
      const pairs  = q.pairs  || [];

      // — Formato incorrecto: la IA a veces genera leftItems / rightItems en lugar de pairs —
      if (pairs.length < 2) {
        const leftItems  = q.leftItems  || [];
        const rightItems = q.rightItems || [];

        if (leftItems.length >= 2 && leftItems.length === rightItems.length) {
          // Convertir al formato {left, right} que espera el schema
          const rebuilt = leftItems.map((l, i) => ({
            left:  typeof l === "string" ? l : (l.text || String(l)),
            right: typeof rightItems[i] === "string" ? rightItems[i] : (rightItems[i].text || String(rightItems[i])),
          }));
          issues.push(`pairs ausentes; reconstruidos ${rebuilt.length} pares desde leftItems/rightItems`);
          fixes.pairs = rebuilt;
          break;
        }

        // Intentar desde options: [{text, match}, ...]
        if (q.options && q.options.length >= 2) {
          const fromOptions = q.options
            .filter((o) => o.text && (o.match || o.pair || o.right))
            .map((o) => ({
              left:  o.text,
              right: o.match || o.pair || o.right || "",
            }));

          if (fromOptions.length >= 2) {
            issues.push(`pairs ausentes; reconstruidos ${fromOptions.length} pares desde options`);
            fixes.pairs   = fromOptions;
            fixes.options = [];
            break;
          }
        }

        issues.push(`pairs insuficientes (${pairs.length}); se necesitan mínimo 2 y no hay respaldo`);
        canAutoFix = false;
        break;
      }

      // — Validar estructura de cada par —
      const badPairs = pairs.filter((p) => !p.left || !p.right);
      if (badPairs.length > 0) {
        // Intentar normalizar keys: question→left, answer→right, term→left, definition→right
        const repairedPairs = pairs.map((p) => ({
          left:  p.left  || p.question || p.term   || p.key   || "",
          right: p.right || p.answer   || p.definition || p.value || "",
        }));

        const stillBad = repairedPairs.filter((p) => !p.left || !p.right);
        if (stillBad.length === 0) {
          issues.push(`${badPairs.length} par(es) con keys incorrectas; normalizados a {left, right}`);
          fixes.pairs = repairedPairs;
        } else {
          issues.push(`${stillBad.length} par(es) con datos faltantes que no se pueden rescatar`);
          canAutoFix = false;
        }
      }

      // — Derechas duplicadas —
      const rights = (fixes.pairs || pairs).map((p) => normalize(p.right));
      const uniqueR = new Set(rights);
      if (uniqueR.size !== rights.length) {
        issues.push("columna derecha contiene valores duplicados");
        canAutoFix = false;
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "sentence_builder": {
      // — prompt debe tener ___ —
      if (!q.prompt.includes("___")) {
        const guessPattern = /\[.*?\]|\(.*?\)|\{\s*\}|_+/;
        const match = q.prompt.match(guessPattern);
        if (match) {
          const repairedPrompt = q.prompt.replace(guessPattern, "___");
          issues.push(`prompt sin "___"; placeholder "${match[0]}" detectado y reemplazado`);
          fixes.prompt = repairedPrompt;
        } else {
          issues.push('prompt no contiene "___" para los espacios');
          canAutoFix = false;
        }
      }

      // — wordBank vacío o insuficiente —
      const wb = q.wordBank || [];
      if (wb.length < 2) {
        // Rescate: la IA a veces pone las palabras en correctAnswers o items
        const fallback =
          (q.correctAnswers && q.correctAnswers.length >= 2 ? q.correctAnswers : null) ||
          (q.items          && q.items.length          >= 2 ? q.items          : null);

        if (fallback) {
          issues.push(`wordBank insuficiente (${wb.length}); rescatado desde campo alternativo`);
          fixes.wordBank = fallback;
          // Contar ___ en el prompt para asegurar coherencia
          const blankCount = (fixes.prompt || q.prompt).split("___").length - 1;
          if (fallback.length < blankCount) {
            issues.push(`wordBank (${fallback.length}) tiene menos palabras que huecos (${blankCount})`);
            canAutoFix = false;
          }
        } else {
          issues.push(`wordBank insuficiente (${wb.length}); no se encontró respaldo`);
          canAutoFix = false;
        }
      }

      // — Verificar coherencia: palabras en wordBank deben cubrir los huecos —
      const blankCount = (fixes.prompt || q.prompt).split("___").length - 1;
      const wbFinal    = fixes.wordBank || wb;
      if (wbFinal.length < blankCount) {
        issues.push(`wordBank (${wbFinal.length} palabras) < huecos en prompt (${blankCount})`);
        canAutoFix = false;
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "typing": {
      const tt = q.typingText || "";
      if (!tt.trim()) {
        // Rescate desde: correctAnswer, answer, prompt (como último recurso)
        const fallback = q.correctAnswer || q.answer || q.prompt || "";
        if (fallback.trim()) {
          issues.push(`typingText vacío; rescatado desde campo alternativo`);
          fixes.typingText = fallback.trim();
        } else {
          issues.push("typingText vacío y sin respaldo");
          canAutoFix = false;
        }
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "code_python": {
      const tc = q.testCases || [];

      if (tc.length === 0) {
        issues.push("testCases vacío");
        canAutoFix = false;
        break;
      }

      // — Casos con expectedOutput vacío —
      const emptyOutput = tc.filter((t) => !t.expectedOutput || !t.expectedOutput.trim());
      if (emptyOutput.length > 0) {
        issues.push(`${emptyOutput.length} caso(s) de prueba sin expectedOutput`);
        canAutoFix = false;
      }

      // — Normalizar testType si falta —
      const missingType = tc.some((t) => !t.testType);
      if (missingType) {
        const repaired = tc.map((t) => ({
          ...t,
          testType: t.testType || (t.callCode ? "return" : "stdout"),
        }));
        issues.push("testType faltante en algunos casos; inferido de callCode");
        fixes.testCases = repaired;
      }

      // — description vacía —
      const missingDesc = tc.filter((t) => !t.description);
      if (missingDesc.length > 0) {
        const withDesc = (fixes.testCases || tc).map((t, i) => ({
          ...t,
          description: t.description || `Prueba ${i + 1}`,
        }));
        fixes.testCases = withDesc;
        issues.push(`${missingDesc.length} caso(s) sin descripción; asignados genéricos`);
      }
      break;
    }

    // ══════════════════════════════════════════════════════════════════════════
    case "free_text": {
      // free_text es el más flexible — solo validar prompt
      if (!q.prompt || !q.prompt.trim()) {
        issues.push("prompt vacío");
        canAutoFix = false;
      }
      // Sugerir evaluationCriteria si no existe
      if (!q.evaluationCriteria) {
        issues.push("[INFO] evaluationCriteria ausente (recomendado para mejor evaluación IA)");
        // No bloqueamos ni fijamos automáticamente — es una sugerencia
      }
      break;
    }

    default:
      issues.push(`tipo desconocido: "${q.type}"`);
      canAutoFix = false;
  }

  return { issues, fixes, canAutoFix };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  log.title("SEA — Script de Reparación de Preguntas IA");

  if (DRY_RUN)     log.warn("MODO DRY-RUN: no se guardarán cambios en la base de datos");
  if (LESSON_ID)   log.info(`Filtrando por lección: ${LESSON_ID}`);
  if (INCLUDE_ALL) log.info("Incluyendo preguntas ya revisadas (--all)");

  // ── Conexión ───────────────────────────────────────────────────────────────
  const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/sea";
  log.info(`Conectando a MongoDB: ${MONGO_URI.replace(/:\/\/.*@/, "://*****@")}`);

  await mongoose.connect(MONGO_URI);
  log.ok("Conexión establecida");

  // ── Carga del modelo ───────────────────────────────────────────────────────
  const Question = require("../models/question"); // ajusta si el path es diferente

  // ── Filtro de consulta ─────────────────────────────────────────────────────
  const filter = { isAIGenerated: true };
  if (!INCLUDE_ALL) filter.isReviewed = false;
  if (LESSON_ID)    filter.lesson     = LESSON_ID;

  const questions = await Question.find(filter).lean();
  stats.total = questions.length;

  log.info(`Preguntas encontradas: ${stats.total}`);
  log.sep();

  if (stats.total === 0) {
    log.ok("No hay preguntas que procesar.");
    await mongoose.disconnect();
    return;
  }

  // ── Reporte agrupado por tipo ──────────────────────────────────────────────
  const byType = {};
  for (const q of questions) {
    byType[q.type] = (byType[q.type] || 0) + 1;
  }
  log.info("Distribución por tipo:");
  for (const [t, n] of Object.entries(byType)) {
    console.log(`   ${C.gray}•${C.reset} ${t.padEnd(20)} ${n} pregunta(s)`);
  }
  log.sep();

  // ── Procesar cada pregunta ─────────────────────────────────────────────────
  const manualReview = []; // para el reporte final

  for (const q of questions) {
    const qId   = String(q._id);
    const short  = `[${q.type}] ${q.prompt?.slice(0, 60)}…`;

    const { issues, fixes, canAutoFix } = diagnose(q);

    if (issues.length === 0) {
      log.ok(`OK  ${short}`);
      stats.alreadyOk++;
      continue;
    }

    // Imprimir problemas detectados
    console.log(`\n${C.yellow}▶${C.reset} ${C.bold}${short}${C.reset}`);
    console.log(`  ${C.gray}ID: ${qId}${C.reset}`);
    for (const issue of issues) {
      console.log(`  ${C.red}⚠${C.reset} ${issue}`);
    }

    if (canAutoFix && Object.keys(fixes).length > 0) {
      console.log(`  ${C.cyan}→ Reparación automática disponible:${C.reset}`);
      for (const [field, val] of Object.entries(fixes)) {
        const preview = JSON.stringify(val).slice(0, 80);
        console.log(`    ${C.gray}${field}:${C.reset} ${preview}${preview.length >= 80 ? "…" : ""}`);
      }

      if (!DRY_RUN) {
        try {
          await Question.findByIdAndUpdate(qId, { $set: fixes }, { runValidators: false });
          log.fix(`Guardado: ${qId}`);
          stats.autoFixed++;
        } catch (err) {
          log.error(`Error al guardar ${qId}: ${err.message}`);
          stats.manualNeeded++;
          manualReview.push({ id: qId, type: q.type, prompt: q.prompt?.slice(0, 80), issues });
        }
      } else {
        log.fix(`[DRY-RUN] Se aplicaría la reparación a: ${qId}`);
        stats.autoFixed++;
      }
    } else {
      log.warn(`Revisión manual requerida: ${qId}`);
      stats.manualNeeded++;
      manualReview.push({ id: qId, type: q.type, prompt: q.prompt?.slice(0, 80), issues });
    }
  }

  // ── Resumen final ──────────────────────────────────────────────────────────
  log.sep();
  log.title("RESUMEN");
  console.log(`  Total procesadas : ${C.bold}${stats.total}${C.reset}`);
  console.log(`  Sin problemas    : ${C.green}${stats.alreadyOk}${C.reset}`);
  console.log(`  Reparadas auto   : ${C.cyan}${stats.autoFixed}${C.reset}${DRY_RUN ? " (simulado)" : ""}`);
  console.log(`  Revisión manual  : ${C.red}${stats.manualNeeded}${C.reset}`);

  if (manualReview.length > 0) {
    log.sep();
    log.title("PREGUNTAS QUE REQUIEREN REVISIÓN MANUAL");
    for (const item of manualReview) {
      console.log(`\n  ${C.yellow}${item.type}${C.reset}  ${C.gray}${item.id}${C.reset}`);
      console.log(`  Prompt: "${item.prompt}"`);
      for (const issue of item.issues) {
        console.log(`    ${C.red}•${C.reset} ${issue}`);
      }
    }

    // Exportar a JSON para facilitar revisión en el panel admin
    const fs = require("fs");
    const reportPath = `./repair-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(manualReview, null, 2));
    log.info(`\nReporte exportado a: ${reportPath}`);
  }

  await mongoose.disconnect();
  log.ok("Desconectado de MongoDB. Proceso completado.");
}

main().catch((err) => {
  log.error(`Error fatal: ${err.message}`);
  console.error(err);
  process.exit(1);
});
