// ============================================================
// AgriSaathi — Deterministic Helper Page Router
// ============================================================
// This file maps natural-language helper requests to EXISTING
// React application routes.
//
// IMPORTANT:
// - Do not create new pages here.
// - Every route below must already exist in App.jsx.
// - Backend RAG remains responsible for factual/data questions.
// - This router is responsible for navigation intent.
// ============================================================

export const APP_ROUTES = [
  {
    path: '/speak-to-agrisaathi',
    label: 'Speak to AgriSaathi',
    description: 'Voice-first agricultural knowledge assistant. Tap and speak your problem to get grounded answers from verified sources.',
    keywords: [
      'speak to agrisaathi',
      'speak',
      'voice assistant',
      'ask agrisaathi',
      'tap to speak',
      'మాట్లాడండి',
      'बोलें',
    ],
  },

  {
    path: '/dashboard',
    label: 'Dashboard',
    description: 'Your farm overview with plots, weather, upcoming activities, and quick access to AgriSaathi tools.',
    keywords: [
      'dashboard',
      'home',
      'farm dashboard',
      'my dashboard',
      'main page',
      'డాష్‌బోర్డ్',
      'హోమ్',
      'होम',
      'डैशबोर्ड',
    ],
  },

  {
    path: '/diagnose',
    label: 'Diagnose',
    description: 'Upload or take a crop or animal photo and use AgriSaathi diagnosis tools to identify possible problems and get precautions.',
    keywords: [
      'diagnose',
      'diagnosis',
      'crop diagnosis',
      'plant diagnosis',
      'disease diagnosis',
      'identify disease',
      'identify crop disease',
      'identify pest',
      'crop disease',
      'plant disease',
      'sick crop',
      'sick plant',
      'sick animal',
      'animal disease',
      'problem in crop',
      'problem with crop',
      'what disease',
      'what is wrong with my crop',
      'పంట వ్యాధి',
      'వ్యాధి నిర్ధారణ',
      'నిర్ధారణ',
      'రోగం',
      'रोग',
      'निदान',
      'फसल रोग',
    ],
  },

  {
    path: '/crops',
    label: 'Crops',
    description: 'Browse crop-related information and crop tools available in AgriSaathi.',
    keywords: [
      'crops',
      'crop page',
      'crop information',
      'crop details',
      'my crops',
      'పంటలు',
      'పంట సమాచారం',
      'फसल',
      'फसल जानकारी',
    ],
  },

  {
    path: '/crop-planner',
    label: 'Crop Planner',
    description: 'Plan what to grow using crop suitability information, soil and water considerations, and crop-care planning.',
    keywords: [
      'crop planner',
      'crop plan',
      'crop planning',
      'plan crop',
      'plan my crop',
      'which crop should i grow',
      'what crop should i grow',
      'what to grow',
      'which crop',
      'crop selection',
      'crop recommendation',
      'crop recommendations',
      'పంట ప్రణాళిక',
      'క్రాప్ ప్లానర్',
      'ఏ పంట వేయాలి',
      'फसल योजना',
      'कौन सी फसल उगाएं',
    ],
  },

  {
    path: '/crop-passport',
    label: 'Crop Passport',
    description: 'Maintain a tamper-evident record of your crop batch, including soil, water, sowing, and harvest history.',
    keywords: [
      'crop passport',
      'crop batch passport',
      'passport for crop',
      'crop record',
      'crop history',
      'పంట పాస్‌పోర్ట్',
      'క్రాప్ పాస్‌పోర్ట్',
      'फसल पासपोर्ट',
    ],
  },

  {
    path: '/crop-encyclopedia',
    label: 'Crop Encyclopedia',
    description: 'Browse detailed crop information and reference material.',
    keywords: [
      'crop encyclopedia',
      'crop encyclopaedia',
      'crop library',
      'crop knowledge',
      'crop reference',
      'పంట విజ్ఞాన సర్వస్వం',
      'फसल विश्वकोश',
    ],
  },

  {
    path: '/soil-passport',
    label: 'Soil Passport',
    description: 'Record and view soil-test information such as pH, nitrogen, phosphorus, potassium, and moisture.',
    keywords: [
      'soil passport',
      'soil test',
      'soil report',
      'soil health',
      'soil information',
      'soil details',
      'soil values',
      'soil pH',
      'soil ph',
      'soil nutrients',
      'నేల పాస్‌పోర్ట్',
      'నేల పరీక్ష',
      'నేల ఆరోగ్యం',
      'मिट्टी',
      'मिट्टी जांच',
      'मृदा परीक्षण',
    ],
  },

  {
    path: '/sensor-lab',
    label: 'Sensor Lab',
    description: 'Enter soil and water samples through supported sensor or manual-entry workflows and get field suitability information.',
    keywords: [
      'sensor lab',
      'sensor',
      'soil sensor',
      'water sensor',
      'soil sample',
      'water sample',
      'soil sampling',
      'sensor data',
      'సెన్సార్',
      'నేల నమూనా',
      'మట్టి सेंसर',
    ],
  },

  {
    path: '/sensor-hub',
    label: 'Sensor Hub',
    description: 'Access the farm sensor and monitoring hub.',
    keywords: [
      'sensor hub',
      'farm sensors',
      'sensor monitoring',
      'సెన్సార్ హబ్',
    ],
  },

  {
    path: '/fertilizer',
    label: 'Fertilizer',
    description: 'Use fertilizer-related tools and information for crop nutrition decisions.',
    keywords: [
      'fertilizer',
      'fertiliser',
      'fertilizer recommendation',
      'fertilizer plan',
      'fertilizer advice',
      'fertilizer information',
      'nutrient recommendation',
      'manure',
      'ఎరువులు',
      'ఎరువు',
      'ఎరువుల సలహా',
      'उर्वरक',
      'खाद',
    ],
  },

  {
    path: '/treatments',
    label: 'Treatments',
    description: 'Access crop and agricultural treatment information.',
    keywords: [
      'treatment',
      'treatments',
      'crop treatment',
      'plant treatment',
      'disease treatment',
      'pest treatment',
      'చికిత్స',
      'పంట చికిత్స',
      'उपचार',
      'फसल उपचार',
    ],
  },

  {
    path: '/pest-library',
    label: 'Pest Library',
    description: 'Browse pest-related reference information and management guidance.',
    keywords: [
      'pest library',
      'pest',
      'pests',
      'insect',
      'insects',
      'crop pest',
      'plant pest',
      'pest information',
      'పురుగులు',
      'కీటకాలు',
      'పెస్ట్',
      'कीट',
      'कीट नियंत्रण',
    ],
  },

  {
    path: '/livestock-care',
    label: 'Livestock Care',
    description: 'Track animal health milestones, feeding schedules, vaccinations, and livestock care.',
    keywords: [
      'livestock',
      'livestock care',
      'animal care',
      'animal health',
      'cattle',
      'cow care',
      'buffalo',
      'goat',
      'sheep',
      'poultry',
      'chicken farming',
      'dairy',
      'animal vaccination',
      'పశువుల సంరక్షణ',
      'పశువులు',
      'జంతు సంరక్షణ',
      'पशुधन',
      'पशु देखभाल',
    ],
  },

  {
    path: '/animal-encyclopedia',
    label: 'Animal Encyclopedia',
    description: 'Browse livestock and animal reference information including breeds, feeding, vaccination, environment, and production guidance.',
    keywords: [
      'animal encyclopedia',
      'animal encyclopaedia',
      'animal breeds',
      'livestock breeds',
      'poultry breeds',
      'dairy breeds',
      'goat breeds',
      'fish farming',
      'fish breeds',
      'apiculture',
      'bee keeping',
      'beekeeping',
      'piggery',
      'rabbit farming',
      'animal vaccination schedule',
      'animal reference',
      'జంతు విజ్ఞాన సర్వస్వం',
      'పశు విజ్ఞాన సర్వస్వం',
      'పశు జాతులు',
      'पशु विश्वकोश',
      'पशु नस्ल',
    ],
  },

  {
    path: '/market-prices',
    label: 'Market Prices',
    description: 'Check mandi and government market prices for agricultural commodities.',
    keywords: [
      'market price',
      'market prices',
      'mandi price',
      'mandi prices',
      'mandi rate',
      'mandi rates',
      'market rate',
      'market rates',
      'price today',
      'today price',
      'current market price',
      'current price',
      'commodity price',
      'crop price',
      'selling price',
      'tomato price',
      'onion price',
      'potato price',
      'మార్కెట్ ధర',
      'మార్కెట్ ధరలు',
      'మండి ధర',
      'మండి రేటు',
      'ఈరోజు ధర',
      'आज का भाव',
      'मंडी भाव',
      'बाजार भाव',
    ],
  },

  {
    path: '/data-gov',
    label: 'Government Data',
    description: 'View live government agricultural datasets and Data.gov.in information.',
    keywords: [
      'data gov',
      'datagov',
      'data.gov.in',
      'government data',
      'live government data',
      'government agricultural data',
      'official data',
      'ప్రభుత్వ డేటా',
      'सरकारी डेटा',
    ],
  },

  {
    path: '/near-me',
    label: 'Near Me',
    description: 'Find nearby KVKs, government markets, agricultural shops, and other useful agricultural services.',
    keywords: [
      'near me',
      'nearby',
      'near me market',
      'nearby market',
      'nearby kvk',
      'nearby agriculture',
      'nearby agri shop',
      'nearby agricultural shop',
      'closest market',
      'closest kvk',
      'nearest market',
      'nearest kvk',
      'దగ్గర్లో',
      'దగ్గరలో',
      'నా దగ్గర',
      'पास में',
      'मेरे पास',
      'नजदीकी',
    ],
  },

  {
    path: '/weather',
    label: 'Weather',
    description: 'See current weather conditions and forecasts for your farm location.',
    keywords: [
      'weather',
      'current weather',
      'weather forecast',
      'forecast',
      'rain forecast',
      'rain today',
      'will it rain',
      'temperature',
      'weather today',
      'farm weather',
      'వాతావరణం',
      'వాతావరణ సమాచారం',
      'వర్ష సూచన',
      'వర్షం పడుతుందా',
      'मौसम',
      'मौसम पूर्वानुमान',
      'बारिश',
    ],
  },

  {
    path: '/weather-analytics',
    label: 'Weather Analytics',
    description: 'View weather trends, current conditions, forecast information, and weather analytics for your farm location.',
    keywords: [
      'weather analytics',
      'weather analysis',
      'weather data',
      'weather trends',
      'climate data',
      'forecast analytics',
      'weather history',
      'weather statistics',
      'వాతావరణ విశ్లేషణ',
      'వాతావరణ డేటా',
      'मौसम विश्लेषण',
      'मौसम डेटा',
    ],
  },

  {
    path: '/weather-alerts',
    label: 'Weather Alerts',
    description: 'See severe-weather alerts and forecast warnings for your farm location.',
    keywords: [
      'weather alerts',
      'weather alert',
      'rain alert',
      'storm alert',
      'flood alert',
      'cyclone alert',
      'severe weather',
      'weather warning',
      'rain warning',
      'వాతావరణ హెచ్చరిక',
      'వర్ష హెచ్చరిక',
      'मौसम चेतावनी',
      'बारिश चेतावनी',
    ],
  },

  {
    path: '/irrigation-planner',
    label: 'Irrigation Planner',
    description: 'Plan irrigation timing using crop, soil moisture, and weather information.',
    keywords: [
      'irrigation',
      'irrigation planner',
      'irrigation plan',
      'water schedule',
      'water planning',
      'when to irrigate',
      'when should i water',
      'how much water',
      'farm water',
      'నీటిపారుదల',
      'నీటి షెడ్యూల్',
      'పంటకు నీరు',
      'सिंचाई',
      'पानी का समय',
    ],
  },

  {
    path: '/farm-ledger',
    label: 'Farm Ledger',
    description: 'Record farm expenses and income and view your costs, revenue, and margins.',
    keywords: [
      'farm ledger',
      'ledger',
      'farm accounts',
      'farm accounting',
      'farm expenses',
      'expenses',
      'expense record',
      'income',
      'farm income',
      'revenue',
      'profit',
      'margin',
      'ఖర్చులు',
      'ఆదాయం',
      'లెడ్జర్',
      'వ్యవసాయ ఖాతాలు',
      'खर्च',
      'आय',
      'खाता',
    ],
  },

  {
    path: '/expense-analytics',
    label: 'Expense Analytics',
    description: 'Analyze farm expenses and spending patterns.',
    keywords: [
      'expense analytics',
      'expense analysis',
      'spending analysis',
      'cost analysis',
      'farm cost analysis',
      'ఖర్చుల విశ్లేషణ',
      'వ్యయ విశ్లేషణ',
    ],
  },

  {
    path: '/inventory-tracker',
    label: 'Inventory',
    description: 'Track fertilizer, seed, pesticide, and other farm stock with low-stock alerts.',
    keywords: [
      'inventory',
      'inventory tracker',
      'stock',
      'stock tracker',
      'farm stock',
      'fertilizer stock',
      'seed stock',
      'pesticide stock',
      'low stock',
      'నిల్వ',
      'స్టాక్',
      'భండారం',
      'भंडार',
      'स्टॉक',
    ],
  },

  {
    path: '/equipment-registry',
    label: 'Equipment Registry',
    description: 'Register and browse farm equipment and machinery available for use or rental.',
    keywords: [
      'equipment',
      'equipment registry',
      'farm equipment',
      'farm machinery',
      'machinery',
      'tractor',
      'tractor equipment',
      'farm machine',
      'పరికరాలు',
      'వ్యవసాయ యంత్రాలు',
      'ట్రాక్టర్',
      'उपकरण',
      'कृषि मशीन',
      'ट्रैक्टर',
    ],
  },

  {
    path: '/marketplace',
    label: 'Resource Marketplace',
    description: 'Buy, sell, or rent farm inputs, equipment, and agricultural resources.',
    keywords: [
      'marketplace',
      'resource marketplace',
      'farm marketplace',
      'agri marketplace',
      'buy equipment',
      'sell equipment',
      'rent equipment',
      'rent tractor',
      'buy tractor',
      'sell tractor',
      'farm inputs marketplace',
      'మార్కెట్‌ప్లేస్',
      'వ్యవసాయ మార్కెట్',
      'कृषि बाजार',
      'मार्केटप्लेस',
    ],
  },

  {
    path: '/input-marketplace',
    label: 'Input Marketplace',
    description: 'Browse agricultural inputs and related marketplace services.',
    keywords: [
      'input marketplace',
      'farm input market',
      'agri inputs',
      'buy seeds',
      'buy fertilizer',
      'buy pesticides',
      'వ్యవసాయ ఇన్‌పుట్స్',
      'कृषि इनपुट',
    ],
  },

  {
    path: '/schemes',
    label: 'Government Schemes',
    description: 'Browse central and state agriculture schemes, subsidies, and farmer-support programs.',
    keywords: [
      'scheme',
      'schemes',
      'government scheme',
      'government schemes',
      'agriculture scheme',
      'farmer scheme',
      'subsidy',
      'subsidies',
      'government subsidy',
      'farmer subsidy',
      'benefit scheme',
      'పథకం',
      'ప్రభుత్వ పథకం',
      'రైతు పథకం',
      'సబ్సిడీ',
      'योजना',
      'सरकारी योजना',
      'किसान योजना',
      'सब्सिडी',
    ],
  },

  {
    path: '/loan-eligibility',
    label: 'Loan Eligibility',
    description: 'Check informational loan-eligibility guidance based on your crop and farm details.',
    keywords: [
      'loan eligibility',
      'loan eligible',
      'eligible for loan',
      'farmer loan',
      'agriculture loan',
      'farm loan',
      'loan',
      'credit eligibility',
      'రుణ అర్హత',
      'రైతు రుణం',
      'వ్యవసాయ రుణం',
      'ఋణం',
      'ऋण पात्रता',
      'किसान ऋण',
      'कृषि ऋण',
      'लोन',
    ],
  },

  {
    path: '/loan-calculator',
    label: 'Loan Calculator',
    description: 'Calculate and explore agricultural loan repayment figures.',
    keywords: [
      'loan calculator',
      'calculate loan',
      'loan calculation',
      'emi',
      'loan emi',
      'interest calculation',
      'రుణ కాలిక్యులేటర్',
      'లోన్ కాలిక్యులేటర్',
      'ऋण कैलकुलेटर',
      'लोन कैलकुलेटर',
    ],
  },

  {
    path: '/insurance-hub',
    label: 'Insurance',
    description: 'Access crop-insurance information and prepare agricultural damage evidence.',
    keywords: [
      'insurance',
      'crop insurance',
      'farm insurance',
      'agriculture insurance',
      'insurance scheme',
      'insurance claim',
      'crop damage insurance',
      'బీమా',
      'పంట బీమా',
      'बीमा',
      'फसल बीमा',
    ],
  },

  {
    path: '/insurance-hub-vault',
    label: 'Insurance Vault',
    description: 'Access stored insurance-related evidence and records.',
    keywords: [
      'insurance vault',
      'insurance evidence',
      'insurance records',
      'claim evidence',
      'బీమా రికార్డులు',
      'बीमा रिकॉर्ड',
    ],
  },

  {
    path: '/community',
    label: 'Community',
    description: 'Connect with other farmers growing similar crops or working with similar farm conditions.',
    keywords: [
      'community',
      'farmer community',
      'farmers community',
      'other farmers',
      'farmer forum',
      'farm forum',
      'సంఘం',
      'రైతుల సంఘం',
      'समुदाय',
      'किसान समुदाय',
    ],
  },

  {
    path: '/community-forum',
    label: 'Community Forum',
    description: 'Participate in the AgriSaathi farmer discussion forum.',
    keywords: [
      'community forum',
      'farmer forum',
      'discussion forum',
      'forum',
      'ఫోరం',
      'రైతుల ఫోరం',
      'किसान फोरम',
    ],
  },

  {
    path: '/profile-settings',
    label: 'Profile & Settings',
    description: 'Manage your account, language, and application settings.',
    keywords: [
      'profile',
      'settings',
      'account settings',
      'app settings',
      'language settings',
      'my profile',
      'ప్రొఫైల్',
      'సెట్టింగ్స్',
      'ఖాతా',
      'प्रोफाइल',
      'सेटिंग्स',
    ],
  },

  {
    path: '/harvest-records',
    label: 'Harvest Records',
    description: 'Record and review your crop harvest information.',
    keywords: [
      'harvest',
      'harvest records',
      'harvest record',
      'crop harvest',
      'harvest history',
      'పంట కోత',
      'కోత రికార్డులు',
      'फसल कटाई',
    ],
  },

  {
    path: '/task-manager',
    label: 'Task Manager',
    description: 'Manage your farm tasks and upcoming agricultural activities.',
    keywords: [
      'task manager',
      'tasks',
      'farm tasks',
      'my tasks',
      'todo',
      'farm todo',
      'పనులు',
      'వ్యవసాయ పనులు',
      'कार्य',
      'कृषि कार्य',
    ],
  },

  {
    path: '/farm-notifications',
    label: 'Farm Notifications',
    description: 'View notifications related to your farm activities and services.',
    keywords: [
      'farm notifications',
      'notifications',
      'farm notification',
      'అధిసూచనలు',
      'నోటిఫికేషన్లు',
      'सूचनाएं',
      'नोटिफिकेशन',
    ],
  },

  {
    path: '/alerts-center',
    label: 'Alerts Center',
    description: 'View important alerts and notifications across AgriSaathi.',
    keywords: [
      'alerts center',
      'all alerts',
      'alerts',
      'important alerts',
      'హెచ్చరికలు',
      'అలర్ట్స్',
      'अलर्ट',
    ],
  },

  {
    path: '/yield-benchmarks',
    label: 'Yield Benchmarks',
    description: 'Review crop-yield benchmark information.',
    keywords: [
      'yield benchmark',
      'yield benchmarks',
      'crop yield',
      'yield data',
      'yield comparison',
      'పంట దిగుబడి',
      'దిగుబడి',
      'उपज',
      'फसल उपज',
    ],
  },

  {
    path: '/sustainability-score',
    label: 'Sustainability Score',
    description: 'Review sustainability indicators for your farming practices.',
    keywords: [
      'sustainability',
      'sustainability score',
      'farm sustainability',
      'sustainable farming',
      'సుస్థిర వ్యవసాయం',
      'सतत खेती',
    ],
  },

  {
    path: '/expert-directory',
    label: 'Expert Directory',
    description: 'Find agricultural experts and professional support.',
    keywords: [
      'expert',
      'experts',
      'expert directory',
      'agriculture expert',
      'agri expert',
      'farm expert',
      'agronomist',
      'వ్యవసాయ నిపుణులు',
      'నిపుణుడు',
      'कृषि विशेषज्ञ',
    ],
  },

  {
    path: '/vendor-contacts',
    label: 'Vendor Contacts',
    description: 'Access agricultural vendor and supplier contact information.',
    keywords: [
      'vendor',
      'vendors',
      'vendor contacts',
      'supplier',
      'suppliers',
      'farm supplier',
      'agri supplier',
      'విక్రేత',
      'సరఫరాదారు',
      'विक्रेता',
      'आपूर्तिकर्ता',
    ],
  },

  {
    path: '/training-center',
    label: 'Training Center',
    description: 'Access agricultural training and learning resources.',
    keywords: [
      'training center',
      'training',
      'farmer training',
      'agriculture training',
      'learn farming',
      'శిక్షణ',
      'రైతు శిక్షణ',
      'प्रशिक्षण',
      'किसान प्रशिक्षण',
    ],
  },

  {
    path: '/training-academy',
    label: 'Training Academy',
    description: 'Access structured agricultural learning and training resources.',
    keywords: [
      'training academy',
      'agriculture academy',
      'farmer academy',
      'learning academy',
      'వ్యవసాయ అకాడమీ',
      'कृषि अकादमी',
    ],
  },

  {
    path: '/document-wallet',
    label: 'Document Wallet',
    description: 'Store and access your agricultural documents and records.',
    keywords: [
      'document wallet',
      'documents',
      'farm documents',
      'agriculture documents',
      'my documents',
      'డాక్యుమెంట్లు',
      'పత్రాలు',
      'दस्तावेज',
    ],
  },

  {
    path: '/export-reports',
    label: 'Export Reports',
    description: 'Generate and export farm reports.',
    keywords: [
      'export reports',
      'export report',
      'farm report',
      'generate report',
      'download report',
      'రిపోర్ట్',
      'రిపోర్టులు',
      'रिपोर्ट',
    ],
  },

  {
    path: '/export-data',
    label: 'Export Data',
    description: 'Export your AgriSaathi farm data.',
    keywords: [
      'export data',
      'download data',
      'my data',
      'farm data export',
      'డేటా ఎగుమతి',
      'डेटा निर्यात',
    ],
  },

  {
    path: '/equipment-registry',
    label: 'Equipment Registry',
    description: 'Register and browse agricultural machinery and equipment.',
    keywords: [
      'equipment registry',
      'machinery registry',
      'register equipment',
      'farm machinery registry',
      'పరికరాల రిజిస్ట్రీ',
    ],
  },

  {
    path: '/feedback-corner',
    label: 'Feedback Corner',
    description: 'Send feedback about AgriSaathi.',
    keywords: [
      'feedback',
      'give feedback',
      'send feedback',
      'feedback corner',
      'అభిప్రాయం',
      'సూచనలు',
      'प्रतिक्रिया',
      'सुझाव',
    ],
  },

  {
    path: '/success-stories',
    label: 'Success Stories',
    description: 'Read farmer success stories and agricultural experiences.',
    keywords: [
      'success stories',
      'farmer success',
      'farmer stories',
      'success story',
      'రైతు విజయగాథలు',
      'सफलता की कहानियां',
    ],
  },

  {
    path: '/support-tickets',
    label: 'Support',
    description: 'Create and manage AgriSaathi support requests.',
    keywords: [
      'support',
      'support ticket',
      'support tickets',
      'help ticket',
      'technical support',
      'సపోర్ట్',
      'సహాయం',
      'समर्थन',
      'मदद',
    ],
  },

  {
    path: '/voice-notes',
    label: 'Voice Notes',
    description: 'Create and access voice notes for your farm.',
    keywords: [
      'voice notes',
      'voice note',
      'record voice',
      'my voice notes',
      'వాయిస్ నోట్స్',
      'आवाज नोट्स',
    ],
  },

  {
    path: '/alerts-center',
    label: 'Alerts Center',
    description: 'Review important AgriSaathi alerts.',
    keywords: [
      'alerts center',
      'all alerts',
      'alerts',
      'అలర్ట్స్ సెంటర్',
      'अलर्ट सेंटर',
    ],
  },
];

