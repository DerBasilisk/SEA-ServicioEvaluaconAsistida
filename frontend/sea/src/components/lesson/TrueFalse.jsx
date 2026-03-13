import { useState } from "react";

export default function TrueFalse({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleConfirm = () => {
    if (selected === null) return;
    onAnswer(selected);
  };

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "✅ Verdadero", value: true },
          { label: "❌ Falso", value: false },
        ].map(({ label, value }) => (
          <button
            key={String(value)}
            onClick={() => setSelected(value)}
            className={`
              py-6 rounded-xl border-2 font-bold text-lg transition-all active:scale-95
              ${selected === value
                ? "bg-violet-600 border-violet-400 text-white"
                : "bg-indigo-800 border-indigo-600 text-white hover:border-violet-400 hover:bg-indigo-700"
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        disabled={selected === null}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition active:scale-95"
      >
        Confirmar
      </button>
    </div>
  );
}