import { useState } from "react";

export default function OrderItems({ question, onAnswer }) {
  const [items, setItems] = useState(() =>
    [...(question.shuffledItems || question.items || [])].map((text, i) => ({ id: i, text }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(null);

  const handleDragStart = (index) => setDragging(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragging === null || dragging === index) return;
    const newItems = [...items];
    const draggedItem = newItems.splice(dragging, 1)[0];
    newItems.splice(index, 0, draggedItem);
    setDragging(index);
    setItems(newItems);
  };

  const handleDragEnd = () => setDragging(null);

  // Mover con botones (accesible)
  const moveUp = (index) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
  };

  const moveDown = (index) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(items.map((i) => i.text));
  };

  return (
    <div className="w-full space-y-3">
      <p className="text-indigo-400 text-sm text-center mb-2">Arrastrá o usá las flechas para ordenar</p>

      {items.map((item, index) => (
        <div
          key={item.id}
          draggable={!submitted}
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          className={`
            flex items-center gap-3 bg-indigo-800 border-2 border-indigo-600 rounded-xl px-4 py-3
            ${!submitted ? "cursor-grab active:cursor-grabbing hover:border-violet-400" : "opacity-60"}
            ${dragging === index ? "border-violet-400 scale-105" : ""}
            transition-all
          `}
        >
          <span className="text-indigo-400 text-lg">⠿</span>
          <span className="text-white flex-1">{item.text}</span>
          {!submitted && (
            <div className="flex flex-col gap-1">
              <button onClick={() => moveUp(index)} disabled={index === 0} className="text-indigo-400 hover:text-white disabled:opacity-20 text-xs leading-none">▲</button>
              <button onClick={() => moveDown(index)} disabled={index === items.length - 1} className="text-indigo-400 hover:text-white disabled:opacity-20 text-xs leading-none">▼</button>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={submitted}
        className="w-full bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold py-4 rounded-xl transition active:scale-95 mt-2"
      >
        Confirmar orden
      </button>
    </div>
  );
}