// ============================================================
// Generic intent words
// ============================================================

const YES_WORDS = [
  'yes',
  'yeah',
  'yep',
  'ok',
  'okay',
  'sure',
  'open it',
  'open',
  'go there',
  'take me there',
  'show it',
  'show me',
  'avunu',
  'అవును',
  'అవును ఓపెన్ చేయి',
  'हाँ',
  'हां',
  'ठीक है',
];

const NO_WORDS = [
  'no',
  'nope',
  'nah',
  'not now',
  'dont open',
  "don't open",
  'kadu',
  'కాదు',
  'వద్దు',
  'nahi',
  'नहीं',
  'मत खोलो',
];

const DETAIL_WORDS = [
  'detail',
  'details',
  'info',
  'information',
  'tell me',
  'explain',
  'data',
  'what about',
  'how does it work',
  'విషయాలు',
  'వివరాలు',
  'సమాచారం',
  'చెప్పు',
  'जानकारी',
  'विवरण',
];

const EXPLAIN_WORDS = [
  'what is',
  'what are',
  'tell me about',
  'how do i use',
  'how to use',
  'how can i use',
  'explain',
  'explain this',
  'what does',
  'what can i do with',
  'ఏమిటి',
  'ఏంటి',
  'గురించి చెప్పు',
  'ఎలా వాడాలి',
  'ఎలా ఉపయోగించాలి',
  'क्या है',
  'के बारे में बताओ',
  'कैसे इस्तेमाल',
];

