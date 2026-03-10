import { useState } from "react";

export default function TrueFalse({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (value) => {
    if (selected !== null) return;
    setSelected(value);
    onAnswer(value);
  };

  return (
    <div className="w-full grid grid-cols-2 gap-4">
      {[
        { label: "✅ Verdadero", value: true },
        { label: "❌ Falso", value: false },
      ].map(({ label, value }) => (
        <button
          key={String(value)}
          onClick={() => handleSelect(value)}
          disabled={selected !== null}
          className={`
            py-6 rounded-xl border-2 font-bold text-lg transition-all active:scale-95
            ${selected === value
              ? "bg-violet-600 border-violet-400 text-white"
              : "bg-indigo-800 border-indigo-600 text-white hover:border-violet-400 hover:bg-indigo-700"
            }
            disabled:cursor-default
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
