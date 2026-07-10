// src/components/BackgroundAnimationsSecondary.jsx
export default function BackgroundAnimationsSecondary() {
  return (
    <div className="sea-bg-animations">
      {/* Patrones de fondo sutiles */}
      <div className="grid-pattern"></div>

      {/* Anillo doble con órbita */}
      <svg className="sea-bg-shape rotate-slow float-2" width="260" height="260" viewBox="0 0 100 100" style={{ top: '-8%', right: '5%' }}>
        <circle cx="50" cy="50" r="35" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1.5" strokeDasharray="3 5" />
        <circle cx="85" cy="50" r="4" fill="var(--doodle-bg, rgba(43,127,232,0.3))" />
      </svg>

      {/* Hexágono */}
      <svg className="sea-bg-shape rotate-reverse float-3" width="160" height="160" viewBox="0 0 100 100" style={{ bottom: '5%', left: '8%' }}>
        <polygon points="50,3 93,25 93,75 50,97 7,75 7,25" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2" />
      </svg>

      {/* Onda / espiral simple */}
      <svg className="sea-bg-shape rotate-medium" width="200" height="200" viewBox="0 0 100 100" style={{ top: '35%', right: '-10%' }}>
        <path
          d="M50,50 m-30,0 a30,30 0 1,1 60,0 a20,20 0 1,1 -40,0 a10,10 0 1,1 20,0"
          fill="none"
          stroke="var(--doodle-bg, rgba(43,127,232,0.3))"
          strokeWidth="1.8"
        />
      </svg>

      {/* Cuadrado rotado (rombo) */}
      <svg className="sea-bg-shape float-1" width="120" height="120" viewBox="0 0 100 100" style={{ top: '70%', left: '30%' }}>
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2" transform="rotate(45 50 50)" />
      </svg>

      {/* Puntos dispersos (constelación) */}
      <svg className="sea-bg-shape float-2" width="150" height="150" viewBox="0 0 100 100" style={{ top: '10%', left: '45%' }}>
        <circle cx="20" cy="30" r="3" fill="var(--doodle-bg, rgba(43,127,232,0.3))" />
        <circle cx="70" cy="15" r="2" fill="var(--doodle-bg, rgba(43,127,232,0.3))" />
        <circle cx="50" cy="60" r="4" fill="var(--doodle-bg, rgba(43,127,232,0.3))" />
        <line x1="20" y1="30" x2="50" y2="60" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1" />
        <line x1="50" y1="60" x2="70" y2="15" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1" />
      </svg>
    </div>
  );
}