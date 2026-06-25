'use strict';

/**
 * seedMatematicas.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seed ESTÁTICO de Matemáticas — sin llamadas a IA.
 * Todas las operaciones y respuestas han sido verificadas manualmente.
 *
 * Estructura:
 *   5 Unidades  →  19 Lecciones  →  ~85 Preguntas
 *
 * Uso:
 *   node scripts/seedMatematicas.js
 *   node scripts/seedMatematicas.js --dry-run   (sin writes a la BD)
 *   node scripts/seedMatematicas.js --force      (recrea preguntas aunque existan)
 *
 * Rutas de modelos: ajusta si tu estructura difiere.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const mongoose = require('mongoose');

// ── Ajusta estas rutas a tu estructura ──────────────────────────────────────
const Question = require('../models/Question');
const Lesson   = require('../models/Lesson');
const Unit     = require('../models/Unit');
const Subject  = require('../models/Subject');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  FLAGS CLI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const args  = process.argv.slice(2);
const DRY   = args.includes('--dry-run');
const FORCE = args.includes('--force');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPERS DE LOG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const log = {
  info:  (...a) => console.log(`  ℹ️  ${a.join(' ')}`),
  ok:    (...a) => console.log(`  ✅ ${a.join(' ')}`),
  warn:  (...a) => console.warn(`  ⚠️  ${a.join(' ')}`),
  err:   (...a) => console.error(`  ❌ ${a.join(' ')}`),
  title: (t)   => console.log(`\n${'═'.repeat(60)}\n📚 ${t}\n${'═'.repeat(60)}`),
  sep:   (t)   => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 54 - t.length))}`),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATOS ESTÁTICOS — MATEMÁTICAS
//
//  correctOrder en order_items:
//    correctOrder[posición_correcta] = índice_en_items[]
//    Ej: items = ['C','A','B'] y el orden correcto es A,B,C
//        → correctOrder = [1, 2, 0]
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MATEMATICAS = {

  // ── Materia ────────────────────────────────────────────────────────────────
  subject: {
    name:            'Matemáticas',
    slug:            'matematicas',
    description:     'Desde aritmética básica hasta álgebra, geometría, estadística y más.',
    icon:            '🔢',
    color:           '#3B82F6',
    order:           1,
    isActive:        true,
    aiPromptContext: 'Genera preguntas de matemáticas claras con operaciones correctas y bien planteadas.',
  },

  // ── Unidades y lecciones ───────────────────────────────────────────────────
  units: [

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIDAD 1 — Aritmética Básica
    // ══════════════════════════════════════════════════════════════════════════
    {
      name:        'Aritmética Básica',
      description: 'Números naturales, operaciones fundamentales, fracciones y decimales.',
      icon:        '➕',
      order:       1,
      requiredXP:  0,

      lessons: [

        // ── L1: Números Naturales ────────────────────────────────────────────
        {
          name:         'Números Naturales y Conteo',
          description:  'Explora el conjunto de los números naturales y sus propiedades básicas.',
          order:        1,
          difficulty:   'easy',
          xpReward:     10,
          questionCount: 5,
          aiTopicHint:  'Números naturales, sucesor, antecesor, orden de números',

          questions: [
            {
              type:    'multiple_choice',
              prompt:  '¿Cuál es el sucesor del número 99?',
              options: [
                { text: '98',  isCorrect: false },
                { text: '100', isCorrect: true,  explanation: 'El sucesor es el número inmediatamente siguiente: 99 + 1 = 100.' },
                { text: '90',  isCorrect: false },
                { text: '101', isCorrect: false },
              ],
              explanation: 'El sucesor de n es n + 1. Sucesor de 99 = 100.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'El número 0 pertenece al conjunto de los números naturales.',
              correctBoolean: true,
              explanation:    'En el currículo actual ℕ = {0, 1, 2, 3, …}, el 0 está incluido.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              prompt:         'El antecesor del número 50 es ___.',
              correctAnswers: ['49'],
              explanation:    'El antecesor de n es n − 1. Antecesor de 50 = 49.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              // items mostrados al estudiante (orden mezclado)
              // Orden correcto de menor a mayor: 1 → 3 → 7 → 9 → 15
              // Índices:  '15'=0  '3'=1  '7'=2  '1'=3  '9'=4
              // correctOrder: pos0→idx3(1), pos1→idx1(3), pos2→idx2(7), pos3→idx4(9), pos4→idx0(15)
              type:         'order_items',
              prompt:       'Ordena estos números de menor a mayor:',
              items:        ['15', '3', '7', '1', '9'],
              correctOrder: [3, 1, 2, 4, 0],
              explanation:  'Orden ascendente: 1, 3, 7, 9, 15.',
              difficulty: 'easy', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              prompt:  '¿Cuántos dígitos tiene el número 4.728?',
              options: [
                { text: '3', isCorrect: false },
                { text: '4', isCorrect: true,  explanation: 'Los dígitos son: 4, 7, 2 y 8.' },
                { text: '5', isCorrect: false },
                { text: '2', isCorrect: false },
              ],
              explanation: '4.728 tiene 4 dígitos: 4, 7, 2 y 8.',
              difficulty: 'easy', xpValue: 2,
            },
          ],
        },

        // ── L2: Suma y Resta ─────────────────────────────────────────────────
        {
          name:         'Suma y Resta',
          description:  'Domina la adición y sustracción de números naturales.',
          order:        2,
          difficulty:   'easy',
          xpReward:     10,
          questionCount: 4,
          aiTopicHint:  'Suma, resta, adición, sustracción de números naturales',

          questions: [
            {
              type:    'multiple_choice',
              // 347 + 258: unidades 7+8=15(escribo 5, llevo 1),
              //             decenas 4+5+1=10(escribo 0, llevo 1),
              //             centenas 3+2+1=6 → 605
              prompt:  '¿Cuánto es 347 + 258?',
              options: [
                { text: '595', isCorrect: false },
                { text: '605', isCorrect: true,  explanation: '7+8=15→5 y llevo 1; 4+5+1=10→0 y llevo 1; 3+2+1=6. Resultado: 605.' },
                { text: '615', isCorrect: false },
                { text: '600', isCorrect: false },
              ],
              explanation: '347 + 258 = 605. Comprobación: 605 − 258 = 347 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 1000 − 437: 1000 − 400 = 600; 600 − 37 = 563
              prompt:         '1.000 − 437 = ___.',
              correctAnswers: ['563'],
              explanation:    '1000 − 437 = 563. Comprobación: 563 + 437 = 1000 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // 500 − 263 = 237, NO 247
              prompt:         '500 − 263 = 247',
              correctBoolean: false,
              explanation:    '500 − 263 = 237 (no 247). Comprobación: 237 + 263 = 500 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada operación con su resultado correcto:',
              // Verificaciones:
              //   150+250 = 400 ✓
              //   800−375: 800−400=400, +25=425 ✓
              //   99+101  = 200 ✓
              //   1000−1  = 999 ✓
              pairs: [
                { left: '150 + 250',    right: '400' },
                { left: '800 − 375',    right: '425' },
                { left: '99 + 101',     right: '200' },
                { left: '1.000 − 1',   right: '999' },
              ],
              explanation: '150+250=400 | 800−375=425 | 99+101=200 | 1000−1=999.',
              difficulty: 'easy', xpValue: 3,
            },
          ],
        },

        // ── L3: Multiplicación y División ────────────────────────────────────
        {
          name:         'Multiplicación y División',
          description:  'Aprende a multiplicar y dividir números naturales con precisión.',
          order:        3,
          difficulty:   'easy',
          xpReward:     15,
          questionCount: 5,
          aiTopicHint:  'Multiplicación, división, tablas de multiplicar, cociente',

          questions: [
            {
              type:    'multiple_choice',
              // 23 × 7: 3×7=21(escribe 1, lleva 2); 2×7=14+2=16 → 161
              prompt:  '¿Cuánto es 23 × 7?',
              options: [
                { text: '151', isCorrect: false },
                { text: '161', isCorrect: true,  explanation: '3×7=21→1 y llevo 2; 2×7=14+2=16. Resultado: 161.' },
                { text: '163', isCorrect: false },
                { text: '140', isCorrect: false },
              ],
              explanation: '23 × 7 = 161. Comprobación: 161 ÷ 7 = 23 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 144 ÷ 12 = 12 → 12 × 12 = 144 ✓
              prompt:         '144 ÷ 12 = ___.',
              correctAnswers: ['12'],
              explanation:    '144 ÷ 12 = 12. Comprobación: 12 × 12 = 144 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         '8 × 9 = 72',
              correctBoolean: true,
              explanation:    '8 × 9 = 72 ✓ (tabla del 9: 9×8=72).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada operación con su resultado:',
              // 6×8=48 ✓ | 63÷7=9 (7×9=63) ✓ | 12×12=144 ✓ | 100÷4=25 ✓
              pairs: [
                { left: '6 × 8',     right: '48'  },
                { left: '63 ÷ 7',    right: '9'   },
                { left: '12 × 12',   right: '144' },
                { left: '100 ÷ 4',   right: '25'  },
              ],
              explanation: '6×8=48 | 63÷7=9 | 12×12=144 | 100÷4=25.',
              difficulty: 'easy', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              // 56 ÷ 8 = 7  (8×7=56) ✓
              prompt:  'Tienes 56 manzanas y las repartes en 8 grupos iguales. ¿Cuántas hay en cada grupo?',
              options: [
                { text: '6', isCorrect: false },
                { text: '7', isCorrect: true,  explanation: '56 ÷ 8 = 7. Comprobación: 7 × 8 = 56 ✓' },
                { text: '8', isCorrect: false },
                { text: '9', isCorrect: false },
              ],
              explanation: '56 ÷ 8 = 7 manzanas por grupo.',
              difficulty: 'easy', xpValue: 3,
            },
          ],
        },

        // ── L4: Fracciones ───────────────────────────────────────────────────
        {
          name:         'Fracciones',
          description:  'Comprende qué son las fracciones, cómo compararlas y operar con ellas.',
          order:        4,
          difficulty:   'medium',
          xpReward:     15,
          questionCount: 5,
          aiTopicHint:  'Fracciones, numerador, denominador, fracciones equivalentes, comparación, operaciones',

          questions: [
            {
              type:    'multiple_choice',
              // 4/8 = 1/2 porque 4÷4=1 y 8÷4=2 ✓
              prompt:  '¿Cuál de estas fracciones es equivalente a 1/2?',
              options: [
                { text: '2/3', isCorrect: false },
                { text: '3/4', isCorrect: false },
                { text: '4/8', isCorrect: true,  explanation: '4/8: dividimos numerador y denominador entre 4 → 1/2.' },
                { text: '2/5', isCorrect: false },
              ],
              explanation: '4/8 = 1/2 (se simplifica dividiendo entre 4).',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'true_false',
              // 3/4=0,75  |  2/3≈0,667  →  3/4 > 2/3 ✓
              prompt:         '3/4 es mayor que 2/3.',
              correctBoolean: true,
              explanation:    '3/4 = 0,75 y 2/3 ≈ 0,667. Como 0,75 > 0,667, entonces 3/4 > 2/3 ✓',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 2/3 + 1/3 = 3/3 = 1 ✓
              prompt:         '2/3 + 1/3 = ___.',
              correctAnswers: ['1', '3/3'],
              explanation:    'Mismo denominador: 2/3 + 1/3 = 3/3 = 1.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada fracción con su porcentaje equivalente:',
              // 1/2=50% | 1/4=25% | 3/4=75% | 1/5=20% ✓
              pairs: [
                { left: '1/2', right: '50%' },
                { left: '1/4', right: '25%' },
                { left: '3/4', right: '75%' },
                { left: '1/5', right: '20%' },
              ],
              explanation: '1/2=50% | 1/4=25% | 3/4=75% | 1/5=20%.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              // 3/5 de 20 = (3×20)÷5 = 60÷5 = 12 ✓
              prompt:  '¿Cuánto es 3/5 de 20?',
              options: [
                { text: '10', isCorrect: false },
                { text: '12', isCorrect: true,  explanation: '(3 × 20) ÷ 5 = 60 ÷ 5 = 12.' },
                { text: '15', isCorrect: false },
                { text: '6',  isCorrect: false },
              ],
              explanation: '3/5 de 20 = (3 × 20) ÷ 5 = 12.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L5: Decimales ────────────────────────────────────────────────────
        {
          name:         'Números Decimales',
          description:  'Aprende a leer, comparar y operar con números decimales.',
          order:        5,
          difficulty:   'medium',
          xpReward:     15,
          questionCount: 4,
          aiTopicHint:  'Números decimales, décimas, centésimas, suma y resta de decimales',

          questions: [
            {
              type:    'multiple_choice',
              // 3,5 + 2,7: parte decimal 0,5+0,7=1,2; entera 3+2=5 → 6,2 ✓
              prompt:  '¿Cuánto es 3,5 + 2,7?',
              options: [
                { text: '5,2', isCorrect: false },
                { text: '6,0', isCorrect: false },
                { text: '6,2', isCorrect: true,  explanation: '0,5+0,7=1,2 → suma decimal. 3+2+1=6 → suma entera. Total: 6,2.' },
                { text: '5,9', isCorrect: false },
              ],
              explanation: '3,5 + 2,7 = 6,2.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 10 − 4,5 = 5,5 → 5,5 + 4,5 = 10 ✓
              prompt:         '10 − 4,5 = ___.',
              correctAnswers: ['5,5', '5.5'],
              explanation:    '10 − 4,5 = 5,5. Comprobación: 5,5 + 4,5 = 10 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // 0,5 = 5/10 = 1/2 ✓
              prompt:         'El número 0,5 es equivalente a la fracción 1/2.',
              correctBoolean: true,
              explanation:    '0,5 = 5/10 = 1/2 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada decimal con su fracción equivalente:',
              // 0,25=1/4 | 0,1=1/10 | 0,75=3/4 | 0,5=1/2 ✓
              pairs: [
                { left: '0,25', right: '1/4'  },
                { left: '0,1',  right: '1/10' },
                { left: '0,75', right: '3/4'  },
                { left: '0,5',  right: '1/2'  },
              ],
              explanation: '0,25=1/4 | 0,1=1/10 | 0,75=3/4 | 0,5=1/2.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

      ], // fin lecciones Unidad 1
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIDAD 2 — Álgebra Básica
    // ══════════════════════════════════════════════════════════════════════════
    {
      name:        'Álgebra Básica',
      description: 'Variables, expresiones algebraicas y ecuaciones de primer grado.',
      icon:        '🔤',
      order:       2,
      requiredXP:  50,

      lessons: [

        // ── L1: Variables ────────────────────────────────────────────────────
        {
          name:         'Introducción a las Variables',
          description:  'Comprende qué es una variable y cómo se usa en matemáticas.',
          order:        1,
          difficulty:   'easy',
          xpReward:     10,
          questionCount: 4,
          aiTopicHint:  'Variables, constantes, expresiones con variables, evaluación',

          questions: [
            {
              type:    'multiple_choice',
              // 2x con x=5 → 2×5=10 ✓
              prompt:  'Si x = 5, ¿cuánto es 2x?',
              options: [
                { text: '25', isCorrect: false },
                { text: '7',  isCorrect: false },
                { text: '10', isCorrect: true,  explanation: '2x = 2 × x = 2 × 5 = 10.' },
                { text: '52', isCorrect: false },
              ],
              explanation: '2x significa 2 multiplicado por x. Con x = 5: 2 × 5 = 10.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'Una variable puede representar cualquier valor numérico.',
              correctBoolean: true,
              explanation:    'Las variables (x, y, n…) son símbolos que pueden tomar cualquier valor numérico según el contexto.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // n=3 → n+7=10 ✓
              prompt:         'Si n = 3, entonces n + 7 = ___.',
              correctAnswers: ['10'],
              explanation:    'n + 7 = 3 + 7 = 10.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              prompt:  '¿Cuál de las siguientes es una expresión algebraica?',
              options: [
                { text: '5 + 3 = 8',  isCorrect: false },
                { text: '3x + 2',     isCorrect: true,  explanation: 'Contiene la variable x, por lo que es una expresión algebraica.' },
                { text: '10 × 4',     isCorrect: false },
                { text: '100',        isCorrect: false },
              ],
              explanation: 'Una expresión algebraica contiene al menos una variable. "3x + 2" tiene la variable x.',
              difficulty: 'easy', xpValue: 2,
            },
          ],
        },

        // ── L2: Expresiones Algebraicas ──────────────────────────────────────
        {
          name:         'Expresiones Algebraicas',
          description:  'Aprende a simplificar y evaluar expresiones con variables.',
          order:        2,
          difficulty:   'medium',
          xpReward:     15,
          questionCount: 4,
          aiTopicHint:  'Términos semejantes, simplificación de expresiones algebraicas, coeficientes',

          questions: [
            {
              type:    'multiple_choice',
              // 4a + 3a = (4+3)a = 7a ✓
              prompt:  '¿Cuánto es 4a + 3a?',
              options: [
                { text: '12a', isCorrect: false },
                { text: '7a',  isCorrect: true,  explanation: 'Términos semejantes: (4 + 3)a = 7a.' },
                { text: '7',   isCorrect: false },
                { text: '43a', isCorrect: false },
              ],
              explanation: '4a + 3a = 7a (se suman los coeficientes de términos semejantes).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 5x − 2x = (5-2)x = 3x ✓
              prompt:         'Simplifica: 5x − 2x = ___x.',
              correctAnswers: ['3'],
              explanation:    '5x − 2x = (5 − 2)x = 3x.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'La expresión 2x + 3y puede simplificarse a 5xy.',
              correctBoolean: false,
              explanation:    '2x y 3y NO son términos semejantes (diferentes variables). No se pueden combinar; la expresión ya está en su forma más simple.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Simplifica y relaciona con el resultado correcto:',
              // 3x+2x=5x | 8y−3y=5y | 4a×2=8a | 10b÷2=5b ✓
              pairs: [
                { left: '3x + 2x',  right: '5x' },
                { left: '8y − 3y',  right: '5y' },
                { left: '4a × 2',   right: '8a' },
                { left: '10b ÷ 2',  right: '5b' },
              ],
              explanation: '3x+2x=5x | 8y−3y=5y | 4a×2=8a | 10b÷2=5b.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L3: Ecuaciones de Primer Grado ───────────────────────────────────
        {
          name:         'Ecuaciones de Primer Grado',
          description:  'Resuelve ecuaciones lineales con una incógnita paso a paso.',
          order:        3,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 5,
          aiTopicHint:  'Ecuaciones de primer grado, despejar incógnita, verificar solución',

          questions: [
            {
              type:    'multiple_choice',
              // x+5=12 → x=12-5=7 ✓  (comprobación: 7+5=12 ✓)
              prompt:  'Resuelve: x + 5 = 12',
              options: [
                { text: 'x = 17', isCorrect: false },
                { text: 'x = 7',  isCorrect: true,  explanation: 'Restamos 5 en ambos lados: x = 12 − 5 = 7.' },
                { text: 'x = 6',  isCorrect: false },
                { text: 'x = 5',  isCorrect: false },
              ],
              explanation: 'x + 5 = 12 → x = 7. Comprobación: 7 + 5 = 12 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 3x=15 → x=5  (3×5=15 ✓)
              prompt:         'Si 3x = 15, entonces x = ___.',
              correctAnswers: ['5'],
              explanation:    '3x = 15 → x = 15 ÷ 3 = 5. Comprobación: 3 × 5 = 15 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // x=4 en 2x−3=5: 2(4)−3=8−3=5 ✓
              prompt:         'x = 4 es solución de la ecuación 2x − 3 = 5.',
              correctBoolean: true,
              explanation:    'Sustituyendo: 2(4) − 3 = 8 − 3 = 5 ✓. Entonces x = 4 sí es solución.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              // items (orden mezclado presentado al estudiante):
              //   idx 0: 'Verificar: 2(4) + 4 = 12 ✓'
              //   idx 1: 'Restar 4 en ambos lados: 2x = 8'
              //   idx 2: 'Dividir entre 2: x = 4'
              //   idx 3: 'Ecuación original: 2x + 4 = 12'
              // Orden correcto: 3 → 1 → 2 → 0
              type:         'order_items',
              prompt:       'Ordena los pasos para resolver la ecuación 2x + 4 = 12:',
              items: [
                'Verificar: 2(4) + 4 = 8 + 4 = 12 ✓',
                'Restar 4 en ambos lados: 2x = 8',
                'Dividir entre 2: x = 4',
                'Ecuación original: 2x + 4 = 12',
              ],
              correctOrder: [3, 1, 2, 0],
              explanation:  '① Planteamos la ecuación ② Restamos 4 ③ Dividimos entre 2 ④ Verificamos.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              // 4x−8=0 → 4x=8 → x=2  (comprobación: 4(2)−8=0 ✓)
              prompt:  'Resuelve: 4x − 8 = 0',
              options: [
                { text: 'x = 0',  isCorrect: false },
                { text: 'x = 4',  isCorrect: false },
                { text: 'x = 2',  isCorrect: true,  explanation: '4x = 8 → x = 8 ÷ 4 = 2. Comprobación: 4(2)−8=0 ✓' },
                { text: 'x = −2', isCorrect: false },
              ],
              explanation: '4x − 8 = 0 → 4x = 8 → x = 2.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L4: Inecuaciones ─────────────────────────────────────────────────
        {
          name:         'Inecuaciones Básicas',
          description:  'Comprende y resuelve desigualdades de primer grado.',
          order:        4,
          difficulty:   'hard',
          xpReward:     20,
          questionCount: 3,
          aiTopicHint:  'Inecuaciones, desigualdades, mayor que, menor que, solución de inecuaciones',

          questions: [
            {
              type:    'multiple_choice',
              // x>7: solo 8 cumple la condición estricta ✓
              prompt:  '¿Cuál de los siguientes valores satisface la inecuación x > 7?',
              options: [
                { text: '5', isCorrect: false },
                { text: '7', isCorrect: false },
                { text: '8', isCorrect: true,  explanation: '8 > 7 es verdadero. El 7 no cumple porque la condición es estricta (>).' },
                { text: '3', isCorrect: false },
              ],
              explanation: 'Solo el 8 satisface x > 7. El 7 no vale porque se necesita estrictamente mayor.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'true_false',
              // x≥5 con x=5: 5≥5 es verdadero ✓
              prompt:         'x = 5 satisface la inecuación x ≥ 5.',
              correctBoolean: true,
              explanation:    'El símbolo ≥ significa "mayor O igual que". Como 5 = 5, se cumple la condición ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // 2x+1<9 → 2x<8 → x<4  ✓ (ej. x=3: 2(3)+1=7<9 ✓)
              prompt:  'Resuelve: 2x + 1 < 9',
              options: [
                { text: 'x > 4', isCorrect: false },
                { text: 'x < 4', isCorrect: true,  explanation: '2x + 1 < 9 → 2x < 8 → x < 4. Por ej. x=3: 2(3)+1=7<9 ✓' },
                { text: 'x = 4', isCorrect: false },
                { text: 'x > 5', isCorrect: false },
              ],
              explanation: '2x + 1 < 9 → 2x < 8 → x < 4.',
              difficulty: 'hard', xpValue: 3,
            },
          ],
        },

      ], // fin lecciones Unidad 2
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIDAD 3 — Geometría
    // ══════════════════════════════════════════════════════════════════════════
    {
      name:        'Geometría',
      description: 'Figuras planas, perímetro, área, ángulos y círculos.',
      icon:        '📐',
      order:       3,
      requiredXP:  100,

      lessons: [

        // ── L1: Figuras Básicas ──────────────────────────────────────────────
        {
          name:         'Figuras Geométricas Básicas',
          description:  'Identifica y clasifica las principales figuras geométricas planas.',
          order:        1,
          difficulty:   'easy',
          xpReward:     10,
          questionCount: 4,
          aiTopicHint:  'Polígonos, triángulos, cuadriláteros, clasificación de figuras geométricas',

          questions: [
            {
              type:    'multiple_choice',
              prompt:  '¿Cuántos lados tiene un hexágono?',
              options: [
                { text: '5', isCorrect: false },
                { text: '6', isCorrect: true,  explanation: '"Hexa" en griego significa seis. Un hexágono tiene 6 lados.' },
                { text: '7', isCorrect: false },
                { text: '8', isCorrect: false },
              ],
              explanation: 'Un hexágono tiene 6 lados. ("Hexa" = seis en griego).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'Un triángulo equilátero tiene todos sus lados iguales.',
              correctBoolean: true,
              explanation:    'El triángulo equilátero tiene los 3 lados iguales y los 3 ángulos de 60° cada uno.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada figura con su número de lados:',
              pairs: [
                { left: 'Triángulo',    right: '3 lados' },
                { left: 'Cuadrilátero', right: '4 lados' },
                { left: 'Pentágono',    right: '5 lados' },
                { left: 'Hexágono',     right: '6 lados' },
              ],
              explanation: 'Triángulo=3 | Cuadrilátero=4 | Pentágono=5 | Hexágono=6.',
              difficulty: 'easy', xpValue: 3,
            },
            {
              type:           'fill_blank',
              prompt:         'Un polígono de 8 lados se llama ___.',
              correctAnswers: ['octágono', 'octogono'],
              explanation:    '"Octa" = ocho en griego. Un polígono de 8 lados es un octágono.',
              difficulty: 'easy', xpValue: 2,
            },
          ],
        },

        // ── L2: Perímetro y Área ─────────────────────────────────────────────
        {
          name:         'Perímetro y Área',
          description:  'Calcula el perímetro y el área de figuras geométricas planas.',
          order:        2,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 5,
          aiTopicHint:  'Perímetro, área, rectángulo, cuadrado, triángulo, fórmulas geométricas',

          questions: [
            {
              type:    'multiple_choice',
              // Perímetro cuadrado = 4 × lado = 4 × 5 = 20 cm ✓
              prompt:  '¿Cuál es el perímetro de un cuadrado con lado de 5 cm?',
              options: [
                { text: '10 cm', isCorrect: false },
                { text: '25 cm', isCorrect: false },
                { text: '20 cm', isCorrect: true,  explanation: 'Perímetro del cuadrado = 4 × lado = 4 × 5 = 20 cm.' },
                { text: '15 cm', isCorrect: false },
              ],
              explanation: 'P(cuadrado) = 4 × lado = 4 × 5 = 20 cm.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // Área rectángulo = base × altura = 6 × 4 = 24 cm² ✓
              prompt:         'El área de un rectángulo de 6 cm × 4 cm es ___ cm².',
              correctAnswers: ['24'],
              explanation:    'A(rectángulo) = base × altura = 6 × 4 = 24 cm².',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // Perímetro triángulo equilátero lado 3 = 3×3=9 cm ✓
              prompt:         'El perímetro de un triángulo equilátero con lado de 3 cm es 9 cm.',
              correctBoolean: true,
              explanation:    'P = 3 × lado = 3 × 3 = 9 cm ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // Área triángulo = (base × altura) ÷ 2 = (8 × 5) ÷ 2 = 40 ÷ 2 = 20 cm² ✓
              prompt:  'Un triángulo tiene base 8 cm y altura 5 cm. ¿Cuál es su área?',
              options: [
                { text: '40 cm²', isCorrect: false },
                { text: '13 cm²', isCorrect: false },
                { text: '20 cm²', isCorrect: true,  explanation: 'A = (b × h) ÷ 2 = (8 × 5) ÷ 2 = 40 ÷ 2 = 20 cm².' },
                { text: '24 cm²', isCorrect: false },
              ],
              explanation: 'A(triángulo) = (base × altura) ÷ 2 = (8 × 5) ÷ 2 = 20 cm².',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:           'fill_blank',
              // A=70, base=10 → altura = A ÷ base = 70 ÷ 10 = 7 cm ✓
              prompt:         'Un rectángulo tiene base 10 cm y área 70 cm². Su altura es ___ cm.',
              correctAnswers: ['7'],
              explanation:    'Área = base × altura → altura = Área ÷ base = 70 ÷ 10 = 7 cm.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L3: Ángulos y Triángulos ─────────────────────────────────────────
        {
          name:         'Ángulos y Triángulos',
          description:  'Clasifica ángulos y triángulos según sus propiedades.',
          order:        3,
          difficulty:   'medium',
          xpReward:     15,
          questionCount: 5,
          aiTopicHint:  'Ángulos, suma de ángulos en un triángulo, clasificación de triángulos',

          questions: [
            {
              type:    'multiple_choice',
              prompt:  '¿Cuántos grados mide un ángulo recto?',
              options: [
                { text: '45°',  isCorrect: false },
                { text: '180°', isCorrect: false },
                { text: '90°',  isCorrect: true,  explanation: 'Un ángulo recto mide exactamente 90° y se dibuja con un cuadradito en el vértice.' },
                { text: '360°', isCorrect: false },
              ],
              explanation: 'Un ángulo recto = 90°.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'La suma de los ángulos interiores de cualquier triángulo es 180°.',
              correctBoolean: true,
              explanation:    'Teorema fundamental: los tres ángulos interiores de un triángulo siempre suman 180°.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 60+80+x=180 → x=180-140=40 ✓
              prompt:         'Un triángulo tiene ángulos de 60° y 80°. El tercer ángulo mide ___°.',
              correctAnswers: ['40'],
              explanation:    '60° + 80° + x = 180° → x = 180° − 140° = 40°.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada tipo de ángulo con su medida:',
              pairs: [
                { left: 'Ángulo agudo',  right: 'Entre 0° y 90°'       },
                { left: 'Ángulo recto',  right: 'Exactamente 90°'       },
                { left: 'Ángulo obtuso', right: 'Entre 90° y 180°'      },
                { left: 'Ángulo llano',  right: 'Exactamente 180°'      },
              ],
              explanation: 'Agudo <90° | Recto =90° | Obtuso >90° y <180° | Llano =180°.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              prompt:  '¿Cómo se llama un triángulo que tiene exactamente dos lados iguales?',
              options: [
                { text: 'Equilátero',  isCorrect: false },
                { text: 'Isósceles',   isCorrect: true,  explanation: 'Isósceles: 2 lados iguales. Equilátero: 3 iguales. Escaleno: todos diferentes.' },
                { text: 'Escaleno',    isCorrect: false },
                { text: 'Rectángulo',  isCorrect: false },
              ],
              explanation: 'Triángulo isósceles = exactamente 2 lados iguales.',
              difficulty: 'easy', xpValue: 2,
            },
          ],
        },

        // ── L4: Círculo y Circunferencia ─────────────────────────────────────
        {
          name:         'Círculo y Circunferencia',
          description:  'Propiedades del círculo: radio, diámetro, circunferencia y área.',
          order:        4,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 4,
          aiTopicHint:  'Círculo, radio, diámetro, pi, circunferencia, área del círculo',

          questions: [
            {
              type:    'multiple_choice',
              prompt:  '¿Cuál es el valor aproximado del número π (pi)?',
              options: [
                { text: '3,41', isCorrect: false },
                { text: '3,14', isCorrect: true,  explanation: 'π ≈ 3,14159… Se usa 3,14 en cálculos básicos.' },
                { text: '3,12', isCorrect: false },
                { text: '2,14', isCorrect: false },
              ],
              explanation: 'π ≈ 3,14 (o con más decimales: 3,14159…).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              prompt:         'El diámetro de un círculo es igual al doble del ___.',
              correctAnswers: ['radio', 'Radio'],
              explanation:    'Diámetro = 2 × radio. El radio va del centro al borde; el diámetro cruza el centro de lado a lado.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // C = 2πr = 2 × 3,14 × 5 = 31,4 cm ✓
              prompt:         'La circunferencia de un círculo con radio 5 cm es aproximadamente 31,4 cm.',
              correctBoolean: true,
              explanation:    'C = 2 × π × r = 2 × 3,14 × 5 = 31,4 cm ✓',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // A = π × r² = 3,14 × 3² = 3,14 × 9 = 28,26 cm² ✓
              prompt:  '¿Cuál es el área de un círculo con radio 3 cm? (usa π ≈ 3,14)',
              options: [
                { text: '9,42 cm²',  isCorrect: false },
                { text: '18,84 cm²', isCorrect: false },
                { text: '28,26 cm²', isCorrect: true,  explanation: 'A = π × r² = 3,14 × 3² = 3,14 × 9 = 28,26 cm².' },
                { text: '6,28 cm²',  isCorrect: false },
              ],
              explanation: 'A(círculo) = π × r² = 3,14 × 9 = 28,26 cm².',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

      ], // fin lecciones Unidad 3
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIDAD 4 — Estadística y Probabilidad
    // ══════════════════════════════════════════════════════════════════════════
    {
      name:        'Estadística y Probabilidad',
      description: 'Recolección de datos, medidas estadísticas y probabilidad básica.',
      icon:        '📊',
      order:       4,
      requiredXP:  150,

      lessons: [

        // ── L1: Datos y Gráficos ─────────────────────────────────────────────
        {
          name:         'Datos y Gráficos',
          description:  'Aprende a representar e interpretar datos en distintos tipos de gráficos.',
          order:        1,
          difficulty:   'easy',
          xpReward:     10,
          questionCount: 4,
          aiTopicHint:  'Gráficos estadísticos, diagrama de barras, gráfico circular, interpretación de datos',

          questions: [
            {
              type:    'multiple_choice',
              prompt:  '¿Qué tipo de gráfico es más adecuado para mostrar las proporciones de un todo?',
              options: [
                { text: 'Gráfico de barras',            isCorrect: false },
                { text: 'Gráfico circular (de pastel)',  isCorrect: true,  explanation: 'El gráfico circular divide el total en sectores proporcionales a cada categoría.' },
                { text: 'Gráfico de líneas',             isCorrect: false },
                { text: 'Histograma',                    isCorrect: false },
              ],
              explanation: 'El gráfico circular (de pastel) muestra cómo se divide un total entre distintas partes.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'Un diagrama de barras se puede usar para representar datos categóricos.',
              correctBoolean: true,
              explanation:    'Sí: los diagramas de barras son ideales para comparar categorías (materias, meses, productos, etc.).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              prompt:         'La ___ es la diferencia entre el valor máximo y el valor mínimo de un conjunto de datos.',
              correctAnswers: ['rango', 'Rango'],
              explanation:    'Rango = valor máximo − valor mínimo. Mide la dispersión del conjunto.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // 12 + 8 + 5 = 25 ✓
              prompt:  'En un gráfico de barras se registró: Fútbol = 12, Baloncesto = 8, Natación = 5. ¿Cuántos estudiantes fueron encuestados en total?',
              options: [
                { text: '20', isCorrect: false },
                { text: '25', isCorrect: true,  explanation: '12 + 8 + 5 = 25 estudiantes.' },
                { text: '30', isCorrect: false },
                { text: '15', isCorrect: false },
              ],
              explanation: 'Total = 12 + 8 + 5 = 25 estudiantes.',
              difficulty: 'easy', xpValue: 2,
            },
          ],
        },

        // ── L2: Medidas de Tendencia Central ─────────────────────────────────
        {
          name:         'Medidas de Tendencia Central',
          description:  'Calcula e interpreta la media, mediana y moda de un conjunto de datos.',
          order:        2,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 5,
          aiTopicHint:  'Media aritmética, mediana, moda, tendencia central, promedio',

          questions: [
            {
              type:    'multiple_choice',
              // (4+8+6+10+2)÷5 = 30÷5 = 6 ✓
              prompt:  '¿Cuál es la media aritmética de: 4, 8, 6, 10, 2?',
              options: [
                { text: '5', isCorrect: false },
                { text: '6', isCorrect: true,  explanation: 'Suma: 4+8+6+10+2=30. Media: 30÷5=6.' },
                { text: '8', isCorrect: false },
                { text: '4', isCorrect: false },
              ],
              explanation: 'Media = suma ÷ cantidad = (4+8+6+10+2) ÷ 5 = 30 ÷ 5 = 6.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:           'fill_blank',
              // {1,3,5,7,9} ordenado → mediana = 5 (posición central) ✓
              prompt:         'La mediana del conjunto {1, 3, 5, 7, 9} (ya ordenado) es ___.',
              correctAnswers: ['5'],
              explanation:    'Con 5 datos ordenados, la mediana es el valor central (3ª posición): 5.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'La moda es el valor que más se repite en un conjunto de datos.',
              correctBoolean: true,
              explanation:    'Correcto. La moda es el dato con mayor frecuencia. Un conjunto puede tener ninguna, una o varias modas.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // {2,4,4,6,8}: el 4 aparece 2 veces; los demás, 1 vez → moda=4 ✓
              prompt:  'En el conjunto de datos {2, 4, 4, 6, 8}, ¿cuál es la moda?',
              options: [
                { text: '2', isCorrect: false },
                { text: '6', isCorrect: false },
                { text: '4', isCorrect: true,  explanation: 'El 4 aparece 2 veces, más que cualquier otro valor.' },
                { text: '8', isCorrect: false },
              ],
              explanation: 'Moda = 4 (aparece 2 veces; los demás solo 1 vez).',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada medida estadística con su definición:',
              pairs: [
                { left: 'Media',    right: 'Suma de datos dividida entre la cantidad' },
                { left: 'Mediana',  right: 'Valor central cuando los datos están ordenados' },
                { left: 'Moda',     right: 'Valor que más se repite en el conjunto'  },
                { left: 'Rango',    right: 'Diferencia entre el mayor y el menor dato' },
              ],
              explanation: 'Media=promedio | Mediana=central | Moda=frecuente | Rango=dispersión.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L3: Probabilidad Básica ──────────────────────────────────────────
        {
          name:         'Probabilidad Básica',
          description:  'Aprende los conceptos fundamentales del cálculo de probabilidades.',
          order:        3,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 4,
          aiTopicHint:  'Probabilidad, experimento aleatorio, espacio muestral, evento seguro, evento imposible',

          questions: [
            {
              type:    'multiple_choice',
              // P(6) = 1/6 ✓
              prompt:  'Al lanzar un dado de 6 caras, ¿cuál es la probabilidad de obtener el número 6?',
              options: [
                { text: '1/3', isCorrect: false },
                { text: '1/6', isCorrect: true,  explanation: '6 resultados posibles; solo 1 es favorable. P(6) = 1/6.' },
                { text: '1/2', isCorrect: false },
                { text: '6/1', isCorrect: false },
              ],
              explanation: 'P = casos favorables ÷ casos totales = 1 ÷ 6 = 1/6.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'La probabilidad de un evento imposible es 0.',
              correctBoolean: true,
              explanation:    'Un evento imposible nunca ocurre, por lo que P = 0. Ejemplo: sacar 7 en un dado de 6 caras.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // P(cara) = 1/2 ✓
              prompt:         'Al lanzar una moneda, la probabilidad de obtener cara es ___.',
              correctAnswers: ['1/2', '0,5', '0.5', '50%'],
              explanation:    'Una moneda tiene 2 resultados posibles. P(cara) = 1 ÷ 2 = 1/2.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // 2 monedas: (C,C),(C,S),(S,C),(S,S) = 4 resultados ✓
              prompt:  'Al lanzar 2 monedas simultáneamente, ¿cuántos resultados posibles hay?',
              options: [
                { text: '2', isCorrect: false },
                { text: '3', isCorrect: false },
                { text: '4', isCorrect: true,  explanation: 'Los resultados son: (C,C), (C,S), (S,C) y (S,S) = 4.' },
                { text: '6', isCorrect: false },
              ],
              explanation: '2 monedas × 2 posibilidades = 4 resultados: (C,C), (C,S), (S,C), (S,S).',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

      ], // fin lecciones Unidad 4
    },

    // ══════════════════════════════════════════════════════════════════════════
    //  UNIDAD 5 — Números y Operaciones Avanzadas
    // ══════════════════════════════════════════════════════════════════════════
    {
      name:        'Números y Operaciones Avanzadas',
      description: 'Potencias, raíces cuadradas, divisibilidad, porcentajes y proporciones.',
      icon:        '🧮',
      order:       5,
      requiredXP:  200,

      lessons: [

        // ── L1: Potencias y Raíces ───────────────────────────────────────────
        {
          name:         'Potencias y Raíces Cuadradas',
          description:  'Calcula potencias y raíces cuadradas y comprende su significado.',
          order:        1,
          difficulty:   'medium',
          xpReward:     15,
          questionCount: 5,
          aiTopicHint:  'Potencias, exponente, base, raíz cuadrada, cuadrados perfectos',

          questions: [
            {
              type:    'multiple_choice',
              // 3⁴ = 3×3×3×3 = 9×9 = 81 ✓
              prompt:  '¿Cuánto es 3⁴?',
              options: [
                { text: '12',  isCorrect: false },
                { text: '64',  isCorrect: false },
                { text: '81',  isCorrect: true,  explanation: '3⁴ = 3×3×3×3 = 9×9 = 81.' },
                { text: '27',  isCorrect: false },
              ],
              explanation: '3⁴ = 3 × 3 × 3 × 3 = 81.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:           'fill_blank',
              // √64 = 8 (8×8=64 ✓)
              prompt:         '√64 = ___.',
              correctAnswers: ['8'],
              explanation:    '√64 = 8 porque 8 × 8 = 64.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // 2⁵ = 2×2×2×2×2 = 4×4×2 = 16×2 = 32 ✓
              prompt:         '2⁵ = 32',
              correctBoolean: true,
              explanation:    '2⁵ = 2×2×2×2×2 = 32 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada expresión con su valor numérico:',
              // 2³=8 | 5²=25 | √49=7 | 10²=100 ✓
              pairs: [
                { left: '2³',   right: '8'   },
                { left: '5²',   right: '25'  },
                { left: '√49',  right: '7'   },
                { left: '10²',  right: '100' },
              ],
              explanation: '2³=8 | 5²=25 | √49=7 | 10²=100.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              // 4²+3² = 16+9 = 25 ✓  (≠ (4+3)²=49)
              prompt:  '¿Cuánto es 4² + 3²?',
              options: [
                { text: '49',  isCorrect: false },
                { text: '14',  isCorrect: false },
                { text: '25',  isCorrect: true,  explanation: '4²=16 y 3²=9. Suma: 16+9=25. ¡Ojo! (4+3)²=49≠25.' },
                { text: '7²',  isCorrect: false },
              ],
              explanation: '4² + 3² = 16 + 9 = 25. (No es lo mismo que (4+3)² = 49)',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L2: Divisibilidad y Números Primos ───────────────────────────────
        {
          name:         'Divisibilidad y Números Primos',
          description:  'Comprende las reglas de divisibilidad e identifica números primos.',
          order:        2,
          difficulty:   'medium',
          xpReward:     20,
          questionCount: 5,
          aiTopicHint:  'Divisibilidad, múltiplos, divisores, números primos, factorización prima',

          questions: [
            {
              type:    'multiple_choice',
              // 17 es primo (solo divisible entre 1 y 17) | 15=3×5, 16=2⁴, 18=2×3² ✓
              prompt:  '¿Cuál de los siguientes números es primo?',
              options: [
                { text: '15', isCorrect: false },
                { text: '16', isCorrect: false },
                { text: '17', isCorrect: true,  explanation: '17 solo es divisible por 1 y 17: es primo. 15=3×5, 16=2⁴, 18=2×3².' },
                { text: '18', isCorrect: false },
              ],
              explanation: '17 es primo: sus únicos divisores son 1 y 17.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'true_false',
              prompt:         'El número 1 es un número primo.',
              correctBoolean: false,
              explanation:    'Los primos tienen exactamente 2 divisores. El 1 solo tiene 1 divisor (él mismo), por lo que NO es primo.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 12 = 2 × 2 × 3  → factores primos: 2, 2 y 3 ✓
              prompt:         'Los factores primos de 12 son: 2, 2 y ___.',
              correctAnswers: ['3'],
              explanation:    '12 = 2 × 2 × 3 = 2² × 3. Sus factores primos son 2 y 3.',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:    'multiple_choice',
              // MCD(12,18): 12=2²×3, 18=2×3² → MCD=2×3=6 ✓
              prompt:  '¿Cuál es el Máximo Común Divisor (MCD) de 12 y 18?',
              options: [
                { text: '3',  isCorrect: false },
                { text: '6',  isCorrect: true,  explanation: 'Divisores comunes de 12 y 18: 1,2,3,6. El mayor es 6.' },
                { text: '36', isCorrect: false },
                { text: '2',  isCorrect: false },
              ],
              explanation: 'MCD(12, 18) = 6. (12=2²×3, 18=2×3² → MCD=2¹×3¹=6)',
              difficulty: 'medium', xpValue: 3,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada criterio de divisibilidad con su regla:',
              pairs: [
                { left: 'Divisible entre 2',  right: 'Termina en cifra par'                    },
                { left: 'Divisible entre 3',  right: 'La suma de sus dígitos es divisible entre 3' },
                { left: 'Divisible entre 5',  right: 'Termina en 0 o 5'                         },
                { left: 'Divisible entre 10', right: 'Termina en 0'                             },
              ],
              explanation: 'Criterios: ÷2→par | ÷3→suma dígitos | ÷5→0 o 5 | ÷10→0.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

        // ── L3: Porcentajes y Proporciones ───────────────────────────────────
        {
          name:         'Porcentajes y Proporciones',
          description:  'Calcula porcentajes y resuelve problemas de proporcionalidad directa.',
          order:        3,
          difficulty:   'hard',
          xpReward:     20,
          questionCount: 5,
          aiTopicHint:  'Porcentaje, tanto por ciento, proporciones, razón, regla de tres simple',

          questions: [
            {
              type:    'multiple_choice',
              // 25% de 200 = (25/100)×200 = 0,25×200 = 50 ✓
              prompt:  '¿Cuánto es el 25% de 200?',
              options: [
                { text: '25', isCorrect: false },
                { text: '50', isCorrect: true,  explanation: '25% de 200 = (25÷100)×200 = 0,25×200 = 50.' },
                { text: '75', isCorrect: false },
                { text: '40', isCorrect: false },
              ],
              explanation: '25% de 200 = 0,25 × 200 = 50.',
              difficulty: 'medium', xpValue: 2,
            },
            {
              type:           'fill_blank',
              // 10% de 350 = 35 ✓
              prompt:         'El 10% de 350 es ___.',
              correctAnswers: ['35'],
              explanation:    '10% de 350 = (10÷100)×350 = 0,1×350 = 35.',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:           'true_false',
              // 50% = 50/100 = 1/2 ✓
              prompt:         'El 50% es equivalente a la fracción 1/2.',
              correctBoolean: true,
              explanation:    '50% = 50/100 = 1/2 ✓',
              difficulty: 'easy', xpValue: 2,
            },
            {
              type:    'multiple_choice',
              // Descuento 20% sobre $80.000: 0,20×80.000=16.000 → precio final=64.000 ✓
              prompt:  'Un artículo cuesta $80.000 y tiene un descuento del 20%. ¿Cuánto se paga?',
              options: [
                { text: '$60.000', isCorrect: false },
                { text: '$64.000', isCorrect: true,  explanation: 'Descuento = 20%×80.000 = 16.000. Precio final = 80.000−16.000 = 64.000.' },
                { text: '$70.000', isCorrect: false },
                { text: '$16.000', isCorrect: false },
              ],
              explanation: '20% de $80.000 = $16.000 de descuento. Se paga $80.000 − $16.000 = $64.000.',
              difficulty: 'hard', xpValue: 3,
            },
            {
              type:   'match_pairs',
              prompt: 'Relaciona cada porcentaje con su fracción equivalente:',
              // 10%=1/10 | 25%=1/4 | 50%=1/2 | 100%=1 ✓
              pairs: [
                { left: '10%',  right: '1/10' },
                { left: '25%',  right: '1/4'  },
                { left: '50%',  right: '1/2'  },
                { left: '100%', right: '1'    },
              ],
              explanation: '10%=1/10 | 25%=1/4 | 50%=1/2 | 100%=1.',
              difficulty: 'medium', xpValue: 3,
            },
          ],
        },

      ], // fin lecciones Unidad 5
    },

  ], // fin units
}; // fin MATEMATICAS

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  LÓGICA DE CREACIÓN (upsert seguro)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * findOrCreate usando findOneAndUpdate + $setOnInsert para evitar disparar
 * el middleware pre('save') de Subject (que no llama a next() en algunas versiones).
 * Con runValidators: false el seed es responsable de la calidad del dato.
 */
