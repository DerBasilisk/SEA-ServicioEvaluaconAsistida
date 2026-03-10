import { useState } from "react";

export default function FillBlank({ question, onAnswer }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!value.trim() || submitted) return;
    setSubmitted(true);
    onAnswer(value.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={submitted}
        autoFocus
        placeholder="Escribí tu respuesta..."
        className="w-full bg-indigo-800 border-2 border-indigo-600 focus:border-violet-400 text-white rounded-xl px-5 py-4 text-lg outline-none transition placeholder-indigo-500 disabled:opacity-60"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || submitted}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition active:scale-95"
      >
        Confirmar
      </button>
    </div>
  );
}
