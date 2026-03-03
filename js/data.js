// ============================================================
//  CAJIGA — DATOS DEL SISTEMA COTIZADOR
//  Extraído del archivo: COTIZADOR CLOSETS 2026.xlsx
// ============================================================

const FUO_LEVELS = [
  { id: 'FUO 1.15', nombre: 'ECONÓMICO',     factor: 1.15, iva: 1.16, desc: 'Melamina sencilla, sin herrajes especiales.' },
  { id: 'FUO 1.25', nombre: 'BÁSICO',         factor: 1.25, iva: 1.16, desc: 'Melamina con chapa, herrajes estándar.' },
  { id: 'FUO 1.32', nombre: 'BÁSICO+',        factor: 1.32, iva: 1.16, desc: 'MDF lacado, herrajes estándar, semi-personalizado.' },
  { id: 'FUO 1.40', nombre: 'ESTÁNDAR',       factor: 1.40, iva: 1.16, desc: 'MDF lacado, herrajes calidad media, personalizado.' },
  { id: 'FUO 1.48', nombre: 'ESTÁNDAR+',      factor: 1.48, iva: 1.16, desc: 'MDF + madera maciza, soft-close, iluminación básica.' },
  { id: 'FUO 1.55', nombre: 'PREMIUM',        factor: 1.55, iva: 1.16, desc: 'Madera maciza, herrajes premium, LED, exclusivo.' },
  { id: 'FUO 1.65', nombre: 'PREMIUM+',       factor: 1.65, iva: 1.16, desc: 'Maderas finas (nogal/encino), herrajes alta gama.' },
  { id: 'FUO 1.75', nombre: 'LUJO',           factor: 1.75, iva: 1.16, desc: 'Maderas selectas, herrajes europeos, domótica básica.' },
  { id: 'FUO 1.88', nombre: 'LUJO+',          factor: 1.88, iva: 1.16, desc: 'Maderas importadas, herrajes de diseñador, domótica.' },
  { id: 'FUO 2.00', nombre: 'ULTRA PREMIUM',  factor: 2.00, iva: 1.16, desc: 'Materiales importados, diseño de autor, garantía extendida.' },
];

const COMPONENTES = [
  'PARAL 1 VISTA', 'PARAL 2 VISTAS', 'PARAL DELGADO 2V',
  'PISO', 'PISO CON ZOCLO', 'CIELO',
  'ENTREPAÑO', 'ENTREPAÑO LED', 'ENTREPAÑO DELGADO',
  'CAJÓN', 'ZAPATERA EXTRAÍBLE', 'TUBO COLGAR',
  'PUERTA ABATIBLE', 'PUERTA CORREDERA', 'PUERTA ESPEJO',
  'ESPEJO',
  'MOLDURA SENCILLA', 'MOLDURA MEDIA', 'MOLDURA DIFÍCIL', 'MOLDURA GRUESA DIFÍCIL',
  'FONDO MADERA',
];

// Componentes que requieren input de PROFUNDIDAD
const COMPONENTES_CON_PROF = ['CAJÓN', 'ZAPATERA EXTRAÍBLE'];
const PROFUNDIDADES = [35, 40, 45, 50, 55, 60];

const MATERIALES = ['NOGAL', 'ENCINO', 'HUANACAXTLE'];

