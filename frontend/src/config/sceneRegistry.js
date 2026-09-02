export const SCENE_LEVELS = {
  IMMERSIVE: 'immersive',
  CONTEXTUAL: 'contextual',
  SUBTLE: 'subtle',
};

export const sceneRegistry = {
  '/': {
    module: 'home',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'farm',
  },

  '/dashboard': {
    module: 'dashboard',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'farm-command-center',
  },

  '/crops': {
    module: 'crops',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'crop',
  },

  '/crop-planner': {
    module: 'crop-planner',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'crop-growth',
  },

  '/crop-passport': {
    module: 'crop-passport',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'crop-identity',
  },

  '/soil-passport': {
    module: 'soil',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'soil-cross-section',
  },

  '/fertilizer': {
    module: 'fertilizer',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'fertilizer',
  },

  '/pest-library': {
    module: 'pest',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'pest-macro',
  },

  '/diagnose': {
    module: 'diagnosis',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'diagnosis',
  },

  '/treatments': {
    module: 'treatments',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'treatment',
  },

  '/livestock': {
    module: 'livestock',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'livestock',
  },

  '/livestock-care': {
    module: 'livestock-care',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'livestock-care',
  },

  '/animal-encyclopedia': {
    module: 'animals',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'animal',
  },

  '/weather': {
    module: 'weather',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'weather',
  },

  '/weather-alerts': {
    module: 'weather-alerts',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'weather',
  },

  '/weather-analytics': {
    module: 'weather-analytics',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'weather',
  },

  '/market-prices': {
    module: 'market',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'mandi',
  },

  '/near-me': {
    module: 'near-me',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'map',
  },

  '/sensor-hub': {
    module: 'sensor-hub',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'smart-farm',
  },

  '/sensor-lab': {
    module: 'sensor-lab',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'laboratory',
  },

  '/irrigation-planner': {
    module: 'irrigation',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'irrigation-field',
  },

  '/harvest-records': {
    module: 'harvest',
    visualLevel: SCENE_LEVELS.IMMERSIVE,
    environment: 'harvest-field',
  },

  '/inventory-tracker': {
    module: 'inventory',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'farm-storage',
  },

  '/equipment-registry': {
    module: 'equipment',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'equipment-yard',
  },

  '/input-marketplace': {
    module: 'input-marketplace',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'agri-store',
  },

  '/resource-marketplace': {
    module: 'marketplace',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'agri-marketplace',
  },

  '/training-center': {
    module: 'training',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'agri-classroom',
  },

  '/training-academy': {
    module: 'academy',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'learning-farm',
  },

  '/community': {
    module: 'community',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-community',
  },

  '/community-forum': {
    module: 'community-forum',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-community',
  },

  '/schemes': {
    module: 'schemes',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'government-benefits',
  },

  '/insurance-hub': {
    module: 'insurance',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'protected-farm',
  },

  '/insurance-vault': {
    module: 'insurance-vault',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'secure-vault',
  },

  '/loan-eligibility': {
    module: 'loan-eligibility',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'financial-farm',
  },

  '/loan-calculator': {
    module: 'loan-calculator',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'financial',
  },

  '/farm-ledger': {
    module: 'farm-ledger',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-ledger',
  },

  '/expense-analytics': {
    module: 'expense-analytics',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-finance',
  },

  '/yield-benchmarks': {
    module: 'yield-benchmarks',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'comparative-fields',
  },

  '/task-manager': {
    module: 'task-manager',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'farm-operations',
  },

  '/alerts-center': {
    module: 'alerts',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'context-alert',
  },

  '/farm-notifications': {
    module: 'notifications',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm',
  },

  '/sustainability-score': {
    module: 'sustainability',
    visualLevel: SCENE_LEVELS.CONTEXTUAL,
    environment: 'living-farm',
  },

  '/expert-directory': {
    module: 'experts',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'expert-hub',
  },

  '/document-wallet': {
    module: 'documents',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'document-vault',
  },

  '/export-reports': {
    module: 'reports',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'report-workspace',
  },

  '/export-data': {
    module: 'export',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'data-export',
  },

  '/voice-notes': {
    module: 'voice-notes',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'voice',
  },

  '/feedback-corner': {
    module: 'feedback',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-community',
  },

  '/support-tickets': {
    module: 'support',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'support',
  },

  '/profile-settings': {
    module: 'profile',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'farm-identity',
  },

  '/login': {
    module: 'login',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'authentication',
  },

  '/register': {
    module: 'register',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'authentication',
  },

  '/forgot-password': {
    module: 'forgot-password',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'authentication',
  },

  '/reset-password': {
    module: 'reset-password',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'authentication',
  },

  '/oauth-consent': {
    module: 'oauth',
    visualLevel: SCENE_LEVELS.SUBTLE,
    environment: 'authentication',
  },
};
