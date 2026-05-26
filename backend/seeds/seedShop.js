// seeds/seedShop.js
require("dotenv").config();
const mongoose = require("mongoose");
const ShopItem = require("../models/shopItem");

/* ─────────────────────────────────────────────
   Items
───────────────────────────────────────────── */
const items = [

  // ══════════════════════════════════════════
  // MARCOS
  // cssValue = box-shadow multicapa:
  //   capa 1 → color del marco
  //   capa 2 → sombra oscura exterior (visible en light mode)
  //   capa 3 → sombra clara interior  (visible en dark mode)
  //   capa 4 → glow del color
  // ══════════════════════════════════════════
  {
    name: "Marco Bronce",
    description: "El primer paso de todo agente.",
    type: "frame",
    rarity: "common",
    price: 80,
    cssValue: "box-shadow: 0 0 0 3px #cd7f32, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 16px rgba(205,127,50,0.5)",
  },
  {
    name: "Marco Plata",
    description: "Para agentes que se destacan del resto.",
    type: "frame",
    rarity: "rare",
    price: 200,
    cssValue: "box-shadow: 0 0 0 3px #9aa0a6, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 18px rgba(154,160,166,0.55)",
  },
  {
    name: "Marco Zafiro",
    description: "El azul profundo de los mejores operativos.",
    type: "frame",
    rarity: "rare",
    price: 350,
    cssValue: "box-shadow: 0 0 0 3px #3B82F6, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 20px rgba(59,130,246,0.6)",
  },
  {
    name: "Marco Esmeralda",
    description: "Verde brillante para mentes brillantes.",
    type: "frame",
    rarity: "rare",
    price: 350,
    cssValue: "box-shadow: 0 0 0 3px #10B981, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 20px rgba(16,185,129,0.6)",
  },
  {
    name: "Marco Amatista",
    description: "Poder arcano concentrado en tu perfil.",
    type: "frame",
    rarity: "epic",
    price: 600,
    cssValue: "box-shadow: 0 0 0 3px #8B5CF6, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 22px rgba(139,92,246,0.65)",
  },
  {
    name: "Marco Rubí",
    description: "Rojo intenso para los más combativos.",
    type: "frame",
    rarity: "epic",
    price: 600,
    cssValue: "box-shadow: 0 0 0 3px #EF4444, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 22px rgba(239,68,68,0.65)",
  },
  {
    name: "Marco Dorado",
    description: "Reservado para los campeones del sistema.",
    type: "frame",
    rarity: "legendary",
    price: 1000,
    cssValue: "box-shadow: 0 0 0 3px #F59E0B, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 24px rgba(245,158,11,0.75)",
  },
  {
    name: "Marco Diamante",
    description: "El más raro. Solo para leyendas.",
    type: "frame",
    rarity: "legendary",
    price: 1500,
    cssValue: "box-shadow: 0 0 0 3px #60d0e4, 0 0 0 5px rgba(0,0,0,0.35), 0 0 0 6px rgba(255,255,255,0.15), 0 0 26px rgba(96,208,228,0.8)",
  },

  // ══════════════════════════════════════════
  // FONDOS — GRADIENTE ADAPTATIVO
  // themeVariants define un color por tema.
  // cssValue es el fallback si el tema no coincide.
  // ══════════════════════════════════════════
  {
    name: "Bosque",
    description: "Verde natural que se adapta a la luz del día.",
    type: "background",
    backgroundType: "gradient",
    rarity: "common",
    price: 100,
    themeVariants: {
      light:        "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)",
      dark:         "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #003322 50%, #006644 100%)",
    },
    cssValue: "linear-gradient(135deg, #064e3b 0%, #6ee7b7 100%)",
  },
  {
    name: "Océano",
    description: "Profundidades azules en constante movimiento.",
    type: "background",
    backgroundType: "gradient",
    rarity: "common",
    price: 100,
    themeVariants: {
      light:        "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)",
      dark:         "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1d4ed8 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #001a4d 50%, #003399 100%)",
    },
    cssValue: "linear-gradient(135deg, #1e3a5f 0%, #93c5fd 100%)",
  },
  {
    name: "Atardecer",
    description: "Cálido resplandor entre el día y la noche.",
    type: "background",
    backgroundType: "gradient",
    rarity: "rare",
    price: 280,
    themeVariants: {
      light:        "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fca5a5 100%)",
      dark:         "linear-gradient(135deg, #78350f 0%, #92400e 40%, #991b1b 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #4d2200 50%, #660000 100%)",
    },
    cssValue: "linear-gradient(135deg, #78350f 0%, #fca5a5 100%)",
  },
  {
    name: "Aurora",
    description: "Luces del norte bailando en tu perfil.",
    type: "background",
    backgroundType: "gradient",
    rarity: "rare",
    price: 320,
    themeVariants: {
      light:        "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #cffafe 100%)",
      dark:         "linear-gradient(135deg, #042f2e 0%, #134e4a 40%, #164e63 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #003330 50%, #003344 100%)",
    },
    cssValue: "linear-gradient(135deg, #042f2e 0%, #cffafe 100%)",
  },
  {
    name: "Galaxia",
    description: "El cosmos comprimido en tu pantalla.",
    type: "background",
    backgroundType: "gradient",
    rarity: "epic",
    price: 600,
    themeVariants: {
      light:        "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 50%, #e0e7ff 100%)",
      dark:         "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #0d0a33 50%, #1a1766 100%)",
    },
    cssValue: "linear-gradient(135deg, #1e1b4b 0%, #ddd6fe 100%)",
  },
  {
    name: "Inferno",
    description: "Fuego sin control para espíritus sin límites.",
    type: "background",
    backgroundType: "gradient",
    rarity: "epic",
    price: 650,
    themeVariants: {
      light:        "linear-gradient(135deg, #fff7ed 0%, #fed7aa 50%, #fca5a5 100%)",
      dark:         "linear-gradient(135deg, #431407 0%, #7c2d12 50%, #991b1b 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #4d1500 50%, #660000 100%)",
    },
    cssValue: "linear-gradient(135deg, #431407 0%, #fca5a5 100%)",
  },
  {
    name: "Abismo",
    description: "Donde la luz no llega. Solo para los más oscuros.",
    type: "background",
    backgroundType: "gradient",
    rarity: "legendary",
    price: 1200,
    themeVariants: {
      light:        "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)",
      dark:         "linear-gradient(135deg, #000000 0%, #0f0f0f 50%, #1a1a2e 100%)",
      highContrast: "linear-gradient(135deg, #000000 0%, #000000 50%, #000033 100%)",
    },
    cssValue: "linear-gradient(135deg, #000000 0%, #1a1a2e 100%)",
  },

  // ══════════════════════════════════════════
  // FONDOS — PATRÓN SVG
  // patternSvg se renderiza como overlay sobre el fondo del tema.
  // Usa "currentColor" para que el frontend lo coloree según el tema.
  // ══════════════════════════════════════════
  {
    name: "Cuadrícula",
    description: "Precisión milimétrica para mentes ordenadas.",
    type: "background",
    backgroundType: "svg",
    rarity: "common",
    price: 150,
    patternOpacity: 0.18,
    patternSize: "30px 30px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30"><path d="M0 0 H30 M0 0 V30" stroke="currentColor" stroke-width="0.5" fill="none"/></svg>`,
    cssValue: null,
  },
  {
    name: "Puntos",
    description: "Un universo de puntos en expansión.",
    type: "background",
    backgroundType: "svg",
    rarity: "common",
    price: 150,
    patternOpacity: 0.22,
    patternSize: "20px 20px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="1.5" fill="currentColor"/></svg>`,
    cssValue: null,
  },
  {
    name: "Circuitos",
    description: "El lenguaje de las máquinas hecho arte.",
    type: "background",
    backgroundType: "svg",
    rarity: "rare",
    price: 380,
    patternOpacity: 0.22,
    patternSize: "60px 60px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M10 30 H25 M35 30 H50" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M30 10 V25 M30 35 V50" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="30" cy="30" r="4" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="30" r="2" fill="currentColor"/><circle cx="50" cy="30" r="2" fill="currentColor"/><circle cx="30" cy="10" r="2" fill="currentColor"/><circle cx="30" cy="50" r="2" fill="currentColor"/></svg>`,
    cssValue: null,
  },
  {
    name: "Hexágonos",
    description: "La forma más eficiente de la naturaleza.",
    type: "background",
    backgroundType: "svg",
    rarity: "epic",
    price: 550,
    patternOpacity: 0.18,
    patternSize: "52px 60px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="60"><polygon points="26,2 50,15 50,45 26,58 2,45 2,15" fill="none" stroke="currentColor" stroke-width="1"/></svg>`,
    cssValue: null,
  },
  {
    name: "Estrellas",
    description: "El cielo nocturno suspendido en tu perfil.",
    type: "background",
    backgroundType: "svg",
    rarity: "epic",
    price: 580,
    patternOpacity: 0.28,
    patternSize: "80px 80px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><polygon points="40,5 47,28 72,28 52,43 59,66 40,52 21,66 28,43 8,28 33,28" fill="currentColor" opacity="0.5"/><circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.35"/><circle cx="70" cy="65" r="1" fill="currentColor" opacity="0.35"/><circle cx="65" cy="15" r="1" fill="currentColor" opacity="0.3"/><circle cx="15" cy="60" r="1.5" fill="currentColor" opacity="0.25"/></svg>`,
    cssValue: null,
  },
  {
    name: "Runes",
    description: "Símbolos ancestrales que otorgan poder.",
    type: "background",
    backgroundType: "svg",
    rarity: "legendary",
    price: 1300,
    patternOpacity: 0.2,
    patternSize: "70px 70px",
    patternSvg: `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70"><circle cx="35" cy="35" r="20" fill="none" stroke="currentColor" stroke-width="0.8"/><circle cx="35" cy="35" r="12" fill="none" stroke="currentColor" stroke-width="0.5"/><line x1="35" y1="15" x2="35" y2="55" stroke="currentColor" stroke-width="0.8"/><line x1="15" y1="35" x2="55" y2="35" stroke="currentColor" stroke-width="0.8"/><line x1="20" y1="20" x2="50" y2="50" stroke="currentColor" stroke-width="0.5"/><line x1="50" y1="20" x2="20" y2="50" stroke="currentColor" stroke-width="0.5"/><polygon points="35,18 38,28 35,26 32,28" fill="currentColor" opacity="0.6"/><polygon points="35,52 38,42 35,44 32,42" fill="currentColor" opacity="0.6"/></svg>`,
    cssValue: null,
  },
];

/* ─────────────────────────────────────────────
   Runner
───────────────────────────────────────────── */
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    await ShopItem.deleteMany({});
    console.log("🗑️  Items anteriores eliminados");

    const inserted = await ShopItem.insertMany(items);
    console.log(`✅ ${inserted.length} items insertados:\n`);

    // Resumen por tipo y rareza
    const summary = inserted.reduce((acc, item) => {
      const key = `${item.type} — ${item.rarity}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    Object.entries(summary).forEach(([k, v]) => console.log(`   ${v}x ${k}`));

  } catch (err) {
    console.error("❌ Error en seed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB");
  }
}

main();