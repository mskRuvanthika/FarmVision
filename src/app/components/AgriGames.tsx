import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ChevronRight, RotateCcw, Clock } from 'lucide-react';

type GameView = 'menu' | 'fb' | 'smc' | 'mt' | 'ka';

// ─── FARM BUILDER ────────────────────────────────────────────────────────────

const FB_CROPS = [
  { id: 'rice',   emoji: '🌾', name: 'Rice',   cost: 1500, baseYield: 40, basePrice: 2100 },
  { id: 'maize',  emoji: '🌽', name: 'Maize',  cost: 1200, baseYield: 35, basePrice: 1800 },
  { id: 'tomato', emoji: '🍅', name: 'Tomato', cost: 1800, baseYield: 50, basePrice: 2800 },
  { id: 'carrot', emoji: '🥕', name: 'Carrot', cost: 1000, baseYield: 45, basePrice: 2200 },
  { id: 'potato', emoji: '🥔', name: 'Potato', cost: 1300, baseYield: 55, basePrice: 1600 },
] as const;
type FBCrop = typeof FB_CROPS[number];

interface FBEvent {
  emoji: string; title: string; desc: string;
  choices: { text: string; dm: number; dw: number; dch: number; dfh: number }[];
}
const FB_EVENTS: FBEvent[] = [
  {
    emoji: '☀️', title: 'Drought Warning!',
    desc: 'No rain for 2 weeks. Crops are drying out rapidly!',
    choices: [
      { text: '💧 Water crops now', dm: 0, dw: -200, dch: 12, dfh: 0 },
      { text: '🛒 Buy emergency water (-₹600)', dm: -600, dw: 0, dch: 16, dfh: 0 },
      { text: '❌ Accept the loss', dm: 0, dw: 0, dch: -22, dfh: -10 },
    ],
  },
  {
    emoji: '🌧️', title: 'Heavy Rainfall!',
    desc: 'Unexpected heavy rain. Risk of waterlogging!',
    choices: [
      { text: '🏗️ Build drainage (-₹800)', dm: -800, dw: 0, dch: 0, dfh: 12 },
      { text: '🌾 Harvest early (lower yield)', dm: 0, dw: 0, dch: -8, dfh: -5 },
      { text: '🤞 Hope for the best', dm: 0, dw: 200, dch: -18, dfh: -12 },
    ],
  },
  {
    emoji: '🐛', title: 'Pest Attack!',
    desc: 'Insects are rapidly damaging your crops!',
    choices: [
      { text: '🧪 Chemical spray (-₹600)', dm: -600, dw: 0, dch: 22, dfh: 0 },
      { text: '🌿 Neem oil spray (-₹400)', dm: -400, dw: 0, dch: 15, dfh: 5 },
      { text: '🚫 Do nothing', dm: 0, dw: 0, dch: -30, dfh: -5 },
    ],
  },
  {
    emoji: '🦠', title: 'Disease Outbreak!',
    desc: 'Yellow spots spreading across your crop leaves!',
    choices: [
      { text: '💊 Apply fungicide (-₹700)', dm: -700, dw: 0, dch: 25, dfh: 0 },
      { text: '🌱 Organic treatment (-₹300)', dm: -300, dw: 0, dch: 12, dfh: 5 },
      { text: '❌ Ignore it', dm: 0, dw: 0, dch: -22, dfh: -8 },
    ],
  },
  {
    emoji: '📈', title: 'Market Prices Surge!',
    desc: 'Demand is very high this week. Great time to sell!',
    choices: [
      { text: '💰 Sell part of crop now (+₹1500)', dm: 1500, dw: 0, dch: 0, dfh: 0 },
      { text: '📦 Store for even better price (+₹400)', dm: 400, dw: 0, dch: 0, dfh: 5 },
      { text: '⏳ Wait and watch', dm: 200, dw: 0, dch: 0, dfh: 0 },
    ],
  },
];

interface FBState {
  stage: 'select' | 'actions' | 'event' | 'harvest' | 'sell' | 'result';
  crop: FBCrop | null;
  money: number; water: number; cropHealth: number; farmHealth: number; growth: number;
  round: number; event: FBEvent | null;
  harvested: number; sellRevenue: number; totalSpent: number; actionLog: string[];
}
const FB_INIT: FBState = {
  stage: 'select', crop: null, money: 10000, water: 1000,
  cropHealth: 100, farmHealth: 100, growth: 0, round: 1,
  event: null, harvested: 0, sellRevenue: 0, totalSpent: 0, actionLog: [],
};

// ─── SAVE MY CROP ────────────────────────────────────────────────────────────

