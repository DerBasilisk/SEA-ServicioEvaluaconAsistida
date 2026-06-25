'use strict';

/**
 * seedLengua.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed COMPLETO para la materia "Lengua":
 *   1. Crea (o reutiliza) el Subject "Lengua"
 *   2. Crea (o reutiliza) las Unidades
 *   3. Crea (o reutiliza) las Lecciones
 *   4. Genera preguntas con IA para cada lección (igual que seedQuestions.js)
 *
 * Uso:
 *   node seedLengua.js                   # normal
 *   node seedLengua.js --dry-run         # solo muestra lo que haría, sin tocar la BD
 *   node seedLengua.js --force           # regenera preguntas aunque la lección ya las tenga
 *   node seedLengua.js --skip-questions  # solo crea Subject/Units/Lessons, sin generar preguntas
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const mongoose = require('mongoose');

const Question           = require('../models/Question');
const Lesson             = require('../models/Lesson');
const Unit               = require('../models/Unit');
const Subject            = require('../models/Subject');
const { generateQuestions } = require('../services/ai.service');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  QUESTIONS_PER_LESSON:   5,      // preguntas a generar por lección
  BATCH_SIZE:             5,      // cuántas por llamada a la IA
  DELAY_BETWEEN_BATCHES:  4_000,  // ms entre lotes de UNA misma lección
  DELAY_BETWEEN_LESSONS: 12_000,  // ms entre lecciones
  RETRY_AFTER_429:       35_000,  // ms si llega un 429
  MIN_EXISTING_TO_SKIP:   5,      // saltar lección si ya tiene ≥ este número
};

// ─────────────────────────────────────────────────────────────────────────────
// CLI FLAGS
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const FLAGS = {
  dryRun:        args.includes('--dry-run'),
  force:         args.includes('--force'),
  skipQuestions: args.includes('--skip-questions'),
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGGER
// ─────────────────────────────────────────────────────────────────────────────

const log = {
  info:    (...a) => console.log(`ℹ️  ${a.join(' ')}`),
  ok:      (...a) => console.log(`✅ ${a.join(' ')}`),
  warn:    (...a) => console.warn(`⚠️  ${a.join(' ')}`),
  error:   (...a) => console.error(`❌ ${a.join(' ')}`),
  section: (...a) => console.log(`\n${'─'.repeat(60)}\n📚 ${a.join(' ')}\n${'─'.repeat(60)}`),
  header:  (...a) => console.log(`\n${'═'.repeat(60)}\n🏫 ${a.join(' ')}\n${'═'.repeat(60)}`),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// DEFINICIÓN DEL CURRÍCULO DE LENGUA
// ─────────────────────────────────────────────────────────────────────────────
//
// Estructura: 5 Unidades temáticas, 5–7 lecciones cada una.
// La última lección de cada unidad es un "checkpoint" de dificultad media/hard.
// Progresión de dificultad: easy → easy/medium → medium → hard/checkpoint.
//
// ─────────────────────────────────────────────────────────────────────────────

const LENGUA_CURRICULUM = {
  subject: {
    name:        'Lengua',
    description: 'Domina la gramática, ortografía, comprensión lectora, redacción y literatura en español.',
    icon:        '📖',
    color:       '#7C3AED',
    order:       1,
    aiPromptContext: [
      'Esta es una materia de LENGUA ESPAÑOLA para estudiantes de secundaria.',
      'Las preguntas deben cubrir: gramática, ortografía, acentuación, puntuación, comprensión lectora, redacción, figuras retóricas y géneros literarios.',
      'Todos los enunciados, opciones y explicaciones deben estar en ESPAÑOL.',
      'Para fill_blank: usa oraciones completas con un único hueco (___) donde falta una palabra gramatical o de vocabulario clave.',
      'Para sentence_builder: proporciona palabras en español para construir oraciones gramaticalmente correctas.',
      'Para match_pairs: empareja conceptos con definiciones, reglas con ejemplos, o autores con obras.',
      'Para true_false: usa afirmaciones sobre reglas gramaticales o hechos literarios verificables.',
      'Incluye ejemplos concretos con oraciones del idioma español. Evita preguntas de matemáticas o ciencias.',
      'Los distractores en multiple_choice deben ser errores gramaticales comunes, no respuestas absurdas.',
    ].join(' '),
  },

  units: [
    // ─────────────────────────────────────────────────────────────
    // UNIDAD 1 — Ortografía
    // ─────────────────────────────────────────────────────────────
    {
      name:        'Ortografía',
      description: 'Aprende las reglas de escritura correcta del español: mayúsculas, letras de uso difícil, acentuación y puntuación.',
      icon:        '✏️',
      order:       1,
      requiredXP:  0,
      lessons: [
        {
          name:        'Uso de las mayúsculas',
          description: 'Cuándo escribir con letra mayúscula: inicio de oración, nombres propios y títulos.',
          order:       1,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Reglas del uso de mayúsculas en español: inicio de oración, nombres propios, títulos, días y meses en minúscula',
          theory: {
            title:   '¿Cuándo usamos mayúsculas?',
            content: 'Las mayúsculas se usan al inicio de una oración, en nombres propios de personas, lugares y organismos, y en títulos de obras. Los días de la semana, meses del año y estaciones **no** llevan mayúscula en español.',
          },
        },
        {
          name:        'Uso de la B y la V',
          description: 'Reglas para distinguir cuándo escribir con "b" (be alta) y cuándo con "v" (ve baja).',
          order:       2,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Reglas ortográficas de la b y la v: verbos terminados en -bir/-buir, prefijos bi-/bis-, adjetivos en -ivo/-iva, formas del verbo ir (iba, ibas…), palabras con nv',
          theory: {
            title:   'B y V: reglas clave',
            content: 'Se escribe **B** en verbos terminados en *-bir* (escribir, recibir), en palabras con *bl* o *br*, y en las formas del copretérito del verbo *ir* (iba, ibas…). Se escribe **V** en adjetivos terminados en *-ivo/-iva* (activo, negativa) y después de *n* (invitar, envidia).',
          },
        },
        {
          name:        'Uso de la G y la J',
          description: 'Reglas para el uso correcto de "g" (sonido suave) y "j" en español.',
          order:       3,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Uso de G y J en español: ge/gi con diéresis (güe/güi), palabras con -aje/-eje, verbos terminados en -ger/-gir, palabras con ja/jo/ju que suenan fuerte',
          theory: {
            title:   'G y J: cómo distinguirlas',
            content: 'La **G** suena fuerte (igual que J) solo ante *e* e *i* (gente, girasol). Ante *a*, *o*, *u* suena suave (gato, gota, gusto). Para sonido suave ante e/i se añade *u* muda: **gue/gui** (guerra, guitarra). Si la *u* suena, se escribe diéresis: **güe/güi** (pingüino). La **J** siempre suena fuerte y aparece en palabras con *-aje*, *-eje*, *-jero*.',
          },
        },
        {
          name:        'Uso de la H',
          description: 'La letra h es muda en español. Aprende en qué palabras se escribe y por qué.',
          order:       4,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Uso de la h muda en español: familias léxicas de palabras con h (haber, hacer, hablar, humano), verbos haber y hacer, interjecciones (ah, oh), palabras de origen extranjero',
          theory: {
            title:   'La H: siempre muda',
            content: 'La **h** no representa ningún sonido en español. Se escribe obligatoriamente en palabras como *haber*, *hacer*, *hablar*, *habitar* y todas sus familias léxicas. También en interjecciones (*¡ah!*, *¡oh!*) y palabras de origen griego o extranjero (hospital, hotel, historia).',
          },
        },
        {
          name:        'Acentuación: las tildes',
          description: 'Aprende las reglas generales de acentuación: palabras agudas, llanas y esdrújulas.',
          order:       5,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Reglas de acentuación en español: palabras agudas (tilde si terminan en n, s o vocal), llanas (tilde si NO terminan en n, s o vocal), esdrújulas (siempre llevan tilde)',
          theory: {
            title:   'Agudas, llanas y esdrújulas',
            content: '**Agudas**: acento en la última sílaba → llevan tilde si terminan en *n*, *s* o vocal (café, camión). **Llanas**: acento en la penúltima sílaba → llevan tilde si NO terminan en *n*, *s* o vocal (árbol, difícil). **Esdrújulas**: acento en la antepenúltima sílaba → **siempre** llevan tilde (música, sábado, pájaro).',
          },
        },
        {
          name:        'Puntuación: punto, coma y punto y coma',
          description: 'Cómo y cuándo usar el punto, la coma y el punto y coma para estructurar oraciones y textos.',
          order:       6,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Uso del punto, la coma y el punto y coma en español: punto final, punto y seguido, punto y aparte, coma en enumeraciones, coma vocativa, punto y coma entre proposiciones largas',
          theory: {
            title:   'El punto y la coma',
            content: 'El **punto** cierra oraciones (. seguido o . aparte) y párrafos. La **coma** separa elementos de una enumeración, aísla el vocativo ("María, ven aquí") y delimita incisos. El **punto y coma** (;) separa proposiciones largas relacionadas entre sí, o elementos de una lista que ya contienen comas.',
          },
        },
        {
          name:        'Checkpoint: Ortografía',
          description: 'Evaluación integradora de todas las reglas ortográficas vistas en esta unidad.',
          order:       7,
          type:        'checkpoint',
          difficulty:  'medium',
          xpReward:    30,
          gemsReward:  1,
          questionCount: 8,
          aiTopicHint: 'Repaso integrador de ortografía española: mayúsculas, b/v, g/j, h muda, acentuación de agudas/llanas/esdrújulas, uso del punto y la coma. Mezcla todos los temas con preguntas de dificultad media.',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    // UNIDAD 2 — Gramática
    // ─────────────────────────────────────────────────────────────
    {
      name:        'Gramática',
      description: 'Conoce las clases de palabras, sus funciones y cómo se construyen las oraciones en español.',
      icon:        '🔤',
      order:       2,
      requiredXP:  50,
      lessons: [
        {
          name:        'El sustantivo',
          description: 'Qué es un sustantivo, sus clases (común/propio, concreto/abstracto) y su género y número.',
          order:       1,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El sustantivo en español: definición, clases (común vs propio, concreto vs abstracto, individual vs colectivo), género y número del sustantivo',
          theory: {
            title:   '¿Qué es el sustantivo?',
            content: 'El **sustantivo** nombra personas, animales, lugares, objetos, ideas o sentimientos. Puede ser *propio* (nombre de algo específico: Madrid, Ana) o *común* (nombre genérico: ciudad, niña). También *concreto* (se percibe con los sentidos: mesa, perro) o *abstracto* (no se percibe físicamente: amor, justicia).',
          },
        },
        {
          name:        'El adjetivo',
          description: 'Función del adjetivo, concordancia con el sustantivo y grados del adjetivo.',
          order:       2,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El adjetivo en español: definición, concordancia en género y número con el sustantivo, grados del adjetivo (positivo, comparativo, superlativo), adjetivos calificativos vs determinativos',
          theory: {
            title:   'El adjetivo y sus grados',
            content: 'El **adjetivo** califica o determina al sustantivo y concuerda con él en género y número (*chico alto / chica alta*). Tiene tres grados: **positivo** (alto), **comparativo** (más alto que) y **superlativo** (altísimo / el más alto).',
          },
        },
        {
          name:        'El verbo',
          description: 'El verbo: conjugación, tiempos verbales más comunes y modos indicativo/subjuntivo.',
          order:       3,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El verbo en español: concepto, persona y número, tiempos verbales del modo indicativo (presente, pretérito perfecto simple, pretérito imperfecto, futuro), infinitivo, participio, gerundio',
          theory: {
            title:   'El verbo: núcleo de la oración',
            content: 'El **verbo** expresa acciones, estados o procesos. Se conjuga en **persona** (1.ª, 2.ª, 3.ª), **número** (singular/plural) y **tiempo** (presente, pasado, futuro). Las formas no personales son: **infinitivo** (-ar/-er/-ir), **participio** (-ado/-ido) y **gerundio** (-ando/-iendo).',
          },
        },
        {
          name:        'El pronombre y el adverbio',
          description: 'Cómo los pronombres sustituyen al sustantivo y cómo los adverbios modifican al verbo, al adjetivo u a otro adverbio.',
          order:       4,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El pronombre personal en español (yo, tú, él…), pronombres demostrativos y posesivos. El adverbio: clases (tiempo, lugar, modo, cantidad, negación) y función modificadora del verbo o del adjetivo',
          theory: {
            title:   'Pronombres y adverbios',
            content: 'El **pronombre** sustituye al sustantivo para no repetirlo (*María llegó* → *Ella llegó*). Los pronombres personales son: yo, tú, él/ella, nosotros, vosotros, ellos/ellas. El **adverbio** modifica al verbo, al adjetivo u a otro adverbio: *corre rápido*, *muy alto*, *bastante bien*.',
          },
        },
        {
          name:        'La oración simple: sujeto y predicado',
          description: 'Estructura básica de la oración: identificar el sujeto (quién) y el predicado (qué hace).',
          order:       5,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Estructura de la oración simple en español: sujeto (núcleo sustantivo + determinantes y adjetivos) y predicado (verbo + complementos). Identificar el sujeto y el predicado en oraciones concretas. Oraciones impersonales.',
          theory: {
            title:   'Sujeto y predicado',
            content: 'Toda oración simple tiene **sujeto** (la persona, animal o cosa de la que se habla) y **predicado** (lo que se dice del sujeto). El núcleo del sujeto es siempre un **sustantivo o pronombre**; el núcleo del predicado es el **verbo**. Para hallar el sujeto, pregunta "¿Quién + verbo?".',
          },
        },
        {
          name:        'Tipos de oraciones',
          description: 'Clasificación de las oraciones según la actitud del hablante: enunciativas, interrogativas, exclamativas, imperativas y desiderativas.',
          order:       6,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Tipos de oraciones según la actitud del hablante: enunciativa afirmativa y negativa, interrogativa directa e indirecta, exclamativa, imperativa, desiderativa y dubitativa. Signos de puntuación correspondientes.',
          theory: {
            title:   'Clasificación de las oraciones',
            content: 'Según la intención del hablante, las oraciones se clasifican en: **enunciativas** (afirman o niegan), **interrogativas** (preguntan, llevan ¿?), **exclamativas** (expresan emoción, llevan ¡!), **imperativas** (dan órdenes), **desiderativas** (expresan deseos: *¡Ojalá llueva!*) y **dubitativas** (expresan duda: *Quizás venga*).',
          },
        },
        {
          name:        'Checkpoint: Gramática',
          description: 'Evaluación integradora de las clases de palabras y la estructura oracional.',
          order:       7,
          type:        'checkpoint',
          difficulty:  'medium',
          xpReward:    30,
          gemsReward:  1,
          questionCount: 8,
          aiTopicHint: 'Repaso integrador de gramática: sustantivo, adjetivo, verbo, pronombre, adverbio, sujeto y predicado, tipos de oración. Mezcla conceptos con preguntas de dificultad media.',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    // UNIDAD 3 — Comprensión Lectora
    // ─────────────────────────────────────────────────────────────
    {
      name:        'Comprensión Lectora',
      description: 'Desarrolla la capacidad de entender, analizar e interpretar textos de diferentes tipos.',
      icon:        '👁️',
      order:       3,
      requiredXP:  150,
      lessons: [
        {
          name:        'Idea principal e ideas secundarias',
          description: 'Cómo identificar qué dice lo más importante un texto y qué información sirve de apoyo.',
          order:       1,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Identificar la idea principal e ideas secundarias de un párrafo o texto corto: diferencia entre lo esencial y lo complementario, estrategias para subrayar y resumir',
          theory: {
            title:   'Lo principal y lo secundario',
            content: 'La **idea principal** es el mensaje central que el autor quiere transmitir: si la eliminas, el texto pierde su sentido. Las **ideas secundarias** amplían, ejemplifican o detallan la idea principal. Para encontrarla, pregunta: "¿De qué trata fundamentalmente este párrafo?".',
          },
        },
        {
          name:        'El párrafo y la coherencia textual',
          description: 'Qué es un párrafo, cómo se organiza y qué hace que un texto sea coherente y cohesionado.',
          order:       2,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El párrafo: definición, estructura (oración tópica + desarrollo + cierre), coherencia (unidad temática) y cohesión (conectores, sinónimos, pronombres para no repetir)',
          theory: {
            title:   'El párrafo bien construido',
            content: 'Un **párrafo** es un conjunto de oraciones que desarrollan una sola idea. Generalmente tiene: **oración tópica** (presenta la idea), **desarrollo** (amplía con detalles o ejemplos) y **cierre** (sintetiza o abre paso al siguiente párrafo). La **coherencia** garantiza que todas las oraciones hablen del mismo tema; la **cohesión** utiliza conectores y pronombres para no repetir palabras.',
          },
        },
        {
          name:        'Tipos de texto',
          description: 'Diferencias entre texto narrativo, descriptivo, expositivo, argumentativo e instructivo.',
          order:       3,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Tipos de texto en lengua: narrativo (cuenta hechos), descriptivo (pinta imágenes con palabras), expositivo (informa y explica), argumentativo (convence) e instructivo (da instrucciones paso a paso). Ejemplos de cada uno.',
          theory: {
            title:   'Cinco tipos de texto',
            content: '**Narrativo**: cuenta eventos en orden temporal (cuentos, novelas). **Descriptivo**: retrata personas, lugares u objetos. **Expositivo**: informa con objetividad (artículos de enciclopedia). **Argumentativo**: defiende una opinión con razones (editorial, debate). **Instructivo**: indica pasos para realizar algo (receta, manual).',
          },
        },
        {
          name:        'Vocabulario en contexto',
          description: 'Estrategias para deducir el significado de palabras desconocidas usando el contexto, familias léxicas y morfología.',
          order:       4,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Vocabulario en contexto: deducir significado por contexto oracional, prefijos y sufijos comunes del español (pre-, des-, -ción, -mente), familias léxicas, sinónimos y antónimos',
          theory: {
            title:   'Descifrar palabras nuevas',
            content: 'Cuando encuentres una palabra desconocida: (1) lee el contexto completo; (2) analiza su **raíz** o familia léxica; (3) fíjate en **prefijos** (*des-*, *pre-*, *in-*) y **sufijos** (*-mente*, *-ción*, *-ista*). Por ejemplo: *des-conoci-do* → acción de no conocer → "extraño" o "ignorado".',
          },
        },
        {
          name:        'Inferencias y lectura crítica',
          description: 'Ir más allá del texto: deducir información implícita, reconocer la intención del autor y evaluar los argumentos.',
          order:       5,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Hacer inferencias en un texto: información implícita vs explícita, deducir el tono e intención del autor, lectura crítica (distinguir hecho de opinión, detectar falacias simples)',
          theory: {
            title:   'Leer entre líneas',
            content: 'La **información explícita** está escrita directamente. La **implícita** requiere deducción. Una **inferencia** es una conclusión lógica que se extrae combinando lo que dice el texto con nuestro conocimiento previo. La **lectura crítica** nos hace preguntar: ¿quién escribe?, ¿con qué propósito?, ¿es esto un hecho o una opinión?',
          },
        },
        {
          name:        'Checkpoint: Comprensión Lectora',
          description: 'Evaluación integradora de comprensión lectora con fragmentos breves de texto.',
          order:       6,
          type:        'checkpoint',
          difficulty:  'medium',
          xpReward:    30,
          gemsReward:  1,
          questionCount: 8,
          aiTopicHint: 'Repaso integrador de comprensión lectora: identificar idea principal, tipo de texto, vocabulario en contexto, inferencias y lectura crítica. Preguntas de dificultad media basadas en fragmentos textuales.',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    // UNIDAD 4 — Redacción y Escritura
    // ─────────────────────────────────────────────────────────────
    {
      name:        'Redacción y Escritura',
      description: 'Aprende a planificar, escribir y revisar distintos tipos de textos con claridad y corrección.',
      icon:        '✍️',
      order:       4,
      requiredXP:  300,
      lessons: [
        {
          name:        'Conectores y marcadores textuales',
          description: 'Palabras y expresiones que enlazan ideas: adición, contraste, causa, consecuencia y orden.',
          order:       1,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Conectores textuales en español: adición (además, también, asimismo), contraste (sin embargo, aunque, pero), causa (porque, ya que, puesto que), consecuencia (por lo tanto, en consecuencia), orden (primero, luego, finalmente)',
          theory: {
            title:   'Conectores: el pegamento del texto',
            content: 'Los **conectores** (o marcadores discursivos) unen oraciones y párrafos indicando la relación entre ideas: **adición** (*además, también*), **contraste** (*sin embargo, pero, aunque*), **causa** (*porque, ya que*), **consecuencia** (*por lo tanto, en consecuencia*), **orden** (*primero, luego, finalmente*).',
          },
        },
        {
          name:        'El texto descriptivo',
          description: 'Técnicas para describir personas, lugares y objetos con precisión y riqueza léxica.',
          order:       2,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'El texto descriptivo en español: descripción objetiva vs subjetiva, descripción de personas (prosopografía, etopeya, retrato), descripción de lugares y objetos, uso de adjetivos y comparaciones',
          theory: {
            title:   'Describir con palabras',
            content: 'La **descripción objetiva** presenta rasgos verificables (color, tamaño, forma). La **subjetiva** añade valoraciones del autor. Describir una persona: **prosopografía** (aspecto físico) + **etopeya** (carácter) = **retrato**. Clave: usa adjetivos precisos, comparaciones y ordena los detalles (de lo general a lo particular).',
          },
        },
        {
          name:        'El texto narrativo',
          description: 'Elementos de la narración: narrador, personajes, tiempo, espacio y estructura (inicio-nudo-desenlace).',
          order:       3,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'El texto narrativo: estructura narrativa (planteamiento, nudo, desenlace), tipos de narrador (omnisciente, protagonista, testigo), personajes principales y secundarios, tiempo y espacio narrativo',
          theory: {
            title:   'Cómo se cuenta una historia',
            content: 'Una narración tiene **planteamiento** (presentación de personajes y situación), **nudo** (conflicto o problema) y **desenlace** (resolución). El **narrador** puede ser: **omnisciente** (lo sabe todo), **protagonista** (habla en 1.ª persona) o **testigo** (observa desde fuera). El **tiempo** y el **espacio** enmarcan la historia.',
          },
        },
        {
          name:        'El texto argumentativo',
          description: 'Cómo defender una tesis con argumentos, refutaciones y una conclusión sólida.',
          order:       4,
          type:        'lesson',
          difficulty:  'hard',
          xpReward:    20,
          questionCount: 5,
          aiTopicHint: 'El texto argumentativo: tesis, argumentos de apoyo (ejemplos, datos, autoridad), contraargumentos o refutación, conclusión. Estructura del texto argumentativo. Falacias argumentativas básicas.',
          theory: {
            title:   'Argumentar para convencer',
            content: 'Un texto argumentativo tiene: **tesis** (la idea que defiendes), **argumentos** (razones que la apoyan: ejemplos, estadísticas, citas de autoridad), **contraargumentos** (objeciones que refutas) y **conclusión** (reafirma la tesis). Evita **falacias** como atacar a la persona en lugar de su argumento (*ad hominem*).',
          },
        },
        {
          name:        'La carta formal y el correo electrónico',
          description: 'Estructura, fórmulas de cortesía y registro apropiado para comunicaciones formales escritas.',
          order:       5,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'La carta formal en español: fecha, destinatario, encabezamiento, cuerpo, despedida y firma. Fórmulas de saludo y despedida formales. Registro formal vs informal. Adaptación al correo electrónico formal.',
          theory: {
            title:   'La carta formal',
            content: 'Una carta formal incluye: **lugar y fecha**, **destinatario**, **encabezamiento** (*Estimado señor / A quien corresponda*), **cuerpo** (con presentación, desarrollo y cierre), **despedida** (*Atentamente / Un cordial saludo*) y **firma**. El registro debe ser formal: sin abreviaciones informales ni coloquialismos.',
          },
        },
        {
          name:        'Checkpoint: Redacción',
          description: 'Evaluación integradora de conocimientos sobre redacción, conectores y tipos de texto escritos.',
          order:       6,
          type:        'checkpoint',
          difficulty:  'hard',
          xpReward:    35,
          gemsReward:  2,
          questionCount: 8,
          aiTopicHint: 'Repaso integrador de redacción: conectores textuales, texto descriptivo, narrativo, argumentativo, carta formal. Preguntas de dificultad media-alta que combinen todos los subtipos.',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────
    // UNIDAD 5 — Literatura
    // ─────────────────────────────────────────────────────────────
    {
      name:        'Literatura',
      description: 'Explora los géneros literarios, las figuras retóricas y las obras más representativas de la literatura en español.',
      icon:        '🎭',
      order:       5,
      requiredXP:  500,
      lessons: [
        {
          name:        'Géneros literarios',
          description: 'Los tres grandes géneros: narrativa, lírica y teatro. Características y subgéneros de cada uno.',
          order:       1,
          type:        'lesson',
          difficulty:  'easy',
          xpReward:    10,
          questionCount: 5,
          aiTopicHint: 'Los géneros literarios: narrativa (novela, cuento, fábula), lírica o poesía (oda, elegía, soneto), teatro o dramático (tragedia, comedia, drama). Características de cada género y sus principales subgéneros.',
          theory: {
            title:   'Los tres grandes géneros',
            content: '**Narrativa**: el autor cuenta hechos mediante un narrador (novela, cuento, fábula). **Lírica**: el autor expresa sentimientos en verso (oda, elegía, soneto). **Teatro o dramático**: escrito para ser representado, con diálogos y acotaciones (tragedia, comedia, drama).',
          },
        },
        {
          name:        'Figuras retóricas I: comparación y metáfora',
          description: 'Las figuras más usadas para crear imágenes literarias: el símil y la metáfora.',
          order:       2,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Figuras retóricas: comparación o símil (usa "como" o "igual que": "tus ojos como estrellas"), metáfora (identifica dos términos: "tus ojos son estrellas"), metáfora impura vs pura. Ejemplos de la literatura española.',
          theory: {
            title:   'Comparación y metáfora',
            content: 'La **comparación** o **símil** establece semejanza usando *como* o *igual que*: "*Sus cabellos son como hilos de oro*". La **metáfora** identifica directamente dos realidades suprimiendo el nexo: "*Sus cabellos son hilos de oro*". En la **metáfora pura** solo aparece el término imaginario: "*Los hilos de oro caían sobre sus hombros*".',
          },
        },
        {
          name:        'Figuras retóricas II: hipérbole, personificación y aliteración',
          description: 'Cómo la exageración, la animación de lo inanimado y la repetición de sonidos crean efectos literarios.',
          order:       3,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Figuras retóricas: hipérbole (exageración expresiva: "te lo he dicho mil veces"), personificación o prosopopeya (atribuir cualidades humanas a objetos o animales), aliteración (repetición de sonidos), anáfora (repetición al inicio de versos). Ejemplos literarios.',
          theory: {
            title:   'Más figuras retóricas',
            content: '**Hipérbole**: exageración expresiva (*"te lo he dicho mil veces"*). **Personificación** (o prosopopeya): se atribuyen cualidades humanas a seres o cosas inanimadas (*"el viento susurraba su pena"*). **Aliteración**: repetición de sonidos para crear musicalidad (*"En el silencio solo se escuchaba un susurro de abejas"*). **Anáfora**: repetición de palabras al inicio de versos o frases consecutivas.',
          },
        },
        {
          name:        'El cuento: estructura y elementos',
          description: 'Cómo analizar un cuento: narrador, personajes, espacio, tiempo y estructura narrativa.',
          order:       4,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Análisis del cuento: definición y características del cuento, narrador (omnisciente, protagonista, testigo), personajes (protagonista, antagonista, secundarios), espacio (físico y psicológico), tiempo (externo e interno), estructura (planteamiento, nudo, desenlace)',
          theory: {
            title:   'Anatomía del cuento',
            content: 'El **cuento** es una narración breve con pocos personajes y una sola línea argumental. Sus elementos son: **narrador** (quien cuenta), **personajes** (protagonista, antagonista, secundarios), **espacio** (dónde ocurre), **tiempo** (cuándo) y **estructura** (planteamiento → nudo → desenlace). El **clímax** es el momento de máxima tensión del nudo.',
          },
        },
        {
          name:        'La poesía: verso, estrofa y rima',
          description: 'Vocabulario y análisis básico de la poesía: verso, estrofa, rima consonante y asonante, tipos de estrofas.',
          order:       5,
          type:        'lesson',
          difficulty:  'medium',
          xpReward:    15,
          questionCount: 5,
          aiTopicHint: 'Elementos de la poesía: verso (cada línea del poema), estrofa (grupo de versos), rima consonante (coinciden vocales y consonantes desde la última vocal tónica), rima asonante (solo vocales), principales estrofas (pareado, terceto, cuarteto, redondilla, soneto)',
          theory: {
            title:   'Rima y estrofa',
            content: '**Verso**: cada línea de un poema. **Estrofa**: agrupación de versos. **Rima**: coincidencia de sonidos al final del verso desde la última vocal tónica. Es **consonante** si coinciden vocales y consonantes (*vida/florida*) y **asonante** si solo coinciden las vocales (*vida/mina*). El **soneto** tiene 14 versos: dos cuartetos (ABBA ABBA) y dos tercetos (CDC DCD o variantes).',
          },
        },
        {
          name:        'El teatro: texto dramático y representación',
          description: 'Características del texto teatral: diálogo, acotaciones, actos y escenas. Diferencias entre tragedia, comedia y drama.',
          order:       6,
          type:        'lesson',
          difficulty:  'hard',
          xpReward:    20,
          questionCount: 5,
          aiTopicHint: 'El texto teatral: diálogos (parlamentos), acotaciones (didascalias), estructura en actos y escenas. Diferencias entre tragedia (conflicto fatal), comedia (final feliz, humor) y drama (mezcla de ambos). Elementos de la puesta en escena.',
          theory: {
            title:   'El teatro como género',
            content: 'El texto teatral se escribe para ser **representado** en escena. Está formado por **diálogos** (parlamentos de los personajes) y **acotaciones** o didascalias (indicaciones del autor sobre movimientos, gestos y escenografía). Se divide en **actos** (partes grandes) y **escenas** (cambios de personajes en escena). **Tragedia**: desenlace fatal. **Comedia**: final feliz y humor. **Drama**: mezcla de ambos.',
          },
        },
        {
          name:        'Checkpoint: Literatura',
          description: 'Evaluación integradora de todos los conceptos literarios de la unidad.',
          order:       7,
          type:        'checkpoint',
          difficulty:  'hard',
          xpReward:    40,
          gemsReward:  2,
          questionCount: 10,
          aiTopicHint: 'Repaso integrador de literatura española: géneros literarios, figuras retóricas (metáfora, hipérbole, personificación, aliteración, anáfora), análisis del cuento, elementos de la poesía (rima, estrofa, verso) y el teatro (actos, escenas, acotaciones). Preguntas de dificultad alta.',
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FUNCIONES DE CREACIÓN (upsert)
// ─────────────────────────────────────────────────────────────────────────────

async function upsertSubject(data) {
  let subject = await Subject.findOne({ name: data.name });
  if (subject) {
    log.info(`Subject "${data.name}" ya existe (id: ${subject._id}) → reutilizando`);
    return subject;
  }
  if (FLAGS.dryRun) {
    log.warn(`[DRY-RUN] Crearía Subject "${data.name}"`);
    return { _id: 'DRY_SUBJECT', name: data.name, ...data };
  }
  subject = await Subject.create(data);
  log.ok(`Subject "${subject.name}" creado (id: ${subject._id})`);
  return subject;
}

async function upsertUnit(data, subjectId) {
  let unit = await Unit.findOne({ subject: subjectId, name: data.name });
  if (unit) {
    log.info(`  Unit "${data.name}" ya existe → reutilizando`);
    return unit;
  }
  if (FLAGS.dryRun) {
    log.warn(`[DRY-RUN] Crearía Unit "${data.name}"`);
    return { _id: `DRY_UNIT_${data.order}`, name: data.name, subject: subjectId, ...data };
  }
  unit = await Unit.create({ ...data, subject: subjectId });
  log.ok(`  Unit "${unit.name}" creada (id: ${unit._id})`);
  return unit;
}

async function upsertLesson(data, unitId) {
  let lesson = await Lesson.findOne({ unit: unitId, name: data.name });
  if (lesson) {
    log.info(`    Lesson "${data.name}" ya existe → reutilizando`);
    return lesson;
  }
  if (FLAGS.dryRun) {
    log.warn(`[DRY-RUN] Crearía Lesson "${data.name}"`);
    return { _id: `DRY_LESSON_${data.order}`, name: data.name, unit: unitId, ...data };
  }
  lesson = await Lesson.create({ ...data, unit: unitId });
  log.ok(`    Lesson "${lesson.name}" creada (id: ${lesson._id})`);
  return lesson;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERACIÓN DE PREGUNTAS (igual que seedQuestions.js)
// ─────────────────────────────────────────────────────────────────────────────

async function saveQuestions(rawQuestions, lesson, unit, subject) {
  const toInsert = rawQuestions.map((q) => ({
    ...q,
    lesson:   lesson._id,
    unit:     unit._id,
    subject:  subject._id,
    isActive: false, // inactivas hasta revisión manual
  }));

  try {
    const result = await Question.insertMany(toInsert, { ordered: false });
    return result.length;
  } catch (err) {
    if (err.code === 11000 || (err.writeErrors && err.insertedDocs)) {
      const inserted = err.insertedDocs?.length ?? 0;
      log.warn(`Algunos duplicados ignorados. Insertadas: ${inserted}`);
      return inserted;
    }
    throw err;
  }
}

async function generateAndSaveForLesson(lesson, unit, subject) {
  const existing = await Question.countDocuments({
    lesson:   lesson._id,
    isActive: { $in: [true, false] },
  });

  if (!FLAGS.force && existing >= CONFIG.MIN_EXISTING_TO_SKIP) {
    log.info(`    Lección "${lesson.name}" ya tiene ${existing} preguntas → saltando`);
    return { skipped: true, saved: 0 };
  }

  const needed = Math.max(0, CONFIG.QUESTIONS_PER_LESSON - existing);
  if (needed === 0) {
    log.info(`    Lección "${lesson.name}" ya completa (${existing} preguntas)`);
    return { skipped: true, saved: 0 };
  }

  log.info(`    Generando ${needed} preguntas para "${lesson.name}"...`);

  if (FLAGS.dryRun) {
    log.warn('    [DRY-RUN] No se llamó a la IA ni se guardó nada');
    return { skipped: false, saved: 0, dryRun: true };
  }

  let totalSaved = 0;
  let remaining  = needed;

  while (remaining > 0) {
    const batchCount = Math.min(CONFIG.BATCH_SIZE, remaining);

    try {
      const questions = await generateQuestions({
        subjectName:     subject.name,
        unitName:        unit.name,
        lessonName:      lesson.name,
        topicHint:       lesson.aiTopicHint || lesson.name,
        aiPromptContext: subject.aiPromptContext ?? '',
        difficulty:      lesson.difficulty ?? 'easy',
        count:           batchCount,
        allowedTypes: [
          'multiple_choice',
          'true_false',
          'fill_blank',
          'match_pairs',
          'sentence_builder',
          'free_text',
          'typing',
        ],
      });

      const saved = await saveQuestions(questions, lesson, unit, subject);
      totalSaved += saved;
      remaining  -= batchCount;

      log.ok(`    Lote guardado: ${saved} preguntas (total acumulado: ${totalSaved})`);

      if (remaining > 0) {
        log.info(`    ⏳ Esperando ${CONFIG.DELAY_BETWEEN_BATCHES / 1000}s antes del siguiente lote...`);
        await sleep(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    } catch (err) {
      const is429 =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('rate');

      if (is429) {
        log.warn(`Rate limit. Esperando ${CONFIG.RETRY_AFTER_429 / 1000}s y reintentando...`);
        await sleep(CONFIG.RETRY_AFTER_429);
        continue; // reintentar el mismo lote
      }

      log.error(`Error generando lote para "${lesson.name}": ${err.message}`);
      break;
    }
  }

  return { skipped: false, saved: totalSaved };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 seedLengua.js — Iniciando\n');

  if (FLAGS.dryRun)        log.warn('Modo DRY-RUN activo — no se modificará la BD ni se llamará a la IA');
  if (FLAGS.force)         log.warn('Modo FORCE activo — se regenerarán preguntas aunque la lección ya las tenga');
  if (FLAGS.skipQuestions) log.warn('Modo SKIP-QUESTIONS activo — solo se crearán Subject/Units/Lessons');

  // ── Conexión ────────────────────────────────────────────────────────────────
  await mongoose.connect(process.env.MONGODB_URI);
  log.ok('Conectado a MongoDB');

  // ── Crear Subject ────────────────────────────────────────────────────────────
  log.header('Creando / verificando Subject: Lengua');
  const subject = await upsertSubject(LENGUA_CURRICULUM.subject);

  // ── Estadísticas globales ────────────────────────────────────────────────────
  const stats = {
    units:      { created: 0, existing: 0 },
    lessons:    { created: 0, existing: 0 },
    questions:  { saved: 0, skipped: 0, errors: 0 },
  };

  // ── Iterar unidades ──────────────────────────────────────────────────────────
  for (const unitData of LENGUA_CURRICULUM.units) {
    const { lessons: lessonsData, ...unitFields } = unitData;

    log.section(`Unidad ${unitFields.order}: ${unitFields.name}`);

    const unit = await upsertUnit(unitFields, subject._id);
    if (unit._id.toString().startsWith('DRY_UNIT') || !(await Unit.exists({ _id: unit._id, name: unitFields.name, subject: subject._id }))) {
      // contabilizar solo si se creó ahora (la lógica de upsertUnit ya loguea)
    }

    // ── Iterar lecciones de la unidad ──────────────────────────────────────────
    for (const lessonData of lessonsData) {
      const lesson = await upsertLesson(lessonData, unit._id);

      if (FLAGS.skipQuestions) continue;

      // Pausa entre lecciones (excepto la primera)
      if (lessonData.order > 1) {
        log.info(`    ⏳ Esperando ${CONFIG.DELAY_BETWEEN_LESSONS / 1000}s...`);
        await sleep(CONFIG.DELAY_BETWEEN_LESSONS);
      }

      try {
        const result = await generateAndSaveForLesson(lesson, unit, subject);
        if (result.skipped) {
          stats.questions.skipped++;
        } else {
          stats.questions.saved += result.saved;
        }
      } catch (err) {
        log.error(`Error inesperado en "${lesson.name}": ${err.message}`);
        stats.questions.errors++;
      }
    }
  }

  // ── Resumen final ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN FINAL — seedLengua.js');
  console.log('═'.repeat(60));

  // Contar desde la BD para un resumen preciso
  const totalUnits   = await Unit.countDocuments({ subject: subject._id });
  const unitIds      = (await Unit.find({ subject: subject._id }, '_id')).map(u => u._id);
  const totalLessons = await Lesson.countDocuments({ unit: { $in: unitIds } });
  const totalQuestions = await Question.countDocuments({ subject: subject._id });

  console.log(`  Materia              : ${subject.name} (id: ${subject._id})`);
  console.log(`  Unidades en BD       : ${totalUnits}`);
  console.log(`  Lecciones en BD      : ${totalLessons}`);
  console.log(`  Preguntas en BD      : ${totalQuestions}`);
  console.log(`  Preguntas guardadas  : ${stats.questions.saved}`);
  console.log(`  Lecciones saltadas   : ${stats.questions.skipped}`);
  console.log(`  Errores de generación: ${stats.questions.errors}`);
  console.log('═'.repeat(60) + '\n');

  await mongoose.disconnect();
  log.ok('Desconectado de MongoDB. ¡Listo!');
}

main().catch((err) => {
  log.error('Error fatal:', err.message);
  console.error(err);
  process.exit(1);
});