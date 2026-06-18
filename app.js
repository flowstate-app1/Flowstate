// ── State ────────────────────────────────────────────
let todos    = [];
let grades   = [];
let events   = [];
let totalXP  = 0;
let streak   = 0;
let tasksDone = 0;
let totalMins = 0;
let sessions = [];
let selectedPlant = 'blossom';
let earnedBadges = {};
let dailyXP = 0;
let dailyXPDate = '';
let recentCompleteTimes = [];

// Weekly tracking: { 'YYYY-MM-DD': { tasks, mins, xp, badges } }
let weekLog = {};

// Daily challenges
let dailyChallenges    = [];   // [{...def, progress, done}]
let dailyChallengeDate = '';   // YYYY-MM-DD when they were generated
let allChallengesDone  = false;

// Per-day event counters (reset each day)
let dayCounters = { tasks: 0, mins: 0, mood: 0, combo: 0, xp: 0, high_task: 0, calendar: 0 };

const CHALLENGE_POOL = [
  { id:'c_tasks1',  text:'Complete 1 task',              xp:50,  type:'tasks',     target:1  },
  { id:'c_tasks3',  text:'Complete 3 tasks',             xp:75,  type:'tasks',     target:3  },
  { id:'c_tasks5',  text:'Complete 5 tasks',             xp:100, type:'tasks',     target:5  },
  { id:'c_study25', text:'Study for 25 minutes',         xp:60,  type:'mins',      target:25 },
  { id:'c_study45', text:'Study for 45 minutes',         xp:80,  type:'mins',      target:45 },
  { id:'c_mood',    text:'Log a mood after a session',   xp:50,  type:'mood',      target:1  },
  { id:'c_combo',   text:'Hit a 2× combo',               xp:60,  type:'combo',     target:1  },
  { id:'c_xp50',    text:'Earn 50 XP today',             xp:50,  type:'xp',        target:50 },
  { id:'c_xp100',   text:'Earn 100 XP today',            xp:75,  type:'xp',        target:100},
  { id:'c_high',    text:'Complete a high-priority task', xp:75, type:'high_task', target:1  },
  { id:'c_cal',     text:'Add an event to the calendar', xp:50,  type:'calendar',  target:1  },
  { id:'c_xp150',   text:'Earn 150 XP today',            xp:100, type:'xp',        target:150},
];

const BADGES = [
  { id: 'first_step',  emoji: '👶', name: 'First Step',  desc: 'Complete your first task' },
  { id: 'on_fire',     emoji: '🔥', name: 'On Fire',     desc: 'Reach a 5-day login streak' },
  { id: 'night_owl',   emoji: '🦉', name: 'Night Owl',   desc: 'Complete a task after 10pm' },
  { id: 'speed_run',   emoji: '⚡', name: 'Speed Run',   desc: 'Complete 3 tasks in under 2 minutes' },
  { id: 'big_brain',   emoji: '🧠', name: 'Big Brain',   desc: 'Reach Scholar level (250 XP)' },
  { id: 'legend',      emoji: '👑', name: 'Legend',      desc: 'Reach Legend level (900 XP)' },
  { id: 'centurion',   emoji: '💯', name: 'Centurion',   desc: 'Earn 100 XP in a single day' },
  { id: 'grind_mode',  emoji: '💪', name: 'Grind Mode',  desc: 'Study for 60+ minutes in one session' },
];

// Login streak state
let loginStreak = 1;

// Calendar view state
const today = new Date().toISOString().slice(0,10);
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();
let selectedDay = today;

const EVENT_COLORS = { test:'#EF4444', quiz:'#F97316', assignment:'#38BDF8', project:'#F59E0B', other:'#10B981' };
const EVENT_LABELS = { test:'Test', quiz:'Quiz', assignment:'Assignment', project:'Project', other:'Other' };

let timerSeconds = 25 * 60;
let timerTotal   = 25 * 60;
let timerRunning = false;
let timerInterval = null;

const PRIORITY_COLORS = { high: '#EF4444', med: '#F59E0B', low: '#10B981' };
const LEVELS = [
  { name: 'Rookie',  min: 0,   max: 100  },
  { name: 'Learner', min: 100, max: 250  },
  { name: 'Scholar', min: 250, max: 500  },
  { name: 'Expert',  min: 500, max: 900  },
  { name: 'Legend',  min: 900, max: 9999 },
];
const MOOD_ICONS = { rough: '😵', okay: '😐', good: '😊', great: '🔥' };

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: "It always seems impossible until it's done.", author: 'Nelson Mandela' },
  { text: "You don't have to be great to start, but you have to start to be great.", author: 'Zig Ziglar' },
  { text: 'The beautiful thing about learning is nobody can take it away from you.', author: 'B.B. King' },
  { text: "Don't watch the clock; do what it does. Keep going.", author: 'Sam Levenson' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'The more that you read, the more things you will know.', author: 'Dr. Seuss' },
  { text: 'Education is the passport to the future.', author: 'Malcolm X' },
  { text: 'Learning is not attained by chance; it must be sought with ardor.', author: 'Abigail Adams' },
  { text: 'The mind is not a vessel to be filled but a fire to be kindled.', author: 'Plutarch' },
];

// ── Plant system ─────────────────────────────────────
const POT = `
  <path d="M60,182 L140,182 L130,224 L70,224 Z" fill="#C47A3B"/>
  <path d="M68,190 L84,190" stroke="rgba(255,255,255,0.22)" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="47" y="169" width="106" height="16" rx="8" fill="#D4894A"/>
  <path d="M55,175 L92,175" stroke="rgba(255,255,255,0.28)" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="100" cy="174" rx="45" ry="8" fill="#5D3A1A"/>
  <ellipse cx="100" cy="171" rx="41" ry="5.5" fill="#7B4F28"/>`;

