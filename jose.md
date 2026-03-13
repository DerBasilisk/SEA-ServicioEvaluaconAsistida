# Patch: integrar questionRefresh en lesson.js

## 1. Agregar import al inicio de controllers/lesson.js

```js
const { refreshStaleQuestions, recordShownQuestions } = require("../services/questionRefresh.service");
```

## 2. En startLesson — registrar preguntas mostradas ANTES de enviar respuesta

Justo antes del `res.json(...)` final de startLesson, agregá:

```js
// Registrar preguntas mostradas (sin await — no bloquea)
recordShownQuestions(
  req.usuario._id,
  lesson._id,
  sanitizedQuestions.map((q) => q._id)
).catch(console.error);
```

## 3. En completeLesson — regenerar en segundo plano

Justo antes del `res.json(...)` final de completeLesson, agregá:

```js
// Regenerar preguntas viejas en segundo plano (sin await)
refreshStaleQuestions(
  req.usuario._id,
  lesson,
  lesson.unit,
  lesson.unit.subject
).catch(console.error);
```

IMPORTANTE: Para que lesson.unit.subject esté disponible en completeLesson,
cambiá el findById al inicio de esa función:

```js
// Antes
const lesson = await Lesson.findById(req.params.id);

// Después
const lesson = await Lesson.findById(req.params.id).populate({
  path: "unit",
  populate: { path: "subject" },
});
```