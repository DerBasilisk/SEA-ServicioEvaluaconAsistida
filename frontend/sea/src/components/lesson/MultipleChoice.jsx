import { useState } from "react";

export default function MultipleChoice({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleConfirm = () => {
    if (!selected) return;
    onAnswer(selected);
  };

  return (
    <div className="w-full space-y-3">
      {question.options?.map((option) => (
        <button
          key={option._id}
          onClick={() => setSelected(option._id)}
          className={`
            w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all active:scale-95
            ${selected === option._id
              ? "bg-violet-600 border-violet-400 text-white"
              : "bg-indigo-800 border-indigo-600 text-white hover:border-violet-400 hover:bg-indigo-700"
            }
          `}
        >
          {option.text}
        </button>
      ))}

      <button
        onClick={handleConfirm}
        disabled={!selected}
        className="w-full mt-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition active:scale-95"
      >
        Confirmar
      </button>
    </div>
  );
}