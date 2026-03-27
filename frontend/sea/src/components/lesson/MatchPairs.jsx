import { useState } from "react";
import { Link2, CheckCircle2 } from "lucide-react";

const PAIR_COLORS = [
  { hex: "#3B82F6" },
  { hex: "#8B5CF6" },
  { hex: "#F59E0B" },
  { hex: "#10B981" },
  { hex: "#F43F5E" },
];

const MATCH_CSS = `
  .node-card {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(10px);
    border: 2px solid white;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .sea-btn-confirm {
    background: #2B7FE8;
    box-shadow: 0 10px 25px rgba(43, 127, 232, 0.3);
  }
`;

export default function MatchPairs({ question, onAnswer }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matches, setMatches] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const leftItems = question.leftItems || [];
  const rightItems = question.rightItems || [];

  const getPairColor = (leftId) => {
    const index = leftItems.findIndex(item => item._id === leftId);
    return PAIR_COLORS[index % PAIR_COLORS.length].hex;
  };

  const handleLeftClick = (id) => {
    if (submitted) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  };

  const handleRightClick = (id) => {
    if (submitted || !selectedLeft) return;
    const newMatches = { ...matches };
    const existingLeft = Object.keys(newMatches).find((l) => newMatches[l] === id);
    if (existingLeft) delete newMatches[existingLeft];
    newMatches[selectedLeft] = id;
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const getMatchByRightId = (rightId) => {
    const leftId = Object.keys(matches).find(l => matches[l] === rightId);
    return leftId ? { leftId, color: getPairColor(leftId) } : null;
  };

  const allMatched = leftItems.length > 0 && Object.keys(matches).length === leftItems.length;

  const getLeftStyle = (item) => {
    const matched = matches[item._id] !== undefined;
    const isSelected = selectedLeft === item._id;
    const color = getPairColor(item._id);

    if (matched) return {
      backgroundColor: color + "25",
      borderColor: color,
      color: color,
      transform: "scale(1.02)",
    };
    if (isSelected) return {
      backgroundColor: "white",
      borderColor: "#2B7FE8",
      color: "#1e40af",
      boxShadow: "0 0 20px rgba(43,127,232,0.3)",
      transform: "scale(1.05)",
    };
    if (selectedLeft) return { opacity: 0.4 };
    return {};
  };

  const getRightStyle = (item) => {
    const matchData = getMatchByRightId(item._id);
    if (matchData) return {
      backgroundColor: matchData.color + "25",
      borderColor: matchData.color,
      color: matchData.color,
      transform: "scale(0.97)",
    };
    if (selectedLeft) return {
      borderColor: "#2B7FE8",
      backgroundColor: "rgba(219,234,254,0.3)",
      cursor: "pointer",
    };
    return { opacity: 0.4 };
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <style>{MATCH_CSS}</style>

      <div className="flex items-center justify-center gap-2 mb-2">
        <Link2 size={16} className="text-[#2B7FE8]" />
        <p className="text-[#7A9CC5] text-[10px] font-black uppercase tracking-widest text-center">
          Seleccioná un elemento de cada columna para enlazarlos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-3">
          {leftItems.map((item) => (
            <button
              key={item._id}
              onClick={() => handleLeftClick(item._id)}
              disabled={submitted}
              style={getLeftStyle(item)}
              className="node-card w-full text-left px-5 py-4 rounded-[1.2rem]"
            >
              <span className="font-black italic text-sm block">{item.text}</span>
              {matches[item._id] && (
                <div className="flex items-center gap-1 mt-1 text-[9px] font-bold uppercase opacity-80">
                  <CheckCircle2 size={10} />
                  <span>Enlace activo</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Columna Derecha */}
        <div className="space-y-3">
          {rightItems.map((item) => (
            <button
              key={item._id}
              onClick={() => handleRightClick(item._id)}
              disabled={submitted || (!selectedLeft && !getMatchByRightId(item._id))}
              style={getRightStyle(item)}
              className="node-card w-full text-left px-5 py-4 rounded-[1.2rem]"
            >
              <span className="font-black italic text-sm">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (!allMatched || submitted) return;
          setSubmitted(true);
          onAnswer(Object.keys(matches).map(l => ({ leftId: l, rightId: matches[l] })));
        }}
        disabled={!allMatched || submitted}
        className="sea-btn-confirm w-full flex items-center justify-center gap-3 text-white font-black italic uppercase tracking-[0.2em] py-5 rounded-[1.5rem] transition-all active:scale-95 disabled:opacity-20 mt-4"
      >
        {allMatched ? "Confirmar Enlaces" : `Faltan ${leftItems.length - Object.keys(matches).length} conexiones`}
      </button>
    </div>
  );
}