const READ_PAGE_WORDS = [
  'read this page',
  'read this',
  'read the page',
  'read page',
  'read content',
  'read it',
  'read this aloud',
  'read aloud',
  'చదవండి',
  'ఇది చదవండి',
  'పేజీ చదవండి',
  'పేజీ చదువు',
  'पढ़ो',
  'इसे पढ़ो',
  'पेज पढ़ो',
];

const normalize = (s) =>
  (s || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

export function isYes(text) {
  const t = normalize(text);
  return YES_WORDS.some((w) => t === w || t.startsWith(`${w} `));
}

export function isNo(text) {
  const t = normalize(text);
  return NO_WORDS.some((w) => t === w || t.startsWith(`${w} `));
}

export function isDetailRequest(text) {
  const t = normalize(text);
  return DETAIL_WORDS.some((w) => t.includes(normalize(w)));
}

export function isExplainIntent(text) {
  const t = normalize(text);
  return EXPLAIN_WORDS.some((w) => t.includes(normalize(w)));
}

export function isReadPageRequest(text) {
  const t = normalize(text);
  return READ_PAGE_WORDS.some((w) => t.includes(normalize(w)));
}

// ============================================================
// Deterministic page matching
// ============================================================

export function resolvePageIntent(text) {
  const t = normalize(text);
  if (!t) return null;

  let best = null;
  let bestScore = 0;

  for (const route of APP_ROUTES) {
    for (const keyword of route.keywords) {
      const kw = normalize(keyword);
      if (!kw) continue;

      if (t === kw) {
        const score = 10000 + kw.length;
        if (score > bestScore) {
          bestScore = score;
          best = route;
        }
        continue;
      }

      if (t.includes(kw)) {
        const wordBonus = kw.includes(' ')
          ? 500
          : 100;

        const score = wordBonus + kw.length;

        if (score > bestScore) {
          bestScore = score;
          best = route;
        }
      }
    }
  }

  return best;
}

// ============================================================
// Language switching
// ============================================================

const LANGUAGE_NAME_TO_CODE = {
  english: 'en',
  ఇంగ్లీష్: 'en',

  hindi: 'hi',
  हिंदी: 'hi',
  हिन्दी: 'hi',

  telugu: 'te',
  తెలుగు: 'te',

  tamil: 'ta',
  தமிழ்: 'ta',

  kannada: 'kn',
  ಕನ್ನಡ: 'kn',

  malayalam: 'ml',
  മലയാളം: 'ml',

  marathi: 'mr',
  मराठी: 'mr',

  gujarati: 'gu',
  ગુજરાતી: 'gu',

  punjabi: 'pa',
  ਪੰਜਾਬੀ: 'pa',

  bengali: 'bn',
  বাংলা: 'bn',

  odia: 'or',
  oriya: 'or',
  ଓଡ଼ିଆ: 'or',

  assamese: 'as',
  অসমীয়া: 'as',

  urdu: 'ur',
};

const LANGUAGE_SWITCH_TRIGGERS = [
  'change language',
  'switch language',
  'explanation in',
  'explain in',
  'speak in',
  'need explanation in',
  'change to',
  'language to',
  'మార్చండి',
  'భాష మార్చు',
  'భాష మార్చండి',
  'भाषा बदलो',
  'भाषा बदलिए',
];

export function detectLanguageSwitch(text) {
  const t = normalize(text);
  if (!t) return null;

  const looksLikeSwitchRequest = LANGUAGE_SWITCH_TRIGGERS.some((w) =>
    t.includes(normalize(w))
  );

  if (!looksLikeSwitchRequest) return null;

  for (const [name, code] of Object.entries(LANGUAGE_NAME_TO_CODE)) {
    if (t.includes(normalize(name))) {
      return code;
    }
  }

  return null;
}

// ============================================================
// Self explanation
// ============================================================

const SELF_EXPLAIN_WORDS = [
  'what can you do',
  'who are you',
  'what is agri helper',
  'what is agri saathi helper',
  'help me understand you',
  'explain yourself',
  'what features can you open',
  'what pages can you open',
  'ఏమి చేయగలవు',
  'నువ్వు ఎవరు',
  'నువ్వు ఏం చేయగలవు',
  'तुम क्या कर सकते हो',
  'तुम कौन हो',
];

export function isSelfExplainRequest(text) {
  const t = normalize(text);

  return SELF_EXPLAIN_WORDS.some((w) =>
    t.includes(normalize(w))
  );
}