const PLANT_TYPES = {
  blossom: {
    name: 'Cherry Blossom', emoji: '🌸', unlockLevel: 'Rookie', unlockXP: 0,
    clip: { x: 90, w: 20 }, maxH: 110, fullY: 172,
    svgContent: POT + `
      <defs><clipPath id="stem-clip"><rect id="stem-clip-rect" x="90" y="172" width="20" height="0"/></clipPath></defs>
      <rect x="97.5" y="62" width="5" height="110" rx="2.5" fill="#5DBE52" clip-path="url(#stem-clip)"/>
      <ellipse id="pl-seed" cx="100" cy="165" rx="8" ry="5.5" fill="#9B7653"/>
      <ellipse id="pl-seed2" cx="100" cy="163" rx="5.5" ry="3.5" fill="#B38B6D"/>
      <g id="pl-leaf1" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,152 C84,140 66,128 64,112 C80,116 97,130 100,152Z" fill="#5DBE52"/>
        <path d="M100,152 L68,116" stroke="#45A045" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <g id="pl-leaf2" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,124 C118,112 136,104 138,86 C122,90 104,106 100,124Z" fill="#66C958"/>
        <path d="M100,124 L134,90" stroke="#45A045" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <g id="pl-leaf3" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,98 C84,86 66,76 64,60 C80,64 97,78 100,98Z" fill="#4CAF50"/>
        <path d="M100,98 L68,63" stroke="#3E9140" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </g>
      <g id="pl-bud" opacity="0" style="transition:opacity 0.7s ease">
        <path d="M100,74 C88,70 80,58 82,46 C91,52 99,66 100,74Z" fill="#5DBE52"/>
        <path d="M100,74 C112,70 120,58 118,46 C109,52 101,66 100,74Z" fill="#66C958"/>
        <ellipse cx="100" cy="60" rx="10" ry="14" fill="#FF9F43"/>
        <ellipse cx="100" cy="52" rx="6.5" ry="9" fill="#FFC107"/>
      </g>
      <g id="pl-bloom" opacity="0" style="transition:opacity 1s ease">
        <ellipse cx="100" cy="40" rx="11" ry="20" fill="#FF85AD"/>
        <ellipse cx="100" cy="84" rx="11" ry="20" fill="#FF85AD"/>
        <ellipse cx="78" cy="62" rx="20" ry="11" fill="#FF9FC0"/>
        <ellipse cx="122" cy="62" rx="20" ry="11" fill="#FF9FC0"/>
        <ellipse cx="84" cy="46" rx="11" ry="20" fill="#FFB3D1" transform="rotate(45 84 46)"/>
        <ellipse cx="116" cy="46" rx="11" ry="20" fill="#FFB3D1" transform="rotate(-45 116 46)"/>
        <ellipse cx="84" cy="78" rx="11" ry="20" fill="#FFB3D1" transform="rotate(-45 84 78)"/>
        <ellipse cx="116" cy="78" rx="11" ry="20" fill="#FFB3D1" transform="rotate(45 116 78)"/>
        <circle cx="100" cy="62" r="18" fill="#FFD700"/>
        <circle cx="100" cy="62" r="12" fill="#FFC107"/>
        <circle cx="100" cy="62" r="7" fill="#FF9800"/>
        <circle cx="95" cy="57" r="2.5" fill="rgba(255,255,255,0.65)"/>
        <circle cx="105" cy="57" r="2.5" fill="rgba(255,255,255,0.65)"/>
      </g>
      <g id="pl-sparkles" opacity="0" style="transition:opacity 0.8s ease">
        <text x="16" y="55" font-size="20" font-family="serif">✨</text>
        <text x="158" y="48" font-size="18" font-family="serif">⭐</text>
        <text x="10" y="92" font-size="15" font-family="serif">✨</text>
        <text x="162" y="80" font-size="20" font-family="serif">✨</text>
      </g>`,
  },

  sunflower: {
    name: 'Sunflower', emoji: '🌻', unlockLevel: 'Learner', unlockXP: 100,
    clip: { x: 94, w: 12 }, maxH: 110, fullY: 172,
    svgContent: POT + `
      <defs><clipPath id="stem-clip"><rect id="stem-clip-rect" x="94" y="172" width="12" height="0"/></clipPath></defs>
      <rect x="96" y="62" width="8" height="110" rx="4" fill="#6AAB3E" clip-path="url(#stem-clip)"/>
      <ellipse id="pl-seed" cx="100" cy="165" rx="7" ry="5" fill="#9B7653"/>
      <ellipse id="pl-seed2" cx="100" cy="163" rx="4.5" ry="3" fill="#B38B6D"/>
      <g id="pl-leaf1" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,150 C82,143 62,146 54,128 C70,124 92,134 100,150Z" fill="#6AAB3E"/>
        <path d="M100,150 L58,130" stroke="#5DBE52" stroke-width="1.5" fill="none"/>
      </g>
      <g id="pl-leaf2" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,118 C118,111 138,114 146,96 C130,92 110,104 100,118Z" fill="#7BC44C"/>
        <path d="M100,118 L142,98" stroke="#5DBE52" stroke-width="1.5" fill="none"/>
      </g>
      <g id="pl-leaf3" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,88 C82,81 62,84 54,66 C70,62 92,74 100,88Z" fill="#6AAB3E"/>
        <path d="M100,88 L57,69" stroke="#5DBE52" stroke-width="1.5" fill="none"/>
      </g>
      <g id="pl-bud" opacity="0" style="transition:opacity 0.7s ease">
        <circle cx="100" cy="58" r="16" fill="#5DBE52"/>
        <circle cx="100" cy="58" r="10" fill="#7BC44C"/>
        <circle cx="100" cy="58" r="5" fill="#4CAF50"/>
      </g>
      <g id="pl-bloom" opacity="0" style="transition:opacity 1s ease">
        <ellipse cx="100" cy="28" rx="9" ry="20" fill="#FFD700"/>
        <ellipse cx="100" cy="88" rx="9" ry="20" fill="#FFD700"/>
        <ellipse cx="70" cy="58" rx="20" ry="9" fill="#FFC200"/>
        <ellipse cx="130" cy="58" rx="20" ry="9" fill="#FFC200"/>
        <ellipse cx="79" cy="37" rx="9" ry="20" fill="#FFCA00" transform="rotate(45 79 37)"/>
        <ellipse cx="121" cy="37" rx="9" ry="20" fill="#FFCA00" transform="rotate(-45 121 37)"/>
        <ellipse cx="79" cy="79" rx="9" ry="20" fill="#FFCA00" transform="rotate(-45 79 79)"/>
        <ellipse cx="121" cy="79" rx="9" ry="20" fill="#FFCA00" transform="rotate(45 121 79)"/>
        <circle cx="100" cy="58" r="22" fill="#4E2504"/>
        <circle cx="100" cy="58" r="15" fill="#3D1C02"/>
        <circle cx="93" cy="52" r="2" fill="#6B3D1E"/><circle cx="100" cy="50" r="2" fill="#6B3D1E"/>
        <circle cx="107" cy="52" r="2" fill="#6B3D1E"/><circle cx="90" cy="58" r="2" fill="#6B3D1E"/>
        <circle cx="97" cy="57" r="2" fill="#6B3D1E"/><circle cx="103" cy="57" r="2" fill="#6B3D1E"/>
        <circle cx="110" cy="58" r="2" fill="#6B3D1E"/><circle cx="93" cy="64" r="2" fill="#6B3D1E"/>
        <circle cx="100" cy="66" r="2" fill="#6B3D1E"/><circle cx="107" cy="64" r="2" fill="#6B3D1E"/>
      </g>
      <g id="pl-sparkles" opacity="0" style="transition:opacity 0.8s ease">
        <text x="12" y="50" font-size="20" font-family="serif">☀️</text>
        <text x="156" y="44" font-size="18" font-family="serif">✨</text>
        <text x="8" y="88" font-size="16" font-family="serif">🌟</text>
        <text x="158" y="78" font-size="20" font-family="serif">☀️</text>
      </g>`,
  },

  cactus: {
    name: 'Desert Cactus', emoji: '🌵', unlockLevel: 'Scholar', unlockXP: 250,
    clip: { x: 83, w: 34 }, maxH: 122, fullY: 172,
    svgContent: POT + `
      <defs><clipPath id="stem-clip"><rect id="stem-clip-rect" x="83" y="172" width="34" height="0"/></clipPath></defs>
      <rect x="83" y="50" width="34" height="122" rx="17" fill="#4CAF50" clip-path="url(#stem-clip)"/>
      <g clip-path="url(#stem-clip)">
        <line x1="91" y1="50" x2="91" y2="172" stroke="#388E3C" stroke-width="1.5" opacity="0.5"/>
        <line x1="109" y1="50" x2="109" y2="172" stroke="#388E3C" stroke-width="1.5" opacity="0.5"/>
        <line x1="83" y1="138" x2="75" y2="133" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="83" y1="138" x2="75" y2="143" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="117" y1="122" x2="125" y2="117" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="117" y1="122" x2="125" y2="127" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="83" y1="105" x2="75" y2="100" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="83" y1="105" x2="75" y2="110" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="117" y1="90" x2="125" y2="85" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="117" y1="90" x2="125" y2="95" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="83" y1="74" x2="75" y2="69" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="117" y1="68" x2="125" y2="63" stroke="#1B5E20" stroke-width="1.5"/>
      </g>
      <ellipse id="pl-seed" cx="100" cy="165" rx="8" ry="5" fill="#8B6914"/>
      <ellipse id="pl-seed2" cx="100" cy="163" rx="5" ry="3" fill="#A67C1A"/>
      <g id="pl-leaf1" opacity="0" style="transition:opacity 0.9s ease">
        <rect x="50" y="112" width="35" height="22" rx="11" fill="#4CAF50"/>
        <line x1="54" y1="123" x2="83" y2="123" stroke="#388E3C" stroke-width="1.5" opacity="0.5"/>
        <line x1="50" y1="114" x2="43" y2="110" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="50" y1="132" x2="43" y2="136" stroke="#1B5E20" stroke-width="1.5"/>
      </g>
      <g id="pl-leaf2" opacity="0" style="transition:opacity 0.9s ease">
        <rect x="115" y="94" width="35" height="22" rx="11" fill="#66BB6A"/>
        <line x1="117" y1="105" x2="148" y2="105" stroke="#388E3C" stroke-width="1.5" opacity="0.5"/>
        <line x1="150" y1="96" x2="157" y2="92" stroke="#1B5E20" stroke-width="1.5"/>
        <line x1="150" y1="114" x2="157" y2="118" stroke="#1B5E20" stroke-width="1.5"/>
      </g>
      <g id="pl-leaf3" opacity="0" style="transition:opacity 0.9s ease">
        <line x1="83" y1="65" x2="73" y2="60" stroke="#1B5E20" stroke-width="2.5"/>
        <line x1="83" y1="65" x2="73" y2="70" stroke="#1B5E20" stroke-width="2.5"/>
        <line x1="117" y1="60" x2="127" y2="55" stroke="#1B5E20" stroke-width="2.5"/>
        <line x1="117" y1="60" x2="127" y2="65" stroke="#1B5E20" stroke-width="2.5"/>
      </g>
      <g id="pl-bud" opacity="0" style="transition:opacity 0.7s ease">
        <ellipse cx="100" cy="54" rx="12" ry="9" fill="#E91E63"/>
        <ellipse cx="100" cy="54" rx="8" ry="6" fill="#FF4081"/>
      </g>
      <g id="pl-bloom" opacity="0" style="transition:opacity 1s ease">
        <ellipse cx="100" cy="26" rx="8" ry="18" fill="#E91E63"/>
        <ellipse cx="100" cy="72" rx="8" ry="18" fill="#E91E63"/>
        <ellipse cx="76" cy="49" rx="18" ry="8" fill="#F06292"/>
        <ellipse cx="124" cy="49" rx="18" ry="8" fill="#F06292"/>
        <ellipse cx="83" cy="32" rx="8" ry="18" fill="#EC407A" transform="rotate(45 83 32)"/>
        <ellipse cx="117" cy="32" rx="8" ry="18" fill="#EC407A" transform="rotate(-45 117 32)"/>
        <ellipse cx="83" cy="66" rx="8" ry="18" fill="#EC407A" transform="rotate(-45 83 66)"/>
        <ellipse cx="117" cy="66" rx="8" ry="18" fill="#EC407A" transform="rotate(45 117 66)"/>
        <circle cx="100" cy="49" r="16" fill="#FFD700"/>
        <circle cx="100" cy="49" r="10" fill="#FFC107"/>
        <circle cx="97" cy="46" r="2.5" fill="rgba(255,255,255,0.6)"/>
        <circle cx="103" cy="46" r="2.5" fill="rgba(255,255,255,0.6)"/>
      </g>
      <g id="pl-sparkles" opacity="0" style="transition:opacity 0.8s ease">
        <text x="12" y="52" font-size="18" font-family="serif">🌵</text>
        <text x="156" y="46" font-size="16" font-family="serif">✨</text>
        <text x="8" y="90" font-size="15" font-family="serif">💧</text>
        <text x="158" y="80" font-size="18" font-family="serif">🌺</text>
      </g>`,
  },

  mushroom: {
    name: 'Mushroom', emoji: '🍄', unlockLevel: 'Rookie', unlockXP: 0,
    clip: { x: 94, w: 12 }, maxH: 52, fullY: 170,
    svgContent: POT + `
      <defs><clipPath id="stem-clip"><rect id="stem-clip-rect" x="94" y="170" width="12" height="0"/></clipPath></defs>
      <rect x="94" y="118" width="12" height="52" rx="6" fill="#F0EAD6" clip-path="url(#stem-clip)"/>
      <ellipse id="pl-seed" cx="100" cy="163" rx="7" ry="4.5" fill="#9B7653"/>
      <ellipse id="pl-seed2" cx="100" cy="161" rx="4.5" ry="2.5" fill="#B38B6D"/>
      <g id="pl-leaf1" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,136 C80,136 66,124 64,112 C78,112 96,122 100,136Z" fill="#C62828"/>
      </g>
      <g id="pl-leaf2" opacity="0" style="transition:opacity 0.9s ease">
        <path d="M100,136 C120,136 134,124 136,112 C122,112 104,122 100,136Z" fill="#D32F2F"/>
      </g>
      <g id="pl-leaf3" opacity="0" style="transition:opacity 0.8s ease">
        <path d="M66,134 Q100,142 134,134" stroke="#5D1A1A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M70,130 Q100,137 130,130" stroke="#7B2020" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.6"/>
      </g>
      <g id="pl-bud" opacity="0" style="transition:opacity 0.7s ease">
        <ellipse cx="100" cy="114" rx="34" ry="24" fill="#C62828"/>
        <ellipse cx="100" cy="134" rx="34" ry="7" fill="#8B2020"/>
      </g>
      <g id="pl-bloom" opacity="0" style="transition:opacity 1s ease">
        <ellipse cx="100" cy="112" rx="38" ry="27" fill="#C62828"/>
        <ellipse cx="100" cy="132" rx="38" ry="8" fill="#7B1A1A"/>
        <path d="M62,132 Q100,140 138,132" stroke="#5D1A1A" stroke-width="2" fill="none"/>
        <circle cx="88" cy="108" r="6.5" fill="rgba(255,255,255,0.75)"/>
        <circle cx="106" cy="98" r="8.5" fill="rgba(255,255,255,0.75)"/>
        <circle cx="119" cy="111" r="5.5" fill="rgba(255,255,255,0.75)"/>
        <circle cx="80" cy="118" r="4" fill="rgba(255,255,255,0.6)"/>
        <circle cx="113" cy="122" r="3.5" fill="rgba(255,255,255,0.6)"/>
        <circle cx="96" cy="121" r="3" fill="rgba(255,255,255,0.5)"/>
      </g>
      <g id="pl-sparkles" opacity="0" style="transition:opacity 0.8s ease">
        <text x="14" y="90" font-size="18" font-family="serif">✨</text>
        <text x="156" y="82" font-size="16" font-family="serif">⭐</text>
        <text x="10" y="120" font-size="15" font-family="serif">🍄</text>
        <text x="158" y="112" font-size="18" font-family="serif">✨</text>
      </g>`,
  },

  crystal: {
    name: 'Crystal Shard', emoji: '💎', unlockLevel: 'Legend', unlockXP: 900,
    clip: { x: 92, w: 16 }, maxH: 115, fullY: 172,
    svgContent: POT + `
      <defs><clipPath id="stem-clip"><rect id="stem-clip-rect" x="92" y="172" width="16" height="0"/></clipPath></defs>
      <polygon points="100,45 92,172 108,172" fill="#7C3AED" clip-path="url(#stem-clip)"/>
      <polygon points="100,45 93,172 97,172" fill="rgba(255,255,255,0.32)" clip-path="url(#stem-clip)"/>
      <ellipse id="pl-seed" cx="100" cy="167" rx="7" ry="4" fill="#6D28D9"/>
      <ellipse id="pl-seed2" cx="100" cy="165" rx="4" ry="2.5" fill="#8B5CF6"/>
      <g id="pl-leaf1" opacity="0" style="transition:opacity 0.9s ease">
        <polygon points="76,108 68,168 84,168" fill="#8B5CF6"/>
        <polygon points="76,108 69,168 74,168" fill="rgba(255,255,255,0.28)"/>
      </g>
      <g id="pl-leaf2" opacity="0" style="transition:opacity 0.9s ease">
        <polygon points="124,92 116,168 132,168" fill="#6D28D9"/>
        <polygon points="124,92 117,168 122,168" fill="rgba(255,255,255,0.25)"/>
      </g>
      <g id="pl-leaf3" opacity="0" style="transition:opacity 0.9s ease">
        <polygon points="55,130 49,168 61,168" fill="#A78BFA"/>
        <polygon points="55,130 50,168 54,168" fill="rgba(255,255,255,0.22)"/>
        <polygon points="145,118 139,168 151,168" fill="#7C3AED"/>
        <polygon points="145,118 140,168 144,168" fill="rgba(255,255,255,0.2)"/>
      </g>
      <g id="pl-bud" opacity="0" style="transition:opacity 0.7s ease">
        <circle cx="100" cy="50" r="18" fill="#C026D3" opacity="0.18"/>
        <circle cx="100" cy="50" r="10" fill="#E879F9" opacity="0.45"/>
        <circle cx="100" cy="50" r="5" fill="#F0ABFC" opacity="0.9"/>
        <circle cx="100" cy="50" r="2" fill="white"/>
      </g>
      <g id="pl-bloom" opacity="0" style="transition:opacity 1s ease">
        <circle cx="100" cy="55" r="48" fill="#7C3AED" opacity="0.07"/>
        <circle cx="100" cy="55" r="28" fill="#A78BFA" opacity="0.12"/>
        <polygon points="100,18 88,52 112,52" fill="#E040FB"/>
        <polygon points="100,18 92,30 100,28" fill="rgba(255,255,255,0.45)"/>
        <polygon points="64,40 74,58 82,46" fill="#AB47BC"/>
        <polygon points="136,40 126,58 118,46" fill="#9C27B0"/>
        <polygon points="50,68 65,74 60,58" fill="#8E24AA"/>
        <polygon points="150,60 135,66 140,52" fill="#7B1FA2"/>
        <polygon points="100,30 88,55 100,48" fill="#CE93D8"/>
        <polygon points="100,30 112,55 100,48" fill="#9C27B0"/>
        <polygon points="100,30 94,38 106,38" fill="rgba(255,255,255,0.5)"/>
        <circle cx="100" cy="48" r="5" fill="white" opacity="0.9"/>
        <circle cx="72" cy="48" r="3" fill="#F48FB1"/>
        <circle cx="128" cy="42" r="3" fill="#CE93D8"/>
        <circle cx="66" cy="66" r="2.5" fill="#AB47BC"/>
        <circle cx="134" cy="60" r="2.5" fill="#BA68C8"/>
      </g>
      <g id="pl-sparkles" opacity="0" style="transition:opacity 0.8s ease">
        <text x="12" y="50" font-size="18" font-family="serif">💎</text>
        <text x="156" y="44" font-size="16" font-family="serif">✨</text>
        <text x="8" y="88" font-size="15" font-family="serif">⭐</text>
        <text x="156" y="78" font-size="18" font-family="serif">💜</text>
      </g>`,
  },
};

