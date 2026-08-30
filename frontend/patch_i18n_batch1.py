#!/usr/bin/env python3
"""
Run from ~/Downloads/agrisaathi/frontend:
    python3 patch_i18n_batch1.py

What it does:
 1. Adds new keys to `labels` in src/lib/i18n.jsx (en/hi/te), skipping any
    key that already exists.
 2. For each target file: adds `import { useLang } from '../lib/i18n';`
    if missing, and replaces the hardcoded strings with t('key') calls.
 3. Prints a checklist at the end of files that need
    `const { t } = useLang();` added manually inside the component body
    (can't safely auto-detect insertion point across different component
    styles).
"""
import re

# ---------------------------------------------------------------------------
# 1. New translation keys
# ---------------------------------------------------------------------------
NEW_LABELS = {
    "state": ("State", "राज्य", "రాష్ట్రం"),
    "district": ("District", "जिला", "జిల్లా"),
    "districts": ("Districts", "जिले", "జిల్లాలు"),
    "mandal": ("Mandal", "मंडल", "మండలం"),
    "village": ("Village", "गांव", "గ్రామం"),
    "pincode": ("Pincode", "पिन कोड", "పిన్ కోడ్"),
    "cropSingular": ("Crop", "फसल", "పంట"),
    "name": ("Name", "नाम", "పేరు"),
    "type": ("Type", "प्रकार", "రకం"),
    "category": ("Category", "श्रेणी", "వర్గం"),
    "unit": ("Unit", "इकाई", "యూనిట్"),
    "titleField": ("Title", "शीर्षक", "శీర్షిక"),
    "cost": ("Cost", "लागत", "ఖర్చు"),
    "revenue": ("Revenue", "राजस्व", "ఆదాయం"),
    "profit": ("Profit", "लाभ", "లాభం"),
    "income": ("Income", "आय", "ఆదాయం"),
    "expense": ("Expense", "व्यय", "ఖర్చు"),
    "net": ("Net", "शुद्ध", "నికర"),
    "signIn": ("Sign in", "साइन इन करें", "సైన్ ఇన్ చేయండి"),
    "email": ("Email", "ईमेल", "ఇమెయిల్"),
    "password": ("Password", "पासवर्ड", "పాస్‌వర్డ్"),
    "connect": ("Connect", "कनेक्ट करें", "కనెక్ట్ చేయండి"),
    "connectSensor": ("Connect sensor", "सेंसर कनेक्ट करें", "సెన్సార్‌ను కనెక్ట్ చేయండి"),
    "analyze": ("Analyze", "विश्लेषण करें", "విశ్లేషించండి"),
    "analyzing": ("Analyzing...", "विश्लेषण हो रहा है...", "విశ్లేషిస్తోంది..."),
    "analyzeSoil": ("Analyze Soil", "मिट्टी का विश्लेषण करें", "నేలను విశ్లేషించండి"),
    "checkWaterSuitability": ("Check Water Suitability", "पानी की उपयुक्तता जांचें", "నీటి అనుకూలతను తనిఖీ చేయండి"),
    "dismiss": ("Dismiss", "खारिज करें", "తీసివేయి"),
    "agriHelper": ("Agri Helper", "एग्री हेल्पर", "అగ్రి హెల్పర్"),
    "allTools": ("All Tools", "सभी उपकरण", "అన్ని సాధనాలు"),
    "weatherDataUnavailable": ("Weather data unavailable", "मौसम डेटा उपलब्ध नहीं", "వాతావరణ డేటా అందుబాటులో లేదు"),
    "speakToAgriSaathi": ("Speak to AgriSaathi", "एग्रीसाथी से बात करें", "అగ్రిసాథీతో మాట్లాడండి"),
    "tapAndSpeak": ("Tap and speak your problem", "टैप करें और अपनी समस्या बताएं", "నొక్కి మీ సమస్యను చెప్పండి"),
    "youSaid": ("You said", "आपने कहा", "మీరు చెప్పింది"),
    "all": ("All", "सभी", "అన్నీ"),
    "allIndia": ("All India", "संपूर्ण भारत", "మొత్తం భారతదేశం"),
    "allStates": ("All states", "सभी राज्य", "అన్ని రాష్ట్రాలు"),
    "any": ("Any", "कोई भी", "ఏదైనా"),
    "low": ("Low", "कम", "తక్కువ"),
    "medium": ("Medium", "मध्यम", "మధ్యస్థం"),
    "high": ("High", "उच्च", "ఎక్కువ"),
    "kharif": ("Kharif", "खरीफ", "ఖరీఫ్"),
    "rabi": ("Rabi", "रबी", "రబీ"),
    "zaid": ("Zaid", "जायद", "జైద్"),
    "perennial": ("Perennial", "बारहमासी", "శాశ్వత"),
    "acre": ("Acre", "एकड़", "ఎకరం"),
    "hectare": ("Hectare", "हेक्टेयर", "హెక్టార్"),
    "guntha": ("Guntha", "गुंठा", "గుంట"),
    "featureInDevelopment": ("This feature is being developed", "यह सुविधा विकसित की जा रही है", "ఈ ఫీచర్ అభివృద్ధిలో ఉంది"),
    "checkBackSoon": ("Check back soon for updates", "अपडेट के लिए बाद में देखें", "అప్‌డేట్‌ల కోసం త్వరలో తనిఖీ చేయండి"),
    "itemName": ("Item name", "वस्तु का नाम", "వస్తువు పేరు"),
    "currentQuantity": ("Current quantity", "वर्तमान मात्रा", "ప్రస్తుత పరిమాణం"),
    "equipmentName": ("Equipment name", "उपकरण का नाम", "పరికరం పేరు"),
    "lastMaintenance": ("Last maintenance", "पिछला रखरखाव", "చివరి నిర్వహణ"),
    "nextMaintenanceDue": ("Next maintenance due", "अगला रखरखाव देय", "తదుపరి నిర్వహణ గడువు"),
    "phoneNumber": ("Phone number", "फ़ोन नंबर", "ఫోన్ నంబర్"),
    "sowing": ("Sowing", "बुवाई", "విత్తనం"),
    "subject": ("Subject", "विषय", "విషయం"),
    "description": ("Description", "विवरण", "వివరణ"),
    "selectACrop": ("Select a crop", "फसल चुनें", "పంటను ఎంచుకోండి"),
    "selectState": ("Select state", "राज्य चुनें", "రాష్ట్రాన్ని ఎంచుకోండి"),
    "selectYourState": ("Select your state", "अपना राज्य चुनें", "మీ రాష్ట్రాన్ని ఎంచుకోండి"),
    "selectDistrict": ("Select District", "जिला चुनें", "జిల్లాను ఎంచుకోండి"),
    "searchDistrict": ("Search district...", "जिला खोजें...", "జిల్లాను వెతకండి..."),
    "yourName": ("Your name", "आपका नाम", "మీ పేరు"),
    "yourStory": ("Your story", "आपकी कहानी", "మీ కథ"),
    "reminder": ("Reminder", "अनुस्मारक", "రిమైండర్"),
    "dueDate": ("Due date", "नियत तारीख", "గడువు తేదీ"),
    "livestockVaccines": ("Livestock vaccines", "पशुधन टीके", "పశువుల టీకాలు"),
    "typeOrTapMic": ("Type or tap mic...", "टाइप करें या माइक टैप करें...", "టైప్ చేయండి లేదా మైక్ నొక్కండి..."),
    "cattle": ("Cattle", "मवेशी", "పశువులు"),
    "buffalo": ("Buffalo", "भैंस", "గేదెలు"),
    "sheep": ("Sheep", "भेड़", "గొర్రెలు"),
    "goat": ("Goat", "बकरी", "మేకలు"),
    "poultry": ("Poultry", "मुर्गी पालन", "కోళ్లు"),
    # PageHeader titles
    "yieldBenchmarksTitle": ("Yield Benchmarks", "उपज बेंचमार्क", "దిగుబడి బెంచ్‌మార్క్‌లు"),
    "alertsCenterTitle": ("Alerts Center", "अलर्ट सेंटर", "అలర్ట్స్ సెంటర్"),
    "exportDataTitle": ("Export Data", "डेटा निर्यात करें", "డేటాను ఎగుమతి చేయండి"),
    "sustainabilityScoreTitle": ("Sustainability Score", "स्थिरता स्कोर", "సుస్థిరత స్కోరు"),
    "weatherAnalyticsTitle": ("Weather Analytics", "मौसम विश्लेषण", "వాతావరణ విశ్లేషణ"),
    "inventoryTrackerTitle": ("Inventory Tracker", "इन्वेंटरी ट्रैकर", "ఇన్వెంటరీ ట్రాకర్"),
    "expertDirectoryTitle": ("Expert Directory", "विशेषज्ञ निर्देशिका", "నిపుణుల డైరెక్టరీ"),
    "equipmentRegistryTitle": ("Equipment Registry", "उपकरण रजिस्ट्री", "పరికరాల రిజిస్ట్రీ"),
    "vendorContactsTitle": ("Vendor Contacts", "विक्रेता संपर्क", "విక్రేత సంప్రదింపులు"),
    "insuranceVaultTitle": ("Insurance Vault", "बीमा वॉल्ट", "బీమా వాల్ట్"),
    "trainingAcademyTitle": ("Training Academy", "प्रशिक्षण अकादमी", "శిక్షణ అకాడమీ"),
    "supportTicketsTitle": ("Support Tickets", "सहायता टिकट", "సపోర్ట్ టికెట్లు"),
    "cropPassportTitle": ("Crop Passport", "फसल पासपोर्ट", "పంట పాస్‌పోర్ట్"),
    "successStoriesTitle": ("Success Stories", "सफलता की कहानियां", "విజయ గాథలు"),
    "resourceMarketplaceTitle": ("Resource Marketplace", "संसाधन बाज़ार", "వనరుల మార్కెట్‌ప్లేస్"),
    "farmNotificationsTitle": ("Farm Notifications", "फार्म सूचनाएं", "వ్యవసాయ నోటిఫికేషన్‌లు"),
    "feedbackCornerTitle": ("Feedback Corner", "फीडबैक कॉर्नर", "ఫీడ్‌బ్యాక్ కార్నర్"),
}