// ── COSTOS DE MATERIAL + CONSUMIBLES POR M² ──────────────────
// Fuente: hoja COSTOS_M2
// Formato: [{ tamano, maxM2, NOGAL, ENCINO, HUANACAXTLE, consumibles }]
const COSTOS_M2 = {
  'PARAL 1 VISTA': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:522, ENCINO:472, NOGAL:495, consumibles:174 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:583, ENCINO:532, NOGAL:552, consumibles:176 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:559, ENCINO:511, NOGAL:527, consumibles:162 },
  ],
  'PARAL 2 VISTAS': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:871, ENCINO:773, NOGAL:807, consumibles:339 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:978, ENCINO:873, NOGAL:905, consumibles:343 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:883, ENCINO:791, NOGAL:817, consumibles:316 },
  ],
  'PARAL DELGADO 2V': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:575, ENCINO:435, NOGAL:535, consumibles:300 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:540, ENCINO:400, NOGAL:500, consumibles:285 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:520, ENCINO:385, NOGAL:480, consumibles:265 },
  ],
  'PISO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:531, ENCINO:485, NOGAL:501, consumibles:174 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:494, ENCINO:448, NOGAL:462, consumibles:176 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:482, ENCINO:438, NOGAL:450, consumibles:162 },
  ],
  'PISO CON ZOCLO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:584, ENCINO:534, NOGAL:551, consumibles:191 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:543, ENCINO:493, NOGAL:508, consumibles:194 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:530, ENCINO:482, NOGAL:495, consumibles:178 },
  ],
  'CIELO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:779, ENCINO:686, NOGAL:714, consumibles:174 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:726, ENCINO:636, NOGAL:660, consumibles:176 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:713, ENCINO:624, NOGAL:646, consumibles:162 },
  ],
  'ENTREPAÑO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:510, ENCINO:418, NOGAL:447, consumibles:339 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:476, ENCINO:386, NOGAL:411, consumibles:343 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:461, ENCINO:371, NOGAL:394, consumibles:316 },
  ],
  'ENTREPAÑO LED': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:1167, ENCINO:1076, NOGAL:1103, consumibles:357 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:1029, ENCINO:947,  NOGAL:971,  consumibles:361 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:1029, ENCINO:947,  NOGAL:971,  consumibles:332 },
  ],
  'ENTREPAÑO DELGADO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:575, ENCINO:435, NOGAL:535, consumibles:300 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:540, ENCINO:400, NOGAL:500, consumibles:285 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:520, ENCINO:385, NOGAL:480, consumibles:265 },
  ],
  'CAJÓN': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:1050, ENCINO:940,  NOGAL:1020, consumibles:310 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:1174, ENCINO:1086, NOGAL:1145, consumibles:282 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:1174, ENCINO:1086, NOGAL:1145, consumibles:259 },
  ],
  'ZAPATERA EXTRAÍBLE': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:367, ENCINO:329, NOGAL:408, consumibles:213 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:344, ENCINO:310, NOGAL:384, consumibles:198 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:317, ENCINO:285, NOGAL:354, consumibles:181 },
  ],
  'TUBO COLGAR': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:66, ENCINO:66, NOGAL:66, consumibles:0 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:66, ENCINO:66, NOGAL:66, consumibles:0 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:66, ENCINO:66, NOGAL:66, consumibles:0 },
  ],
  'PUERTA ABATIBLE': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:600, ENCINO:500, NOGAL:530, consumibles:365 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:550, ENCINO:460, NOGAL:490, consumibles:370 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:520, ENCINO:440, NOGAL:465, consumibles:340 },
  ],
  'PUERTA CORREDERA': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:600, ENCINO:500, NOGAL:530, consumibles:365 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:550, ENCINO:460, NOGAL:490, consumibles:370 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:520, ENCINO:440, NOGAL:465, consumibles:340 },
  ],
  'PUERTA ESPEJO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:600, ENCINO:500, NOGAL:530, consumibles:200 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:550, ENCINO:460, NOGAL:490, consumibles:202 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:520, ENCINO:440, NOGAL:465, consumibles:186 },
  ],
  'ESPEJO': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:520, ENCINO:520, NOGAL:520, consumibles:0 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:480, ENCINO:480, NOGAL:480, consumibles:0 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:470, ENCINO:470, NOGAL:470, consumibles:0 },
  ],
  'MOLDURA SENCILLA': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:2566, ENCINO:3300, NOGAL:4950, consumibles:200 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:2400, ENCINO:3100, NOGAL:4700, consumibles:190 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:2300, ENCINO:2900, NOGAL:4500, consumibles:180 },
  ],
  'MOLDURA MEDIA': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:2566, ENCINO:3300, NOGAL:4950, consumibles:200 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:2400, ENCINO:3100, NOGAL:4700, consumibles:190 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:2300, ENCINO:2900, NOGAL:4500, consumibles:180 },
  ],
  'MOLDURA DIFÍCIL': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:2566, ENCINO:3300, NOGAL:4950, consumibles:200 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:2400, ENCINO:3100, NOGAL:4700, consumibles:190 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:2300, ENCINO:2900, NOGAL:4500, consumibles:180 },
  ],
  'MOLDURA GRUESA DIFÍCIL': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:7698,  ENCINO:9900,  NOGAL:14850, consumibles:250 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:7200,  ENCINO:9300,  NOGAL:14000, consumibles:240 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:6900,  ENCINO:8900,  NOGAL:13400, consumibles:230 },
  ],
  'FONDO MADERA': [
    { tamano:'CHICO',   maxM2:0.5, HUANACAXTLE:210, ENCINO:160, NOGAL:175, consumibles:120 },
    { tamano:'MEDIANO', maxM2:1,   HUANACAXTLE:175, ENCINO:135, NOGAL:150, consumibles:110 },
    { tamano:'GRANDE',  maxM2:99,  HUANACAXTLE:160, ENCINO:120, NOGAL:135, consumibles:100 },
  ],
};