const PRESET_PLANT_MAP = { 5: 'mushroom', 25: 'blossom', 45: 'sunflower', 60: 'crystal' };
const PLANT_PRESET_MAP = { mushroom: 5, blossom: 25, sunflower: 45, crystal: 60 };

const PLANT_MESSAGES = {
  mushroom: [
    "Start your break — I'll pop up fast! 🍄",
    "Pushing through the soil... 🍄",
    "My cap is forming! Enjoy your break! 🍄",
    "Growing quick! Rest up, you've earned it! 🌱",
    "Almost there — looking spotty! 🍄",
    "My dots are coming in nicely... 🍄",
    "One more moment... 🍄",
    "🍄 FULL MUSHROOM! Great break — you're refreshed!",
  ],
  blossom: [
    "Start the timer and I'll start growing! 🌰",
    "Here we go! Waking up from the soil... 🌱",
    "My first sprout! Don't stop now! 🌿",
    "Growing bigger every minute! You're doing great! 💪",
    "Flourishing! Stay focused just a little longer! 🪴",
    "I can feel a flower coming! Stay with me! 🌸",
    "Almost in full bloom... just a little more! 🌺",
    "🌸 FULL BLOOM! Amazing session — you did it!",
  ],
  sunflower: [
    "Start the timer and I'll reach for the sun! 🌻",
    "Shooting up toward the light... ☀️",
    "My first leaf! Keep going! 🌱",
    "Tracking the sunlight — focus is my fuel! ☀️",
    "Growing strong! Stay golden! 🌻",
    "Almost at full height — the sun is right there! ☀️",
    "Petals forming... golden and glorious! 🌻",
    "🌻 FULL BLOOM! Magnificent — you shone bright!",
  ],
  cactus: [
    "Start the timer. I grow slow and strong! 🌵",
    "Even in the desert, I persist... 🌵",
    "Building strength, spine by spine! 💪",
    "I don't need much — just your focus! 🌵",
    "My arms are reaching out! Incredible! 💚",
    "Almost blooming in the heat... stay strong! 🌺",
    "The rarest bloom is almost here... 💧",
    "🌵 CACTUS BLOOM! Rare and beautiful — just like this session!",
  ],
  crystal: [
    "Start the timer and watch me crystallize! 💎",
    "Focus energy forming... ✨",
    "My facets are taking shape! Pure concentration! 💜",
    "The crystal grows with every minute! Keep going! 💎",
    "Glowing brighter — you're incredible! ✨",
    "Almost fully formed... one last push! 💎",
    "The final facets are crystallizing... 💜",
    "💎 PERFECT CRYSTAL! A legendary session — flawless!",
  ],
};

function selectPlant(type, fromPreset) {
  if (timerRunning) return;
  if (totalXP < PLANT_TYPES[type].unlockXP) return;
  selectedPlant = type;
  const svg = document.getElementById('companion-svg');
  if (svg) svg.innerHTML = PLANT_TYPES[type].svgContent;
  // Sync timer preset unless called from setPreset
  if (!fromPreset) {
    const mins = PLANT_PRESET_MAP[type] || 25;
    timerSeconds = mins * 60;
    timerTotal   = mins * 60;
    updateTimerDisplay();
    document.querySelectorAll('.preset-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mins == mins);
    });
  }
  renderPlantSelector();
  updateCompanion(timerRunning ? 1 - timerSeconds/timerTotal : 0);
  save();
}

function renderPlantSelector() {
  const el = document.getElementById('plant-selector');
  if (!el) return;
  const order = ['mushroom', 'blossom', 'sunflower', 'crystal'];
  const durations = { mushroom: '5 min', blossom: '25 min', sunflower: '45 min', crystal: '60 min' };
  el.innerHTML = `
    <p class="plant-selector-label">Choose your session</p>
    <div class="plant-options">
      ${order.map(key => {
        const p = PLANT_TYPES[key];
        const unlocked = totalXP >= p.unlockXP;
        const active   = selectedPlant === key;
        return `<button class="plant-option ${active ? 'active' : ''} ${unlocked ? '' : 'locked'}"
          onclick="${unlocked ? `selectPlant('${key}')` : 'void 0'}"
          title="${unlocked ? p.name + ' — ' + durations[key] : 'Unlock at ' + p.unlockLevel}">
          <span class="plant-opt-emoji">${p.emoji}</span>
          <span class="plant-opt-name">${durations[key]}</span>
          ${unlocked
            ? `<span style="font-size:9px;color:var(--text-hint);font-weight:500">${p.name.split(' ')[0]}</span>`
            : `<div class="plant-lock-badge"><i class="ti ti-lock"></i>${p.unlockLevel}</div>`}
          ${active ? '<div class="plant-active-ring"></div>' : ''}
        </button>`;
      }).join('')}
    </div>`;
}

// ── Persistence ──────────────────────────────────────
function save() {
  try {
    localStorage.setItem('sq_todos',  JSON.stringify(todos));
    localStorage.setItem('sq_grades', JSON.stringify(grades));
    localStorage.setItem('sq_events', JSON.stringify(events));
    localStorage.setItem('sq_state',  JSON.stringify({ totalXP, streak, tasksDone, totalMins, sessions, selectedPlant, earnedBadges, dailyXP, dailyXPDate }));
    localStorage.setItem('sq_week', JSON.stringify(weekLog));
    localStorage.setItem('sq_challenges', JSON.stringify({ date: dailyChallengeDate, challenges: dailyChallenges, counters: dayCounters, allDone: allChallengesDone }));
    saveFlash();
  } catch(e) {}
}

function saveFlash() {
  const el = document.getElementById('save-toast');
  if (!el) return;
  el.textContent = '✓  Saved';
  el.classList.add('show');
  clearTimeout(saveFlash._t);
  saveFlash._t = setTimeout(() => el.classList.remove('show'), 1600);
}

// ── Daily login streak ────────────────────────────────
function checkLoginStreak() {
  const raw = localStorage.getItem('fs_login');
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
  let increased = false;

  if (raw) {
    const d = JSON.parse(raw);
    if (d.lastDate === today) {
      // Already logged in today — just restore
      loginStreak = d.streak;
    } else if (d.lastDate === yesterday) {
      // Consecutive day → increment
      loginStreak = d.streak + 1;
      increased = true;
    } else {
      // Missed a day → reset
      loginStreak = 1;
    }
  } else {
    loginStreak = 1;
    increased = true;
  }

  localStorage.setItem('fs_login', JSON.stringify({ streak: loginStreak, lastDate: today }));
  updateLoginStreakBadge();

  if (loginStreak >= 5) setTimeout(() => awardBadge('on_fire'), 2000);

  if (increased) {
    setTimeout(() => showStreakToast(), 1400); // show after splash clears
  }
}

function updateLoginStreakBadge() {
  const el = document.getElementById('login-streak-badge');
  if (el) el.textContent = '🔥 ' + loginStreak;
}

function showStreakToast() {
  const msgs = [
    '', // 0 (unused)
    '🔥 Day 1 — Welcome back!',
    '🔥🔥 2-day streak!',
    '🔥🔥🔥 3 days strong!',
  ];
  const msg = loginStreak <= 3
    ? msgs[loginStreak]
    : `🔥 ${loginStreak}-day streak! You're on fire!`;

  const el = document.getElementById('streak-toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');

  // Bump badge animation
  const badge = document.getElementById('login-streak-badge');
  if (badge) {
    badge.classList.remove('bump');
    void badge.offsetWidth;
    badge.classList.add('bump');
  }

  // Auto-hide after 3s
  setTimeout(() => el.classList.remove('show'), 3200);

  // Mini confetti celebration
  if (loginStreak >= 3) launchConfetti();
}

function load() {
  try {
    const t = localStorage.getItem('sq_todos');
    if (t) todos = JSON.parse(t);
    const g = localStorage.getItem('sq_grades');
    if (g) grades = JSON.parse(g);
    const s = localStorage.getItem('sq_state');
    if (s) {
      const d = JSON.parse(s);
      totalXP       = d.totalXP       || 0;
      streak        = d.streak        || 0;
      tasksDone     = d.tasksDone     || 0;
      totalMins     = d.totalMins     || 0;
      sessions      = d.sessions      || [];
      selectedPlant = d.selectedPlant || 'blossom';
      earnedBadges  = d.earnedBadges  || {};
      dailyXPDate   = d.dailyXPDate   || today;
      dailyXP       = (d.dailyXPDate === today) ? (d.dailyXP || 0) : 0;
    }
    const ev = localStorage.getItem('sq_events');
    if (ev) events = JSON.parse(ev);
    const wk = localStorage.getItem('sq_week');
    if (wk) weekLog = JSON.parse(wk);
    const ch = localStorage.getItem('sq_challenges');
    if (ch) {
      const d = JSON.parse(ch);
      if (d.date === today) {
        dailyChallengeDate = d.date;
        dailyChallenges    = d.challenges || [];
        dayCounters        = d.counters   || dayCounters;
        allChallengesDone  = d.allDone    || false;
      }
    }
    todos.forEach(t => { if (!t.done && t.reminder) scheduleNotification(t); });
  } catch(e) {}
}

