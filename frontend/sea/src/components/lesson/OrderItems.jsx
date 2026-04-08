import { useState } from "react";
import { GripVertical, ChevronUp, ChevronDown, ListOrdered } from "lucide-react";

const ORDER_CSS = `
  .order-card {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .order-card:hover:not(.submitted) {
    background: rgba(255, 255, 255, 0.8);
    border-color: #2B7FE8;
  }
  .dragging {
    opacity: 0.5;
    transform: scale(1.02);
    border-color: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.2);
  }
  .sea-btn-confirm {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

export default function OrderItems({ question, onAnswer, onReport, }) {
  const [items, setItems] = useState(() =>
    [...(question.shuffledItems || question.items || [])].map((text, i) => ({ id: i, text }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(null);

  const handleDragStart = (index) => !submitted && setDragging(index);
  const handleDragEnd = () => setDragging(null);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragging === null || dragging === index || submitted) return;
    const newItems = [...items];
    const draggedItem = newItems.splice(dragging, 1)[0];
    newItems.splice(index, 0, draggedItem);
    setDragging(index);
    setItems(newItems);
  };

  const move = (index, direction) => {
    if (submitted) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (submitted) return;
    setSubmitted(true);
    onAnswer(items.map((i) => i.text));
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <style>{ORDER_CSS}</style>

      <div className="flex items-center justify-center gap-2 mb-4">
        <ListOrdered size={16} className="text-[#2B7FE8]" />
        <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-widest text-center">
          Establece la secuencia correcta
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable={!submitted}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              order-card flex items-center gap-4 px-5 py-4 rounded-[1.5rem]
              ${dragging === index ? "dragging" : ""}
              ${submitted ? "opacity-50 grayscale submitted" : "cursor-grab active:cursor-grabbing"}
            `}
          >
            {/* Handle visual */}
            <div className="text-slate-300">
              <GripVertical size={20} />
            </div>

            {/* Número de orden */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2B7FE8]/10 border border-[#2B7FE8]/20 flex items-center justify-center">
              <span className="text-[#2B7FE8] font-black italic text-xs">{index + 1}</span>
            </div>

            {/* Texto del item */}
            <span className="flex-1 text-[#0F2547] font-black italic text-lg tracking-tight">
              {item.text}
            </span>

            {/* Controles de flecha (Desktop/Mobile) */}
            {!submitted && (
              <div className="flex flex-col gap-1">
                <button 
                  onClick={() => move(index, -1)} 
                  disabled={index === 0}
                  className="p-1 hover:bg-[#2B7FE8]/10 rounded-lg text-slate-400 hover:text-[#2B7FE8] transition-colors disabled:opacity-0"
                >
                  <ChevronUp size={18} />
                </button>
                <button 
                  onClick={() => move(index, 1)} 
                  disabled={index === items.length - 1}
                  className="p-1 hover:bg-[#2B7FE8]/10 rounded-lg text-slate-400 hover:text-[#2B7FE8] transition-colors disabled:opacity-0"
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={submitted}
          className="sea-btn-confirm w-full flex items-center justify-center gap-3 text-white font-black italic uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
        >
          <span>Confirmar Secuencia</span>
        </button>
        
        <p className="text-center mt-4 text-[#7A9CC5] text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
          Arrastra para reordenar los módulos
        </p>
      </div>
    </div>
  );
}