# ---------------------------------------------------------------------------
# 2. Text replacements per file: (old_exact_line_snippet, new_snippet)
# ---------------------------------------------------------------------------
FILE_PATCHES = {
    "src/components/Layout.jsx": [
        ('>Crop</button>', ">{t('cropSingular')}</button>"),
        ('>Livestock</button>', ">{t('livestock')}</button>"),
        ('>Weather</button>', ">{t('weather')}</button>"),
    ],
    "src/components/LocationFields.jsx": [
        ('<Label className="text-sm">State</Label>', "<Label className=\"text-sm\">{t('state')}</Label>"),
        ('<Label className="text-sm">District</Label>', "<Label className=\"text-sm\">{t('district')}</Label>"),
        ('<Label className="text-sm">Mandal</Label>', "<Label className=\"text-sm\">{t('mandal')}</Label>"),
        ('<Label className="text-sm">Village</Label>', "<Label className=\"text-sm\">{t('village')}</Label>"),
        ('placeholder="Select state"', "placeholder={t('selectState')}"),
        ('placeholder="Mandal"', "placeholder={t('mandal')}"),
        ('placeholder="Village"', "placeholder={t('village')}"),
    ],
    "src/components/PincodeLocationFields.jsx": [
        ('<Label className="text-sm">Pincode</Label>', "<Label className=\"text-sm\">{t('pincode')}</Label>"),
        ('<Label className="text-sm">Mandal</Label>', "<Label className=\"text-sm\">{t('mandal')}</Label>"),
    ],
    "src/components/YieldEstimator.jsx": [
        ('<h3 className="text-sm font-semibold text-gray-800">Yield Estimator</h3>', "<h3 className=\"text-sm font-semibold text-gray-800\">Yield Estimator</h3>"),  # needs its own key if desired; skipped title here since no exact key requested
        ('<Label>Crop</Label>', "<Label>{t('cropSingular')}</Label>"),
        ('<p className="text-xs text-gray-500">Estimated yield</p>', "<p className=\"text-xs text-gray-500\">Estimated yield</p>"),
    ],
    "src/components/ProfitCalculator.jsx": [
        ('<p className="text-xs text-gray-500">Revenue</p>', "<p className=\"text-xs text-gray-500\">{t('revenue')}</p>"),
        ('<p className="text-xs text-gray-500">Cost</p>', "<p className=\"text-xs text-gray-500\">{t('cost')}</p>"),
        ('<p className="text-xs text-gray-500">Profit</p>', "<p className=\"text-xs text-gray-500\">{t('profit')}</p>"),
    ],
    "src/components/AgriHelperWidget.jsx": [
        ('className="text-gray-400 text-xs">Dismiss</button>', "className=\"text-gray-400 text-xs\">{t('dismiss')}</button>"),
        ('<span className="font-semibold text-gray-800">Agri Helper</span>', "<span className=\"font-semibold text-gray-800\">{t('agriHelper')}</span>"),
        ('placeholder="Type or tap mic..."', "placeholder={t('typeOrTapMic')}"),
    ],
    "src/pages/FarmLedger.jsx": [
        ('<PageHeader title="Farm Ledger" icon={FileSpreadsheet} />', "<PageHeader title={t('ledger')} icon={FileSpreadsheet} />"),
        ('<p className="text-xs text-gray-500">Income</p>', "<p className=\"text-xs text-gray-500\">{t('income')}</p>"),
        ('<p className="text-xs text-gray-500">Expense</p>', "<p className=\"text-xs text-gray-500\">{t('expense')}</p>"),
        ('<p className="text-xs text-gray-500">Net</p>', "<p className=\"text-xs text-gray-500\">{t('net')}</p>"),
        ('<Label>Type</Label>', "<Label>{t('type')}</Label>"),
        ('<SelectItem value="income">Income</SelectItem>', "<SelectItem value=\"income\">{t('income')}</SelectItem>"),
        ('<SelectItem value="expense">Expense</SelectItem>', "<SelectItem value=\"expense\">{t('expense')}</SelectItem>"),
        ('<Label>Category</Label>', "<Label>{t('category')}</Label>"),
    ],
    "src/pages/Placeholder.jsx": [
        ('<p className="text-gray-400">This feature is being developed</p>', "<p className=\"text-gray-400\">{t('featureInDevelopment')}</p>"),
        ('<p className="text-sm text-gray-400 mt-2">Check back soon for updates</p>', "<p className=\"text-sm text-gray-400 mt-2\">{t('checkBackSoon')}</p>"),
    ],
    "src/pages/SpeakToAgriSaathi.jsx": [
        ('<h1 className="text-2xl font-bold text-gray-900 mb-1">Speak to AgriSaathi</h1>', "<h1 className=\"text-2xl font-bold text-gray-900 mb-1\">{t('speakToAgriSaathi')}</h1>"),
        ('<p className="text-gray-500 mb-6">Tap and speak your problem</p>', "<p className=\"text-gray-500 mb-6\">{t('tapAndSpeak')}</p>"),
        ('<p className="text-xs uppercase tracking-wide text-gray-400 mb-1">You said</p>', "<p className=\"text-xs uppercase tracking-wide text-gray-400 mb-1\">{t('youSaid')}</p>"),
    ],
    "src/pages/NearMe.jsx": [
        ('<SelectItem value="all">All</SelectItem>', "<SelectItem value=\"all\">{t('all')}</SelectItem>"),
    ],
    "src/pages/DataGovLiveData.jsx": [
        ('<span>Not loaded</span>', "<span>Not loaded</span>"),  # no key defined; left as-is intentionally
    ],
    "src/pages/SensorLab.jsx": [
        ('<p className="text-sm font-medium">Connect sensor</p>', "<p className=\"text-sm font-medium\">{t('connectSensor')}</p>"),
        ('<Button variant="outline" onClick={connectSensor}>Connect</Button>', "<Button variant=\"outline\" onClick={connectSensor}>{t('connect')}</Button>"),
        ('<Button onClick={analyzeSoil} className="w-full bg-green-600 hover:bg-green-700 mb-4">Analyze Soil</Button>', "<Button onClick={analyzeSoil} className=\"w-full bg-green-600 hover:bg-green-700 mb-4\">{t('analyzeSoil')}</Button>"),
        ('<Button onClick={analyzeWater} className="w-full bg-blue-600 hover:bg-blue-700 mb-4">Check Water Suitability</Button>', "<Button onClick={analyzeWater} className=\"w-full bg-blue-600 hover:bg-blue-700 mb-4\">{t('checkWaterSuitability')}</Button>"),
    ],
    "src/pages/InventoryTracker.jsx": [
        ('<PageHeader title="Inventory Tracker" icon={Package} />', "<PageHeader title={t('inventoryTrackerTitle')} icon={Package} />"),
        ('<Label>Item name</Label>', "<Label>{t('itemName')}</Label>"),
        ('<Label>Category</Label>', "<Label>{t('category')}</Label>"),
        ('<Label>Unit</Label>', "<Label>{t('unit')}</Label>"),
        ('<Label>Current quantity</Label>', "<Label>{t('currentQuantity')}</Label>"),
    ],
    "src/pages/EquipmentRegistry.jsx": [
        ('<PageHeader title="Equipment Registry" icon={Wrench} />', "<PageHeader title={t('equipmentRegistryTitle')} icon={Wrench} />"),
        ('<Label>Equipment name</Label>', "<Label>{t('equipmentName')}</Label>"),
        ('<Label>Type</Label>', "<Label>{t('type')}</Label>"),
        ('<Label>Last maintenance</Label>', "<Label>{t('lastMaintenance')}</Label>"),
        ('<Label>Next maintenance due</Label>', "<Label>{t('nextMaintenanceDue')}</Label>"),
    ],
    "src/pages/VendorContacts.jsx": [
        ('<PageHeader title="Vendor Contacts" icon={Store} />', "<PageHeader title={t('vendorContactsTitle')} icon={Store} />"),
        ('<Label>Name</Label>', "<Label>{t('name')}</Label>"),
        ('<Label>Type</Label>', "<Label>{t('type')}</Label>"),
        ('<Label>Phone number</Label>', "<Label>{t('phoneNumber')}</Label>"),
    ],
    "src/pages/Fertilize.jsx": [
        ('<Label className="mb-1.5 block">Unit</Label>', "<Label className=\"mb-1.5 block\">{t('unit')}</Label>"),
        ('<SelectItem value="acre">Acre</SelectItem>', "<SelectItem value=\"acre\">{t('acre')}</SelectItem>"),
        ('<SelectItem value="hectare">Hectare</SelectItem>', "<SelectItem value=\"hectare\">{t('hectare')}</SelectItem>"),
        ('<SelectItem value="guntha">Guntha</SelectItem>', "<SelectItem value=\"guntha\">{t('guntha')}</SelectItem>"),
    ],
    "src/pages/Login.jsx": [
        ('<h1 className="text-lg font-semibold text-center">Sign in</h1>', "<h1 className=\"text-lg font-semibold text-center\">{t('signIn')}</h1>"),
        ('<Label>Email</Label>', "<Label>{t('email')}</Label>"),
        ('<Label>Password</Label>', "<Label>{t('password')}</Label>"),
        ('<Button className="w-full" onClick={handleSubmit}>Sign in</Button>', "<Button className=\"w-full\" onClick={handleSubmit}>{t('signIn')}</Button>"),
    ],
    "src/pages/CropPlanner.jsx": [
        ('<SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>',
         "<SelectContent><SelectItem value=\"low\">{t('low')}</SelectItem><SelectItem value=\"medium\">{t('medium')}</SelectItem><SelectItem value=\"high\">{t('high')}</SelectItem></SelectContent>"),
        ('<SelectContent><SelectItem value="kharif">Kharif</SelectItem><SelectItem value="rabi">Rabi</SelectItem><SelectItem value="zaid">Zaid</SelectItem><SelectItem value="perennial">Perennial</SelectItem></SelectContent>',
         "<SelectContent><SelectItem value=\"kharif\">{t('kharif')}</SelectItem><SelectItem value=\"rabi\">{t('rabi')}</SelectItem><SelectItem value=\"zaid\">{t('zaid')}</SelectItem><SelectItem value=\"perennial\">{t('perennial')}</SelectItem></SelectContent>"),
        ('<SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>', "<SelectTrigger><SelectValue placeholder={t('any')} /></SelectTrigger>"),
    ],
    "src/pages/SupportTickets.jsx": [
        ('<PageHeader title="Support Tickets" icon={LifeBuoy} />', "<PageHeader title={t('supportTicketsTitle')} icon={LifeBuoy} />"),
        ('<Label>Subject</Label>', "<Label>{t('subject')}</Label>"),
        ('<Label>Category</Label>', "<Label>{t('category')}</Label>"),
        ('<Label>Description</Label>', "<Label>{t('description')}</Label>"),
    ],
    "src/pages/CropPassport.jsx": [
        ('<PageHeader title="Crop Passport" icon={ShieldCheck} />', "<PageHeader title={t('cropPassportTitle')} icon={ShieldCheck} />"),
        ('<option value="">Select a crop</option>', "<option value=\"\">{t('selectACrop')}</option>"),
    ],
    "src/pages/SuccessStories.jsx": [
        ('<PageHeader title="Success Stories" icon={Trophy} />', "<PageHeader title={t('successStoriesTitle')} icon={Trophy} />"),
        ('<Label>Your name</Label>', "<Label>{t('yourName')}</Label>"),
        ('<Label>Crop</Label>', "<Label>{t('cropSingular')}</Label>"),
        ('<Label>Your story</Label>', "<Label>{t('yourStory')}</Label>"),
    ],
    "src/pages/GovernmentSchemes.jsx": [
        ('<SelectItem value="all">All India</SelectItem>', "<SelectItem value=\"all\">{t('allIndia')}</SelectItem>"),
        ('<SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All states" /></SelectTrigger>', "<SelectTrigger className=\"h-8 text-sm\"><SelectValue placeholder={t('allStates')} /></SelectTrigger>"),
    ],
    "src/pages/FarmNotifications.jsx": [
        ('<PageHeader title="Farm Notifications" icon={BellRing} />', "<PageHeader title={t('farmNotificationsTitle')} icon={BellRing} />"),
        ('<Label>Reminder</Label>', "<Label>{t('reminder')}</Label>"),
        ('<Label>Due date</Label>', "<Label>{t('dueDate')}</Label>"),
    ],
    "src/pages/PestLibrary.jsx": [
        (">Livestock vaccines</button>", ">{t('livestockVaccines')}</button>"),
    ],
    "src/pages/Home.jsx": [
        ('<h2 className="text-lg font-semibold text-gray-700">Speak to AgriSaathi</h2>', "<h2 className=\"text-lg font-semibold text-gray-700\">{t('speakToAgriSaathi')}</h2>"),
        ('<p className="text-sm text-gray-500">Tap and speak your problem</p>', "<p className=\"text-sm text-gray-500\">{t('tapAndSpeak')}</p>"),
        ('<div className="text-center text-blue-100 py-4">Weather data unavailable</div>', "<div className=\"text-center text-blue-100 py-4\">{t('weatherDataUnavailable')}</div>"),
        ('<h3 className="text-sm font-semibold text-gray-500 mb-3">All Tools</h3>', "<h3 className=\"text-sm font-semibold text-gray-500 mb-3\">{t('allTools')}</h3>"),
    ],
    "src/pages/YieldBenchmarks.jsx": [
        ('<PageHeader title="YieldBenchmarks" />', "<PageHeader title={t('yieldBenchmarksTitle')} />"),
    ],
    "src/pages/AlertsCenter.jsx": [
        ('<PageHeader title="Alerts Center" icon={Bell} />', "<PageHeader title={t('alertsCenterTitle')} icon={Bell} />"),
    ],
    "src/pages/ExportData.jsx": [
        ('<PageHeader title="ExportData" />', "<PageHeader title={t('exportDataTitle')} />"),
    ],
    "src/pages/SustainabilityScore.jsx": [
        ('<PageHeader title="Sustainability Score" icon={Leaf} />', "<PageHeader title={t('sustainabilityScoreTitle')} icon={Leaf} />"),
    ],
    "src/pages/WeatherAnalytics.jsx": [
        ('title="Weather Analytics"', "title={t('weatherAnalyticsTitle')}"),
    ],
    "src/pages/ExpertDirectory.jsx": [
        ('<PageHeader title="Expert Directory" icon={Users} />', "<PageHeader title={t('expertDirectoryTitle')} icon={Users} />"),
    ],
    "src/pages/InsuranceVault.jsx": [
        ('<PageHeader title="InsuranceVault" />', "<PageHeader title={t('insuranceVaultTitle')} />"),
    ],
    "src/pages/TrainingAcademy.jsx": [
        ('<PageHeader title="TrainingAcademy" />', "<PageHeader title={t('trainingAcademyTitle')} />"),
    ],
    "src/pages/ResourceMarketplace.jsx": [
        ('title="Resource Marketplace"', "title={t('resourceMarketplaceTitle')}"),
    ],
    "src/pages/FeedbackCorner.jsx": [
        ('<PageHeader title="Feedback Corner" icon={MessageSquareHeart} />', "<PageHeader title={t('feedbackCornerTitle')} icon={MessageSquareHeart} />"),
    ],
    "src/pages/Livestock.jsx": [
        ('label="Districts"', "label={t('districts')}"),
        ('label="Cattle"', "label={t('cattle')}"),
        ('label="Buffalo"', "label={t('buffalo')}"),
        ('label="Sheep"', "label={t('sheep')}"),
        ('label="Goat"', "label={t('goat')}"),
        ('label="Poultry"', "label={t('poultry')}"),
        ('placeholder="Search district..."', "placeholder={t('searchDistrict')}"),
    ],
    "src/pages/SoilPassport.jsx": [
        ('<SelectValue placeholder="Select State" />', "<SelectValue placeholder={t('selectState')} />"),
        ('<SelectValue placeholder="Select District" />', "<SelectValue placeholder={t('selectDistrict')} />"),
        ('<SelectValue placeholder="Select your state" />', "<SelectValue placeholder={t('selectYourState')} />"),
    ],
}