const SMC_SCENARIOS = [
  { level: 1, crop: '🍅 Tomato', alert: 'Your tomato crop is showing yellow spots on the leaves.',
    clues: ['Yellow spots on lower leaves', 'White powdery coating visible', 'Humid weather (80% RH)', 'Mild temperature 25°C'],
    options: ['🦠 Fungal Disease', '🐛 Pest Attack', '💧 Water Stress', '🌱 Nutrient Deficiency'],
    correct: 0, points: 100,
    explanation: 'White powder + yellow spots = Powdery Mildew (fungal disease). Apply neem-based fungicide immediately.' },
  { level: 1, crop: '🌽 Maize', alert: 'Your maize plant has small holes in the leaves with insects visible.',
    clues: ['Circular holes in leaves', 'Small green insects visible', 'Plant growth slowed', 'Dry warm weather'],
    options: ['🦠 Fungal Disease', '🐛 Pest Attack', '💧 Water Stress', '🌱 Nutrient Deficiency'],
    correct: 1, points: 100,
    explanation: 'Visible insects + leaf holes = Pest Attack. Use biological or chemical control promptly.' },
  { level: 1, crop: '🥕 Carrot', alert: 'Your carrot plants are wilting during the afternoon hours.',
    clues: ['Leaves wilting in afternoon heat', 'Soil is very dry and cracked', 'No rain for 2 weeks', 'No insects found'],
    options: ['🦠 Fungal Disease', '🐛 Pest Attack', '💧 Water Stress', '🌱 Nutrient Deficiency'],
    correct: 2, points: 100,
    explanation: 'Wilting + dry soil + no rain = Water Stress. Irrigate immediately with drip or sprinkler.' },
  { level: 2, crop: '🌾 Rice', alert: 'Rice leaves turning uniform pale yellow-green across the whole plant.',
    clues: ['Uniform pale yellow-green color', 'Lower leaves yellowing first', 'Slow overall growth', 'Recent heavy rains leached soil'],
    options: ['🦠 Fungal Disease', '🐛 Pest Attack', '💧 Over-watering', '🌱 Nitrogen Deficiency'],
    correct: 3, points: 150,
    explanation: 'Uniform yellowing starting from older leaves = Nitrogen Deficiency. Apply urea or compost.' },
  { level: 2, crop: '🥔 Potato', alert: 'Potato leaves have brown spots with yellow halos spreading rapidly.',
    clues: ['Brown spots with yellow halos', 'Lower leaves affected first', 'Cool wet weather 18°C', 'Spots spreading fast to other plants'],
    options: ['🦠 Late Blight (Fungal)', '🐛 Aphid Infestation', '💧 Overwatering damage', '🌱 Phosphorus Deficiency'],
    correct: 0, points: 150,
    explanation: 'Brown spots + yellow halos in cool wet weather = Late Blight (Phytophthora). Emergency action required!' },
  { level: 2, crop: '🍅 Tomato', alert: 'Tomato fruits developing dark sunken spots at the blossom end.',
    clues: ['Dark leathery spots at fruit bottom', 'Irregular watering pattern this week', 'Adequate fertilization applied', 'No insects found on plant'],
    options: ['🦠 Fungal Blight', '🐛 Fruit Borer Damage', '💧 Blossom End Rot (Ca)', '🌱 Iron Deficiency'],
    correct: 2, points: 150,
    explanation: 'Dark bottom spots = Blossom End Rot caused by calcium deficiency + irregular watering. Water consistently.' },
  { level: 3, crop: '🌾 Rice', alert: 'Rice plants show mosaic leaf patterns with stunted growth.',
    clues: ['Mosaic/mottled leaf pattern', 'Stunted plant growth overall', 'Aphids present on leaves', 'Neighboring farms also affected'],
    options: ['🦠 Viral Disease (aphid-spread)', '🐛 Leaf Folder Caterpillar', '💧 Drought Stress', '🌱 Zinc Deficiency'],
    correct: 0, points: 200,
    explanation: 'Mosaic pattern + aphids = Viral disease spread by aphids. Control aphids and remove infected plants.' },
  { level: 3, crop: '🌽 Maize', alert: 'Maize stems have small holes with white powdery material around them.',
    clues: ['Small holes in stem base', 'White sawdust-like frass visible', 'Plant falling over (lodging)', 'New leaves showing damage first'],
    options: ['🦠 Stalk Rot (Fungal)', '🐛 Stem Borer', '💧 Drought damage', '🌱 Boron Deficiency'],
    correct: 1, points: 200,
    explanation: 'Stem holes + white frass = Stem Borer (Chilo partellus). Use pheromone traps and Bacillus thuringiensis.' },
  { level: 3, crop: '🥔 Potato', alert: 'Potato tubers show dark rings inside when cut open.',
    clues: ['Dark/brown ring inside tuber', 'External skin appears normal', 'Some plants wilting suddenly', 'Wet soil conditions present'],
    options: ['🦠 Bacterial Ring Rot', '🐛 White Grub damage', '💧 Internal browning (cold)', '🌱 Iron Toxicity'],
    correct: 0, points: 200,
    explanation: 'Dark ring inside tuber = Bacterial Ring Rot (Clavibacter). Destroy infected plants, use certified seed only.' },
];

interface SMCState {
  stage: 'intro' | 'playing' | 'feedback' | 'result';
  level: number; qIndex: number; timeLeft: number;
  score: number; cropHealth: number; correct: number; total: number;
  lastCorrect: boolean; lastExplanation: string;
}
const SMC_INIT: SMCState = {
  stage: 'intro', level: 1, qIndex: 0, timeLeft: 30,
  score: 0, cropHealth: 100, correct: 0, total: 0,
  lastCorrect: false, lastExplanation: '',
};

// ─── MARKET TYCOON ───────────────────────────────────────────────────────────

const MT_CROPS = [
  { id: 'rice',   emoji: '🌾', name: 'Rice',   seedCost: 800  },
  { id: 'maize',  emoji: '🌽', name: 'Maize',  seedCost: 600  },
  { id: 'tomato', emoji: '🍅', name: 'Tomato', seedCost: 1000 },
  { id: 'wheat',  emoji: '🌿', name: 'Wheat',  seedCost: 500  },
] as const;
type MTCrop = typeof MT_CROPS[number];

type MTPriceMap = Record<string, { local: number; city: number; wholesale: number }>;
const MT_BASE_PRICES: MTPriceMap = {
  rice:   { local: 2100, city: 2350, wholesale: 2200 },
  maize:  { local: 1800, city: 2050, wholesale: 1950 },
  tomato: { local: 2800, city: 3200, wholesale: 2900 },
  wheat:  { local: 1900, city: 2150, wholesale: 2000 },
};

interface MTEvent { emoji: string; title: string; desc: string; apply: (p: MTPriceMap) => MTPriceMap; }
const MT_EVENTS: MTEvent[] = [
  { emoji: '🎉', title: 'Festival Season!', desc: 'High demand during festival season. All prices up 20%!',
    apply: p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { local: Math.round(v.local * 1.2), city: Math.round(v.city * 1.2), wholesale: Math.round(v.wholesale * 1.2) }])) },
  { emoji: '📉', title: 'Bumper Harvest!', desc: 'Too much supply in the market. All prices down 15%!',
    apply: p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { local: Math.round(v.local * 0.85), city: Math.round(v.city * 0.85), wholesale: Math.round(v.wholesale * 0.85) }])) },
  { emoji: '🚚', title: 'Transport Strike!', desc: 'City transport workers on strike. City prices drop ₹300.',
    apply: p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { ...v, city: v.city - 300 }])) },
  { emoji: '🌍', title: 'Export Boost!', desc: 'Major export orders for Rice & Wheat. Their prices up 30%!',
    apply: p => ({ ...p, rice: { local: Math.round(p.rice.local * 1.3), city: Math.round(p.rice.city * 1.3), wholesale: Math.round(p.rice.wholesale * 1.3) }, wheat: { local: Math.round(p.wheat.local * 1.3), city: Math.round(p.wheat.city * 1.3), wholesale: Math.round(p.wheat.wholesale * 1.3) } }) },
  { emoji: '🏪', title: 'Local Market Boost!', desc: 'New local market opened nearby. Local prices up 25%!',
    apply: p => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { ...v, local: Math.round(v.local * 1.25) }])) },
];

interface MTState {
  stage: 'intro' | 'grow' | 'event' | 'sell' | 'result';
  money: number; round: number; crop: MTCrop | null;
  prices: MTPriceMap; event: MTEvent | null;
  totalProfit: number;
  roundLog: { round: number; label: string; market: string; profit: number }[];
}
const MT_INIT: MTState = {
  stage: 'intro', money: 10000, round: 1, crop: null,
  prices: Object.fromEntries(Object.entries(MT_BASE_PRICES).map(([k, v]) => [k, { ...v }])),
  event: null, totalProfit: 0, roundLog: [],
};

// ─── KIDS ADVENTURE ──────────────────────────────────────────────────────────