async function upsertDoc(Model, filter, data) {
  return Model.findOneAndUpdate(
    filter,
    { $setOnInsert: data },
    { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
  );
}

async function createQuestions(questions, lessonId, unitId, subjectId) {
  let created = 0;
  for (const q of questions) {
    const exists = await Question.findOne({ lesson: lessonId, prompt: q.prompt });
    if (exists && !FORCE) continue;
    if (exists && FORCE) await Question.deleteOne({ _id: exists._id });

    await Question.create({
      ...q,
      lesson:        lessonId,
      unit:          unitId,
      subject:       subjectId,
      isActive:      true,
      isAIGenerated: false,
      isReviewed:    true,
    });
    created++;
  }
  return created;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  log.title('seedMatematicas.js — Iniciando');
  if (DRY)   log.warn('Modo DRY-RUN: no se escribirá nada en la BD');
  if (FORCE) log.warn('Modo FORCE: las preguntas existentes se regenerarán');

  await mongoose.connect(process.env.MONGODB_URI);
  log.ok('Conectado a MongoDB');

  if (DRY) {
    // Contar sólo y salir
    let totalQ = 0;
    for (const u of MATEMATICAS.units)
      for (const l of u.lessons)
        totalQ += l.questions.length;
    log.info(`DRY-RUN: se insertarían ${MATEMATICAS.units.length} unidades, ` +
      `${MATEMATICAS.units.reduce((a,u)=>a+u.lessons.length,0)} lecciones, ${totalQ} preguntas.`);
    await mongoose.disconnect();
    return;
  }

  // ── 1. Subject ─────────────────────────────────────────────────────────────
  log.sep('Materia');
  const subjectData = { ...MATEMATICAS.subject };
  const subject = await upsertDoc(Subject, { slug: subjectData.slug }, subjectData);
  log.ok(`Materia: "${subject.name}" (id: ${subject._id})`);

  // ── 2. Unidades → Lecciones → Preguntas ───────────────────────────────────
  const stats = { units: 0, lessons: 0, questions: 0, errors: 0 };

  for (const unitData of MATEMATICAS.units) {
    const { lessons, ...unitFields } = unitData;

    log.sep(`Unidad ${unitFields.order}: ${unitFields.name}`);

    let unit;
    try {
      unit = await upsertDoc(
        Unit,
        { subject: subject._id, order: unitFields.order },
        { ...unitFields, subject: subject._id }
      );
      stats.units++;
      log.ok(`Unidad guardada: "${unit.name}" (id: ${unit._id})`);
    } catch (err) {
      log.err(`Error creando unidad "${unitFields.name}": ${err.message}`);
      stats.errors++;
      continue;
    }

    for (const lessonData of lessons) {
      const { questions, ...lessonFields } = lessonData;

      let lesson;
      try {
        lesson = await upsertDoc(
          Lesson,
          { unit: unit._id, order: lessonFields.order },
          { ...lessonFields, unit: unit._id }
        );
        stats.lessons++;
        log.info(`Lección "${lesson.name}" (id: ${lesson._id})`);
      } catch (err) {
        log.err(`  Error creando lección "${lessonFields.name}": ${err.message}`);
        stats.errors++;
        continue;
      }

      try {
        const created = await createQuestions(questions, lesson._id, unit._id, subject._id);
        stats.questions += created;
        log.ok(`  → ${created} pregunta(s) insertada(s) (${questions.length} definidas)`);
      } catch (err) {
        log.err(`  Error insertando preguntas de "${lesson.name}": ${err.message}`);
        stats.errors++;
      }
    }
  }

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESUMEN FINAL');
  console.log('═'.repeat(60));
  console.log(`  Unidades  insertadas : ${stats.units}`);
  console.log(`  Lecciones insertadas : ${stats.lessons}`);
  console.log(`  Preguntas insertadas : ${stats.questions}`);
  console.log(`  Errores              : ${stats.errors}`);
  console.log('═'.repeat(60) + '\n');

  await mongoose.disconnect();
  log.ok('Desconectado. ¡Seed completado!');
}

main().catch((err) => {
  log.err('Error fatal:', err.message);
  console.error(err);
  process.exit(1);
});