# ---------------------------------------------------------------------------
# Step 1: patch i18n.jsx with new keys
# ---------------------------------------------------------------------------
i18n_path = "src/lib/i18n.jsx"
with open(i18n_path) as f:
    i18n_content = f.read()

added, skipped = [], []
insertion_lines = []
for key, (en, hi, te) in NEW_LABELS.items():
    if re.search(rf"^\s*{re.escape(key)}:\s*{{", i18n_content, re.M):
        skipped.append(key)
        continue
    line = f"  {key}: {{ en: {en!r}, hi: {hi!r}, te: {te!r} }},"
    insertion_lines.append(line)
    added.append(key)

if insertion_lines:
    marker = "export function LanguageProvider"
    idx = i18n_content.index(marker)
    # insert just before the closing `};` of the labels object, which is the
    # last `};` before the marker
    close_idx = i18n_content.rindex("};", 0, idx)
    i18n_content = (
        i18n_content[:close_idx]
        + "\n".join(insertion_lines) + "\n"
        + i18n_content[close_idx:]
    )
    with open(i18n_path, "w") as f:
        f.write(i18n_content)

print(f"i18n.jsx: added {len(added)} keys, skipped {len(skipped)} already present.")

# ---------------------------------------------------------------------------
# Step 2: patch each target file
# ---------------------------------------------------------------------------
IMPORT_LINE = "import { useLang } from '../lib/i18n';"
needs_hook_check = []

for relpath, replacements in FILE_PATCHES.items():
    try:
        with open(relpath) as f:
            content = f.read()
    except FileNotFoundError:
        print(f"  SKIP (not found): {relpath}")
        continue

    changed = False

    # ensure import present
    if "useLang" not in content:
        last_import_match = list(re.finditer(r"^import .+;$", content, re.M))
        if last_import_match:
            insert_at = last_import_match[-1].end()
            content = content[:insert_at] + "\n" + IMPORT_LINE + content[insert_at:]
            changed = True

    hits, misses = 0, 0
    for old, new in replacements:
        if old == new:
            continue  # intentionally-skipped entries above
        if old in content:
            content = content.replace(old, new, 1)
            hits += 1
            changed = True
        else:
            misses += 1

    if changed:
        with open(relpath, "w") as f:
            f.write(content)
        needs_hook_check.append(relpath)

    print(f"  {relpath}: {hits} replaced, {misses} not found (already changed or line shifted)")

print("\n=== Next step ===")
print("Open each file below and confirm it has `const { t } = useLang();`")
print("as the first line inside the component function body. If `npm run dev`")
print("throws \"t is not defined\", that's the file missing it:\n")
for f in needs_hook_check:
    print(f"  {f}")
