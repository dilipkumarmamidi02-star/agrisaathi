// 26 languages: the 22 official Indian languages (8th Schedule) + English,
// plus 3 additional regional languages that tested as genuinely distinct
// from their closest mainstream relative (Rajasthani, Chhattisgarhi, Tulu).
//
// Bhojpuri and Magahi were tested and dropped — the backend LLM
// consistently collapsed them into plain Hindi even with explicit
// prompt hints, so rather than ship a silently-broken language option,
// they were removed.
//
// `locale` is the BCP-47 code passed to SpeechRecognition/speechSynthesis.
// For raj/hne/tcy below, no major browser/OS ships a dedicated voice —
// `locale` falls back to the closest supported voice so speech doesn't
// silently fail, but the accent won't be native. Backend text translation
// is unaffected by this and works correctly for all 26.
export const INDIAN_LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-IN' },
  { code: 'hi', label: 'हिन्दी', locale: 'hi-IN' },
  { code: 'te', label: 'తెలుగు', locale: 'te-IN' },
  { code: 'ta', label: 'தமிழ்', locale: 'ta-IN' },
  { code: 'kn', label: 'ಕನ್ನಡ', locale: 'kn-IN' },
  { code: 'ml', label: 'മലയാളം', locale: 'ml-IN' },
  { code: 'mr', label: 'मराठी', locale: 'mr-IN' },
  { code: 'gu', label: 'ગુજરાતી', locale: 'gu-IN' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', locale: 'pa-IN' },
  { code: 'bn', label: 'বাংলা', locale: 'bn-IN' },
  { code: 'or', label: 'ଓଡ଼ିଆ', locale: 'or-IN' },
  { code: 'as', label: 'অসমীয়া', locale: 'as-IN' },
  { code: 'ur', label: 'اردو', locale: 'ur-IN' },
  { code: 'sa', label: 'संस्कृतम्', locale: 'sa-IN' },
  { code: 'ks', label: 'کٲشُر', locale: 'ks-IN' },
  { code: 'sd', label: 'سنڌي', locale: 'sd-IN' },
  { code: 'ne', label: 'नेपाली', locale: 'ne-IN' },
  { code: 'kok', label: 'कोंकणी', locale: 'kok-IN' },
  { code: 'mni', label: 'মৈতৈলোন্', locale: 'mni-IN' },
  { code: 'doi', label: 'डोगरी', locale: 'doi-IN' },
  { code: 'brx', label: 'बड़ो', locale: 'brx-IN' },
  { code: 'sat', label: 'संताली', locale: 'sat-IN' },
  { code: 'mai', label: 'मैथिली', locale: 'mai-IN' },

  // --- 3 additional regional languages, tested and confirmed distinct ---
  { code: 'raj', label: 'राजस्थानी', locale: 'hi-IN' }, // no native voice, falls back to Hindi TTS
  { code: 'hne', label: 'छत्तीसगढ़ी', locale: 'hi-IN' }, // no native voice, falls back to Hindi TTS
  { code: 'tcy', label: 'ತುಳು', locale: 'kn-IN' },      // no native voice, falls back to Kannada TTS
];