const KA_CROPS = [
  { emoji: '🍅', name: 'Tomato' }, { emoji: '🌾', name: 'Rice' },
  { emoji: '🌽', name: 'Maize' }, { emoji: '🥕', name: 'Carrot' },
  { emoji: '🥔', name: 'Potato' }, { emoji: '🌻', name: 'Sunflower' },
];
const KA_STEPS = [
  { emoji: '🕳️', title: 'Plant the Seed',    desc: 'Dig a small hole and gently place your seed in the soil!',          action: '🌱 Plant It!',      coins: 20, badge: '🌱 First Plant!'   },
  { emoji: '💧', title: 'Water Your Plant',   desc: 'Give your little plant fresh clean water every single day!',       action: '💧 Water It!',      coins: 20, badge: null              },
  { emoji: '☀️', title: 'Give Sunlight',      desc: "Move your plant so it gets bright beautiful sunlight!",           action: '☀️ Sunlight!',     coins: 15, badge: '💧 Water Master!' },
  { emoji: '🐛', title: 'Remove Pests!',      desc: 'Oh no! A bug found your plant. Chase it away right now!',         action: '🛡️ Protect!',     coins: 25, badge: null              },
  { emoji: '🌿', title: 'Watch it Grow!',     desc: 'Your plant is growing bigger and stronger every day!',            action: '⏳ Keep Growing!',  coins: 10, badge: null              },
  { emoji: '🌾', title: 'Harvest Time!',      desc: "Your crop is fully grown. Time to pick and celebrate!",           action: '🎉 Harvest!',       coins: 50, badge: '🌾 First Harvest!' },
];

interface KAState {
  stage: 'choose' | 'steps' | 'result';
  crop: { emoji: string; name: string } | null;
  step: number; coins: number; badges: string[];
}
const KA_INIT: KAState = { stage: 'choose', crop: null, step: 0, coins: 0, badges: [] };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function gradeLabel(score: number, max = 1000) {
  const p = (score / max) * 100;
  if (p >= 85) return { label: 'Master Farmer! 🌟', emoji: '🏆', color: 'text-yellow-600' };
  if (p >= 65) return { label: 'Skilled Farmer', emoji: '🥈', color: 'text-gray-600' };
  if (p >= 40) return { label: 'Learning Farmer', emoji: '🥉', color: 'text-amber-600' };
  return { label: 'Apprentice Farmer', emoji: '🌱', color: 'text-green-600' };
}

