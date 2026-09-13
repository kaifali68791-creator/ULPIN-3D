/* =====================================================================
   ULPIN 3D — Multilingual Language Selector (ADD-ON MODULE)
   Isolated i18n support: adds 4 languages (English default) without
   touching any existing behaviour.
     en  English   te తెలుగు   hi हिन्दी   ta தமிழ்
   How it works:
   - Exact-match dictionary of English UI strings -> translation.
   - Walks text nodes (TreeWalker) + placeholder/title/aria-label attrs.
   - MutationObserver keeps JS-rendered content translated too.
   - Selection persisted in localStorage ("ulpin3d.lang").
   Technical identifiers, ULPIN values, owner names and numeric data
   are intentionally NOT translated.
   ===================================================================== */
"use strict";

(function () {

  var STORE_KEY = "ulpin3d.lang";

  /* ---------------- supported languages ---------------- */
  var LANGS = {
    en: { name: "English",   dir: "ltr" },
    hi: { name: "हिन्दी",      dir: "ltr" },
    te: { name: "తెలుగు",      dir: "ltr" },
    ta: { name: "தமிழ்",      dir: "ltr" }
  };

  /* ------------- pattern rules (partial strings) -------------
     Applied when an exact key match fails; remainder is kept as-is
     (e.g. role names after "Welcome, "). */
  var RULES = {
    te: [
      { re: /^Welcome,\s*/, t: "స్వాగతం, " },
      { re: / · demo access$/, t: " · డెమో యాక్సెస్" },
      { re: / · signed in$/, t: " · సైన్ ఇన్ అయ్యారు" }
    ],
    hi: [
      { re: /^Welcome,\s*/, t: "स्वागत है, " },
      { re: / · demo access$/, t: " · डेमो एक्सेस" },
      { re: / · signed in$/, t: " · साइन इन" }
    ],
    ta: [
      { re: /^Welcome,\s*/, t: "வரவேற்கிறோம், " },
      { re: / · demo access$/, t: " · டெமோ அணுகல்" },
      { re: / · signed in$/, t: " · உள்நுழைந்தது" }
    ]
  };

  /* ---------------- translation dictionaries ---------------- */
  var DICT = {
  te: {
"Main": "ముఖ్య", "Registry": "రిజిస్ట్రీ", "Tools": "సాధనాలు", "Intelligence": "ఇంటెలిజెన్స్",
    "Dashboard": "డాష్‌బోర్డ్", "Map Viewer": "భూపట దర్శిని", "3D Property View": "3D ఆస్తి వీక్షణ",
    "Land Parcels": "భూ పార్సిళ్ళు", "Buildings": "భవనాలు", "Floors & Units": "అంతస్థులు & యూనిట్లు",
    "ULPIN Generator": "ULPIN జనరేటర్", "Underground Infra": "భూగర్భ మౌలిక సదుపాయాలు",
    "Air Rights": "వాయు హక్కులు", "AI & ML Analysis": "AI & ML విశ్లేషణ", "Data Sources": "డేటా మూలాలు",
    "Settings": "సెట్టింగ్‌లు", "LIVE": "లైవ్", "Survey Master · RTK Network": "సర్వే మాస్టర్ · RTK నెట్‌వర్క్",
    "Account": "ఖాతా", "Menu": "మెనూ", "Notifications": "నోటిఫికేషన్‌లు", "Language": "భాష",
    "GPS / GNSS ONLINE": "GPS / GNSS ఆన్‌లైన్", "DEMO DATA": "డెమో డేటా", "Sign in": "సైన్ ఇన్ చేయండి",
"Vertical Property Mapping": "నిలువు ఆస్తి మ్యాపింగ్",
    "Smart India Hackathon · Digital India Land Records": "స్మార్ట్ ఇండియా హాకథాన్ · డిజిటల్ ఇండియా ల్యాండ్ రికార్డ్‌లు",
    "3D ULPIN & Vertical Property Mapping System": "3D ULPIN & నిలువు ఆస్తి మ్యాపింగ్ వ్యవస్థ",
    "Digital 3D Cadastral Platform for Smart Land & Property Management": "స్మార్ట్ భూమి & ఆస్తి నిర్వహణ కోసం డిజిటల్ 3D కాడాస్ట్రల్ వేదిక",
    "A next-generation platform for managing surface parcels, buildings, floors, apartments, vertical ownership and spatial property information.": "ఉపరితల పార్సిళ్ళు, భవనాలు, అంతస్థులు, అపార్ట్‌మెంట్లు, నిలువు యాజమాన్యం మరియు ప్రాదేశిక ఆస్తి సమాచారాన్ని నిర్వహించడానికి తదుపరి తరం వేదిక.",
    "Please select your role to continue": "కొనసాగించడానికి మీ పాత్రను ఎంచుకోండి",
    "Skip to demo platform": "డెమో వేదికకు దాటవేయండి",
    "Version 1.0 · Demo sign-in and guest access available": "వెర్షన్ 1.0 · డెమో సైన్-ఇన్ మరియు అతిథి ప్రాప్యత అందుబాటులో ఉంది",
    "Developed by Kaif (member of team CYBERLEEKS) ·": "కైఫ్ అభివృద్ధి చేశారు (టీమ్ CYBERLEEKS సభ్యుడు) ·",
    "Sign in to ULPIN 3D": "ULPIN 3D లో సైన్ ఇన్ చేయండి",
    "Vertical Property Mapping & ULPIN Generation Platform": "నిలువు ఆస్తి మ్యాపింగ్ & ULPIN జనరేషన్ వేదిక",
    "Email or username": "ఇమెయిల్ లేదా వినియోగదారు పేరు",
    "Password": "పాస్‌వర్డ్",
    "Sign In": "సైన్ ఇన్",
    "Forgot password?": "పాస్‌వర్డ్ మర్చిపోయారా?",
    "Demo Sign In": "డెమో సైన్ ఇన్",
    "Continue with demo access": "డెమో ప్రాప్యతతో కొనసాగించండి",
    "Continue with guest access": "అతిథి ప్రాప్యతతో కొనసాగించండి",
    "Welcome,": "స్వాగతం,",
    " signed in as": " గా సైన్ ఇన్ అయ్యారు",
    "demo access": "డెమో ప్రాప్యత",
    "Platform administration mode · mock workspace": "వేదిక నిర్వహణ మోడ్ · మాక్ కార్యస్థలం",
    "All system dashboards": "అన్ని సిస్టమ్ డాష్‌బోర్డులు",
    "Core platform modules": "ప్రధాన వేదిక మాడ్యూళ్ళు",
    "Team members": "బృంద సభ్యులు",
    "Data sources": "డేటా మూలాలు",
    "System health": "సిస్టమ్ ఆరోగ్యం",
    "Pending approvals": "పెండింగ్ ఆమోదాలు",
    "Records of Rights (RoR)": "హక్కుల రికార్డులు (RoR)",
    "ULPIN records": "ULPIN రికార్డులు",
    "Mutation workflow": "మ్యుటేషన్ వర్క్‌ఫ్లో",
    "Ownership search": "యాజమాన్య శోధన",
    "Cadastral map viewer": "కాడాస్ట్రల్ మ్యాప్ వీక్షకుడు",
    "3D volume browser": "3D వాల్యూమ్ బ్రౌజర్",
    "Field survey channels": "ఫీల్డ్ సర్వే ఛానెల్స్",
    "LiDAR & AI modules": "LiDAR & AI మాడ్యూళ్ళు",
    "Building register": "భవన రిజిస్టర్",
    "Underground infrastructure": "భూగర్భ మౌలిక సదుపాయాలు",
    "Air rights register": "వాయు హక్కుల రిజిస్టర్",
    "Role workspace · demo": "పాత్ర కార్యస్థలం · డెమో",
"Loading parcel map…": "పార్సిల్ మ్యాప్ లోడ్ అవుతోంది…",
    "Interactive cadastral map": "ఇంటరాక్టివ్ కాడాస్ట్రల్ మ్యాప్",
    "Parcels on this view": "ఈ వీక్షణలో పార్సిళ్ళు",
    "Survey numbers": "సర్వే నంబర్లు",
    "Total area": "మొత్తం విస్తీర్ణం",
    "Demarcated": "హద్దులు గుర్తించబడిన",
    "Confirmed": "నిర్ధారించబడింది",
    "Under review": "సమీక్షలో ఉంది",
    "Map layer": "మ్యాప్ పొర",
    "Satellite": "ఉపగ్రహం",
    "Cadastral": "కాడాస్ట్రల్",
    "Hybrid": "హైబ్రిడ్",
    "Legend": "చిహ్నాల వివరణ",
    "Parcels": "పార్సిళ్ళు",
    "Show parcels": "పార్సిళ్ళు చూపించు",
    "Show buildings": "భవనాలు చూపించు",
    "Reset map": "మ్యాప్ రీసెట్ చేయండి",
    "Parcels details": "పార్సిల్ వివరాలు",
    "Survey No.": "సర్వే నెం.",
    "Location": "ప్రదేశం",
    "Owner": "యజమాని",
    "Area": "విస్తీర్ణం",
    "Status": "స్థితి",
    "Close": "మూసివేయండి",
    "3D Property Explorer": "3D ఆస్తి అన్వేషకుడు",
    "Explore registered vertical properties in 3D": "3D లో నమోదైన నిలువు ఆస్తులను అన్వేషించండి",
    "Floors": "అంతస్థులు",
    "Units": "యూనిట్లు",
    "No building data": "భవన డేటా లేదు",
    "Drag to rotate · Scroll to zoom": "తిప్పడానికి లాగండి · జూమ్ చేయడానికి స్క్రోల్ చేయండి",
    "Back to Dashboard": "డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి",
    "Select a building to view property information.": "ఆస్తి సమాచారాన్ని చూడడానికి ఒక భవనాన్ని ఎంచుకోండి.",
    "3D volumetric property model": "3D ఘనపరిమాణ ఆస్తి నమూనా",
    "Interactive 3D building · floors as stacked property volumes · drag to orbit · click a floor": "ఇంటరాక్టివ్ 3D భవనం · అంతస్థులు పేర్చిన ఆస్తి వాల్యూమ్‌లుగా · కక్ష్యలో తిప్పడానికి లాగండి · అంతస్థుపై క్లిక్ చేయండి",
    "Retail": "రిటైల్",
    "Parking": "పార్కింగ్",
    "Selected": "ఎంచుకోబడింది",
    "Unit": "యూనిట్",
    "Type": "రకం",
    "Switch building": "భవనం మార్చండి",
    "Choose building": "భవనాన్ని ఎంచుకోండి",
    "Land parcel registry": "భూ పార్సిల్ రిజిస్ట్రీ",
    "Mock RoR data merged with geo-coordinates · click a row to locate": "మాక్ RoR డేటా భౌగోళిక నిరూపకాలతో విలీనం చేయబడింది · గుర్తించడానికి అడ్డు వరుసపై క్లిక్ చేయండి",
    "Generate missing ULPINs": "తప్పిపోయిన ULPINలను జనరేట్ చేయండి",
    "Search survey no, owner or ULPIN…": "సర్వే నం., యజమాని లేదా ULPIN కోసం వెతకండి…",
    "All land uses": "అన్ని భూ వినియోగాలు",
    "All statuses": "అన్ని స్థితులు",
    "Titled": "శీర్షిక కలిగిన",
    "Pending survey": "పెండింగ్ సర్వే",
    "Disputed": "వివాదాస్పదం",
    "Land use": "భూ వినియోగం",
    "Area (sq m)": "విస్తీర్ణం (చ.మీ)",
    "Coordinates": "నిరూపకాలు",
    "Locate": "గుర్తించండి",
    "Locate on map": "మ్యాప్‌పై గుర్తించండి",
    "Floors & units ledger": "అంతస్థులు & యూనిట్లు లెడ్జర్",
    "Every flat / commercial unit carries a volumetric ULPIN derived from its parent parcel": "ప్రతి ఫ్లాట్ / వాణిజ్య యూనిట్ దాని మాతృ పార్సిల్ నుండి స్వీకరించిన ఘనపరిమాణ ULPINను కలిగి ఉంటుంది",
    "Unit ID": "యూనిట్ ID",
    "Building": "భవనం",
    "Floor": "అంతస్తు",
    "Area (sq ft)": "విస్తీర్ణం (చ.అడుగులు)",
    "Volumetric ULPIN": "ఘనపరిమాణ ULPIN",
    "Sample subset · full ledger in Phase 2": "నమూనా ఉపసమితి · పూర్తి లెడ్జర్ దశ 2లో",
    "Generate a ULPIN": "ఒక ULPIN జనరేట్ చేయండి",
    "Demo generator · administrative codes + parcel coordinates": "డెమో జనరేటర్ · పరిపాలనా కోడ్‌లు + పార్సిల్ నిరూపకాలు",
    "State": "రాష్ట్రం",
    "District": "జిల్లా",
    "Sub-district / Tehsil": "ఉప-జిల్లా / తహసీల్",
    "Village": "గ్రామం",
    "Land parcel (survey number)": "భూ పార్సిల్ (సర్వే నంబర్)",
    "Generate Surface ULPIN": "ఉపరితల ULPIN జనరేట్ చేయండి",
    "What is ULPIN?": "ULPIN అంటే ఏమిటి?",
    "A 26-character unique land parcel ID (state": "26-అక్షరాల ప్రత్యేక భూ పార్సిల్ ID (రాష్ట్రం",
    "for demonstration — the official scheme is issued by state revenue departments.": "ప్రదర్శన కోసం — అధికారిక పథకం రాష్ట్ర ఆదాయ శాఖలచే జారీ చేయబడుతుంది.",
    "simulated format": "అనుకరణ ఆకృతి",
    "). This is a": "). ఇది ఒక",
    "Vertical Property ULPIN": "నిలువు ఆస్తి ULPIN",
    "Extend the surface identity to a building, floor or unit": "ఉపరితల గుర్తింపును ఒక భవనం, అంతస్తు లేదా యూనిట్‌కు విస్తరించండి",
    "Generate Vertical ULPIN": "నిలువు ULPIN జనరేట్ చేయండి",
    "Issued identity": "జారీ చేయబడిన గుర్తింపు",
    "Result of the last generation": "చివరి జనరేషన్ ఫలితం",
    "Choose a parcel on the left and press": "ఎడమ వైపు ఒక పార్సిల్‌ను ఎంచుకుని నొక్కండి",
    "Generate ULPIN": "ULPIN జనరేట్ చేయండి",
    "Verify an existing ULPIN": "ఇప్పటికే ఉన్న ULPINను ధృవీకరించండి",
    "Paste a 26-character ULPIN…": "26-అక్షరాల ULPINను అతికించండి…",
    "Verify": "ధృవీకరించండి",
    "How it works": "ఇది ఎలా పనిచేస్తుంది",
    "Official pipeline planned for later phases": "తరువాత దశలకు అధికారిక పైప్‌లైన్ ప్రణాళిక",
    "RoR + map merge": "RoR + మ్యాప్ విలీనం",
    "Records of Rights are matched to cadastral map polygons.": "హక్కుల రికార్డులు కాడాస్ట్రల్ మ్యాప్ బహుభుజాలతో సరిపోల్చబడతాయి.",
    "Geo-coordinate encoding": "భౌగోళిక నిరూపక ఎన్‌కోడింగ్",
    "Parcel corner coordinates are encoded into the last 14 characters.": "పార్సిల్ మూల నిరూపకాలు చివరి 14 అక్షరాలలో ఎన్‌కోడ్ చేయబడతాయి.",
    "Stamping & 3D linking": "స్టాంపింగ్ & 3D లింకింగ్",
    "The ULPIN anchors all vertical volumes — floors, flats, utilities, air space.": "ULPIN అన్ని నిలువు వాల్యూమ్‌లను — అంతస్థులు, ఫ్లాట్లు, వినియోగాలు, వాయు ప్రదేశం అంకితం చేస్తుంది.",
    "Subsurface infrastructure register": "ఉపరితలాధార మౌలిక సదుపాయాల రిజిస్టర్",
    "Underground utilities tied to their host parcels & exact depths": "తమ హోస్ట్ పార్సిళ్ళు & ఖచ్చితమైన లోతులతో ముడిపడిన భూగర్భ వినియోగాలు",
    "Water": "నీరు",
    "Sewer": "మురుగునీరు",
    "Gas": "గ్యాస్",
    "Power": "విద్యుత్తు",
    "Fiber": "ఫైబర్",
    "Air rights & air-space volumes": "వాయు హక్కులు & వాయు-ప్రదేశ వాల్యూమ్‌లు",
    "Legal 3D volumes for towers, FSI utilisation & aerial utilities": "గోపురాలకు, FSI వినియోగం & వైమానిక వినియోగాలకు చట్టబద్ధ 3D వాల్యూమ్‌లు",
    "Phase 2 module": "దశ 2 మాడ్యూల్",
    "Concept": "భావన",
    "Each air-space volume is registered as a 3D parcel above a base ULPIN — enabling FSI banking, drone corridors and overhead utility easements.": "ప్రతి వాయు-ప్రదేశ వాల్యూమ్ ఒక ఆధార ULPIN పైన 3D పార్సిల్‌గా నమోదు చేయబడుతుంది — FSI బ్యాంకింగ్, డ్రోన్ కారిడార్లు మరియు ఓవర్‌హెడ్ యుటిలిటీ సౌలభ్యాలను సాధ్యం చేస్తుంది.",
    "Registered air parcels": "నమోదైన వాయు పార్సిళ్ళు",
    "Sample records · demo": "నమూనా రికార్డులు · డెమో",
    "AI Cadastral Analysis": "AI కాడాస్ట్రల్ విశ్లేషణ",
    "AI-powered validation, property intelligence and 3D cadastral insights": "AI-శక్తిమంత ధృవీకరణ, ఆస్తి మేధస్సు మరియు 3D కాడాస్ట్రల్ అంతర్దృష్టులు",
    "Live Analysis": "లైవ్ విశ్లేషణ",
    "AI Insights": "AI అంతర్దృష్టులు",
    "Real-time system metrics": "నిజ-సమయ సిస్టమ్ కొలమానాలు",
    "Analysis Control Panel": "విశ్లేషణ నియంత్రణ ప్యానెల్",
    "Select analysis type and run AI validation": "విశ్లేషణ రకాన్ని ఎంచుకుని AI ధృవీకరణ అమలు చేయండి",
    "Parcel Analysis": "పార్సిల్ విశ్లేషణ",
    "Building Analysis": "భవన విశ్లేషణ",
    "AI Building Extraction": "AI భవన సంగ్రహణ",
    "AI Floor Segmentation": "AI అంతస్థు విభజన",
    "Vertical Parcel Delineation": "నిలువు పార్సిల్ హద్దు నిర్ధారణ",
    "Topology Validation": "టోపోలజీ ధృవీకరణ",
    "ULPIN Validation": "ULPIN ధృవీకరణ",
    "Ownership Conflict Detection": "యాజమాన్య వివాద గుర్తింపు",
    "Infrastructure Analysis": "మౌలిక సదుపాయాల విశ్లేషణ",
    "Infrastructure Planning": "మౌలిక సదుపాయాల ప్రణాళిక",
    "Run AI Analysis": "AI విశ్లేషణ అమలు చేయండి",
    "Analysis Results": "విశ్లేషణ ఫలితాలు",
    "Select an analysis type and click \"Run AI Analysis\"": "ఒక విశ్లేషణ రకాన్ని ఎంచుకుని \"AI విశ్లేషణ అమలు చేయండి\" క్లిక్ చేయండి",
    "AI analysis results will appear here.": "AI విశ్లేషణ ఫలితాలు ఇక్కడ కనిపిస్తాయి.",
    "Select an analysis type from the panel above and run the analysis.": "పైన ఉన్న ప్యానెల్ నుండి ఒక విశ్లేషణ రకాన్ని ఎంచుకుని విశ్లేషణను అమలు చేయండి."
  },
  hi: {
"Main": "मुख्य", "Registry": "रजिस्ट्री", "Tools": "उपकरण", "Intelligence": "इंटेलिजेंस",
    "Dashboard": "डैशबोर्ड", "Map Viewer": "मानचित्र दर्शक", "3D Property View": "3D संपत्ति दर्शन",
    "Land Parcels": "भूमि पार्सल", "Buildings": "भवन", "Floors & Units": "मंजिलें & इकाइयां",
    "ULPIN Generator": "ULPIN जनरेटर", "Underground Infra": "भूमिगत बुनियादी ढांचा",
    "Air Rights": "हवाई अधिकार", "AI & ML Analysis": "AI & ML विश्लेषण", "Data Sources": "डेटा स्रोत",
    "Settings": "सेटिंग्स", "LIVE": "लाइव", "Survey Master · RTK Network": "सर्वे मास्टर · RTK नेटवर्क",
    "Account": "खाता", "Menu": "मेनू", "Notifications": "सूचनाएं", "Language": "भाषा",
    "GPS / GNSS ONLINE": "GPS / GNSS ऑनलाइन", "DEMO DATA": "डेमो डेटा", "Sign in": "साइन इन करें",
    "Vertical Property Mapping": "लंबवत संपत्ति मैपिंग",
    "Smart India Hackathon · Digital India Land Records": "स्मार्ट इंडिया हैकathon · डिजिटल इंडिया लैंड रिकॉर्ड्स",
    "3D ULPIN & Vertical Property Mapping System": "3D ULPIN & लंबवत संपत्ति मैपिंग सिस्टम",
    "Digital 3D Cadastral Platform for Smart Land & Property Management": "स्मार्ट भूमि & संपत्ति प्रबंधन के लिए डिजिटल 3D कैडास्ट्रल प्लेटफ़ॉर्म",
    "A next-generation platform for managing surface parcels, buildings, floors, apartments, vertical ownership and spatial property information.": "सतह के पार्सल, भवनों, मंजिलों, अपार्टमेंटों, लंबवत स्वामित्व और स्थानिक संपत्ति जानकारी के प्रबंधन के लिए अगली पीढ़ी का प्लेटफ़ॉर्म।",
    "Please select your role to continue": "जारी रखने के लिए कृपया अपनी भूमिका चुनें",
    "Skip to demo platform": "डेमो प्लेटफ़ॉर्म पर जाएं",
    "Version 1.0 · Demo sign-in and guest access available": "संस्करण 1.0 · डेमो साइन-इन और guest access उपलब्ध",
    "Developed by Kaif (member of team CYBERLEEKS) ·": "काइफ द्वारा विकसित (टीम CYBERLEEKS के सदस्य) ·",
    "Sign in to ULPIN 3D": "ULPIN 3D में साइन इन करें",
    "Vertical Property Mapping & ULPIN Generation Platform": "लंबवत संपत्ति मैपिंग & ULPIN जनरेशन प्लेटफ़ॉर्म",
    "Email or username": "ईमेल या उपयोगकर्ता नाम",
    "Password": "पासवर्ड",
    "Sign In": "साइन इन करें",
    "Forgot password?": "पासवर्ड भूल गए?",
    "Demo Sign In": "डेमो साइन इन",
    "Continue with demo access": "डेमो एक्सेस के साथ जारी रखें",
    "Continue with guest access": "guest access के साथ जारी रखें",
"Welcome,": "स्वागत है,",
    " signed in as": " के रूप में साइन इन",
    "demo access": "डेमो एक्सेस",
    "Platform administration mode · mock workspace": "प्लेटफ़ॉर्म प्रशासन मोड · mock workspace",
    "All system dashboards": "सभी सिस्टम डैशबोर्ड",
    "Core platform modules": "कोर प्लेटफ़ॉर्म मॉड्यूल",
    "Team members": "टीम के सदस्य",
    "Data sources": "डेटा स्रोत",
    "System health": "सिस्टम हेल्थ",
    "Pending approvals": "लंबित अनुमोदन",
    "Records of Rights (RoR)": "अधिकार रिकॉर्ड (RoR)",
    "ULPIN records": "ULPIN रिकॉर्ड",
    "Mutation workflow": "परिवर्तन वर्कफ़्लो",
    "Ownership search": "स्वामित्व खोज",
    "Cadastral map viewer": "कैडास्ट्रल मानचित्र दर्शक",
    "3D volume browser": "3D वॉल्यूम ब्राउज़र",
    "Field survey channels": "फ़ील्ड सर्वे चैनल",
    "LiDAR & AI modules": "LiDAR & AI मॉड्यूल",
    "Building register": "भवन रजिस्टर",
    "Underground infrastructure": "भूमिगत बुनियादी ढांचा",
    "Air rights register": "हवाई अधिकार रजिस्टर",
    "Role workspace · demo": "भूमिका workspace · डेमो",
    "Loading parcel map…": "पार्सल मानचित्र लोड हो रहा है…",
    "Interactive cadastral map": "इंटरैक्टिव कैडास्ट्रल मानचित्र",
    "Parcels on this view": "इस View पर पार्सल",
    "Survey numbers": "सर्वे संख्याएं",
    "Total area": "कुल क्षेत्र",
    "Demarcated": "सीमांकित",
    "Confirmed": "पुष्टि किया गया",
    "Under review": "समीक्षा में",
    "Map layer": "मानचित्र परत",
    "Satellite": "सैटेलाइट",
    "Cadastral": "कैडास्ट्रल",
    "Hybrid": "हाइब्रिड",
    "Legend": "लीजेंड",
    "Parcels": "पार्सल",
    "Show parcels": "पार्सल दिखाएं",
    "Show buildings": "भवन दिखाएं",
    "Reset map": "मानचित्र रीसेट करें",
    "Parcels details": "पार्सल विवरण",
    "Survey No.": "सर्वे क्र.।",
    "Location": "स्थान",
    "Owner": "मालिक",
    "Area": "क्षेत्र",
    "Status": "स्थिति",
    "Close": "बंद करें",
"3D Property Explorer": "3D संपत्ति एक्सप्लोरर",
    "Explore registered vertical properties in 3D": "3D में पंजीकृत लंबवत संपत्तियों का अन्वेषण करें",
    "Floors": "मंजिलें",
    "Units": "इकाइयां",
    "No building data": "कोई भवन डेटा नहीं",
    "Drag to rotate · Scroll to zoom": "घूमाने के लिए खींचें · ज़ूम के लिए स्क्रॉल करें",
    "Back to Dashboard": "डैशबोर्ड पर वापस जाएं",
    "Select a building to view property information.": "संपत्ति जानकारी देखने के लिए एक भवन चुनें।",
    "3D volumetric property model": "3D वॉल्यूमेट्रिक संपत्ति मॉडल",
    "Interactive 3D building · floors as stacked property volumes · drag to orbit · click a floor": "इंटरैक्टिव 3D भवन · मंजिलें stacked संपत्ति वॉल्यूम के रूप में · ऑर्बिट के लिए खींचें · एक मंजिल पर क्लिक करें",
    "Retail": "खुदरा",
    "Parking": "पार्किंग",
    "Selected": "चयनित",
    "Unit": "इकाई",
    "Type": "प्रकार",
    "Switch building": "भवन बदलें",
    "Choose building": "भवन चुनें",
    "Land parcel registry": "भूमि पार्सल रजिस्ट्री",
    "Mock RoR data merged with geo-coordinates · click a row to locate": "मॉक RoR डेटा geo-coordinates के साथ मिलाया गया · स्थान खोजने के लिए एक पंक्ति पर क्लिक करें",
    "Generate missing ULPINs": "लापता ULPIN जनरेट करें",
    "Search survey no, owner or ULPIN…": "सर्वे नंबर, मालिक या ULPIN खोजें…",
    "All land uses": "सभी भूमि उपयोग",
    "All statuses": "सभी स्थितियां",
    "Titled": "टाइटल्ड",
    "Pending survey": "लंबित सर्वे",
    "Disputed": "विवादित",
    "Land use": "भूमि उपयोग",
    "Area (sq m)": "क्षेत्र (वर्ग मीटर)",
    "Coordinates": "निर्देशांक",
    "Locate": "स्थान खोजें",
    "Locate on map": "मानचित्र पर स्थान खोजें",
    "Floors & units ledger": "मंजिलें & इकाइयां लेजर",
    "Every flat / commercial unit carries a volumetric ULPIN derived from its parent parcel": "प्रत्येक फ्लैट / वाणिज्यिक इकाई अपने मूल पार्सल से व्युत्पन्न एक वॉल्यूमेट्रिक ULPIN रखती है",
    "Unit ID": "इकाई ID",
    "Building": "भवन",
    "Floor": "मंजिल",
    "Area (sq ft)": "क्षेत्र (वर्ग फीट)",
    "Volumetric ULPIN": "वॉल्यूमेट्रिक ULPIN",
    "Sample subset · full ledger in Phase 2": "नमूना उपसमुच्चय · फेज 2 में पूरा लेजर",
"Generate a ULPIN": "एक ULPIN जनरेट करें",
    "Demo generator · administrative codes + parcel coordinates": "डेमो जनरेटर · प्रशासकीय कोड + पार्सल निर्देशांक",
    "State": "राज्य",
    "District": "जिला",
    "Sub-district / Tehsil": "उप-जिला / तहसील",
    "Village": "गांव",
    "Land parcel (survey number)": "भूमि पार्सल (सर्वे संख्या)",
    "Generate Surface ULPIN": "सतह ULPIN जनरेट करें",
    "What is ULPIN?": "ULPIN क्या है?",
    "A 26-character unique land parcel ID (state": "26-अक्षर अद्वितीय भूमि पार्सल ID (राज्य",
    "for demonstration — the official scheme is issued by state revenue departments.": "प्रदर्शन के लिए — आधिकारिक योजना राज्य राजस्व विभागों द्वारा जारी की जाती है।",
    "simulated format": "सिम्युलेटेड प्रारूप",
    "). This is a": "). यह एक",
    "Vertical Property ULPIN": "लंबवत संपत्ति ULPIN",
    "Extend the surface identity to a building, floor or unit": "सतह पहचान को एक भवन, मंजिल या इकाई तक विस्तारित करें",
    "Generate Vertical ULPIN": "लंबवत ULPIN जनरेट करें",
    "Issued identity": "जारी पहचान",
    "Result of the last generation": "अंतिम जनरेशन का परिणाम",
    "Choose a parcel on the left and press": "बाईं ओर एक पार्सल चुनें और दबाएं",
    "Generate ULPIN": "ULPIN जनरेट करें",
    "Verify an existing ULPIN": "मौजूदा ULPIN की पुष्टि करें",
    "Paste a 26-character ULPIN…": "26-अक्षर ULPIN पेस्ट करें…",
    "Verify": "पुष्टि करें",
    "How it works": "यह कैसे काम करता है",
    "Official pipeline planned for later phases": "बाद के चरणों के लिए आधिकारिक पाइपलाइन योजनाबद्ध",
    "RoR + map merge": "RoR + मानचित्र मिलान",
    "Records of Rights are matched to cadastral map polygons.": "अधिकार रिकॉर्ड कैडास्ट्रल मानचित्र बहुभुजों से मेल खाते हैं।",
    "Geo-coordinate encoding": "भौगोलिक निर्देशांक एन्कोडिंग",
    "Parcel corner coordinates are encoded into the last 14 characters.": "पार्सल कोने के निर्देशांक अंतिम 14 अक्षरों में एन्कोड किए जाते हैं।",
    "Stamping & 3D linking": "स्टैम्पिंग & 3D लिंकिंग",
    "The ULPIN anchors all vertical volumes — floors, flats, utilities, air space.": "ULPIN सभी लंबवत वॉल्यूम को जड़ता है — मंजिलें, फ्लैट, यूटिलिटीज़, हवा का स्थान।",
    "Subsurface infrastructure register": "उप-भूजल बुनियादी ढांचा रजिस्टर",
    "Underground utilities tied to their host parcels & exact depths": "उनके होस्ट पार्सल और सटीक गहराइयों से जुड़ी भूमिगत यूटिलिटीज़",
"Water": "पानी",
    "Sewer": "सीवर",
    "Gas": "गैस",
    "Power": "बिजली",
    "Fiber": "फाइबर",
    "Air rights & air-space volumes": "हवाई अधिकार & हवा के स्थान वॉल्यूम",
    "Legal 3D volumes for towers, FSI utilisation & aerial utilities": "गगनचुंबी इमारतों, FSI उपयोग & वायु यूटिलिटीज़ के लिए कानूनी 3D वॉल्यूम",
    "Phase 2 module": "फेज 2 मॉड्यूल",
    "Concept": "अवधारणा",
    "Each air-space volume is registered as a 3D parcel above a base ULPIN — enabling FSI banking, drone corridors and overhead utility easements.": "प्रत्येक हवा के स्थान वॉल्यूम एक आधार ULPIN के ऊपर 3D पार्सल के रूप में पंजीकृत किया जाता है — FSI बैंकिंग, ड्रोन गलियारों और ऊपरी यूटिलिटी आसानी को सक्षम करना।",
    "Registered air parcels": "पंजीकृत हवा के पार्सल",
    "Sample records · demo": "नमूना रिकॉर्ड · डेमो",
    "AI Cadastral Analysis": "AI कैडास्ट्रल विश्लेषण",
    "AI-powered validation, property intelligence and 3D cadastral insights": "AI-संचालित सत्यापन, संपत्ति खुफिया और 3D कैडास्ट्रल अंतर्दृष्टि",
    "Live Analysis": "लाइव विश्लेषण",
    "AI Insights": "AI अंतर्दृष्टि",
    "Real-time system metrics": "रियल-टाइम सिस्टम मेट्रिक्स",
    "Analysis Control Panel": "विश्लेषण नियंत्रण पैनल",
    "Select analysis type and run AI validation": "विश्लेषण प्रकार चुनें और AI सत्यापन चलाएं",
    "Parcel Analysis": "पार्सल विश्लेषण",
    "Building Analysis": "भवन विश्लेषण",
    "AI Building Extraction": "AI भवन निष्कर्षण",
    "AI Floor Segmentation": "AI मंजिल विभाजन",
    "Vertical Parcel Delineation": "लंबवत पार्सल परिभाषा",
    "Topology Validation": "टोपोलॉजी सत्यापन",
    "ULPIN Validation": "ULPIN सत्यापन",
    "Ownership Conflict Detection": "स्वामित्व संघर्ष पहचान",
    "Infrastructure Analysis": "बुनियादी ढांचा विश्लेषण",
    "Infrastructure Planning": "बुनियादी ढांचा योजना",
    "Run AI Analysis": "AI विश्लेषण चलाएं",
    "Analysis Results": "विश्लेषण परिणाम",
    "Select an analysis type and click \"Run AI Analysis\"": "एक विश्लेषण प्रकार चुनें और \"AI विश्लेषण चलाएं\" पर क्लिक करें",
    "AI analysis results will appear here.": "AI विश्लेषण परिणाम यहां दिखाई देंगे।",
    "Select an analysis type from the panel above and run the analysis.": "ऊपर दिए गए पैनल से विश्लेषण प्रकार चुनें और विश्लेषण चलाएं।"
  },
  ta: {
"Main": "முக்கியம்", "Registry": "பதிவு", "Tools": "கருவிகள்", "Intelligence": "நுண்ணறிவு",
    "Dashboard": "டாஷ்போர்டு", "Map Viewer": "செவ்வியல் பார்வையாளர்", "3D Property View": "3D சொத்து காணொளி",
    "Land Parcels": "நிலத் துணுக்கள்", "Buildings": "கட்டிடங்கள்", "Floors & Units": "தரக்கட்டம் & அலகுகள்",
    "ULPIN Generator": "ULPIN உருவாக்கி", "Underground Infra": "நிலத்தட்டு அடிப்படைக் கட்டமைப்பு",
    "Air Rights": "காற்றுரிமைகள்", "AI & ML Analysis": "AI & ML ஆய்வு", "Data Sources": "தரவுக் கொள்முதல்கள்",
    "Settings": "அமைப்புகள்", "LIVE": "லைவ்", "Survey Master · RTK Network": "விஞ்ஞான மாஸ்டர் · RTK வலையமைப்பு",
    "Account": "கணக்கு", "Menu": "மெனு", "Notifications": "அறிவிப்புகள்", "Language": "மொழி",
    "GPS / GNSS ONLINE": "GPS / GNSS ஆன்லைன்", "DEMO DATA": "டெமோ தரவு", "Sign in": "உள்நுழையவும்",
    "Vertical Property Mapping": "உயர் சொத்து வரைபடம்",
    "Smart India Hackathon · Digital India Land Records": "ச்மார்ட் இந்தியா ஹேக்கத்ோன் · டிஜிட்டல் இந்தியா நிலப் பதிவுகள்",
    "3D ULPIN & Vertical Property Mapping System": "3D ULPIN & உயர் சொத்து வரைபட அமைப்பு",
    "Digital 3D Cadastral Platform for Smart Land & Property Management": "ச்மார்ட் நில & சொத்து மேலாண்மை சார்ந்த டிஜிட்டல் 3D காட்டாஸ்ட்ரல் தளம்",
    "A next-generation platform for managing surface parcels, buildings, floors, apartments, vertical ownership and spatial property information.": "தகடுகள், கட்டிடங்கள், தரக்கட்டங்கள், வீட்டுவசதிகள், உயர் சொத்துரிமை மற்றும் பகுப்பாய்வு சொத்துத் தகவல்களை பராமரிக்க அடுத்த தலைமுறை தளம்.",
    "Please select your role to continue": "தொடர கடந்து உங்கள் பங்கு தேர்ந்தெடுக்கவும்",
    "Skip to demo platform": "டெமோ தளத்திற்கு செல்லவும்",
    "Version 1.0 · Demo sign-in and guest access available": "பதிப்பு 1.0 · டெமோ சைன்-இன் மற்றும் விருந்தினர் அணுகல் கிடைக்கிறது",
    "Developed by Kaif (member of team CYBERLEEKS) ·": "கைஃபால் உருவாக்கியது (குழு CYBERLEEKS உறுப்பினர்) ·",
    "Sign in to ULPIN 3D": "ULPIN 3D இல் உள்நுழையவும்",
    "Vertical Property Mapping & ULPIN Generation Platform": "உயர் சொத்து வரைபடம் & ULPIN உருவாக்க தளம்",
    "Email or username": "மின்னஞ்சல் அல்லது பயனர் பெயர்",
    "Password": "கடவுச்செய்யல்",
    "Sign In": "சைன் இன் செய்யவும்",
    "Forgot password?": "கடவுச்செய்யல் மறந்துவிட்டீர்களா?",
    "Demo Sign In": "டெமோ சைன் இன்",
    "Continue with demo access": "டெமோ அணுகலுடன் தொடரவும்",
    "Continue with guest access": "விருந்தினர் அணுகலுடன் தொடரவும்",
"Welcome,": "வரவேற்கிறோம்,",
    " signed in as": " மூலம் சைன் இன் ஆகிறீர்கள்",
    "demo access": "டெமோ அணுகல்",
    "Platform administration mode · mock workspace": "தள நிர்வாக முறை · மாக் பணியிடம்",
    "All system dashboards": "அனைத்து கணினி டாஷ்போர்டுகள்",
    "Core platform modules": "மூல தள தொகுதிகள்",
    "Team members": "குழு உறுப்பினர்கள்",
    "Data sources": "தரவுக் கொள்முதல்கள்",
    "System health": "கணினி ஆரோக்கியம்",
    "Pending approvals": "தொடக்க ஒப்புதல்கள்",
    "Records of Rights (RoR)": "உரிமைப் பதிவுகள் (RoR)",
    "ULPIN records": "ULPIN பதிவுகள்",
    "Mutation workflow": "மாற்ற பணியேற்றம்",
    "Ownership search": "சொத்துரிமை தேடல்",
    "Cadastral map viewer": "காட்டாஸ்ட்ரல் வரைபட பார்வையாளர்",
    "3D volume browser": "3D பருப்பொருள் உலாவி",
    "Field survey channels": "துறை விஞ்ஞான சேனல்கள்",
    "LiDAR & AI modules": "LiDAR & AI தொகுதிகள்",
    "Building register": "கட்டிட பதிவு",
    "Underground infrastructure": "நிலத்தட்டு அடிப்படைக் கட்டமைப்பு",
    "Air rights register": "காற்றுரிமை பதிவு",
    "Role workspace · demo": "பங்கு பணியிடம் · டெமோ",
    "Loading parcel map…": "துணுக்கு வரைபடம் ஏற்றுக்கொள்ளப்படுகிறது…",
    "Interactive cadastral map": "ஊடக காட்டாஸ்ட்ரல் வரைபடம்",
    "Parcels on this view": "இந்த காட்சியில் துணுக்கள்",
    "Survey numbers": "விஞ்ஞான எண்கள்",
    "Total area": "மொத்த பரப்பளவு",
    "Demarcated": "எல்லை வரையப்பட்ட",
    "Confirmed": "உறுதிப்படுத்தப்பட்ட",
    "Under review": "ஆய்வில்",
    "Map layer": "வரைபடப் பட்டம்",
    "Satellite": "செயற்கைக் கோள்",
    "Cadastral": "காட்டாஸ்ட்ரல்",
    "Hybrid": "கலப்பு",
    "Legend": "விளக்கம்",
    "Parcels": "துணுக்கள்",
    "Show parcels": "துணுக்களைக் காட்டவும்",
    "Show buildings": "கட்டிடங்களைக் காட்டவும்",
    "Reset map": "வரைபடத்தை மீட்டமைக்கவும்",
    "Parcels details": "துணுக்கு விவரங்கள்",
    "Survey No.": "விஞ்ஞான எண்.",
    "Location": "இடம்",
    "Owner": "உரிமையாளர்",
    "Area": "பரப்பளவு",
    "Status": "நிலை",
    "Close": "மூடவும்",
"3D Property Explorer": "3D சொத்து ஆய்வாளர்",
    "Explore registered vertical properties in 3D": "3D-ல் பதிவு செய்யப்பட்ட உயர் சொத்துக்களை ஆய்வு செய்யவும்",
    "Floors": "தரக்கட்டங்கள்",
    "Units": "அலகுகள்",
    "No building data": "கட்டிடத் தரவு இல்லை",
    "Drag to rotate · Scroll to zoom": "சுழற்ற இழுத்து விடவும் · சிரிம்ப ஸ்க்ரால் செய்யவும்",
    "Back to Dashboard": "டாஷ்போர்டுக்குத் திரும்பவும்",
    "Select a building to view property information.": "சொத்துத் தகவல்களைப் பார்க்க ஒரு கட்டிடத்தைத் தேர்ந்தெடுக்கவும்.",
    "3D volumetric property model": "3D பருப்பொருள் சொத்து மாதிரி",
    "Interactive 3D building · floors as stacked property volumes · drag to orbit · click a floor": "ஊடக 3D கட்டிடம் · தரக்கட்டங்கள் அடுக்குப் பொருள் பருப்பொருளாக · சுழற்ற இழுத்து விடவும் · ஒரு தரக்கட்டத்தைக் கிளிக் செய்யவும்",
    "Retail": "விற்பனை",
    "Parking": "பார்க்கிங்",
    "Selected": "தேர்ந்தெடுக்கப்பட்டது",
    "Unit": "அலகு",
    "Type": "வகை",
    "Switch building": "கட்டிடத்தை மாற்றவும்",
    "Choose building": "கட்டிடத்தைத் தேர்ந்தெடுக்கவும்",
    "Land parcel registry": "நிலத் துணுக்கு பதிவு",
    "Mock RoR data merged with geo-coordinates · click a row to locate": "மாக் RoR தரவு புவியியல் ஆயத்திரங்களுடன் இணைக்கப்பட்டது · இடத்தைக் கண்டுபிடிக்க ஒரு வரியைக் கிளிக் செய்யவும்",
    "Generate missing ULPINs": "நிலவில்லா ULPIN-களை உருவாக்கவும்",
    "Search survey no, owner or ULPIN…": "விஞ்ஞான எண், உரிமையாளர் அல்லது ULPIN தேடவும்…",
    "All land uses": "அனைத்து நில பயன்பாடுகள்",
    "All statuses": "அனைத்து நிலைகள்",
    "Titled": "தலைப்புடைய",
    "Pending survey": "தொடக்க விஞ்ஞானம்",
    "Disputed": "புகாரளிக்கப்பட்ட",
    "Land use": "நில பயன்பாடு",
    "Area (sq m)": "பரப்பளவு (சதுர மீட்டர்)",
    "Coordinates": "ஆயத்திரங்கள்",
    "Locate": "இடத்தைக் கண்டுபிடி",
    "Locate on map": "வரைபடத்தில் இடத்தைக் கண்டுபிடி",
    "Floors & units ledger": "தரக்கட்டம் & அலகு புத்தகம்",
    "Every flat / commercial unit carries a volumetric ULPIN derived from its parent parcel": "ஒவ்வொரு ஃப்ளாட் / வணிக அலகும் தனது பெற்றோர் துணுக்கிலிருந்து பெறப்பட்ட ஒரு பருப்பொருள் ULPIN-ஐ எடுத்துக்கொள்கிறது",
    "Unit ID": "அலகு ஐடி",
    "Building": "கட்டிடம்",
    "Floor": "தரக்கட்டம்",
    "Area (sq ft)": "பரப்பளவு (சதுர அடி)",
    "Volumetric ULPIN": "பருப்பொருள் ULPIN",
    "Sample subset · full ledger in Phase 2": "மாதிரி தொகுத்துக்கள் · இறுதிப் புத்தகம் கட்டம் 2-ல்",
"Generate a ULPIN": "ஒரு ULPIN உருவாக்கவும்",
    "Demo generator · administrative codes + parcel coordinates": "டெமோ உருவாக்கி · நிர்வாக குறியீடுகள் + துணுக்கு ஆயத்திரங்கள்",
    "State": "மாநிலம்",
    "District": "மாவட்டம்",
    "Sub-district / Tehsil": "துணை-மாவட்டம் / தேக்சில்",
    "Village": "கிராமம்",
    "Land parcel (survey number)": "நிலத் துணுக்கு (விஞ்ஞான எண்)",
    "Generate Surface ULPIN": "தகடு ULPIN உருவாக்கவும்",
    "What is ULPIN?": "ULPIN என்ன?",
    "A 26-character unique land parcel ID (state": "26-எழுத்து தனித்துவமான நிலத் துணுக்கு ஐடி (மாநிலம்",
    "for demonstration — the official scheme is issued by state revenue departments.": "காட்சிக்காக — அதிகாரப்பூர்வமான திட்டம் மாநில வருவாய் துறைகளால் வெளியிடப்படுகிறது.",
    "simulated format": "காட்சித் தொகுதி",
    "). This is a": "). இது ஒரு",
    "Vertical Property ULPIN": "உயர் சொத்து ULPIN",
    "Extend the surface identity to a building, floor or unit": "தகடு அடையாளத்தை ஒரு கட்டிடம், தரக்கட்டம் அல்லது அலகுக்கு விரிவுபடுத்தவும்",
    "Generate Vertical ULPIN": "உயர் ULPIN உருவாக்கவும்",
    "Issued identity": "வெளியிடப்பட்ட அடையாளம்",
    "Result of the last generation": "கடைசி உருவாக்கத்தின் முடிவு",
    "Choose a parcel on the left and press": "இடதுபுறத்தில் ஒரு துணுக்கைத் தேர்ந்தெடுத்து அழுத்தவும்",
    "Generate ULPIN": "ULPIN உருவாக்கவும்",
    "Verify an existing ULPIN": "ஏற்கனவே உள்ள ULPIN-ஐ சரிபார்க்கவும்",
    "Paste a 26-character ULPIN…": "26-எழுத்து ULPIN ஒன்றை ஒட்டவும்…",
    "Verify": "சரிபார்க்கவும்",
    "How it works": "இது எப்படி வேலை செய்கிறது",
    "Official pipeline planned for later phases": "பின்னர் கட்டங்களுக்கான அதிகாரப்பூர்வ பைப்பிளைன் திட்டமிடப்பட்டது",
    "RoR + map merge": "RoR + வரைபட இணைப்பு",
    "Records of Rights are matched to cadastral map polygons.": "உரிமைப் பதிவுகள் காட்டாஸ்ட்ரல் வரைபட பலகோணங்களுடன் பொருந்தவும்.",
    "Geo-coordinate encoding": "புவியியல் ஆயத்திர குறியீடு",
    "Parcel corner coordinates are encoded into the last 14 characters.": "துணுக்கு முனை ஆயத்திரங்கள் கடைசி 14 எழுத்துக்களில் குறியீடு செய்யப்படுகின்றன.",
    "Stamping & 3D linking": "முத்திரை & 3D இணைப்பு",
    "The ULPIN anchors all vertical volumes — floors, flats, utilities, air space.": "ULPIN அனைத்து உயர் பருப்பொருள்களையும் கட்டுப்படுத்துகிறது — தரக்கட்டங்கள், ஃப்ளாட்கள், பயன்பாடுகள், காற்றுப் பரப்பு.",
    "Subsurface infrastructure register": "புவியியல் அடிப்படைக் கட்டமைப்பு பதிவு",
    "Underground utilities tied to their host parcels & exact depths": "தங்கள் உரிமைத் துணுக்குகளுக்கும் துல்லிய ஆழங்களுக்கும் இணைக்கப்பட்ட நிலத்தட்டு பயன்பாடுகள்",
    "Water": "தண்ணீர்",
    "Sewer": "கழிவுநீர்",
    "Gas": "எரிவாயு",
    "Power": "மின்சாரம்",
    "Fiber": "ஃபைபர்",
    "Air rights & air-space volumes": "காற்றுரிமைகள் & காற்றுப் பரப்பு பருப்பொருள்கள்",
    "Legal 3D volumes for towers, FSI utilisation & aerial utilities": "கோபுரங்கள், FSI பயன்பாடு & காற்றுப் பயன்பாடுகளுக்கான சட்டப்பூர்வ 3D பருப்பொருள்கள்",
    "Phase 2 module": "கட்டம் 2 தொகுதி",
    "Concept": "கருத்து",
    "Each air-space volume is registered as a 3D parcel above a base ULPIN — enabling FSI banking, drone corridors and overhead utility easements.": "ஒவ்வொரு காற்றுப் பரப்பு பருப்பொருளும் ஒரு அடிப்படை ULPIN-க்கு மேலே 3D துணுக்காக பதிவுசெய்யப்படுகிறது — FSI வங்கி, டிரோன் பாலங்கள் மற்றும் மேலெழுச்சி பயன்பாடு வசதிகளை செயல்படுத்துகிறது.",
    "Registered air parcels": "பதிவு செய்யப்பட்ட காற்றுத் துணுக்கள்",
    "Sample records · demo": "மாதிரி பதிவுகள் · டெமோ",
    "AI Cadastral Analysis": "AI காட்டாஸ்ட்ரல் ஆய்வு",
    "AI-powered validation, property intelligence and 3D cadastral insights": "AI-சார்ந்த சரிபார்ப்பு, சொத்து நுண்ணறிவு மற்றும் 3D காட்டாஸ்ட்ரல் புதுமைகள்",
    "Live Analysis": "லைவ் ஆய்வு",
    "AI Insights": "AI புதுமைகள்",
    "Real-time system metrics": "நிகழ்நேர கணினி அளவுகோல்கள்",
    "Analysis Control Panel": "ஆய்வு கட்டுப்பாட்டுப் பண்டலம்",
    "Select analysis type and run AI validation": "ஆய்வு வகையைத் தேர்ந்தெடுத்து AI சரிபார்ப்பை இயக்கவும்",
    "Parcel Analysis": "துணுக்கு ஆய்வு",
    "Building Analysis": "கட்டிட ஆய்வு",
    "AI Building Extraction": "AI கட்டிட பிரிவு",
    "AI Floor Segmentation": "AI தரக்கட்டம் பிரிவு",
    "Vertical Parcel Delineation": "உயர் துணுக்கு வரையறை",
    "Topology Validation": "டாப்பாலஜி சரிபார்ப்பு",
    "ULPIN Validation": "ULPIN சரிபார்ப்பு",
    "Ownership Conflict Detection": "சொத்துரிமை மோதல் கண்டறிதல்",
    "Infrastructure Analysis": "கட்டமைப்பு ஆய்வு",
    "Infrastructure Planning": "கட்டமைப்பு திட்டமிடல்",
    "Run AI Analysis": "AI ஆய்வை இயக்கவும்",
    "Analysis Results": "ஆய்வு முடிவுகள்",
    "Select an analysis type and click \"Run AI Analysis\"": "ஒரு ஆய்வு வகையைத் தேர்ந்தெடுத்து \"AI ஆய்வை இயக்கவும்\" என்பதைக் கிளிக் செய்யவும்",
    "AI analysis results will appear here.": "AI ஆய்வு முடிவுகள் இங்கே தோன்றும்.",
    "Select an analysis type from the panel above and run the analysis.": "மேலே உள்ள பண்டலத்திலிருந்து ஒரு ஆய்வு வகையைத் தேர்ந்தெடுத்து ஆய்வை இயக்கவும்."
  }
  };
/* ===================== language selector + engine (add-on) ===================== */

  var currentLang = "en";
  try { currentLang = localStorage.getItem(STORE_KEY) || "en"; } catch (e) {}
  if (!LANGS[currentLang]) { currentLang = "en"; }

  var LABELS = { en: "English", hi: "हिन्दी", te: "తెలుగు", ta: "தமிழ்" };
  var WRAP_ID = "i18n-lang-wrap";
  var SEL_ID = "i18n-lang-select";
  var applying = false;

  var translate = function (s) {
    if (!s || currentLang === "en") { return s; }
    var d = DICT[currentLang];
    if (d && d[s] != null) { return d[s]; }
    var rs = RULES[currentLang];
    if (rs) {
      for (var k = 0; k < rs.length; k++) {
        if (rs[k].re.test(s)) { return s.replace(rs[k].re, rs[k].t); }
      }
    }
    return s;
  };

  var skipped = function (el) {
    if (!el) { return true; }
    var t = (el.tagName || "").toLowerCase();
    if (t === "script" || t === "style" || t === "textarea" || t === "option" || t === "title") { return true; }
    if (el.getAttribute && el.getAttribute("data-i18n-skip") !== null) { return true; }
    if (el.id === WRAP_ID || el.id === SEL_ID) { return true; }
    if (el.closest && el.closest("#" + WRAP_ID)) { return true; }
    if (el.closest && el.closest("#" + SEL_ID)) { return true; }
    return false;
  };

  var keepOriginal = function (el, attr) {
    var o = "__i18n_orig_" + attr;
    if (el[o] === undefined) { el[o] = el.getAttribute(attr); }
    return el[o];
  };

  var registerText = function (tn) {
    if (!tn || tn.__i18nReady) { return; }
    if (!tn.parentNode || skipped(tn.parentNode)) { return; }
    var s = tn.nodeValue;
    if (!s || !String(s).trim()) { return; }
    tn.__i18nOrig = s;
    tn.__i18nLast = s;
    tn.__i18nReady = true;
  };

  var applyText = function (tn) {
    if (!tn || tn.__i18nReady !== true) { return; }
    var cur = tn.nodeValue;
    if (tn.__i18nLast !== undefined && cur !== tn.__i18nLast && cur !== tn.__i18nOrig) {
      /* app replaced the text with a new (English) value -> treat as new original */
      tn.__i18nOrig = cur;
    }
    var out = currentLang === "en" ? tn.__i18nOrig : translate(tn.__i18nOrig);
    if (cur !== out) { tn.nodeValue = out; }
    tn.__i18nLast = out;
  };

  var applyEl = function (el) {
    if (!el || skipped(el)) { return; }
    var attrs = ["placeholder", "title", "aria-label"];
    for (var i = 0; i < attrs.length; i++) {
      var a = attrs[i];
      if (!el.hasAttribute || !el.hasAttribute(a)) { continue; }
      var o = keepOriginal(el, a);
      if (o == null) { continue; }
      var v = currentLang === "en" ? o : translate(o);
      if (el.getAttribute(a) !== v) { el.setAttribute(a, v); }
    }
  };

  var registerAll = function () {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var n = walker.nextNode();
    while (n) {
      registerText(n);
      n = walker.nextNode();
    }
  };

  var apply = function () {
    registerAll();
    var all = document.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      applyEl(all[i]);
      var kids = all[i].childNodes;
      for (var j = 0; j < kids.length; j++) {
        if (kids[j].nodeType === Node.TEXT_NODE) { applyText(kids[j]); }
      }
    }
    var sel = document.getElementById(SEL_ID);
    if (sel && sel.value !== currentLang) { sel.value = currentLang; }
  };
var timer = null;
  var onMutation = function () {
    if (applying || currentLang === "en") { return; }
    if (timer) { clearTimeout(timer); }
    timer = setTimeout(function () {
      timer = null;
      applying = true;
      try { apply(); } finally { applying = false; }
    }, 150);
  };

  var setLang = function (lang) {
    if (!LANGS[lang]) { lang = "en"; }
    currentLang = lang;
    try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    applying = true;
    try { apply(); } finally { applying = false; }
    if (typeof window.dispatchEvent === "function") {
      try { window.dispatchEvent(new Event("ulpin:langchange")); } catch (e2) {}
    }
  };

  var ensureStyle = function () {
    if (document.getElementById("i18n-style")) { return; }
    var st = document.createElement("style");
    st.id = "i18n-style";
    st.textContent = "#i18n-lang-wrap{display:inline-flex;align-items:center;gap:4px;margin:0 6px;}" +
      "#i18n-lang-wrap .i18n-lang-label{font-size:12px;color:#94a3b8;}" +
      "#i18n-lang-select{font-size:13px;padding:3px 6px;border-radius:6px;background:transparent;color:inherit;border:1px solid rgba(148,163,184,.5);outline:none;cursor:pointer;}";
    document.head.appendChild(st);
  };

  var ensureSelector = function () {
    if (document.getElementById(WRAP_ID)) { return document.getElementById(WRAP_ID); }
    ensureStyle();
    var wrap = document.createElement("span");
    wrap.id = WRAP_ID;
    wrap.className = "chip i18n-lang-chip";
    wrap.setAttribute("data-i18n-skip", "");
    var lbl = document.createElement("span");
    lbl.className = "i18n-lang-label";
    lbl.setAttribute("data-i18n-skip", "");
    lbl.textContent = "Language";
    var sel = document.createElement("select");
    sel.id = SEL_ID;
    sel.setAttribute("data-i18n-skip", "");
    sel.setAttribute("aria-label", "Language");
    ["en", "hi", "te", "ta"].forEach(function (code) {
      var o = document.createElement("option");
      o.value = code;
      o.textContent = LABELS[code];
      sel.appendChild(o);
    });
    sel.value = currentLang;
    sel.addEventListener("change", function () { setLang(sel.value); }, false);
    wrap.appendChild(lbl);
    wrap.appendChild(sel);
    var host = document.querySelector(".topbar .tb-right");
    if (!host) { host = document.querySelector(".topbar, .top-bar, header.topbar"); }
    if (host) {
      host.appendChild(wrap);
    } else {
      var nav = document.getElementById("nav");
      if (nav) { nav.insertBefore(wrap, nav.firstChild); }
      else { document.body.insertBefore(wrap, document.body.firstChild); }
    }
    return wrap;
  };

  var boot = function () {
    ensureSelector();
    applying = true;
    try { apply(); } finally { applying = false; }
    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(onMutation);
      mo.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();