// ── MANO DE OBRA POR COMPONENTE Y TAMAÑO ─────────────────────
// Fuente: hoja MANO_DE_OBRA (columna COSTO MO)
const MANO_DE_OBRA = {
  'PARAL 1 VISTA':        [{ tamano:'CHICO', costoMO:450.276 }, { tamano:'MEDIANO', costoMO:511.747 }, { tamano:'GRANDE', costoMO:587.229 }],
  'PARAL 2 VISTAS':       [{ tamano:'CHICO', costoMO:488.103 }, { tamano:'MEDIANO', costoMO:608.089 }, { tamano:'GRANDE', costoMO:751.157 }],
  'PARAL DELGADO 2V':     [{ tamano:'CHICO', costoMO:451.592 }, { tamano:'MEDIANO', costoMO:558.222 }, { tamano:'GRANDE', costoMO:725.196 }],
  'PISO':                 [{ tamano:'CHICO', costoMO:359.077 }, { tamano:'MEDIANO', costoMO:426.932 }, { tamano:'GRANDE', costoMO:558.470 }],
  'PISO CON ZOCLO':       [{ tamano:'CHICO', costoMO:395.790 }, { tamano:'MEDIANO', costoMO:469.287 }, { tamano:'GRANDE', costoMO:614.345 }],
  'CIELO':                [{ tamano:'CHICO', costoMO:404.952 }, { tamano:'MEDIANO', costoMO:520.050 }, { tamano:'GRANDE', costoMO:762.959 }],
  'ENTREPAÑO':            [{ tamano:'CHICO', costoMO:292.241 }, { tamano:'MEDIANO', costoMO:435.191 }, { tamano:'GRANDE', costoMO:688.481 }],
  'ENTREPAÑO LED':        [{ tamano:'CHICO', costoMO:292.069 }, { tamano:'MEDIANO', costoMO:358.941 }, { tamano:'GRANDE', costoMO:448.764 }],
  'ENTREPAÑO DELGADO':    [{ tamano:'CHICO', costoMO:265.802 }, { tamano:'MEDIANO', costoMO:400.559 }, { tamano:'GRANDE', costoMO:624.472 }],
  'CAJÓN':                [{ tamano:'CHICO', costoMO:434.362 }, { tamano:'MEDIANO', costoMO:485.542 }, { tamano:'GRANDE', costoMO:654.611 }],
  'ZAPATERA EXTRAÍBLE':   [{ tamano:'CHICO', costoMO:396.274 }, { tamano:'MEDIANO', costoMO:410.260 }, { tamano:'GRANDE', costoMO:550.055 }],
  'TUBO COLGAR':          [{ tamano:'CHICO', costoMO:23.572  }, { tamano:'MEDIANO', costoMO:23.572  }, { tamano:'GRANDE', costoMO:25.593 }],
  'PUERTA ABATIBLE':      [{ tamano:'CHICO', costoMO:489.595 }, { tamano:'MEDIANO', costoMO:651.426 }, { tamano:'GRANDE', costoMO:810.618 }],
  'PUERTA CORREDERA':     [{ tamano:'CHICO', costoMO:489.595 }, { tamano:'MEDIANO', costoMO:651.426 }, { tamano:'GRANDE', costoMO:810.618 }],
  'PUERTA ESPEJO':        [{ tamano:'CHICO', costoMO:489.595 }, { tamano:'MEDIANO', costoMO:651.426 }, { tamano:'GRANDE', costoMO:810.618 }],
  'ESPEJO':               [{ tamano:'CHICO', costoMO:94.290  }, { tamano:'MEDIANO', costoMO:101.025 }, { tamano:'GRANDE', costoMO:114.495 }],
  'MOLDURA SENCILLA':     [{ tamano:'CHICO', costoMO:356.386 }, { tamano:'MEDIANO', costoMO:403.374 }, { tamano:'GRANDE', costoMO:497.020 }],
  'MOLDURA MEDIA':        [{ tamano:'CHICO', costoMO:390.171 }, { tamano:'MEDIANO', costoMO:437.158 }, { tamano:'GRANDE', costoMO:530.805 }],
  'MOLDURA DIFÍCIL':      [{ tamano:'CHICO', costoMO:477.459 }, { tamano:'MEDIANO', costoMO:524.446 }, { tamano:'GRANDE', costoMO:631.563 }],
  'MOLDURA GRUESA DIFÍCIL':[{ tamano:'CHICO', costoMO:679.060 }, { tamano:'MEDIANO', costoMO:746.010 }, { tamano:'GRANDE', costoMO:873.441 }],
  'FONDO MADERA':         [{ tamano:'CHICO', costoMO:154.960 }, { tamano:'MEDIANO', costoMO:215.157 }, { tamano:'GRANDE', costoMO:295.796 }],
};