function statBar(value: number, color: string) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function AgriGames() {
  const [view, setView] = useState<GameView>('menu');
  const [fb, setFb]     = useState<FBState>(FB_INIT);
  const [smc, setSmc]   = useState<SMCState>(SMC_INIT);
  const [mt, setMt]     = useState<MTState>(MT_INIT);
  const [ka, setKa]     = useState<KAState>(KA_INIT);

  // SMC countdown timer
  useEffect(() => {
    if (smc.stage !== 'playing') return;
    if (smc.timeLeft <= 0) {
      const scenarios = SMC_SCENARIOS.filter(s => s.level === smc.level);
      const sc = scenarios[smc.qIndex];
      setSmc(prev => ({
        ...prev, stage: 'feedback', lastCorrect: false,
        lastExplanation: sc?.explanation ?? '',
        cropHealth: Math.max(0, prev.cropHealth - 15),
        total: prev.total + 1,
      }));
      return;
    }
    const t = setTimeout(() => setSmc(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })), 1000);
    return () => clearTimeout(t);
  }, [smc.stage, smc.timeLeft, smc.level, smc.qIndex]);

  // ── Farm Builder ──────────────────────────────────────────────────────────

  function fbSelectCrop(crop: FBCrop) {
    setFb(prev => ({ ...prev, stage: 'actions', crop, money: prev.money - crop.cost, totalSpent: prev.totalSpent + crop.cost }));
  }

  function fbDoAction(action: 'water' | 'fertilize' | 'protect' | 'rest') {
    setFb(prev => {
      const deltas = {
        water:     { dm: 0,    dw: -150, dch: 12, dfh: 0,  dg: 18, log: '💧 Watered crops' },
        fertilize: { dm: -800, dw: 0,    dch: 15, dfh: 0,  dg: 25, log: '🌱 Applied fertilizer (-₹800)' },
        protect:   { dm: -600, dw: 0,    dch: 0,  dfh: 20, dg: 10, log: '🛡️ Protected farm (-₹600)' },
        rest:      { dm: 0,    dw: 0,    dch: 5,  dfh: 5,  dg: 8,  log: '☕ Rested & monitored' },
      }[action];
      const newRound   = prev.round + 1;
      const newMoney   = prev.money + deltas.dm;
      const newWater   = Math.max(0, prev.water + deltas.dw);
      const newCH      = Math.min(100, Math.max(0, prev.cropHealth + deltas.dch));
      const newFH      = Math.min(100, Math.max(0, prev.farmHealth + deltas.dfh));
      const newGrowth  = Math.min(100, prev.growth + deltas.dg);
      const newSpent   = prev.totalSpent + (deltas.dm < 0 ? -deltas.dm : 0);
      const shouldEvent = Math.random() < 0.65;
      const eventObj   = shouldEvent ? FB_EVENTS[Math.floor(Math.random() * FB_EVENTS.length)] : null;
      const nextStage  = eventObj ? 'event' : newRound > 4 ? 'harvest' : 'actions';
      return {
        ...prev, money: newMoney, water: newWater, cropHealth: newCH, farmHealth: newFH,
        growth: newGrowth, round: newRound, event: eventObj, stage: nextStage,
        totalSpent: newSpent, actionLog: [...prev.actionLog, deltas.log],
      };
    });
  }

  function fbHandleEvent(i: number) {
    setFb(prev => {
      if (!prev.event) return prev;
      const ch = prev.event.choices[i];
      const nextStage = prev.round > 4 ? 'harvest' : 'actions';
      return {
        ...prev,
        money:      prev.money + ch.dm,
        water:      Math.max(0, prev.water + ch.dw),
        cropHealth: Math.min(100, Math.max(0, prev.cropHealth + ch.dch)),
        farmHealth: Math.min(100, Math.max(0, prev.farmHealth + ch.dfh)),
        totalSpent: prev.totalSpent + (ch.dm < 0 ? -ch.dm : 0),
        event: null, stage: nextStage,
        actionLog: [...prev.actionLog, `${prev.event.emoji} ${ch.text}`],
      };
    });
  }

  function fbHarvest() {
    setFb(prev => {
      if (!prev.crop) return prev;
      const kg = Math.round(prev.crop.baseYield * (prev.cropHealth / 100) * (prev.growth / 100) * 12);
      return { ...prev, harvested: kg, stage: 'sell' };
    });
  }

  function fbSell(market: 'local' | 'city' | 'wholesale') {
    setFb(prev => {
      if (!prev.crop) return prev;
      const m = market === 'city' ? 1.15 : market === 'wholesale' ? 1.08 : 1.0;
      const revenue = Math.round((prev.harvested * prev.crop.basePrice / 100) * m);
      return { ...prev, sellRevenue: revenue, money: prev.money + revenue, stage: 'result' };
    });
  }

  function fbScore() {
    const profit = fb.sellRevenue - fb.totalSpent;
    return Math.min(1000,
      Math.round(fb.cropHealth * 3) +
      Math.round(fb.farmHealth * 2) +
      Math.min(300, Math.round(Math.max(0, profit) / 50)) +
      Math.round((fb.water / 1000) * 200)
    );
  }

  // ── Save My Crop ──────────────────────────────────────────────────────────

  function smcStartLevel(level: number) {
    setSmc({ ...SMC_INIT, stage: 'playing', level, timeLeft: 30 });
  }

  function smcAnswer(optionIndex: number) {
    const sc = SMC_SCENARIOS.filter(s => s.level === smc.level)[smc.qIndex];
    if (!sc) return;
    const correct = optionIndex === sc.correct;
    setSmc(prev => ({
      ...prev, stage: 'feedback', lastCorrect: correct,
      lastExplanation: sc.explanation,
      score:      correct ? prev.score + sc.points : prev.score,
      cropHealth: correct ? Math.min(100, prev.cropHealth + 10) : Math.max(0, prev.cropHealth - 15),
      correct:    correct ? prev.correct + 1 : prev.correct,
      total:      prev.total + 1,
    }));
  }

  function smcNext() {
    const scenarios = SMC_SCENARIOS.filter(s => s.level === smc.level);
    if (smc.qIndex + 1 >= scenarios.length) {
      setSmc(prev => ({ ...prev, stage: 'result' }));
    } else {
      setSmc(prev => ({ ...prev, stage: 'playing', qIndex: prev.qIndex + 1, timeLeft: 30 }));
    }
  }

  // ── Market Tycoon ─────────────────────────────────────────────────────────

  function mtGrow(crop: MTCrop) {
    const event = MT_EVENTS[Math.floor(Math.random() * MT_EVENTS.length)];
    const updatedPrices = event.apply({ ...mt.prices });
    setMt(prev => ({ ...prev, crop, event, prices: updatedPrices, money: prev.money - crop.seedCost, stage: 'event' }));
  }

  function mtAcknowledgeEvent() {
    setMt(prev => ({ ...prev, event: null, stage: 'sell' }));
  }

  function mtSell(market: 'local' | 'city' | 'wholesale') {
    setMt(prev => {
      if (!prev.crop) return prev;
      const price  = prev.prices[prev.crop.id][market];
      const profit = price - prev.crop.seedCost;
      const newRound = prev.round + 1;
      return {
        ...prev,
        money: prev.money + price,
        totalProfit: prev.totalProfit + profit,
        round: newRound, crop: null,
        stage: newRound > 5 ? 'result' : 'grow',
        roundLog: [...prev.roundLog, { round: prev.round, label: `${prev.crop.emoji} ${prev.crop.name}`, market, profit }],
      };
    });
  }

  function mtSkip() {
    setMt(prev => {
      const loss = -(prev.crop?.seedCost ?? 0);
      const newRound = prev.round + 1;
      return {
        ...prev, totalProfit: prev.totalProfit + loss, round: newRound, crop: null,
        stage: newRound > 5 ? 'result' : 'grow',
        roundLog: [...prev.roundLog, { round: prev.round, label: prev.crop ? `${prev.crop.emoji} ${prev.crop.name}` : '?', market: 'Stored', profit: loss }],
      };
    });
  }

  // ── Kids Adventure ────────────────────────────────────────────────────────

  function kaChooseCrop(crop: { emoji: string; name: string }) {
    setKa({ ...KA_INIT, crop, stage: 'steps', coins: 10 });
  }

  function kaDoStep() {
    const step    = KA_STEPS[ka.step];
    const newCoins  = ka.coins + step.coins;
    const newBadges = step.badge ? [...ka.badges, step.badge] : [...ka.badges];
    if (ka.step + 1 >= KA_STEPS.length) {
      const final = [...newBadges, '👨‍🌾 Young Farmer!'];
      if (newCoins >= 140) final.push('🏆 Farm Champion!');
      setKa(prev => ({ ...prev, coins: newCoins, badges: final, stage: 'result' }));
    } else {
      setKa(prev => ({ ...prev, coins: newCoins, badges: newBadges, step: prev.step + 1 }));
    }
  }

  // ── MENU ─────────────────────────────────────────────────────────────────

  if (view === 'menu') {
    const GAMES = [
      { id: 'fb' as GameView, emoji: '🌾', name: 'Farm Builder',
        desc: 'Plant crops, manage resources, fight events, and sell your harvest for maximum profit.',
        tags: ['Simulation', 'Strategy'], diff: 'Intermediate', diffCls: 'bg-amber-50 text-amber-700',
        grad: 'from-green-500 to-emerald-600' },
      { id: 'smc' as GameView, emoji: '🐛', name: 'Save My Crop',
        desc: 'Identify crop diseases and pest attacks before the 30-second timer runs out!',
        tags: ['Quiz', 'Timed'], diff: 'Challenging', diffCls: 'bg-red-50 text-red-700',
        grad: 'from-red-500 to-orange-500' },
      { id: 'mt' as GameView, emoji: '💰', name: 'Farm Market Tycoon',
        desc: 'Grow crops, watch market events, choose the best market and reach ₹50,000 profit.',
        tags: ['Trading', 'Strategy'], diff: 'Advanced', diffCls: 'bg-purple-50 text-purple-700',
        grad: 'from-amber-500 to-yellow-500' },
      { id: 'ka' as GameView, emoji: '👦', name: 'Kids Farm Adventure',
        desc: "A colorful step-by-step farming journey for children. Earn coins and collect badges!",
        tags: ['Kids', 'Educational'], diff: 'Easy', diffCls: 'bg-green-50 text-green-700',
        grad: 'from-yellow-400 to-orange-400' },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link to="/" className="text-white hover:text-green-200 transition-colors"><ArrowLeft className="w-6 h-6" /></Link>
            <div>
              <h1 className="text-xl font-bold">🎮 Agri Games</h1>
              <p className="text-sm text-green-100">Learn farming. Make smart decisions. Have fun.</p>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 pb-24">
          <p className="text-gray-400 text-sm text-center mb-5">4 interactive farming games — choose your challenge!</p>
          <div className="grid gap-4">
            {GAMES.map(g => (
              <button key={g.id} onClick={() => setView(g.id)}
                className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 hover:border-green-400 p-5 text-left transition-all group">
                <div className="flex gap-4 items-start">
                  <div className={`bg-gradient-to-br ${g.grad} w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                    {g.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="font-bold text-gray-900">{g.name}</h2>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.diffCls}`}>{g.diff}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-2 leading-relaxed">{g.desc}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {g.tags.map(t => <span key={t} className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{t}</span>)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Tap to start</span>
                  <span className="text-green-600 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                    PLAY NOW <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── FARM BUILDER ─────────────────────────────────────────────────────────

  if (view === 'fb') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button onClick={() => { setView('menu'); setFb(FB_INIT); }} className="text-white hover:text-green-200"><ArrowLeft className="w-6 h-6" /></button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">🌾 Farm Builder</h1>
              <p className="text-sm text-green-100">Build your farm and grow a successful harvest</p>
            </div>
            {fb.stage === 'actions' && <div className="text-right"><p className="text-xs text-green-200">Round</p><p className="font-bold">{fb.round}/4</p></div>}
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 pb-24">

          {/* SELECT CROP */}
          {fb.stage === 'select' && (
            <div>
              <div className="text-center py-4 mb-4">
                <div className="text-5xl mb-2">🚜</div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Your Crop</h2>
                <p className="text-sm text-gray-500">Starting budget: ₹{fb.money.toLocaleString()} · Water: {fb.water}L · Seeds: limited</p>
              </div>
              <div className="grid gap-3">
                {FB_CROPS.map(crop => (
                  <button key={crop.id} onClick={() => fbSelectCrop(crop)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:border-green-500 hover:shadow-md p-4 flex items-center gap-4 transition-all">
                    <span className="text-3xl">{crop.emoji}</span>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-gray-900">{crop.name}</p>
                      <p className="text-xs text-gray-500">Seed cost ₹{crop.cost.toLocaleString()} · Base ₹{crop.basePrice}/quintal</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 text-sm">+{crop.baseYield} kg</p>
                      <p className="text-xs text-gray-400">base yield</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FARMING ACTIONS */}
          {fb.stage === 'actions' && fb.crop && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                  <p className="text-xs text-gray-400">💰 Money</p>
                  <p className="font-bold text-gray-900">₹{fb.money.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                  <p className="text-xs text-gray-400">💧 Water</p>
                  <p className="font-bold text-gray-900">{fb.water} L</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: '🌱 Crop Health', val: fb.cropHealth, color: 'bg-green-500' },
                  { label: '❤️ Farm Health', val: fb.farmHealth, color: 'bg-red-400' },
                  { label: '📈 Growth',      val: fb.growth,     color: 'bg-blue-500' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                    <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                    {statBar(s.val, s.color)}
                    <p className="text-xs font-bold text-gray-700 mt-1">{s.val}%</p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-3">
                <p className="font-semibold text-gray-700 text-sm mb-3">Round {fb.round}/4 — Choose an Action</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'water',     emoji: '💧', label: 'Water Crops',    cost: '-150L',   fx: '+12 CH · +18% grow', dis: fb.water < 150 },
                    { id: 'fertilize', emoji: '🌱', label: 'Fertilize',       cost: '-₹800',  fx: '+15 CH · +25% grow', dis: fb.money < 800 },
                    { id: 'protect',   emoji: '🛡️', label: 'Protect Farm',   cost: '-₹600',  fx: '+20 FH · +10% grow', dis: fb.money < 600 },
                    { id: 'rest',      emoji: '☕', label: 'Rest & Monitor',  cost: 'Free',   fx: '+5 CH · +5 FH',      dis: false },
                  ].map(a => (
                    <button key={a.id} disabled={a.dis}
                      onClick={() => !a.dis && fbDoAction(a.id as 'water' | 'fertilize' | 'protect' | 'rest')}
                      className={`p-3 rounded-lg border text-left transition-all ${a.dis ? 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed' : 'bg-green-50 border-green-100 hover:border-green-400 hover:bg-green-100'}`}>
                      <div className="text-xl mb-1">{a.emoji}</div>
                      <p className="font-semibold text-gray-800 text-sm">{a.label}</p>
                      <p className="text-xs text-gray-500">{a.cost}</p>
                      <p className="text-xs text-green-600 mt-0.5">{a.fx}</p>
                    </button>
                  ))}
                </div>
              </div>
              {fb.actionLog.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-100 p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Action Log</p>
                  {fb.actionLog.map((l, i) => <p key={i} className="text-xs text-gray-500 py-0.5">• {l}</p>)}
                </div>
              )}
            </div>
          )}

          {/* EVENT */}
          {fb.stage === 'event' && fb.event && (
            <div className="py-4">
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{fb.event.emoji}</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{fb.event.title}</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-amber-800 text-sm">{fb.event.desc}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-3">How do you respond?</p>
              <div className="grid gap-2.5">
                {fb.event.choices.map((ch, i) => {
                  const effects = [
                    ch.dm !== 0 && `₹${ch.dm > 0 ? '+' : ''}${ch.dm.toLocaleString()}`,
                    ch.dw !== 0 && `Water ${ch.dw > 0 ? '+' : ''}${ch.dw}L`,
                    ch.dch !== 0 && `Crop ${ch.dch > 0 ? '+' : ''}${ch.dch}%`,
                    ch.dfh !== 0 && `Farm ${ch.dfh > 0 ? '+' : ''}${ch.dfh}%`,
                  ].filter(Boolean).join(' · ');
                  return (
                    <button key={i} onClick={() => fbHandleEvent(i)}
                      className="bg-white rounded-lg border border-gray-200 hover:border-green-400 hover:bg-green-50 p-4 text-left transition-all">
                      <p className="font-medium text-gray-800 text-sm">{ch.text}</p>
                      {effects && <p className="text-xs text-gray-400 mt-1">{effects}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* HARVEST */}
          {fb.stage === 'harvest' && fb.crop && (
            <div className="text-center py-6">
              <div className="text-6xl mb-3">🌾</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Harvest!</h2>
              <p className="text-gray-500 text-sm mb-5">Your {fb.crop.emoji} {fb.crop.name} has completed 4 seasons of growth.</p>
              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                {[
                  { e: '🌱', l: 'Crop Health', v: `${fb.cropHealth}%` },
                  { e: '📈', l: 'Growth',      v: `${fb.growth}%` },
                  { e: '💧', l: 'Water Left',  v: `${fb.water}L` },
                  { e: '💰', l: 'Money Left',  v: `₹${fb.money.toLocaleString()}` },
                ].map(s => (
                  <div key={s.l} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                    <p className="text-xs text-gray-400">{s.e} {s.l}</p>
                    <p className="font-bold text-gray-900">{s.v}</p>
                  </div>
                ))}
              </div>
              <button onClick={fbHarvest}
                className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors shadow-md">
                🌾 Harvest Now!
              </button>
            </div>
          )}

          {/* SELL */}
          {fb.stage === 'sell' && fb.crop && (
            <div className="py-2">
              <div className="text-center mb-5">
                <div className="text-4xl mb-2">📦</div>
                <h2 className="text-xl font-bold text-gray-900">Sell Your Harvest</h2>
                <p className="text-gray-500 text-sm mt-1">Harvested: <strong>{fb.harvested} kg</strong> of {fb.crop.emoji} {fb.crop.name}</p>
              </div>
              <div className="grid gap-3">
                {[
                  { id: 'local',      emoji: '🏪', label: 'Local Market',     m: 1.0,  note: 'Safe · no transport cost' },
                  { id: 'city',       emoji: '🏙️', label: 'City Market',      m: 1.15, note: '+15% price · near buyers' },
                  { id: 'wholesale',  emoji: '🚛', label: 'Wholesale Market',  m: 1.08, note: '+8% price · bulk buyers' },
                ].map(mkt => {
                  const rev = Math.round((fb.harvested * fb.crop!.basePrice / 100) * mkt.m);
                  return (
                    <button key={mkt.id} onClick={() => fbSell(mkt.id as 'local' | 'city' | 'wholesale')}
                      className="bg-white rounded-xl border border-gray-100 hover:border-green-500 shadow-sm hover:shadow-md p-4 flex items-center gap-4 transition-all">
                      <span className="text-2xl">{mkt.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-gray-900">{mkt.label}</p>
                        <p className="text-xs text-gray-500">{mkt.note}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{rev.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">total revenue</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* RESULT */}
          {fb.stage === 'result' && (() => {
            const score  = fbScore();
            const grade  = gradeLabel(score);
            const profit = fb.sellRevenue - fb.totalSpent;
            return (
              <div className="text-center py-6">
                <div className="text-6xl mb-2">{grade.emoji}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{grade.label}</h2>
                <p className={`text-xl font-bold mb-5 ${grade.color}`}>{score} / 1000</p>
                <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                  {[
                    { l: '🌾 Total Harvest', v: `${fb.harvested} kg` },
                    { l: '💰 Revenue',       v: `₹${fb.sellRevenue.toLocaleString()}` },
                    { l: '📊 Net Profit',    v: `₹${profit.toLocaleString()}`, hi: profit > 0 },
                    { l: '💧 Water Saved',   v: `${fb.water} L` },
                    { l: '🌱 Crop Health',   v: `${fb.cropHealth}%` },
                    { l: '❤️ Farm Health',   v: `${fb.farmHealth}%` },
                  ].map(s => (
                    <div key={s.l} className={`rounded-lg border p-3 shadow-sm ${(s as any).hi ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>
                      <p className="text-xs text-gray-400">{s.l}</p>
                      <p className={`font-bold ${(s as any).hi ? 'text-green-600' : 'text-gray-900'}`}>{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setFb(FB_INIT)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                  <button onClick={() => { setView('menu'); setFb(FB_INIT); }}
                    className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">
                    ← Agri Games
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── SAVE MY CROP ─────────────────────────────────────────────────────────

  if (view === 'smc') {
    const levelScenarios = SMC_SCENARIOS.filter(s => s.level === smc.level);
    const current = levelScenarios[smc.qIndex];
    const timerPct   = (smc.timeLeft / 30) * 100;
    const timerColor = smc.timeLeft > 15 ? 'bg-green-500' : smc.timeLeft > 8 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button onClick={() => { setView('menu'); setSmc(SMC_INIT); }} className="text-white hover:text-red-200"><ArrowLeft className="w-6 h-6" /></button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">🐛 Save My Crop</h1>
              <p className="text-sm text-red-100">Identify the problem and save your crop!</p>
            </div>
            {smc.stage === 'playing' && (
              <div className="text-right"><p className="text-xs text-red-200">Score</p><p className="font-bold">{smc.score}</p></div>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 pb-24">

          {/* INTRO */}
          {smc.stage === 'intro' && (
            <div className="text-center py-6">
              <div className="text-6xl mb-3">🐛</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Save My Crop</h2>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                Diagnose crop diseases and pests before the 30-second timer runs out! 3 levels of increasing difficulty.
              </p>
              <p className="font-semibold text-gray-700 mb-4">Select Difficulty:</p>
              <div className="grid gap-3 max-w-xs mx-auto">
                {[
                  { level: 1, label: 'Level 1 — Easy',      emoji: '🌱', cls: 'bg-green-600 hover:bg-green-700' },
                  { level: 2, label: 'Level 2 — Medium',    emoji: '🌿', cls: 'bg-amber-500 hover:bg-amber-600' },
                  { level: 3, label: 'Level 3 — Hard',      emoji: '🌾', cls: 'bg-red-600 hover:bg-red-700' },
                ].map(l => (
                  <button key={l.level} onClick={() => smcStartLevel(l.level)}
                    className={`${l.cls} text-white py-3.5 px-5 rounded-xl font-bold transition-colors`}>
                    {l.emoji} {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PLAYING */}
          {smc.stage === 'playing' && current && (
            <div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 font-medium">Q {smc.qIndex + 1}/{levelScenarios.length}</span>
                  <span className={`font-bold flex items-center gap-1 ${smc.timeLeft <= 8 ? 'text-red-600' : 'text-gray-600'}`}>
                    <Clock className="w-4 h-4" /> {smc.timeLeft}s
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${timerColor} rounded-full transition-all duration-1000`} style={{ width: `${timerPct}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-500">Crop Health:</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${smc.cropHealth}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700">{smc.cropHealth}%</span>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-3">
                <p className="text-red-700 font-bold text-sm">🚨 ALERT! — {current.crop}</p>
                <p className="text-red-900 font-medium mt-1">{current.alert}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Clues Observed:</p>
                <div className="grid grid-cols-2 gap-2">
                  {current.clues.map((c, i) => (
                    <div key={i} className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-700">🔍 {c}</div>
                  ))}
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-2">What is the problem?</p>
              <div className="grid gap-2.5">
                {current.options.map((opt, i) => (
                  <button key={i} onClick={() => smcAnswer(i)}
                    className="w-full text-left bg-white border border-gray-200 hover:border-red-400 hover:bg-red-50 rounded-lg p-4 font-medium text-gray-800 text-sm transition-all">
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FEEDBACK */}
          {smc.stage === 'feedback' && (
            <div className="py-4">
              <div className={`rounded-xl border-2 p-6 mb-5 text-center ${smc.lastCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-5xl mb-2">{smc.lastCorrect ? '✅' : '❌'}</div>
                <p className="text-xl font-bold text-gray-900">
                  {smc.lastCorrect ? 'Correct Diagnosis!' : 'Wrong Diagnosis!'}
                </p>
                <p className="text-sm text-gray-500 mt-1 mb-3">
                  {smc.lastCorrect
                    ? `+${levelScenarios[smc.qIndex]?.points ?? 100} points earned`
                    : 'Crop Health -15%'}
                </p>
                <div className="bg-white rounded-lg p-4 text-left border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{smc.lastExplanation}</p>
                </div>
              </div>
              <button onClick={smcNext}
                className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-red-700 transition-colors">
                {smc.qIndex + 1 >= levelScenarios.length ? 'See Results 🏆' : 'Next Scenario →'}
              </button>
            </div>
          )}

          {/* RESULT */}
          {smc.stage === 'result' && (() => {
            const maxScore = levelScenarios.reduce((s, q) => s + q.points, 0);
            const grade    = gradeLabel(smc.score, maxScore);
            const saved    = smc.total > 0 ? Math.round((smc.correct / smc.total) * 100) : 0;
            return (
              <div className="text-center py-6">
                <div className="text-6xl mb-2">🏆</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Crop Protector!</h2>
                <p className={`text-xl font-bold mb-5 ${grade.color}`}>{smc.score} / {maxScore} pts</p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { l: 'Crops Saved', v: `${saved}%` },
                    { l: 'Correct',     v: `${smc.correct}/${smc.total}` },
                    { l: 'Crop Health', v: `${smc.cropHealth}%` },
                  ].map(s => (
                    <div key={s.l} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                      <p className="text-xs text-gray-400">{s.l}</p>
                      <p className="font-bold text-gray-900">{s.v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setSmc(SMC_INIT)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                  <button onClick={() => { setView('menu'); setSmc(SMC_INIT); }}
                    className="flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700">
                    ← Agri Games
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── MARKET TYCOON ─────────────────────────────────────────────────────────

  if (view === 'mt') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button onClick={() => { setView('menu'); setMt(MT_INIT); }} className="text-white hover:text-amber-200"><ArrowLeft className="w-6 h-6" /></button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">💰 Farm Market Tycoon</h1>
              <p className="text-sm text-amber-100">Grow. Trade. Sell. Maximize your profit.</p>
            </div>
            {mt.stage !== 'intro' && (
              <div className="text-right">
                <p className="text-xs text-amber-200">Profit</p>
                <p className={`font-bold ${mt.totalProfit >= 0 ? 'text-white' : 'text-red-300'}`}>
                  ₹{mt.totalProfit.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="max-w-6xl mx-auto p-4 pb-24">

          {/* INTRO */}
          {mt.stage === 'intro' && (
            <div className="text-center py-6">
              <div className="text-6xl mb-3">💰</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Farm Market Tycoon</h2>
              <p className="text-gray-500 mb-5 max-w-sm mx-auto text-sm leading-relaxed">
                You have ₹10,000 and 5 seasons. Grow crops smart, pick the best market, and reach ₹50,000 profit!
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left max-w-xs mx-auto">
                <p className="font-bold text-amber-800 mb-2">🎯 Target: ₹50,000 profit in 5 seasons</p>
                <p className="text-sm text-amber-700">• Watch market events closely</p>
                <p className="text-sm text-amber-700">• Choose the right market to sell</p>
                <p className="text-sm text-amber-700">• High risk crops = high reward</p>
              </div>
              <button onClick={() => setMt(prev => ({ ...prev, stage: 'grow' }))}
                className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-amber-600 transition-colors shadow-md">
                Start Trading! 💰
              </button>
            </div>
          )}

          {/* GROW */}
          {mt.stage === 'grow' && (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                  <p className="text-xs text-gray-400">💰 Balance</p>
                  <p className="font-bold text-gray-900">₹{mt.money.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                  <p className="text-xs text-gray-400">📅 Season</p>
                  <p className="font-bold text-gray-900">{mt.round} / 5</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-3 mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Progress to ₹50,000 goal</span>
                  <span>{Math.max(0, Math.round((mt.totalProfit / 50000) * 100))}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${mt.totalProfit >= 50000 ? 'bg-yellow-400' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, (mt.totalProfit / 50000) * 100))}%` }} />
                </div>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Season {mt.round}: Choose a Crop to Grow</h3>
              <p className="text-sm text-gray-500 mb-3">Buy seeds for 1 quintal. A market event will affect prices before you sell.</p>
              <div className="grid gap-2.5">
                {MT_CROPS.map(crop => {
                  const p = mt.prices[crop.id];
                  const best = Math.max(p.local, p.city, p.wholesale);
                  const maxProfit = best - crop.seedCost;
                  const canAfford = mt.money >= crop.seedCost;
                  return (
                    <button key={crop.id} onClick={() => canAfford && mtGrow(crop)} disabled={!canAfford}
                      className={`bg-white rounded-xl border shadow-sm p-4 text-left transition-all ${canAfford ? 'border-gray-100 hover:border-amber-400 hover:shadow-md' : 'border-gray-100 opacity-40 cursor-not-allowed'}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{crop.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{crop.name}</p>
                          <p className="text-xs text-gray-500">Seeds: ₹{crop.seedCost}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${maxProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {maxProfit >= 0 ? '+' : ''}₹{maxProfit.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-400">best profit</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-xs">
                        {(['local', 'city', 'wholesale'] as const).map(m => (
                          <div key={m} className="bg-gray-50 rounded px-2 py-1 text-center">
                            <p className="text-gray-400 capitalize">{m === 'wholesale' ? 'W/sale' : m.charAt(0).toUpperCase() + m.slice(1)}</p>
                            <p className="font-semibold text-gray-700">₹{p[m]}</p>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* EVENT */}
          {mt.stage === 'event' && mt.event && (
            <div className="py-4 text-center">
              <div className="text-6xl mb-3">{mt.event.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{mt.event.title}</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-800 text-sm">{mt.event.desc}</p>
              </div>
              <p className="text-sm text-gray-500 mb-5">Market prices have been updated. Now choose where to sell your {mt.crop?.emoji} {mt.crop?.name}!</p>
              <button onClick={mtAcknowledgeEvent}
                className="bg-amber-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors">
                Go to Market →
              </button>
            </div>
          )}

          {/* SELL */}
          {mt.stage === 'sell' && mt.crop && (
            <div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">You have ready to sell:</p>
                <p className="text-lg font-bold text-gray-900">{mt.crop.emoji} 1 quintal of {mt.crop.name}</p>
                <p className="text-sm text-gray-500">Seed cost paid: ₹{mt.crop.seedCost}</p>
              </div>
              <h3 className="font-bold text-gray-800 mb-3">Choose Your Market:</h3>
              <div className="grid gap-3 mb-3">
                {[
                  { id: 'local',     emoji: '🏪', label: 'Local Market' },
                  { id: 'city',      emoji: '🏙️', label: 'City Market' },
                  { id: 'wholesale', emoji: '🚛', label: 'Wholesale Market' },
                ].map(m => {
                  const price  = mt.prices[mt.crop!.id][m.id as 'local' | 'city' | 'wholesale'];
                  const profit = price - mt.crop!.seedCost;
                  return (
                    <button key={m.id} onClick={() => mtSell(m.id as 'local' | 'city' | 'wholesale')}
                      className="bg-white rounded-xl border border-gray-100 hover:border-amber-400 shadow-sm hover:shadow-md p-4 flex items-center gap-4 transition-all">
                      <span className="text-2xl">{m.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className="font-bold text-gray-900">{m.label}</p>
                        <p className="text-xs text-gray-400">Current rate: ₹{price}/quintal</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profit >= 0 ? '+' : ''}₹{profit.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">profit</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={mtSkip}
                className="w-full bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">
                📦 Store & Skip this season (lose seed cost)
              </button>
            </div>
          )}

          {/* RESULT */}
          {mt.stage === 'result' && (() => {
            const won   = mt.totalProfit >= 50000;
            const score = Math.min(1000, Math.round(Math.max(0, mt.totalProfit) / 50));
            return (
              <div className="text-center py-6">
                <div className="text-6xl mb-2">{won ? '🏆' : '📊'}</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{won ? 'Master Trader!' : 'Season Complete!'}</h2>
                <p className={`text-xl font-bold mb-5 ${mt.totalProfit >= 50000 ? 'text-green-600' : mt.totalProfit >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  Total Profit: ₹{mt.totalProfit.toLocaleString()}
                </p>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 text-left">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Season Log</p>
                  {mt.roundLog.map((log, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600">S{log.round}: {log.label} → {log.market}</span>
                      <span className={`text-sm font-bold ${log.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {log.profit >= 0 ? '+' : ''}₹{log.profit.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
                  <p className="text-amber-700 font-semibold">Score: {score} / 1000</p>
                  <p className="text-amber-600 text-sm mt-0.5">
                    {won ? '🎯 Target reached! Excellent trading skills!' : `₹${Math.max(0, 50000 - mt.totalProfit).toLocaleString()} short of the ₹50,000 target.`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMt(MT_INIT)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200">
                    <RotateCcw className="w-4 h-4" /> Play Again
                  </button>
                  <button onClick={() => { setView('menu'); setMt(MT_INIT); }}
                    className="flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600">
                    ← Agri Games
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // ── KIDS ADVENTURE ────────────────────────────────────────────────────────

  const kaStep = ka.stage === 'steps' ? KA_STEPS[ka.step] : null;
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => { setView('menu'); setKa(KA_INIT); }} className="text-white hover:text-yellow-200"><ArrowLeft className="w-6 h-6" /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">👦 Kids Farm Adventure</h1>
            <p className="text-sm text-yellow-100">Plant. Grow. Harvest. Learn!</p>
          </div>
          {ka.stage === 'steps' && (
            <div className="text-right"><p className="text-xs text-yellow-100">🪙 Coins</p><p className="font-bold">{ka.coins}</p></div>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto p-4 pb-24">

        {/* CHOOSE CROP */}
        {ka.stage === 'choose' && (
          <div>
            <div className="text-center py-4 mb-4">
              <div className="text-5xl mb-2">🌻</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Choose Your Seed!</h2>
              <p className="text-gray-500 text-sm">Pick a crop to grow on your little farm today.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {KA_CROPS.map(crop => (
                <button key={crop.name} onClick={() => kaChooseCrop(crop)}
                  className="bg-white rounded-xl border-2 border-gray-100 hover:border-yellow-400 shadow-sm hover:shadow-md p-5 flex flex-col items-center gap-2 transition-all">
                  <span className="text-4xl">{crop.emoji}</span>
                  <span className="font-bold text-gray-900">{crop.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEPS */}
        {ka.stage === 'steps' && kaStep && (
          <div>
            {/* Progress dots */}
            <div className="flex justify-center gap-2.5 mb-5 mt-1">
              {KA_STEPS.map((s, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all ${
                    i < ka.step  ? 'bg-green-500 text-white' :
                    i === ka.step ? 'bg-yellow-400 text-white ring-4 ring-yellow-100 scale-110' :
                    'bg-gray-100 text-gray-300'
                  }`}>
                    {i < ka.step ? '✓' : s.emoji}
                  </div>
                </div>
              ))}
            </div>
            {/* Crop badge */}
            <div className="bg-white rounded-lg border border-gray-100 p-3 mb-4 flex items-center gap-2">
              <span className="text-xl">{ka.crop?.emoji}</span>
              <span className="text-sm font-medium text-gray-600">Growing: <strong>{ka.crop?.name}</strong></span>
              <div className="ml-auto flex items-center gap-1">
                <span className="text-yellow-500">🪙</span>
                <span className="font-bold text-gray-700">{ka.coins}</span>
              </div>
            </div>
            {/* Step card */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 mb-5 text-center">
              <div className="text-7xl mb-3">{kaStep.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{kaStep.title}</h2>
              <p className="text-gray-600 mb-5 leading-relaxed">{kaStep.desc}</p>
              <button onClick={kaDoStep}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-md hover:opacity-90 active:scale-95 transition-all">
                {kaStep.action}
              </button>
              <p className="text-sm text-amber-600 mt-3 font-medium">+{kaStep.coins} 🪙 coins!</p>
            </div>
            {ka.badges.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-3">
                <p className="text-xs font-semibold text-gray-400 mb-2">🏅 BADGES EARNED</p>
                <div className="flex flex-wrap gap-2">
                  {ka.badges.map((b, i) => (
                    <span key={i} className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {ka.stage === 'result' && (
          <div className="text-center py-6">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Great Job!</h2>
            <p className="text-gray-500 mb-5">You helped your {ka.crop?.emoji} {ka.crop?.name} grow from seed to harvest!</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                <p className="text-xs text-gray-400">Crops Grown</p>
                <p className="font-bold text-2xl text-gray-900">1</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                <p className="text-xs text-gray-400">🪙 Coins</p>
                <p className="font-bold text-2xl text-yellow-500">{ka.coins}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                <p className="text-xs text-gray-400">Badges</p>
                <p className="font-bold text-2xl text-gray-900">{ka.badges.length}</p>
              </div>
            </div>
            {ka.badges.length > 0 && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4 mb-5">
                <p className="font-bold text-amber-700 mb-3">🏅 Badges Collected!</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {ka.badges.map((b, i) => (
                    <span key={i} className="bg-white border border-yellow-200 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm">{b}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setKa(KA_INIT)}
                className="flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 py-3 rounded-xl font-semibold hover:bg-yellow-200">
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>
              <button onClick={() => { setView('menu'); setKa(KA_INIT); }}
                className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">
                ← Agri Games
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