// ── Sound ─────────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function tone(freq, dur, vol = 0.07, type = 'sine') {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function playComplete()   { tone(523,0.12); setTimeout(()=>tone(659,0.12),90); setTimeout(()=>tone(784,0.2),180); }
function playLevelUpSound() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.22,0.09),i*110)); }
function playComboSound(n) { const b=440+(n-2)*50; tone(b,0.1,0.07,'triangle'); setTimeout(()=>tone(b*1.5,0.15,0.07,'triangle'),90); }
function playAdd()        { tone(440,0.08,0.04); }
function playTimerDone()  { [523,523,784].forEach((f,i)=>setTimeout(()=>tone(f,0.3,0.09),i*200)); }

// ── Confetti ──────────────────────────────────────────
function launchConfetti(fromEl) {
  const colors = ['#38BDF8','#06B6D4','#0EA5E9','#F59E0B','#34D399','#F472B6','#38BDF8','#22D3EE'];
  const container = document.getElementById('confetti-container');
  let cx = 50, cy = 35;
  if (fromEl) {
    const r = fromEl.getBoundingClientRect();
    cx = ((r.left + r.width/2) / window.innerWidth)  * 100;
    cy = ((r.top  + r.height/2) / window.innerHeight) * 100;
  }
  for (let i = 0; i < 50; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const color  = colors[Math.floor(Math.random()*colors.length)];
    const size   = 5 + Math.random()*9;
    const dx     = (Math.random()-0.5)*360;
    const dy     = -(60+Math.random()*220);
    const rot    = Math.random()*900-450;
    const dur    = 0.75+Math.random()*0.7;
    const delay  = Math.random()*0.2;
    const circle = Math.random()>0.45;
    el.style.cssText = `left:${cx}%;top:${cy}%;width:${size}px;height:${circle?size:size*0.45}px;background:${color};border-radius:${circle?'50%':'2px'};--dx:${dx}px;--dy:${dy}px;--rot:${rot}deg;animation-duration:${dur}s;animation-delay:${delay}s;`;
    container.appendChild(el);
    setTimeout(() => el.remove(), (dur+delay+0.3)*1000);
  }
}

// ── Combo ─────────────────────────────────────────────
let lastCompleteTime = 0, comboCount = 0, comboHideTimer = null;

function triggerCombo(el) {
  const now = Date.now();
  if (now - lastCompleteTime < 10000 && comboCount > 0) comboCount++;
  else comboCount = 1;
  lastCompleteTime = now;

  if (comboCount >= 2) {
    if (comboCount === 2) updateChallengeProgress('combo');
    const msgs = ['','','2× COMBO! 🔥','3× ON FIRE! 🔥🔥','4× UNSTOPPABLE! ⚡','5× LEGENDARY! 👑'];
    const msg  = msgs[Math.min(comboCount, msgs.length-1)] || `${comboCount}× COMBO! 👑`;
    const d = document.getElementById('combo-display');
    d.textContent = msg;
    d.classList.remove('show');
    void d.offsetWidth;
    d.classList.add('show');
    clearTimeout(comboHideTimer);
    comboHideTimer = setTimeout(() => d.classList.remove('show'), 2200);
    playComboSound(comboCount);
  }
}

function getComboMult() {
  // Returns 2 if the previous task was completed within 10 seconds, else 1
  return (Date.now() - lastCompleteTime < 10000 && comboCount > 0) ? 2 : 1;
}

// ── Level-up ──────────────────────────────────────────
let lastLevelName = null;

function getCurrentLevel() {
  return [...LEVELS].reverse().find(l => totalXP >= l.min) || LEVELS[0];
}

function checkLevelUp() {
  const level = getCurrentLevel();
  if (lastLevelName && level.name !== lastLevelName) showLevelUpModal(level);
  lastLevelName = level.name;
}

function showLevelUpModal(level) {
  const subs = { Learner:'You\'re building real momentum!', Scholar:'Knowledge is your superpower!', Expert:'You\'re in elite territory!', Legend:'Maximum level! You\'re unstoppable. 🏆' };
  document.getElementById('modal-level-name').textContent = level.name;
  document.getElementById('modal-level-sub').textContent  = subs[level.name] || 'Keep crushing it!';

  const unlocked = ['sunflower','crystal'].map(k=>PLANT_TYPES[k]).find(p => p.unlockLevel === level.name);
  const unlockEl = document.getElementById('modal-unlock');
  if (unlocked && unlockEl) {
    document.getElementById('modal-unlock-emoji').textContent = unlocked.emoji;
    document.getElementById('modal-unlock-text').textContent  = unlocked.name + ' unlocked! Select it on the Timer tab.';
    unlockEl.style.display = 'block';
  } else if (unlockEl) {
    unlockEl.style.display = 'none';
  }

  document.getElementById('levelup-modal').style.display = 'flex';
  launchConfetti();
  playLevelUpSound();
  // Screen shake + star burst
  document.body.classList.remove('shaking');
  requestAnimationFrame(() => document.body.classList.add('shaking'));
  setTimeout(() => document.body.classList.remove('shaking'), 650);
  spawnModalStars();
  renderPlantSelector();
}

function closeLevelUp() { document.getElementById('levelup-modal').style.display = 'none'; }

// ── XP header & home ─────────────────────────────────
function updateXPHeader() {
  const level = getCurrentLevel();
  const idx   = LEVELS.indexOf(level);
  const next  = LEVELS[idx+1];
  document.getElementById('xp-level-badge').textContent = level.name;
  if (next) {
    const pct = Math.round((totalXP-level.min)/(next.min-level.min)*100);
    document.getElementById('xp-mini-fill').style.width = Math.min(pct,100)+'%';
    document.getElementById('xp-mini-text').textContent = totalXP+' XP';
  } else {
    document.getElementById('xp-mini-fill').style.width = '100%';
    document.getElementById('xp-mini-text').textContent = 'MAX ⭐';
  }
}

function renderHome() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning ☀️' : h < 17 ? 'Good afternoon 🌤️' : h < 21 ? 'Good evening 🌙' : 'Good night ⭐';
  document.getElementById('home-greeting').textContent = greeting;

  const active = todos.filter(t=>!t.done).length;
  const doneToday = todos.filter(t=>t.done).length;
  document.getElementById('home-sub').textContent = active > 0 ? `You have ${active} task${active>1?'s':''} left today.` : tasksDone > 0 ? 'All clear! Amazing work today. 🎉' : 'Ready to crush it today?';

  // Level bar
  const level = getCurrentLevel();
  const idx   = LEVELS.indexOf(level);
  const next  = LEVELS[idx+1];
  document.getElementById('home-level-name').textContent = level.name;
  if (next) {
    const pct = Math.round((totalXP-level.min)/(next.min-level.min)*100);
    document.getElementById('home-xp-fill').style.width = Math.min(pct,100)+'%';
    document.getElementById('home-xp-text').textContent = totalXP+' / '+next.min+' XP';
  } else {
    document.getElementById('home-xp-fill').style.width = '100%';
    document.getElementById('home-xp-text').textContent = 'MAX LEVEL ⭐';
  }

  // Pills
  document.getElementById('home-done-text').textContent   = doneToday+' done';
  document.getElementById('home-mins-text').textContent   = totalMins+' min';
  document.getElementById('home-streak-text').textContent = streak+' streak';
  document.getElementById('home-xp-pill').textContent     = totalXP+' XP';

  // Quick grid sub-labels
  document.getElementById('qa-tasks-sub').textContent = active>0 ? active+' task'+(active>1?'s':'')+' left' : 'All done! 🎉';
  const gpa = calcGPA();
  document.getElementById('qa-gpa-sub').textContent = grades.length > 0 ? 'GPA: '+(gpa||'—') : 'Track classes';

  // Today's tasks preview (top 4 active)
  const preview = document.getElementById('home-tasks-preview');
  const topTasks = todos.filter(t=>!t.done).slice(0,4);
  if (!topTasks.length) {
    preview.innerHTML = `<div style="text-align:center;color:var(--text-hint);font-size:13px;padding:1rem 0">
      ${todos.length ? '🎉 All tasks complete!' : 'Add tasks on the Tasks tab to see them here.'}
    </div>`;
  } else {
    preview.innerHTML = topTasks.map(t => `
      <div class="home-task-row" onclick="navTo('todo')">
        <span class="priority-dot" style="background:${PRIORITY_COLORS[t.pri]}"></span>
        <span class="task-name">${t.text}</span>
        <span class="task-pri-badge">${t.pri}</span>
      </div>`).join('');
    if (todos.filter(t=>!t.done).length > 4) {
      preview.innerHTML += `<div style="text-align:center;font-size:12px;color:var(--text-hint);padding:8px 0">${todos.filter(t=>!t.done).length-4} more tasks →</div>`;
    }
  }

  // Quote (changes daily)
  const q = QUOTES[Math.floor(Date.now()/86400000) % QUOTES.length];
  document.getElementById('quote-text').textContent   = q.text;
  document.getElementById('quote-author').textContent = '— '+q.author;

  renderDailyChallenges();
}

// ── Navigation ───────────────────────────────────────
function showPage(p, btn) {
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  if (btn) { btn.classList.add('active'); }
  else {
    const btns = document.querySelectorAll('.nav-btn');
    const pages = ['home','todo','timer','grades','calendar','stats'];
    const i = pages.indexOf(p);
    if (i >= 0) btns[i].classList.add('active');
  }
  if (p==='home')     renderHome();
  if (p==='todo')     checkNotifBanner();
  if (p==='stats')    renderStats();
  if (p==='grades')   renderGrades();
  if (p==='calendar') renderCalendar();
}

function navTo(p) { showPage(p, null); }

// ── Notifications ────────────────────────────────────
function checkNotifBanner() {
  const b = document.getElementById('notif-banner');
  const perm = Notification.permission;
  if (perm==='granted') { b.innerHTML=''; }
  else if (perm==='denied') { b.innerHTML=`<div class="banner-inner warn"><i class="ti ti-bell-off"></i> Notifications blocked — enable in browser settings.</div>`; }
  else { b.innerHTML=`<div class="banner-inner warn"><i class="ti ti-bell"></i> Enable notifications for reminders. <button onclick="requestNotif()">Enable</button></div>`; }
}

async function requestNotif() { await Notification.requestPermission(); checkNotifBanner(); }

function scheduleNotification(task) {
  if (!task.reminder) return;
  const delay = new Date(task.reminder).getTime()-Date.now();
  if (delay<=0) return;
  setTimeout(()=>{ if(Notification.permission==='granted'&&!task.done) new Notification('Flowstate reminder 📚',{body:task.text+' is due soon!'}); }, delay);
}

// ── To-do ─────────────────────────────────────────────
function addTodo() {
  const inp  = document.getElementById('todo-input');
  const text = inp.value.trim();
  if (!text) { inp.focus(); return; }
  const pri      = document.getElementById('todo-priority').value;
  const reminder = document.getElementById('todo-reminder').value;
  const task = { id: Date.now(), text, pri, done: false, reminder, showReminder: false };
  todos.unshift(task);
  inp.value = '';
  document.getElementById('todo-reminder').value = '';
  scheduleNotification(task);
  playAdd();
  renderTodos();
  save();
  inp.focus();
}

function toggleTodo(id) {
  const t = todos.find(x=>x.id===id);
  if (!t||t.done) return;
  t.done = true;

  // Combo multiplier — check BEFORE triggerCombo updates lastCompleteTime
  const mult = getComboMult();
  const baseXP = t.pri==='high'?30:t.pri==='med'?20:10;
  const xp = baseXP * mult;

  totalXP += xp; streak++; tasksDone++;
  if (dailyXPDate !== today) { dailyXP = 0; dailyXPDate = today; }
  dailyXP += xp;
  logDayStats({ tasks: 1, xp });
  updateChallengeProgress('tasks');
  updateChallengeProgress('xp', xp);
  if (t.pri === 'high') updateChallengeProgress('high_task');
  showXPToast((mult > 1 ? '2× ' : '') + '+'+xp+' XP');
  flashItem(id);
  const el = document.querySelector('[data-id="'+id+'"]');
  launchConfetti(el);
  playComplete();
  triggerCombo(el);

  // 20% chance of bonus XP drop
  if (Math.random() < 0.2) {
    totalXP += 50;
    dailyXP += 50;
    logDayStats({ xp: 50 });
    updateChallengeProgress('xp', 50);
    setTimeout(() => {
      showBonusToast();
      launchConfetti(el);
      setTimeout(() => launchConfetti(), 300);
    }, 350);
  }

  checkLevelUp();
  checkBadges();
  updateXPHeader();
  renderTodos();
  renderStats();
  save();
}

