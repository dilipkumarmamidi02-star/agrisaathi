// Deterministic page router for the voice/chat helper.
// Add more keywords per page as you find real user phrasing.

export const APP_ROUTES = [
  { path: '/diagnose', label: 'Diagnose',
    description: 'Take or upload a photo of a crop or animal, confirm what it is, and get AI-assisted diagnosis with precautions.',
    keywords: ['diagnose', 'diagnosis', 'disease', 'sick crop', 'sick animal', 'problem in crop',
      'వ్యాధి', 'నిర్ధారణ', 'డయాగ్నోస్', 'रोग', 'निदान'] },
  { path: '/crop-planner', label: 'Crop Planner',
    description: 'Get crop suggestions ranked by soil and water fit for your region, with a fertilizer and care schedule template.',
    keywords: ['crop planner', 'crop plan', 'crops page', 'which crop', 'what to grow', 'crop planning',
      'క్రాప్ ప్లానర్', 'పంట ప్రణాళిక', 'फसल योजना'] },
  { path: '/crop-passport', label: 'Crop Passport',
    description: 'A tamper-evident record of your crop batch — soil, water, sowing and harvest history — that you can share or verify.',
    keywords: ['crop passport', 'passport', 'క్రాప్ పాస్‌పోర్ట్', 'फसल पासपोर्ट'] },
  { path: '/loan-eligibility', label: 'Loan Eligibility',
    description: 'Check informational loan eligibility guidance based on your crop and farm details.',
    keywords: ['loan eligibility', 'loan', 'eligible for loan', 'రుణ అర్హత', 'ఋణం', 'ऋण पात्रता', 'लोन'] },
  { path: '/soil-passport', label: 'Soil Passport',
    description: 'Record and view your soil test values — pH, N, P, K, moisture — as a reference for crop and fertilizer decisions.',
    keywords: ['soil passport', 'soil test', 'soil report', 'నేల పాస్‌పోర్ట్', 'मिट्टी'] },
  { path: '/livestock-care', label: 'Livestock Care',
    description: 'Track health milestones, feed schedules, and vaccinations for your animals.',
    keywords: ['livestock', 'animal care', 'cattle', 'poultry', 'dairy', 'పశువుల సంరక్షణ', 'पशुधन'] },
  { path: '/animal-encyclopedia', label: 'Animal Encyclopedia',
    description: 'Official reference for livestock breeds — vaccination schedules, feed, yield timing, and required environment for poultry, dairy, goats, fisheries, apiculture and more.',
    keywords: ['animal encyclopedia', 'animal breeds', 'poultry breeds', 'dairy breeds', 'goat breeds',
      'fish farming', 'apiculture', 'bee keeping', 'piggery', 'rabbit farming', 'vaccination schedule',
      'జంతు విజ్ఞాన సర్వస్వం', 'पशु विश्वकोश'] },
  { path: '/farm-ledger', label: 'Farm Ledger',
    description: 'Log expenses and income and see your cost, revenue, and margin at a glance.',
    keywords: ['farm ledger', 'expenses', 'income', 'ledger', 'ఖర్చులు', 'खाता'] },
  { path: '/market-prices', label: 'Market Prices',
    description: 'Check mandi rates for your crops from saved and government markets.',
    keywords: ['market price', 'mandi rate', 'price today', 'మార్కెట్ ధరలు', 'मंडी भाव'] },
  { path: '/near-me', label: 'Near Me',
    description: 'Find nearby KVKs, government markets, and agri shops sorted by distance from your location.',
    keywords: ['near me', 'nearby kvk', 'nearby market', 'దగ్గర్లో', 'पास में'] },
  { path: '/schemes', label: 'Government Schemes',
    description: 'Browse central and state government agriculture schemes and subsidies you may qualify for.',
    keywords: ['scheme', 'government scheme', 'subsidy', 'పథకం', 'योजना'] },
  { path: '/insurance-hub', label: 'Insurance',
    description: 'Prepare tamper-evident crop damage evidence and check insurance scheme information.',
    keywords: ['insurance', 'crop insurance', 'బీమా', 'बीमा'] },
  { path: '/inventory-tracker', label: 'Inventory',
    description: 'Track your fertilizer, seed, and pesticide stock with low-stock alerts.',
    keywords: ['inventory', 'stock', 'నిల్వ', 'भंडार'] },
  { path: '/equipment-registry', label: 'Equipment Registry',
    description: 'Register and browse farm equipment and machinery available for rent.',
    keywords: ['equipment', 'machinery', 'tractor', 'పరికరాలు', 'उपकरण'] },
  { path: '/marketplace', label: 'Resource Marketplace',
    description: 'Buy, sell, or rent farm inputs and equipment with other farmers.',
    keywords: ['marketplace', 'rent tractor', 'buy equipment', 'మార్కెట్‌ప్లేస్'] },
  { path: '/irrigation-planner', label: 'Irrigation',
    description: 'Plan irrigation timing based on your crop, soil moisture, and weather.',
    keywords: ['irrigation', 'water schedule', 'నీటిపారుదల', 'सिंचाई'] },
  { path: '/weather-analytics', label: 'Weather Analytics',
    description: 'View weather trends, current conditions, forecast data, and weather analytics for your farm location.',
    keywords: ['weather analytics', 'weather analysis', 'weather data', 'weather trends',
      'climate data', 'forecast analytics', 'వాతావరణ విశ్లేషణ', 'వాతావరణ డేటా',
      'मौसम विश्लेषण', 'मौसम डेटा'] },
  { path: '/weather-alerts', label: 'Weather Alerts',
    description: 'See severe-weather alerts and forecast warnings for your farm location.',
    keywords: ['weather alerts', 'weather alert', 'rain alert', 'storm alert', 'వాతావరణ హెచ్చరిక', 'मौसम चेतावनी'] },
  { path: '/weather', label: 'Weather',
    description: 'See current weather and forecast for your farm location.',
    keywords: ['weather', 'current weather', 'weather forecast', 'rain forecast', 'వాతావరణం', 'मौसम'] },
  { path: '/sensor-lab', label: 'Sensor Lab',
    description: 'Log up to 20 soil samples and 5 water samples via Bluetooth, USB, or manual entry to get crop/field suitability advice.',
    keywords: ['sensor', 'soil sample', 'water sample', 'సెన్సార్'] },
  { path: '/community', label: 'Community',
    description: 'Connect with other farmers growing the same crop or with similar soil reports.',
    keywords: ['community', 'forum', 'other farmers', 'సంఘం', 'समुदाय'] },
  { path: '/profile-settings', label: 'Profile & Settings',
    description: 'Manage your account, language, and app settings.',
    keywords: ['profile', 'settings', 'account', 'ప్రొఫైల్', 'प्रोफाइल'] },
  { path: '/dashboard', label: 'Dashboard',
    description: 'Your farm overview — plots, weather, upcoming harvests, and quick access to every tool.',
    keywords: ['dashboard', 'home', 'డాష్‌బోర్డ్', 'होम'] },
];

