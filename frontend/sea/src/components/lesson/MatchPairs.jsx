import { useState } from "react";
import { Link2, CheckCircle2 } from "lucide-react";
import useThemeStore from "../../store/themeStore";

const GET_PAIR_COLOR = (index, theme) => {
  const lightColors = ["#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#F43F5E"];
  const darkColors = ["#60A5FA", "#A78BFA", "#FBBF24", "#34D399", "#FB7185"];
  const hcColors = ["#00FFFF", "#FFFF00", "#00FF00", "#FF00FF", "#FFFFFF"];

  const colors = theme === "high-contrast" ? hcColors : (theme === "dark" ? darkColors : lightColors);
  return colors[index % colors.length];
};

const MATCH_CSS = `
  .node-card {
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    border: 2px solid var(--glass-border);
    color: var(--text-primary);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sea-btn-confirm {
    background: var(--text-accent);
    color: var(--btn-text);
    box-shadow: 0 10px 25px var(--glass-shadow);
  }

  /* Efecto de pulso para el seleccionado */
  .node-selected {
    animation: border-pulse 2s infinite;
  }

  @keyframes border-pulse {
    0% { border-color: var(--text-accent); box-shadow: 0 0 0 0 var(--text-accent); }
    70% { border-color: var(--text-accent); box-shadow: 0 0 0 10px rgba(0,0,0,0); }
    100% { border-color: var(--text-accent); box-shadow: 0 0 0 0 rgba(0,0,0,0); }
  }
`;

export default function MatchPairs({ question, onAnswer, onReport, }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const { theme } = useThemeStore();
  const [matches, setMatches] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const leftItems = question.leftItems || [];
  const rightItems = question.rightItems || [];

  const getPairColor = (leftId) => {
    const index = leftItems.findIndex(item => item._id === leftId);
    return GET_PAIR_COLOR(index, theme);
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
      backgroundColor: theme === "high-contrast" ? "#000" : color + "20",
      borderColor: color,
      color: color,
      transform: "scale(1.02)",
    };
    if (isSelected) return {
      backgroundColor: "var(--card-bg)",
      borderColor: "var(--text-accent)",
      color: "var(--text-accent)",
      boxShadow: "var(--glass-shadow)",
      transform: "scale(1.05)",
    };
    if (selectedLeft) return { opacity: 0.3, filter: "grayscale(1)" };
    return {};
  };

  const getRightStyle = (item) => {
    const matchData = getMatchByRightId(item._id);
    if (matchData) return {
      backgroundColor: theme === "high-contrast" ? "#000" : matchData.color + "20",
      borderColor: matchData.color,
      color: matchData.color,
    };
    if (selectedLeft) return {
      borderColor: "var(--text-accent)",
      backgroundColor: theme === "high-contrast" ? "#000" : "var(--progress-track)",
      cursor: "pointer",
    };
    return { opacity: 0.3 };
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <style>{MATCH_CSS}</style>

      <div className="flex items-center justify-center gap-2 mb-2">
        <Link2 size={16} className="text-[var(--text-accent)]" />
        <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest text-center">
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
              className={`node-card w-full text-left px-5 py-4 rounded-[1.2rem] ${selectedLeft === item._id ? 'node-selected' : ''}`}
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