// ── HERRAJES POR COMPONENTE ───────────────────────────────────
// Fuente: hoja HERRAJES
// Clave: "COMPONENTE|profundidad" o "COMPONENTE|TODAS"
const HERRAJES = {
  'CAJÓN|35': 46.94,
  'CAJÓN|40': 58.99,
  'CAJÓN|45': 60.33,
  'CAJÓN|50': 73.73,
  'CAJÓN|55': 50.52,
  'CAJÓN|60': 54.97,
  'PUERTA ABATIBLE|TODAS':  311.40,  // 4 bisagras (242.28) + 4 contras (69.12)
  'PUERTA CORREDERA|TODAS': 0,       // riel incluido en precio base
  'PUERTA ESPEJO|TODAS':    311.40,  // igual que abatible
  'ENTREPAÑO LED|TODAS':    0,       // tira LED con cantidad variable (no incluida)
  'TUBO COLGAR|TODAS':      2.74,    // 2 bridas ovaladas
  'ZAPATERA EXTRAÍBLE|55':  50.52,
  'ZAPATERA EXTRAÍBLE|60':  54.97,
};

// Iconos/emojis por categoría de componente
const COMP_ICONS = {
  'PARAL 1 VISTA': '🪵', 'PARAL 2 VISTAS': '🪵', 'PARAL DELGADO 2V': '🪵',
  'PISO': '▬', 'PISO CON ZOCLO': '▬', 'CIELO': '▬',
  'ENTREPAÑO': '📐', 'ENTREPAÑO LED': '💡', 'ENTREPAÑO DELGADO': '📐',
  'CAJÓN': '🗄️', 'ZAPATERA EXTRAÍBLE': '👟', 'TUBO COLGAR': '👔',
  'PUERTA ABATIBLE': '🚪', 'PUERTA CORREDERA': '🚪', 'PUERTA ESPEJO': '🪞',
  'ESPEJO': '🪞',
  'MOLDURA SENCILLA': '〰️', 'MOLDURA MEDIA': '〰️', 'MOLDURA DIFÍCIL': '〰️', 'MOLDURA GRUESA DIFÍCIL': '〰️',
  'FONDO MADERA': '🟫',
};