function deleteTodo(id) { todos=todos.filter(x=>x.id!==id); renderTodos(); save(); }

function toggleReminderPanel(id) {
  if (Notification.permission==='default') { requestNotif(); return; }
  if (Notification.permission==='denied')  { checkNotifBanner(); return; }
  const t=todos.find(x=>x.id===id); if(!t) return;
  t.showReminder=!t.showReminder; renderTodos();
}

function saveReminder(id) {
  const t=todos.find(x=>x.id===id); if(!t) return;
  const val=document.getElementById('reminder-input-'+id).value; if(!val) return;
  t.reminder=val; t.showReminder=false; scheduleNotification(t); renderTodos(); save();
}

function clearReminder(id) {
  const t=todos.find(x=>x.id===id); if(!t) return;
  t.reminder=''; t.showReminder=false; renderTodos(); save();
}

function formatReminder(dt) { return new Date(dt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }

function showBonusToast() {
  const t = document.getElementById('bonus-toast');
  t.textContent = '🎰 BONUS +50 XP!';
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Weekly log helpers ────────────────────────────────
function logDayStats({ tasks = 0, mins = 0, xp = 0, badge = null } = {}) {
  if (!weekLog[today]) weekLog[today] = { tasks: 0, mins: 0, xp: 0, badges: [] };
  const d = weekLog[today];
  d.tasks += tasks;
  d.mins  += mins;
  d.xp    += xp;
  if (badge) d.badges.push(badge);
}

// ── Badges ────────────────────────────────────────────
function awardBadge(id) {
  if (earnedBadges[id]) return;
  earnedBadges[id] = true;
  logDayStats({ badge: id });
  save();
  const badge = BADGES.find(b => b.id === id);
  if (badge) showBadgePopup(badge);
  renderStats();
}

function showBadgePopup(badge) {
  const el = document.getElementById('badge-popup');
  if (!el) return;
  el.querySelector('.badge-popup-emoji').textContent = badge.emoji;
  el.querySelector('.badge-popup-name').textContent  = badge.name;
  el.querySelector('.badge-popup-desc').textContent  = badge.desc;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  launchConfetti();
  tone(660, 0.12); setTimeout(() => tone(880, 0.15), 130);
  clearTimeout(showBadgePopup._t);
  showBadgePopup._t = setTimeout(() => el.classList.remove('show'), 3500);
}

function checkBadges() {
  // First Step
  if (tasksDone >= 1) awardBadge('first_step');
  // Night Owl — checked at task completion time
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 4) awardBadge('night_owl');
  // Big Brain
  if (totalXP >= 250) awardBadge('big_brain');
  // Legend
  if (totalXP >= 900) awardBadge('legend');
  // Centurion — daily XP
  if (dailyXPDate !== today) { dailyXP = 0; dailyXPDate = today; }
  if (dailyXP >= 100) awardBadge('centurion');
  // On Fire — login streak
  if (loginStreak >= 5) awardBadge('on_fire');
  // Speed Run — 3 completions within 120s
  const now = Date.now();
  recentCompleteTimes = recentCompleteTimes.filter(t => now - t < 120000);
  recentCompleteTimes.push(now);
  if (recentCompleteTimes.length >= 3) awardBadge('speed_run');
}

function checkGrindBadge(mins) {
  if (mins >= 60) awardBadge('grind_mode');
}

function renderBadges() {
  const el = document.getElementById('badges-grid');
  if (!el) return;
  el.innerHTML = BADGES.map(b => {
    const earned = earnedBadges[b.id];
    return `<div class="badge-card ${earned ? 'earned' : 'locked'}" title="${b.desc}">
      <div class="badge-emoji">${earned ? b.emoji : '🔒'}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`;
  }).join('');
}

function showXPToast(msg) {
  const t=document.getElementById('xp-toast');
  t.textContent=msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),1000);
}

function flashItem(id) {
  const el=document.querySelector('[data-id="'+id+'"]');
  if(el){el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),420);}
}

function renderTodos() {
  const list   = document.getElementById('todo-list');
  const active = todos.filter(t=>!t.done);
  const done   = todos.filter(t=>t.done);
  const all    = [...active,...done];

  if (!all.length) {
    list.innerHTML=`<div class="empty-state"><i class="ti ti-sparkles" style="font-size:32px;display:block;margin-bottom:10px;color:var(--purple)"></i>All clear! Add a task above.</div>`;
  } else {
    list.innerHTML = all.map(t => {
      const badge = t.reminder&&!t.done ? `<span class="reminder-badge"><i class="ti ti-bell" style="font-size:11px"></i>${formatReminder(t.reminder)}</span>` : '';
      const panel = t.showReminder ? `<div class="reminder-row"><i class="ti ti-bell" style="color:var(--purple);font-size:16px"></i><input type="datetime-local" id="reminder-input-${t.id}" value="${t.reminder||''}"/><button class="set-btn" onclick="saveReminder(${t.id})">Set</button>${t.reminder?`<button class="clear-btn" onclick="clearReminder(${t.id})">Clear</button>`:''}</div>` : '';
      return `<div class="todo-item ${t.done?'done':''}" data-id="${t.id}">
        <div class="todo-main">
          <div class="todo-check ${t.done?'done':''}" onclick="toggleTodo(${t.id})" role="checkbox" aria-checked="${t.done}" tabindex="0">${t.done?'<i class="ti ti-check"></i>':''}</div>
          <span class="priority-dot" style="background:${PRIORITY_COLORS[t.pri]}"></span>
          <span class="todo-text ${t.done?'done':''}">${t.text}${badge}</span>
          <div class="todo-actions">
            ${!t.done?`<button class="icon-btn" onclick="toggleReminderPanel(${t.id})"><i class="ti ti-bell"></i></button>`:''}
            <button class="icon-btn del" onclick="deleteTodo(${t.id})"><i class="ti ti-trash"></i></button>
          </div>
        </div>${panel}</div>`;
    }).join('');
  }

  const doneCount = done.length;
  const total     = todos.length;
  const pct       = total ? Math.round(doneCount/total*100) : 0;
  document.getElementById('td-done').textContent      = doneCount;
  document.getElementById('td-left').textContent      = active.length;
  document.getElementById('td-xp').textContent        = totalXP;
  document.getElementById('progress-pct').textContent = pct+'%';
  document.getElementById('streak-fill').style.width  = pct+'%';
}

// ── Plant companion ───────────────────────────────────
const PLANT_STAGES = [
  { pct: 0,  emoji: '🌰', label: 'Seed' },
  { pct: 15, emoji: '🌱', label: 'Sprout' },
  { pct: 35, emoji: '🪴', label: 'Growing' },
  { pct: 60, emoji: '🌿', label: 'Lush' },
  { pct: 80, emoji: '🌸', label: 'Budding' },
  { pct: 95, emoji: '🌺', label: 'Blooming' },
];

function getCompanionMsg(pct, isRunning) {
  const msgs = PLANT_MESSAGES[selectedPlant] || PLANT_MESSAGES.blossom;
  if (pct >= 100) {
    const mins = Math.round(timerTotal / 60);
    if (mins >= 60) return `${PLANT_TYPES[selectedPlant].emoji} LEGENDARY SESSION! You grew an incredible ${PLANT_TYPES[selectedPlant].name}!`;
    if (mins >= 45) return `${PLANT_TYPES[selectedPlant].emoji} EPIC SESSION! Outstanding bloom!`;
    return msgs[7];
  }
  if (!isRunning && pct === 0) return msgs[0];
  if (!isRunning && pct > 0)   return `I'm at ${Math.round(pct)}%... please don't give up on me! 🥺`;
  if (pct < 10)  return msgs[1];
  if (pct < 28)  return msgs[2];
  if (pct < 48)  return msgs[3];
  if (pct < 68)  return msgs[4];
  if (pct < 85)  return msgs[5];
  return msgs[6];
}

function getStageEmoji(pct) {
  if (pct >= 95) return PLANT_TYPES[selectedPlant]?.emoji || '🌺';
  const stages = [
    { pct: 0,  emoji: '🌰' }, { pct: 15, emoji: '🌱' },
    { pct: 35, emoji: '🪴' }, { pct: 60, emoji: '🌿' },
    { pct: 80, emoji: '🌸' },
  ];
  let stage = stages[0];
  for (const s of stages) { if (pct >= s.pct) stage = s; }
  return stage.emoji;
}

function updateCompanion(timerPct) {
  const plant = PLANT_TYPES[selectedPlant] || PLANT_TYPES.blossom;
  const pct = timerPct * 100;

  const stemGrow = Math.min(pct / 75, 1);
  const h = Math.round(plant.maxH * stemGrow);
  const y = plant.fullY - h;
  const cr = document.getElementById('stem-clip-rect');
  if (cr) {
    cr.setAttribute('x', plant.clip.x);
    cr.setAttribute('width', plant.clip.w);
    cr.setAttribute('y', y);
    cr.setAttribute('height', h);
  }

  // Seed fades out
  const seedOp = pct < 5 ? 1 : Math.max(0, 1-(pct-5)/8);
  ['pl-seed','pl-seed2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = seedOp;
  });

  // Leaves
  const setOp = (id, show) => { const el=document.getElementById(id); if(el) el.style.opacity=show?1:0; };
  setOp('pl-leaf1', pct > 18);
  setOp('pl-leaf2', pct > 38);
  setOp('pl-leaf3', pct > 58);
  setOp('pl-bud',   pct > 72 && pct < 93);
  setOp('pl-bloom', pct >= 93);
  setOp('pl-sparkles', pct >= 97);

  // Bar & label
  const barEl = document.getElementById('companion-bar-fill');
  const pctEl = document.getElementById('companion-bar-pct');
  const emoEl = document.getElementById('companion-stage-emoji');
  if (barEl) barEl.style.width  = Math.min(pct,100)+'%';
  if (pctEl) pctEl.textContent  = Math.round(Math.min(pct,100))+'%';
  if (emoEl) emoEl.textContent  = getStageEmoji(pct);

  // Bubble
  const bubble = document.getElementById('companion-bubble');
  if (bubble) bubble.textContent = getCompanionMsg(pct, timerRunning);
}

// ── Timer ─────────────────────────────────────────────
function setPreset(mins, btn) {
  if (timerRunning) return;
  timerSeconds = mins*60; timerTotal = mins*60;
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  // Auto-switch to the matching plant (use best unlocked if locked)
  let plantKey = PRESET_PLANT_MAP[mins] || 'blossom';
  if (totalXP < PLANT_TYPES[plantKey].unlockXP) {
    // Fall back to best unlocked plant for this duration
    plantKey = 'blossom';
  }
  selectPlant(plantKey, true);
  updateTimerDisplay();
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning = false;
    document.getElementById('timer-btn').innerHTML = '<i class="ti ti-player-play"></i> Resume';
    // Show wilt when paused mid-session
    const pct = 1 - timerSeconds/timerTotal;
    if (pct > 0.02) {
      document.getElementById('companion-wrap').classList.add('wilting');
      document.getElementById('wilt-drop').style.display = 'block';
    }
    updateCompanion(pct);
  } else {
    timerRunning = true;
    document.getElementById('timer-btn').innerHTML = '<i class="ti ti-player-pause"></i> Pause';
    document.getElementById('companion-wrap').classList.remove('wilting');
    document.getElementById('wilt-drop').style.display = 'none';
    timerInterval = setInterval(()=>{
      timerSeconds--;
      updateTimerDisplay();
      updateCompanion(1 - timerSeconds/timerTotal);
      if (timerSeconds<=0) {
        clearInterval(timerInterval); timerRunning=false; onTimerDone();
      }
    },1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval); timerRunning=false; timerSeconds=timerTotal;
  document.getElementById('timer-btn').innerHTML = '<i class="ti ti-player-play"></i> Start';
  document.getElementById('companion-wrap').classList.remove('wilting');
  document.getElementById('wilt-drop').style.display = 'none';
  document.getElementById('mood-row').style.display = 'none';
  document.getElementById('session-confetti').textContent = '';
  updateTimerDisplay();
  updateCompanion(0);
}

