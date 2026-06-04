// src/components/BackgroundAnimations.jsx
export default function BackgroundAnimations() {
  return (
    <div className="sea-bg-animations">
      <div className="dots-pattern"></div>
      <div className="wave-pattern"></div>

      <svg className="sea-bg-shape rotate-slow float-1" width="280" height="280" viewBox="0 0 100 100" style={{ top: '5%', left: '-5%' }}>
        <circle cx="50" cy="50" r="40" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2" strokeDasharray="6 6" />
        <circle cx="50" cy="50" r="25" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1.5" />
      </svg>

      <svg className="sea-bg-shape rotate-medium float-2" width="180" height="180" viewBox="0 0 100 100" style={{ bottom: '15%', right: '-8%' }}>
        <polygon points="50,10 90,85 10,85" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2.5" />
        <polygon points="50,30 70,70 30,70" fill="var(--doodle-bg, rgba(43,127,232,0.3))" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1" />
      </svg>

      <svg className="sea-bg-shape rotate-fast float-3" width="140" height="140" viewBox="0 0 100 100" style={{ top: '40%', left: '20%' }}>
        <polygon points="50,5 61,35 95,35 68,55 79,85 50,65 21,85 32,55 5,35 39,35" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1.8" />
      </svg>

      <svg className="sea-bg-shape rotate-reverse" width="220" height="220" viewBox="0 0 100 100" style={{ bottom: '30%', left: '-15%' }}>
        <circle cx="50" cy="50" r="30" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="18" fill="none" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1" strokeDasharray="4 4" />
      </svg>

      <svg className="sea-bg-shape float-1" width="100" height="100" viewBox="0 0 100 100" style={{ top: '65%', right: '10%' }}>
        <line x1="20" y1="20" x2="80" y2="80" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2" />
        <line x1="80" y1="20" x2="20" y2="80" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="2" />
        <circle cx="50" cy="50" r="10" fill="var(--doodle-bg, rgba(43,127,232,0.3))" stroke="var(--doodle-bg, rgba(43,127,232,0.3))" strokeWidth="1.5" />
      </svg>
    </div>
  );
}