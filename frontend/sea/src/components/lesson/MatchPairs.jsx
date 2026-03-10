import { useState } from "react";

export default function MatchPairs({ question, onAnswer }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matches, setMatches] = useState({}); // { leftId: rightId }
  const [submitted, setSubmitted] = useState(false);

  const leftItems = question.leftItems || [];
  const rightItems = question.rightItems || [];

  const handleLeftClick = (id) => {
    if (submitted) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  };

  const handleRightClick = (id) => {
    if (submitted || !selectedLeft) return;

    // Si este rightId ya está matcheado, desmatchear
    const existingLeft = Object.keys(matches).find((l) => matches[l] === id);
    const newMatches = { ...matches };
    if (existingLeft) delete newMatches[existingLeft];

    newMatches[selectedLeft] = id;
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const isMatched = (leftId) => matches[leftId] !== undefined;
  const getRightMatch = (leftId) => rightItems.find((r) => r._id === matches[leftId]);
  const isRightUsed = (rightId) => Object.values(matches).includes(rightId);

  const allMatched = leftItems.length > 0 && Object.keys(matches).length === leftItems.length;

  const handleSubmit = () => {
    if (!allMatched || submitted) return;
    setSubmitted(true);
    const answer = Object.keys(matches).map((leftId) => ({
      leftId,
      rightId: matches[leftId],
    }));
    onAnswer(answer);
  };

  return (
    <div className="w-full space-y-4">
      <p className="text-indigo-400 text-sm text-center">Seleccioná un elemento de la izquierda y luego el que corresponde a la derecha</p>

      <div className="grid grid-cols-2 gap-4">
        {/* Columna izquierda */}
        <div className="space-y-2">
          {leftItems.map((item) => (
            <button
              key={item._id}
              onClick={() => handleLeftClick(item._id)}
              disabled={submitted}
              className={`
                w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${selectedLeft === item._id ? "bg-violet-600 border-violet-400 text-white" :
                  isMatched(item._id) ? "bg-emerald-800 border-emerald-500 text-emerald-300" :
                  "bg-indigo-800 border-indigo-600 text-white hover:border-violet-400"}
                disabled:cursor-default
              `}
            >
              {item.text}
              {isMatched(item._id) && (
                <span className="block text-xs text-emerald-400 mt-1">→ {getRightMatch(item._id)?.text}</span>
              )}
            </button>
          ))}
        </div>

        {/* Columna derecha */}
        <div className="space-y-2">
          {rightItems.map((item) => (
            <button
              key={item._id}
              onClick={() => handleRightClick(item._id)}
              disabled={submitted || (!selectedLeft && !isRightUsed(item._id))}
              className={`
                w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all
                ${isRightUsed(item._id) ? "bg-emerald-800 border-emerald-500 text-emerald-300 opacity-50" :
                  selectedLeft ? "bg-indigo-700 border-violet-500 text-white hover:bg-violet-700 cursor-pointer" :
                  "bg-indigo-800 border-indigo-600 text-indigo-400"}
                disabled:cursor-default
              `}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allMatched || submitted}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition active:scale-95"
      >
        {allMatched ? "Confirmar" : `Faltan ${leftItems.length - Object.keys(matches).length} conexiones`}
      </button>
    </div>
  );
}
