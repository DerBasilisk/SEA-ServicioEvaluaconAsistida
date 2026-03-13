import { useState, useMemo } from "react";

export default function SentenceBuilder({ question, onAnswer }) {
  // El prompt tiene ___ donde van las palabras. Ej: "El ___ es ___ de América"
  // question.wordBank: array de strings con las opciones disponibles
  // question.correctAnswers: array de strings en orden correcto

  const blanks = (question.prompt.match(/___/g) || []).length;
  const [selected, setSelected] = useState(Array(blanks).fill(null)); // palabra en cada hueco
  const [activeBlank, setActiveBlank] = useState(0); // hueco activo

  const parts = question.prompt.split("___");

  const usedWords = selected.filter(Boolean);
  const availableWords = useMemo(() => {
    const used = [...usedWords];
    return (question.wordBank || []).filter((w) => {
      const idx = used.indexOf(w);
      if (idx !== -1) { used.splice(idx, 1); return false; }
      return true;
    });
  }, [selected, question.wordBank]);

  const handleSelectWord = (word) => {
    const newSelected = [...selected];
    newSelected[activeBlank] = word;
    setSelected(newSelected);
    // Avanzar al siguiente hueco vacío
    const nextBlank = newSelected.findIndex((v, i) => i > activeBlank && !v);
    if (nextBlank !== -1) setActiveBlank(nextBlank);
    else {
      const firstEmpty = newSelected.findIndex((v) => !v);
      if (firstEmpty !== -1) setActiveBlank(firstEmpty);
    }
  };

  const handleRemoveWord = (blankIndex) => {
    const newSelected = [...selected];
    newSelected[blankIndex] = null;
    setSelected(newSelected);
    setActiveBlank(blankIndex);
  };

  const allFilled = selected.every(Boolean);

  const handleConfirm = () => {
    if (!allFilled) return;
    onAnswer(selected);
  };

  return (
    <div className="w-full space-y-6">
      {/* Oración con huecos */}
      <div className="bg-indigo-900 rounded-2xl p-5 flex flex-wrap items-center gap-2 text-lg leading-relaxed">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-2 flex-wrap">
            <span className="text-white">{part}</span>
            {i < blanks && (
              <button
                onClick={() => handleRemoveWord(i)}
                className={`
                  min-w-[80px] px-3 py-1 rounded-lg border-2 font-bold transition-all
                  ${activeBlank === i
                    ? "border-violet-400 bg-violet-800 text-white"
                    : "border-indigo-500 bg-indigo-800 text-white"
                  }
                  ${selected[i] ? "border-emerald-500 bg-emerald-900 text-emerald-300" : ""}
                `}
              >
                {selected[i] || <span className="text-indigo-500 text-sm">toca aquí</span>}
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Banco de palabras */}
      <div>
        <p className="text-indigo-400 text-xs text-center mb-3">
          {activeBlank < blanks
            ? `Completando hueco ${activeBlank + 1} de ${blanks}`
            : "Todos los huecos completos"}
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {availableWords.map((word, i) => (
            <button
              key={i}
              onClick={() => handleSelectWord(word)}
              className="px-4 py-2 bg-indigo-800 border-2 border-indigo-600 hover:border-violet-400 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all active:scale-95"
            >
              {word}
            </button>
          ))}
          {availableWords.length === 0 && (
            <p className="text-indigo-500 text-sm">Todas las palabras usadas</p>
          )}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        disabled={!allFilled}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition active:scale-95"
      >
        {allFilled ? "Confirmar" : `Faltan ${selected.filter(v => !v).length} palabras`}
      </button>
    </div>
  );
}