const YES_WORDS = ['yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'open it', 'open', 'avunu', 'అవును', 'ha', 'हाँ', 'हा'];
const NO_WORDS = ['no', 'nope', 'nah', 'kadu', 'కాదు', 'nahi', 'नहीं'];
const DETAIL_WORDS = ['detail', 'details', 'info', 'information', 'tell me', 'data', 'విషయాలు', 'వివరాలు', 'जानकारी', 'डिटेल'];
const EXPLAIN_WORDS = ['what is', 'tell me about', 'how do i use', 'how to use', 'explain',
  'ఏమిటి', 'గురించి చెప్పు', 'ఎలా వాడాలి', 'क्या है', 'के बारे में बताओ', 'कैसे इस्तेमाल'];
const READ_PAGE_WORDS = ['read this page', 'read this', 'read content', 'read it',
  'చదవండి', 'ఇది చదవండి', 'పేజీ చదవండి', 'पढ़ो', 'इसे पढ़ो', 'पेज पढ़ो'];

const normalize = (s) => (s || '').toLowerCase().trim();

export function isYes(text) {
  const t = normalize(text);
  return YES_WORDS.some((w) => t === w || t.startsWith(w + ' '));
}

export function isNo(text) {
  const t = normalize(text);
  return NO_WORDS.some((w) => t === w || t.startsWith(w + ' '));
}

export function isDetailRequest(text) {
  const t = normalize(text);
  return DETAIL_WORDS.some((w) => t.includes(w));
}

export function isExplainIntent(text) {
  const t = normalize(text);
  return EXPLAIN_WORDS.some((w) => t.includes(w));
}

export function isReadPageRequest(text) {
  const t = normalize(text);
  return READ_PAGE_WORDS.some((w) => t.includes(w));
}

// Returns the best-matching route for free text, or null if nothing matches well.
export function resolvePageIntent(text) {
  const t = normalize(text);
  if (!t) return null;

  let best = null;
  let bestScore = 0;

  for (const route of APP_ROUTES) {
    for (const kw of route.keywords) {
      const kwNorm = normalize(kw);
      if (!kwNorm) continue;
      if (t.includes(kwNorm)) {
        const score = kwNorm.length;
        if (score > bestScore) {
          bestScore = score;
          best = route;
        }
      }
    }
  }
  return best;
}

// --- Language switching ------------------------------------------------
// Maps spoken phrases (in English AND the language's own script/Latin
// transliteration) to the language codes used in indianLanguages.js.
const LANGUAGE_NAME_TO_CODE = {
  english: 'en', ఇంగ్లీష్: 'en',
  hindi: 'hi', 'हिंदी': 'hi', 'हिन्दी': 'hi',
  telugu: 'te', తెలుగు: 'te',
  tamil: 'ta', தமிழ்: 'ta',
  kannada: 'kn', ಕನ್ನಡ: 'kn',
  malayalam: 'ml', മലയാളം: 'ml',
  marathi: 'mr', 'मराठी': 'mr',
  gujarati: 'gu', ગુજરાતી: 'gu',
  punjabi: 'pa', ਪੰਜਾਬੀ: 'pa',
  bengali: 'bn', বাংলা: 'bn',
  odia: 'or', oriya: 'or', ଓଡ଼ିଆ: 'or',
  assamese: 'as', অসমীয়া: 'as',
  urdu: 'ur',
};

const LANGUAGE_SWITCH_TRIGGERS = [
  'change language', 'switch language', 'explanation in', 'explain in',
  'speak in', 'need explanation in', 'change to', 'మార్చండి', 'భాష మార్చు',
  'भाषा बदलो', 'भाषा बदलिए',
];

// Returns a language code if this message is a "change language to X" style
// request, otherwise null.
export function detectLanguageSwitch(text) {
  const t = normalize(text);
  if (!t) return null;
  const looksLikeSwitchRequest = LANGUAGE_SWITCH_TRIGGERS.some((w) => t.includes(w));
  if (!looksLikeSwitchRequest) return null;

  for (const [name, code] of Object.entries(LANGUAGE_NAME_TO_CODE)) {
    if (t.includes(name.toLowerCase())) return code;
  }
  return null;
}

// --- "What can you do / who are you" -----------------------------------
const SELF_EXPLAIN_WORDS = [
  'what can you do', 'who are you', 'what is agri helper', 'help me understand you',
  'explain yourself', 'ఏమి చేయగలవు', 'నువ్వు ఎవరు', 'तुम क्या कर सकते हो', 'तुम कौन हो',
];

export function isSelfExplainRequest(text) {
  const t = normalize(text);
  return SELF_EXPLAIN_WORDS.some((w) => t.includes(w));
}
