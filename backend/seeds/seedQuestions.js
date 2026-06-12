'use strict';

require('dotenv').config(); // carga .env del directorio donde corres el script

const mongoose = require('mongoose');
const path     = require('path');

// ── Ajusta estas rutas a tu estructura de proyecto ──────────────────────────
const Question          = require('../models/Question');       // ← tu modelo
const Lesson            = require('../models/Lesson');         // ← tu modelo
const Unit              = require('../models/Unit');           // ← tu modelo
const Subject           = require('../models/Subject');        // ← tu modelo
const { generateQuestions } = require('../services/ai.service');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN — ajusta estos valores según tus límites de API
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  QUESTIONS_PER_LESSON:    2,   // total deseado por lección
  BATCH_SIZE:               2,   // cuántas generar por llamada a la IA
  DELAY_BETWEEN_BATCHES:  4_000, // ms entre los lotes de UNA misma lección
  DELAY_BETWEEN_LESSONS: 10_000, // ms entre lecciones (evita ráfagas)
  RETRY_AFTER_429:       30_000, // ms a esperar si llega un 429 externo
  MIN_EXISTING_TO_SKIP:       2, // si la lección ya tiene ≥ este nº, saltar
};

// ─────────────────────────────────────────────────────────────────────────────
// CLI FLAGS
// ─────────────────────────────────────────────────────────────────────────────

const args      = process.argv.slice(2);
const FLAGS = {
  force:    args.includes('--force'),
  dryRun:   args.includes('--dry-run'),
  subject:  argValue(args, '--subject'),
  lessonId: argValue(args, '--lesson'),
};