function updateTimerDisplay() {
  const m = Math.floor(timerSeconds/60);
  const s = timerSeconds%60;
  document.getElementById('ring-label').textContent = m+':'+String(s).padStart(2,'0');
}

function onTimerDone() {
  const mins = Math.round(timerTotal / 60);
  let bonusXP = 50;
  let doneMsg = `${PLANT_TYPES[selectedPlant].emoji} Session complete! Rate your focus below.`;

  if (mins >= 60) {
    bonusXP = 120;
    doneMsg = `🌟 LEGENDARY SESSION! +${bonusXP} XP — you crushed a full hour! Rate your focus.`;
  } else if (mins >= 45) {
    bonusXP = 80;
    doneMsg = `⚡ EPIC SESSION! +${bonusXP} XP — incredible focus! Rate your focus.`;
  }

  document.getElementById('timer-btn').innerHTML = '<i class="ti ti-player-play"></i> Start';
  document.getElementById('mood-row').style.display = 'flex';
  document.getElementById('session-confetti').textContent = doneMsg;
  totalXP += bonusXP; totalMins += mins;
  updateCompanion(1);
  playTimerDone();
  launchConfetti(document.getElementById('companion-wrap'));
  if (mins >= 45) setTimeout(() => launchConfetti(), 600);
  if (mins >= 60) setTimeout(() => launchConfetti(), 1200);
  logDayStats({ mins, xp: bonusXP });
  updateChallengeProgress('mins', mins);
  updateChallengeProgress('xp', bonusXP);
  checkLevelUp(); checkGrindBadge(mins); updateXPHeader();
  if (Notification.permission==='granted') new Notification('Flowstate — session done! 🌺',{body:'Your plant is in full bloom — great work!'});
  renderTodos(); save();
}

function logMood(mood, btn) {
  document.querySelectorAll('.mood-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  const subj = document.getElementById('study-subject').value.trim()||'Study session';
  const mins = Math.round(timerTotal/60);
  sessions.unshift({subj,mins,mood,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
  updateChallengeProgress('mood');
  renderSessionLog(); renderStats(); save();
}

function renderSessionLog() {
  const el = document.getElementById('session-log');
  if (!sessions.length) {
    el.innerHTML=`<div class="empty-state"><i class="ti ti-plant" style="font-size:28px;display:block;margin-bottom:8px;color:var(--green)"></i>No sessions yet — grow your first plant!</div>`;
    return;
  }
  el.innerHTML = sessions.slice(0,5).map(s=>`
    <div class="log-item">
      <span style="font-size:18px">🌺</span>
      <span class="log-name">${s.subj}</span>
      <span>${s.mins} min</span>
      <span style="margin-left:4px">${MOOD_ICONS[s.mood]||''}</span>
      <span style="color:var(--text-hint);margin-left:8px;font-size:12px">${s.time}</span>
    </div>`).join('');
}

// ── Grades ────────────────────────────────────────────
function letterGrade(pct) {
  if (pct>=93) return 'A';  if (pct>=90) return 'A-';
  if (pct>=87) return 'B+'; if (pct>=83) return 'B';  if (pct>=80) return 'B-';
  if (pct>=77) return 'C+'; if (pct>=73) return 'C';  if (pct>=70) return 'C-';
  if (pct>=67) return 'D+'; if (pct>=60) return 'D';  return 'F';
}

function gradePoints(letter) {
  const map = {'A':4.0,'A-':3.7,'B+':3.3,'B':3.0,'B-':2.7,'C+':2.3,'C':2.0,'C-':1.7,'D+':1.3,'D':1.0,'F':0};
  return map[letter]??0;
}

function gradeColor(pct) {
  if (pct>=90) return '#10B981';
  if (pct>=80) return '#3B82F6';
  if (pct>=70) return '#F59E0B';
  if (pct>=60) return '#F97316';
  return '#EF4444';
}


function calcGPABoth() {
  if (!grades.length) return { weighted: null, unweighted: null };
  let wtPts=0, uwPts=0, totalCr=0;
  grades.forEach(g => {
    const letter = letterGrade(g.pct);
    const base   = gradePoints(letter);
    const bonus  = g.type==='ap' ? 1.0 : g.type==='honors' ? 0.5 : 0;
    wtPts  += (base + bonus) * g.credits;
    uwPts  += base * g.credits;
    totalCr += g.credits;
  });
  if (!totalCr) return { weighted: null, unweighted: null };
  return {
    weighted:   Math.min(grades.some(g=>g.type!=='reg') ? 5.0 : 4.0, wtPts/totalCr).toFixed(2),
    unweighted: (uwPts/totalCr).toFixed(2),
  };
}

function calcGPA() {
  return calcGPABoth().unweighted;
}

function addGrade() {
  const name    = document.getElementById('grade-class').value.trim();
  const pct     = parseFloat(document.getElementById('grade-pct').value);
  const credits = parseInt(document.getElementById('grade-credits').value) || 3;
  const type    = document.getElementById('grade-type').value;
  if (!name || isNaN(pct)) { document.getElementById('grade-class').focus(); return; }
  grades.push({ id: Date.now(), name, pct: Math.min(100,Math.max(0,pct)), credits, type });
  document.getElementById('grade-class').value = '';
  document.getElementById('grade-pct').value   = '';
  playAdd();
  renderGrades();
  save();
}

function deleteGrade(id) { grades=grades.filter(g=>g.id!==id); renderGrades(); save(); }

function renderGrades() {
  const { weighted, unweighted } = calcGPABoth();
  document.getElementById('gpa-weighted-val').textContent   = weighted   || '—';
  document.getElementById('gpa-unweighted-val').textContent = unweighted || '—';

  const list = document.getElementById('grade-list');
  const targetSec = document.getElementById('target-gpa-section');

  if (!grades.length) {
    list.innerHTML=`<div class="empty-state"><i class="ti ti-school" style="font-size:32px;display:block;margin-bottom:10px;color:var(--purple)"></i>Add your first class above to calculate your GPA.</div>`;
    if (targetSec) targetSec.style.display = 'none';
    return;
  }

  if (targetSec) targetSec.style.display = 'block';

  const typeLabels = { reg: 'Regular', honors: 'Honors', ap: 'AP / IB' };
  const sorted = [...grades].sort((a,b)=>b.pct-a.pct);
  list.innerHTML = sorted.map(g => {
    const letter = letterGrade(g.pct);
    const color  = gradeColor(g.pct);
    const typeLbl = typeLabels[g.type] || 'Regular';
    const pts     = gradePoints(letter);
    const bonus   = g.type==='ap' ? 1.0 : g.type==='honors' ? 0.5 : 0;
    const wPts    = (pts + bonus).toFixed(1);
    return `
      <div class="grade-card" style="border-left-color:${color}">
        <div class="grade-card-top">
          <div class="grade-letter-badge" style="background:${color}">${letter}</div>
          <div class="grade-info">
            <div class="grade-class-name">${g.name}</div>
            <div class="grade-meta">${g.pct}% &nbsp;·&nbsp; ${typeLbl} &nbsp;·&nbsp; ${g.credits} cr &nbsp;·&nbsp; ${wPts} pts</div>
          </div>
          <div class="grade-actions">
            <button class="icon-btn del" onclick="deleteGrade(${g.id})"><i class="ti ti-trash"></i></button>
          </div>
        </div>
        <div class="grade-bar-track">
          <div class="grade-bar-fill" style="width:${g.pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

// ── Calculator hub ────────────────────────────────────
function showCalc(name, btn) {
  document.querySelectorAll('.calc-tab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.calc-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('calc-'+name).classList.add('active');
}

function calcFinal() {
  const current = parseFloat(document.getElementById('final-current').value);
  const weight  = parseFloat(document.getElementById('final-weight').value);
  const target  = parseFloat(document.getElementById('final-target').value);

  if (isNaN(current)||isNaN(weight)||isNaN(target)) {
    alert('Please fill in all three fields.'); return;
  }
  if (weight<=0||weight>100) { alert('Final weight must be between 1 and 100.'); return; }

  const w = weight / 100;
  const needed = (target - current*(1-w)) / w;
  const resultEl   = document.getElementById('final-result');
  const scenariosEl = document.getElementById('final-scenarios');
  const tableEl    = document.getElementById('final-scenarios-table');

  let cls, msg;
  if (needed <= 60)       { cls='result-great';      msg='You\'ve got this in the bag! Even a low score on the final secures your goal.'; }
  else if (needed <= 80)  { cls='result-good';       msg='Very achievable! Stay focused and you\'ll hit your target grade.'; }
  else if (needed <= 90)  { cls='result-tough';      msg='Tough but doable. Strong studying in the next few days will make the difference.'; }
  else if (needed <= 100) { cls='result-hard';       msg='You\'ll need a near-perfect final. Prioritize exam prep above everything else.'; }
  else                    { cls='result-impossible'; msg='Mathematically impossible to reach that target this semester — but do your best!'; }

  const scoreDisplay = needed > 100 ? 'N/A' : needed < 0 ? '0%' : needed.toFixed(1)+'%';
  resultEl.className = 'calc-result '+cls;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="result-score">${scoreDisplay}</div>
    <div class="result-letter">needed on your final exam</div>
    <div class="result-message">${msg}<br><br>
      <strong>Formula:</strong> Current: ${current}%, Final weight: ${weight}%, Target: ${target}%
    </div>`;

  // Scenarios
  const scenarios = [
    { label: 'If you score 60%', score: 60, color: '#EF4444' },
    { label: 'If you score 70%', score: 70, color: '#F59E0B' },
    { label: 'If you score 80%', score: 80, color: '#3B82F6' },
    { label: 'If you score 90%', score: 90, color: '#10B981' },
    { label: 'If you score 100%', score: 100, color: '#7C3AED' },
  ];
  tableEl.innerHTML = scenarios.map(s => {
    const finalGrade = current*(1-w) + s.score*w;
    const ltr = letterGrade(finalGrade);
    return `<div class="scenario-row">
      <span class="s-dot" style="background:${s.color}"></span>
      <span class="s-label">${s.label}</span>
      <span class="s-val">${finalGrade.toFixed(1)}% &nbsp;<span style="color:var(--text-muted);font-weight:500">${ltr}</span></span>
    </div>`;
  }).join('');
  scenariosEl.style.display = 'block';
}

function calcNeeded() {
  const current = parseFloat(document.getElementById('needed-current').value);
  const count   = parseFloat(document.getElementById('needed-count').value);
  const target  = parseFloat(document.getElementById('needed-target').value);
  const left    = parseFloat(document.getElementById('needed-left').value);

  if (isNaN(current)||isNaN(count)||isNaN(target)||isNaN(left)) {
    alert('Please fill in all four fields.'); return;
  }
  if (count<=0||left<=0) { alert('Counts must be at least 1.'); return; }

  const needed = (target*(count+left) - current*count) / left;
  const resultEl    = document.getElementById('needed-result');
  const breakdownEl = document.getElementById('needed-breakdown');
  const tableEl     = document.getElementById('needed-breakdown-table');

  let cls, msg;
  if (needed <= 60)       { cls='result-great';      msg='You\'ve already set yourself up for success!'; }
  else if (needed <= 80)  { cls='result-good';       msg='Totally reachable! Keep consistent and you\'ll get there.'; }
  else if (needed <= 90)  { cls='result-tough';      msg='Challenging but achievable. Don\'t miss any assignments.'; }
  else if (needed <= 100) { cls='result-hard';       msg='You\'ll need top scores on everything remaining. Now\'s the time to grind!'; }
  else                    { cls='result-impossible'; msg='Mathematically impossible with those numbers — but keep going and do your best!'; }

  const scoreDisplay = needed > 100 ? 'N/A' : needed < 0 ? '0%' : needed.toFixed(1)+'%';
  resultEl.className = 'calc-result '+cls;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="result-score">${scoreDisplay}</div>
    <div class="result-letter">average needed on remaining ${left} assignment${left>1?'s':''}</div>
    <div class="result-message">${msg}</div>`;

  // Breakdown scenarios
  const scenarios = [
    { label: 'If remaining avg = 70%', avg: 70 },
    { label: 'If remaining avg = 80%', avg: 80 },
    { label: 'If remaining avg = 90%', avg: 90 },
    { label: 'If remaining avg = 100%', avg: 100 },
  ];
  const colors = ['#EF4444','#F59E0B','#3B82F6','#10B981'];
  tableEl.innerHTML = scenarios.map((s,i) => {
    const finalAvg = (current*count + s.avg*left) / (count+left);
    const ltr = letterGrade(finalAvg);
    return `<div class="scenario-row">
      <span class="s-dot" style="background:${colors[i]}"></span>
      <span class="s-label">${s.label}</span>
      <span class="s-val">${finalAvg.toFixed(1)}% &nbsp;<span style="color:var(--text-muted);font-weight:500">${ltr}</span></span>
    </div>`;
  }).join('');
  breakdownEl.style.display = 'block';
}

function calcTargetGPA() {
  const target = parseFloat(document.getElementById('target-gpa-input').value);
  const left   = parseInt(document.getElementById('classes-left-input').value);
  const resultEl = document.getElementById('gpa-target-result');

  if (isNaN(target)||isNaN(left)||left<1) {
    alert('Please enter your target GPA and number of classes left.'); return;
  }
  if (target<0||target>4.0) { alert('GPA must be between 0.0 and 4.0.'); return; }

  const { unweighted } = calcGPABoth();
  if (!unweighted) { alert('Add at least one class first.'); return; }

  const current    = parseFloat(unweighted);
  const count      = grades.length;
  const totalPts   = current * grades.reduce((a,g)=>a+g.credits,0);
  const totalCr    = grades.reduce((a,g)=>a+g.credits,0);
  const neededPts  = target * (totalCr + left) - totalPts;
  const neededAvg  = neededPts / left;

  let cls, msg, label;
  if (neededAvg >= 3.7)      { cls='result-hard';   label='≥ A−'; msg='You\'ll need A-level or better performance in every remaining class.'; }
  else if (neededAvg >= 3.0) { cls='result-tough';  label='≥ B';  msg='Solid B performance across your remaining classes will get you there.'; }
  else if (neededAvg >= 2.0) { cls='result-good';   label='≥ C';  msg='Passing grades in remaining classes will meet your goal.'; }
  else if (neededAvg >= 0)   { cls='result-great';  label='Any';  msg='Your current GPA already meets or exceeds your target!'; }
  else                       { cls='result-impossible'; label='N/A'; msg='Mathematically impossible given your current GPA and credits remaining.'; }

  resultEl.className = 'calc-result '+cls;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="result-score" style="font-size:32px">${label}</div>
    <div class="result-letter">avg grade needed across ${left} class${left>1?'es':''}</div>
    <div class="result-message">${msg}<br><br>
      <strong>Your current GPA:</strong> ${current} &nbsp;·&nbsp; <strong>Target:</strong> ${target.toFixed(1)}
    </div>`;
}

// ── Stats ─────────────────────────────────────────────
function renderStats() {
  document.getElementById('s-tasks').textContent  = tasksDone;
  document.getElementById('s-mins').textContent   = totalMins;
  document.getElementById('s-xp').textContent     = totalXP;
  document.getElementById('s-streak').textContent = streak;

  const level = getCurrentLevel();
  const idx   = LEVELS.indexOf(level);
  const next  = LEVELS[idx+1];
  document.getElementById('level-name').textContent = level.name;
  if (next) {
    const pct = Math.round((totalXP-level.min)/(next.min-level.min)*100);
    document.getElementById('level-xp').textContent  = totalXP+' / '+next.min+' XP';
    document.getElementById('level-bar').style.width = Math.min(pct,100)+'%';
  } else {
    document.getElementById('level-xp').textContent  = totalXP+' XP — MAX LEVEL! 🏆';
    document.getElementById('level-bar').style.width = '100%';
  }

  const statsEl = document.getElementById('stats-sessions');
  statsEl.innerHTML = sessions.length
    ? sessions.map(s=>`<div class="log-item"><span style="font-size:16px">🌺</span><span class="log-name">${s.subj}</span><span>${s.mins} min</span><span style="margin-left:4px">${MOOD_ICONS[s.mood]||''}</span></div>`).join('')
    : '<div class="empty-state" style="padding:1.5rem">No sessions yet</div>';

  renderBadges();
}

// ── Calendar ──────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function renderCalendar() {
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  document.getElementById('cal-month-label').textContent = MONTH_NAMES[calMonth] + ' ' + calYear;

  let cells = '';
  for (let i = 0; i < firstDay; i++) cells += '<div class="cal-cell empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvs = events.filter(e => e.date === ds);
    const isToday = ds === today;
    const isSel   = ds === selectedDay;
    const dots = dayEvs.slice(0,4).map(e => `<span class="cal-dot" style="background:${EVENT_COLORS[e.type]||'#38BDF8'}"></span>`).join('');
    cells += `<button class="cal-cell${isToday?' today':''}${isSel?' selected':''}" onclick="selectDay('${ds}')">
      <span class="cal-num">${d}</span>
      <div class="cal-dots">${dots}</div>
    </button>`;
  }
  document.getElementById('cal-grid').innerHTML = cells;
  renderDayPanel();
  renderUpcoming();
  updateCalHomePill();
}

function selectDay(ds) {
  selectedDay = ds;
  renderCalendar();
}

function renderDayPanel() {
  const panel = document.getElementById('cal-day-panel');
  const dayEvs = events.filter(e => e.date === selectedDay);
  const label = formatCalDate(selectedDay);
  if (dayEvs.length === 0) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  panel.innerHTML = `<div class="cal-day-title">${label}</div>` +
    dayEvs.map(e => `
      <div class="cal-day-event">
        <div class="cal-event-type-bar" style="background:${EVENT_COLORS[e.type]||'#38BDF8'}"></div>
        <div class="cal-event-info">
          <div class="cal-event-name">${e.title}</div>
          <div class="cal-event-label">${EVENT_LABELS[e.type]||e.type}</div>
        </div>
        <button class="cal-event-delete" onclick="deleteCalEvent(${e.id})"><i class="ti ti-x"></i></button>
      </div>`).join('');
}

function renderUpcoming() {
  const el = document.getElementById('upcoming-events');
  if (!el) return;
  const now = new Date(today);
  const upcoming = events
    .filter(e => e.date >= today)
    .sort((a,b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  if (!upcoming.length) {
    el.innerHTML = '<div class="upcoming-empty">No upcoming events — you\'re clear! 🎉</div>';
    return;
  }
  el.innerHTML = upcoming.map(e => {
    const diff = Math.round((new Date(e.date) - now) / 86400000);
    const daysLabel = diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow' : `${diff} days`;
    const urgent = diff <= 2;
    return `<div class="upcoming-card" style="border-left-color:${EVENT_COLORS[e.type]||'#38BDF8'}">
      <div class="upcoming-card-inner">
        <div class="upcoming-title">${e.title}</div>
        <div class="upcoming-meta">${EVENT_LABELS[e.type]||e.type} · ${formatCalDate(e.date)}</div>
      </div>
      <div class="upcoming-days${urgent?' urgent':''}">${daysLabel}</div>
    </div>`;
  }).join('');
}

function updateCalHomePill() {
  const el = document.getElementById('qa-cal-sub');
  if (!el) return;
  const upcoming = events.filter(e => e.date >= today).sort((a,b)=>a.date.localeCompare(b.date));
  if (!upcoming.length) { el.textContent = 'Nothing due'; return; }
  const next = upcoming[0];
  const diff = Math.round((new Date(next.date) - new Date(today)) / 86400000);
  el.textContent = diff === 0 ? `${next.title} today!` : diff === 1 ? `${next.title} tomorrow` : `${next.title} in ${diff}d`;
}

function changeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCalendar();
}

function addCalEvent() {
  const title = document.getElementById('event-title').value.trim();
  const type  = document.getElementById('event-type').value;
  const date  = document.getElementById('event-date').value;
  if (!title || !date) { alert('Please enter a title and date.'); return; }
  events.push({ id: Date.now(), title, type, date });
  events.sort((a,b) => a.date.localeCompare(b.date));
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value  = '';
  updateChallengeProgress('calendar');
  save();
  renderCalendar();
}

function deleteCalEvent(id) {
  events = events.filter(e => e.id !== id);
  save();
  renderCalendar();
}

function formatCalDate(ds) {
  const d = new Date(ds + 'T12:00:00');
  return d.toLocaleDateString([], { weekday:'short', month:'short', day:'numeric' });
}

// ── Modal stars ────────────────────────────────────────
function spawnModalStars() {
  const card = document.querySelector('.modal-card');
  if (!card) return;
  document.querySelectorAll('.modal-star').forEach(s => s.remove());
  const starEmojis = ['⭐','✨','💫','🌟'];
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'modal-star';
    s.textContent = starEmojis[Math.floor(Math.random() * starEmojis.length)];
    const angle = (Math.random() * 360) * Math.PI / 180;
    const dist = 60 + Math.random() * 80;
    s.style.setProperty('--sx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle)*dist + 'px');
    s.style.left = (30 + Math.random() * 40) + '%';
    s.style.top  = (20 + Math.random() * 40) + '%';
    s.style.animationDelay = (Math.random() * 0.3) + 's';
    card.appendChild(s);
  }
}

// ── Weekly Recap ──────────────────────────────────────
function getLastWeekRange() {
  const now = new Date();
  // Last Monday
  const lastMon = new Date(now);
  lastMon.setDate(now.getDate() - now.getDay() - 6);
  lastMon.setHours(0,0,0,0);
  const lastSun = new Date(lastMon);
  lastSun.setDate(lastMon.getDate() + 6);
  const fmt = d => d.toISOString().slice(0,10);
  return { start: fmt(lastMon), end: fmt(lastSun) };
}

function buildWeeklyStats() {
  const { start, end } = getLastWeekRange();
  let totalTasks = 0, totalMinsW = 0, totalXPW = 0;
  let bestDay = null, bestDayTasks = -1;
  let weekBadges = [];
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  // iterate each day in range
  let cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate) {
    const key = cur.toISOString().slice(0,10);
    const d = weekLog[key] || { tasks:0, mins:0, xp:0, badges:[] };
    totalTasks += d.tasks;
    totalMinsW += d.mins;
    totalXPW   += d.xp;
    if (d.tasks > bestDayTasks) {
      bestDayTasks = d.tasks;
      bestDay = DAY_NAMES[cur.getDay()];
    }
    weekBadges.push(...(d.badges || []));
    cur.setDate(cur.getDate() + 1);
  }

  // deduplicate badges and look up info
  const uniqueBadges = [...new Set(weekBadges)]
    .map(id => BADGES.find(b => b.id === id))
    .filter(Boolean);

  const startLabel = new Date(start).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const endLabel   = new Date(end).toLocaleDateString('en-US',{month:'short',day:'numeric'});

  return { totalTasks, totalMinsW, totalXPW, bestDay, bestDayTasks, uniqueBadges, startLabel, endLabel };
}

function checkWeeklyRecap() {
  const now = new Date();
  // Only show on Mondays
  if (now.getDay() !== 1) return;
  const shownKey = localStorage.getItem('fs_recap_shown');
  const { start } = getLastWeekRange();
  if (shownKey === start) return; // already shown for this week

  const stats = buildWeeklyStats();
  // Only show if there's something to show
  if (stats.totalTasks === 0 && stats.totalMinsW === 0) return;

  localStorage.setItem('fs_recap_shown', start);
  setTimeout(() => showWeeklyRecap(stats), 2200);
}

function showWeeklyRecap(stats) {
  const el = document.getElementById('weekly-recap');
  if (!el) return;

  // Populate
  el.querySelector('.wr-period').textContent  = `${stats.startLabel} – ${stats.endLabel}`;
  el.querySelector('.wr-tasks-num').textContent = stats.totalTasks;
  el.querySelector('.wr-mins-num').textContent  = stats.totalMinsW;
  el.querySelector('.wr-xp-num').textContent    = stats.totalXPW;
  el.querySelector('.wr-best-day').textContent  = stats.bestDayTasks > 0 ? stats.bestDay : '—';

  const badgeEl = el.querySelector('.wr-badges');
  badgeEl.innerHTML = stats.uniqueBadges.length
    ? stats.uniqueBadges.map(b => `<span class="wr-badge-chip">${b.emoji} ${b.name}</span>`).join('')
    : '<span style="opacity:.5;font-size:13px">None this week</span>';

  el.classList.add('show');
  launchConfetti();
  setTimeout(() => launchConfetti(), 600);
}

function closeWeeklyRecap() {
  document.getElementById('weekly-recap').classList.remove('show');
}

function shareWeeklyRecap() {
  const stats = buildWeeklyStats();
  const canvas = document.createElement('canvas');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const W = 540, H = 960;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  const ctx = canvas.getContext('2d');
  ctx.scale(DPR, DPR);

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0,   '#0A0F1E');
  bg.addColorStop(0.4, '#0D1B2A');
  bg.addColorStop(1,   '#1a0a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Decorative blobs
  const blob = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  };
  blob(80,  120, 180, 'rgba(56,189,248,0.18)');
  blob(460, 340, 200, 'rgba(168,85,247,0.15)');
  blob(100, 760, 160, 'rgba(6,182,212,0.12)');
  blob(420, 820, 140, 'rgba(245,158,11,0.10)');

  // Logo / header
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '500 14px Inter, sans-serif';
  ctx.fillText('FLOWSTATE', W/2, 54);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 26px Fredoka One, cursive';
  ctx.fillText('Your Week in Review', W/2, 92);

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText(`${stats.startLabel} – ${stats.endLabel}`, W/2, 118);

  // Divider
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60, 138); ctx.lineTo(W-60, 138); ctx.stroke();

  // Stat blocks helper
  const statBlock = (label, value, unit, x, y, color) => {
    // Card bg
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, x - 108, y - 20, 216, 160, 20);
    ctx.fill();

    // Glow
    const gl = ctx.createRadialGradient(x, y+40, 0, x, y+40, 90);
    gl.addColorStop(0, color.replace('1)', '0.18)'));
    gl.addColorStop(1, 'transparent');
    ctx.fillStyle = gl;
    ctx.fillRect(x-108, y-20, 216, 160);

    ctx.fillStyle = color;
    ctx.font = 'bold 64px Fredoka One, cursive';
    ctx.textAlign = 'center';
    ctx.fillText(value, x, y + 68);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.letterSpacing = '0.1em';
    ctx.fillText(label.toUpperCase(), x, y + 96);

    if (unit) {
      ctx.fillStyle = color;
      ctx.font = '500 12px Inter, sans-serif';
      ctx.fillText(unit, x, y + 114);
    }
  };

  statBlock('Tasks Done',   stats.totalTasks, 'completed',  W/4,     168, 'rgba(56,189,248,1)');
  statBlock('Mins Studied', stats.totalMinsW, 'focused',    3*W/4,   168, 'rgba(6,182,212,1)');
  statBlock('XP Earned',    stats.totalXPW,   'points',     W/4,     360, 'rgba(245,158,11,1)');
  statBlock('Best Day',     stats.bestDayTasks > 0 ? stats.bestDay : '—', stats.bestDayTasks > 0 ? stats.bestDayTasks+' tasks' : '', 3*W/4, 360, 'rgba(52,211,153,1)');

  // Badges section
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, 40, 565, W-80, 148, 20);
  ctx.fill();

  ctx.fillStyle = 'rgba(167,139,250,0.9)';
  ctx.font = '600 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BADGES UNLOCKED THIS WEEK', W/2, 592);

  if (stats.uniqueBadges.length > 0) {
    ctx.font = '32px serif';
    const spacing = Math.min(60, (W-100) / stats.uniqueBadges.length);
    const startX  = W/2 - (stats.uniqueBadges.length - 1) * spacing / 2;
    stats.uniqueBadges.forEach((b, i) => {
      ctx.fillText(b.emoji, startX + i * spacing, 648);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(stats.uniqueBadges.map(b => b.name).join('  ·  '), W/2, 690);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Keep going — badges await next week!', W/2, 650);
  }

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('flowstate · level up your learning', W/2, H - 36);

  // Download
  canvas.toBlob(blob => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `flowstate-week-${stats.startLabel.replace(' ','-')}.png`;
    a.click();
  }, 'image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Daily Challenges ──────────────────────────────────
function seededRand(seed) {
  let h = seed + 0x6d2b79f5;
  h = Math.imul(h ^ h >>> 15, h | 1);
  h ^= h + Math.imul(h ^ h >>> 7, h | 61);
  return ((h ^ h >>> 14) >>> 0) / 4294967296;
}

function pickDailyChallenges() {
  if (dailyChallengeDate === today) return; // already generated today
  dailyChallengeDate = today;
  allChallengesDone  = false;
  dayCounters        = { tasks: 0, mins: 0, mood: 0, combo: 0, xp: 0, high_task: 0, calendar: 0 };

  // Seed from date digits so picks are deterministic per day
  const dateSeed = parseInt(today.replace(/-/g, ''), 10);
  const pool = [...CHALLENGE_POOL];
  const picked = [];
  let seed = dateSeed;
  while (picked.length < 3 && pool.length) {
    seed = Math.floor(seededRand(seed) * 1e9);
    const idx = Math.floor(seededRand(seed) * pool.length);
    picked.push({ ...pool.splice(idx, 1)[0], progress: 0, done: false });
  }
  dailyChallenges = picked;
  save();
}

function updateChallengeProgress(type, amount = 1) {
  if (dailyChallengeDate !== today) return;
  if (allChallengesDone) return;
  if (!(type in dayCounters)) return;
  dayCounters[type] += amount;

  let anyNewlyDone = false;
  dailyChallenges.forEach(c => {
    if (c.done || c.type !== type) return;
    c.progress = Math.min(dayCounters[type], c.target);
    if (c.progress >= c.target) {
      c.done = true;
      anyNewlyDone = true;
      totalXP += c.xp;
      showXPToast('🎯 +' + c.xp + ' XP');
      setTimeout(() => launchConfetti(), 150);
    }
  });

  if (anyNewlyDone) {
    const allDone = dailyChallenges.every(c => c.done);
    if (allDone && !allChallengesDone) {
      allChallengesDone = true;
      setTimeout(showAllChallengesComplete, 600);
    }
    checkLevelUp();
    updateXPHeader();
    save();
  }
  renderDailyChallenges();
}

function showAllChallengesComplete() {
  const el = document.getElementById('challenges-complete-toast');
  if (!el) return;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  launchConfetti();
  setTimeout(() => launchConfetti(), 400);
  setTimeout(() => launchConfetti(), 800);
  tone(660, 0.1); setTimeout(() => tone(784, 0.1), 120); setTimeout(() => tone(1046, 0.18), 250);
  setTimeout(() => el.classList.remove('show'), 4000);
}

function renderDailyChallenges() {
  const el = document.getElementById('daily-challenges');
  if (!el) return;
  if (!dailyChallenges.length) { el.innerHTML = ''; return; }

  el.innerHTML = dailyChallenges.map(c => {
    const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
    return `
    <div class="challenge-card ${c.done ? 'challenge-done' : ''}">
      <div class="challenge-top">
        <span class="challenge-text">${c.done ? '✓ ' : ''}${c.text}</span>
        <span class="challenge-xp">+${c.xp} XP</span>
      </div>
      <div class="challenge-bar-wrap">
        <div class="challenge-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="challenge-progress-label">${c.progress} / ${c.target}</div>
    </div>`;
  }).join('');
}

// ── Export / Import ────────────────────────────────────
function exportData() {
  const data = { todos, grades, events, totalXP, streak, tasksDone, totalMins, sessions, selectedPlant, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `flowstate-backup-${today}.json`;
  a.click();
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (d.todos)    todos     = d.todos;
      if (d.grades)   grades    = d.grades;
      if (d.events)   events    = d.events;
      if (d.totalXP  !== undefined) totalXP   = d.totalXP;
      if (d.streak   !== undefined) streak    = d.streak;
      if (d.tasksDone!== undefined) tasksDone = d.tasksDone;
      if (d.totalMins!== undefined) totalMins = d.totalMins;
      if (d.sessions)  sessions  = d.sessions;
      if (d.selectedPlant) selectedPlant = d.selectedPlant;
      save();
      renderHome(); renderTodos(); renderGrades(); renderStats(); renderCalendar(); updateXPHeader();
      alert('✓ Data imported successfully!');
    } catch(err) { alert('Could not read file. Make sure it\'s a valid Flowstate backup.'); }
    input.value = '';
  };
  reader.readAsText(file);
}

// ── Bindings ──────────────────────────────────────────
document.getElementById('todo-input').addEventListener('keydown', e => { if(e.key==='Enter') addTodo(); });
document.getElementById('todo-input').addEventListener('focus', ()=>{ try{getAudio();}catch(e){} });
document.getElementById('add-task-btn').addEventListener('click', addTodo);
document.getElementById('add-grade-btn').addEventListener('click', addGrade);
document.getElementById('grade-class').addEventListener('keydown', e=>{ if(e.key==='Enter') addGrade(); });
document.getElementById('grade-pct').addEventListener('keydown',   e=>{ if(e.key==='Enter') addGrade(); });
document.getElementById('final-target').addEventListener('keydown',  e=>{ if(e.key==='Enter') calcFinal(); });
document.getElementById('needed-left').addEventListener('keydown',   e=>{ if(e.key==='Enter') calcNeeded(); });

// ── Init ──────────────────────────────────────────────
load();
checkLoginStreak();
checkWeeklyRecap();
pickDailyChallenges();
lastLevelName = getCurrentLevel().name;

// Splash screen
const splashEmojis = ['🌱','🌿','🌸','🌻','🌵','💎'];
let splashI = 0;
const splashInterval = setInterval(() => {
  splashI = (splashI + 1) % splashEmojis.length;
  const el = document.getElementById('splash-emoji');
  if (el) el.textContent = splashEmojis[splashI];
}, 260);
setTimeout(() => {
  clearInterval(splashInterval);
  const splash = document.getElementById('splash-screen');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 600);
  }
}, 1800);

// Inject plant SVG
const svg = document.getElementById('companion-svg');
if (svg) svg.innerHTML = PLANT_TYPES[selectedPlant]?.svgContent || PLANT_TYPES.blossom.svgContent;

renderHome();
renderTodos();
renderGrades();
renderSessionLog();
renderStats();
renderCalendar();
renderPlantSelector();
updateTimerDisplay();
updateXPHeader();
updateCompanion(0);
checkNotifBanner();

// Set today as default date in calendar form
const evDateInput = document.getElementById('event-date');
if (evDateInput) evDateInput.value = today;