function argValue(args, flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = {
  info:    (...a) => console.log(`ℹ️  ${a.join(' ')}`),
  ok:      (...a) => console.log(`✅ ${a.join(' ')}`),
  warn:    (...a) => console.warn(`⚠️  ${a.join(' ')}`),
  error:   (...a) => console.error(`❌ ${a.join(' ')}`),
  section: (...a) => console.log(`\n${'─'.repeat(60)}\n📚 ${a.join(' ')}\n${'─'.repeat(60)}`),
};

/**
 * Guarda un array de preguntas generadas por la IA en MongoDB.
 * Ignora silenciosamente duplicados por prompt (índice único opcional).
 */
async function saveQuestions(rawQuestions, lesson, unit, subject) {
  const toInsert = rawQuestions.map((q) => ({
    ...q,
    lesson:  lesson._id,
    unit:    unit._id,
    subject: subject._id,
    isActive: false, // las dejamos inactivas hasta revisión manual; cambia a true si prefieres
  }));

  try {
    const result = await Question.insertMany(toInsert, { ordered: false });
    return result.length;
  } catch (err) {
    // ordered:false → continúa aunque haya duplicados (E11000)
    if (err.code === 11000 || (err.writeErrors && err.insertedDocs)) {
      const inserted = err.insertedDocs?.length ?? 0;
      log.warn(`Algunos duplicados ignorados. Insertadas: ${inserted}`);
      return inserted;
    }
    throw err;
  }
}

/**
 * Genera preguntas en lotes de BATCH_SIZE y las guarda.
 * Maneja 429 con un retry simple.
 */
async function generateAndSaveForLesson(lesson, unit, subject) {
  const existing = await Question.countDocuments({ lesson: lesson._id, isActive: { $in: [true, false] } });

  if (!FLAGS.force && existing >= CONFIG.MIN_EXISTING_TO_SKIP) {
    log.info(`Lección "${lesson.name}" ya tiene ${existing} preguntas → saltando`);
    return { skipped: true, saved: 0 };
  }

  const needed = Math.max(0, CONFIG.QUESTIONS_PER_LESSON - existing);
  if (needed === 0) {
    log.info(`Lección "${lesson.name}" ya completa (${existing} preguntas)`);
    return { skipped: true, saved: 0 };
  }

  log.info(`Lección "${lesson.name}" | existentes: ${existing} | a generar: ${needed}`);

  if (FLAGS.dryRun) {
    log.warn('[DRY-RUN] No se llamó a la IA ni se guardó nada');
    return { skipped: false, saved: 0, dryRun: true };
  }

  let totalSaved = 0;
  let remaining  = needed;

  while (remaining > 0) {
    const batchCount = Math.min(CONFIG.BATCH_SIZE, remaining);

    try {
      const questions = await generateQuestions({
        subjectName:    subject.name,
        unitName:       unit.name,
        lessonName:     lesson.name,
        topicHint:      lesson.aiTopicHint || lesson.name,
        aiPromptContext: subject.aiPromptContext ?? '',
        difficulty:     lesson.difficulty ?? 'easy',
        count:          batchCount,
        // Todos los tipos disponibles; el service ya filtra según la materia
        allowedTypes: [
          'multiple_choice', 'true_false', 'fill_blank',
          'match_pairs', 'sentence_builder', 'free_text', 'typing',
        ],
      });

      const saved = await saveQuestions(questions, lesson, unit, subject);
      totalSaved += saved;
      remaining  -= batchCount;

      log.ok(`  Lote guardado: ${saved} preguntas (total acumulado: ${totalSaved})`);

      if (remaining > 0) {
        log.info(`  ⏳ Esperando ${CONFIG.DELAY_BETWEEN_BATCHES / 1000}s antes del siguiente lote...`);
        await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('rate');

      if (is429) {
        log.warn(`Rate limit alcanzado. Esperando ${CONFIG.RETRY_AFTER_429 / 1000}s y reintentando...`);
        await sleep(CONFIG.RETRY_AFTER_429);
        // Reintentar este mismo lote (no decrementamos remaining)
        continue;
      }

      log.error(`Error generando lote para "${lesson.name}": ${err.message}`);
      break; // saltar a la siguiente lección en vez de explotar todo
    }
  }

  return { skipped: false, saved: totalSaved };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 seedQuestions.js — Iniciando\n');
  if (FLAGS.dryRun)  log.warn('Modo DRY-RUN activo — no se modificará la BD ni se llamará a la IA');
  if (FLAGS.force)   log.warn('Modo FORCE activo — se regenerarán lecciones aunque ya tengan preguntas');
  if (FLAGS.subject) log.info(`Filtrando por materia: "${FLAGS.subject}"`);
  if (FLAGS.lessonId)log.info(`Filtrando por lección: "${FLAGS.lessonId}"`);

  // ── Conexión ──────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI);
  log.ok('Conectado a MongoDB');

  // ── Consulta de lecciones ─────────────────────────────────────────────────
  let lessonQuery = { isActive: true };
  if (FLAGS.lessonId) lessonQuery._id = FLAGS.lessonId;

  const lessons = await Lesson.find(lessonQuery)
    .populate({
      path: 'unit',
      populate: { path: 'subject' },
    })
    .sort({ 'unit.subject': 1, unit: 1, order: 1 });

  // Filtrar por materia si se especificó --subject
  const filtered = FLAGS.subject
    ? lessons.filter((l) =>
        l.unit?.subject?.name?.toLowerCase().includes(FLAGS.subject.toLowerCase())
      )
    : lessons;

  if (filtered.length === 0) {
    log.warn('No se encontraron lecciones con los filtros dados.');
    await mongoose.disconnect();
    return;
  }

  log.info(`Lecciones a procesar: ${filtered.length}`);

  // ── Iterar lección por lección ────────────────────────────────────────────
  const stats = { total: filtered.length, skipped: 0, processed: 0, saved: 0, errors: 0 };

  for (let i = 0; i < filtered.length; i++) {
    const lesson  = filtered[i];
    const unit    = lesson.unit;
    const subject = unit?.subject;

    if (!unit || !subject) {
      log.warn(`Lección "${lesson.name}" sin unit/subject poblados — saltando`);
      stats.errors++;
      continue;
    }

    log.section(`[${i + 1}/${filtered.length}] ${subject.name} › ${unit.name} › ${lesson.name}`);

    try {
      const result = await generateAndSaveForLesson(lesson, unit, subject);

      if (result.skipped) {
        stats.skipped++;
      } else {
        stats.processed++;
        stats.saved += result.saved;
      }
    } catch (err) {
      log.error(`Error inesperado en "${lesson.name}": ${err.message}`);
      stats.errors++;
    }

    // Pausa entre lecciones (excepto la última)
    if (i < filtered.length - 1) {
      log.info(`⏳ Esperando ${CONFIG.DELAY_BETWEEN_LESSONS / 1000}s antes de la siguiente lección...`);
      await sleep(CONFIG.DELAY_BETWEEN_LESSONS);
    }
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('═'.repeat(60));
  console.log(`  Lecciones totales  : ${stats.total}`);
  console.log(`  Procesadas (IA)    : ${stats.processed}`);
  console.log(`  Saltadas           : ${stats.skipped}`);
  console.log(`  Con errores        : ${stats.errors}`);
  console.log(`  Preguntas guardadas: ${stats.saved}`);
  console.log('═'.repeat(60) + '\n');

  await mongoose.disconnect();
  log.ok('Desconectado de MongoDB. ¡Listo!');
}

main().catch((err) => {
  log.error('Error fatal:', err.message);
  console.error(err);
  process.exit(1);
});