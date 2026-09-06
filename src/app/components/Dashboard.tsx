import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Leaf, CloudRain, TrendingUp, Camera, Mic, User, Activity, MoreVertical, Gamepad2, BookOpen, MessageCircle } from 'lucide-react';

export function Dashboard() {
  const [language, setLanguage] = useState('en');
  const [location, setLocation] = useState({ latitude: 0, longitude: 0 });
  const [quickStats, setQuickStats] = useState<any>(null);
  const [greeting, setGreeting] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    }
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMoreMenu]);

  useEffect(() => {
    // Get user location with defensive error handling
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            try {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            } catch (e) {
              console.error('Location state update error:', e);
            }
          },
          (error) => {
            // Default to somewhere in India on error
            console.log('Geolocation error, using default location:', error);
            try {
              setLocation({ latitude: 20.5937, longitude: 78.9629 });
            } catch (e) {
              console.error('Default location error:', e);
            }
          },
          { timeout: 5000, maximumAge: 60000 }
        );
      } else {
        // Geolocation not supported, use default
        setLocation({ latitude: 20.5937, longitude: 78.9629 });
      }
    } catch (error) {
      // Fallback if geolocation API throws
      console.error('Geolocation API error:', error);
      try {
        setLocation({ latitude: 20.5937, longitude: 78.9629 });
      } catch (e) {
        console.error('Fallback location error:', e);
      }
    }

    // Load quick stats
    try {
      fetchQuickStats();
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    }
  }, []);

  useEffect(() => {
    const greetings = {
      en: 'Welcome, Farmer!',
      hi: 'स्वागत है, किसान!',
      ta: 'வரவேற்கிறோம், விவசாயி!',
      te: 'స్వాగతం, రైతు!'
    };
    setGreeting(greetings[language as keyof typeof greetings] || greetings.en);
  }, [language]);

  const fetchQuickStats = async () => {
    // Use client-side mock data only
    setQuickStats({
      weather: {
        day: new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        temp_max: (28 + Math.random() * 8).toFixed(1),
        temp_min: (18 + Math.random() * 6).toFixed(1),
        conditions: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]
      },
      topMarketCrop: {
        name: 'Cotton',
        currentPrice: (6200 + (Math.random() - 0.5) * 800).toFixed(0),
        change: ((Math.random() - 0.5) * 10).toFixed(1),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      }
    });
  };

  const features = [
    {
      icon: Leaf,
      title: { en: 'Soil Analysis', hi: 'मिट्टी विश्लेषण', ta: 'மண் பகுப்பாய்வு', te: 'నేల విశ్లేషణ' },
      desc: { en: 'Real-time soil data', hi: 'रीयल-टाइम मिट्टी डेटा', ta: 'நேரடி மண் தரவு', te: 'నిజ-సమయ నేల డేటా' },
      link: '/soil-analysis',
      color: 'bg-green-500',
    },
    {
      icon: Activity,
      title: { en: 'Crop Advisory', hi: 'फसल सलाह', ta: 'பயிர் ஆலோசனை', te: 'పంట సలహా' },
      desc: { en: 'AI recommendations', hi: 'AI सिफारिशें', ta: 'AI பரிந்துரைகள்', te: 'AI సిఫార్సులు' },
      link: '/crop-advisory',
      color: 'bg-blue-500',
    },
    {
      icon: Camera,
      title: { en: 'Disease Detection', hi: 'रोग पहचान', ta: 'நோய் கண்டறிதல்', te: 'వ్యాధి గుర్తింపు' },
      desc: { en: 'Upload crop images', hi: 'फसल चित्र अपलोड करें', ta: 'பயிர் படங்களை பதிவேற்றவும்', te: 'పంట చిత్రాలను అప్‌లోడ్ చేయండి' },
      link: '/disease-detection',
      color: 'bg-red-500',
    },
    {
      icon: CloudRain,
      title: { en: 'Weather', hi: 'मौसम', ta: 'வானிலை', te: 'వాతావరణం' },
      desc: { en: '7-day forecast', hi: '7-दिन का पूर्वानुमान', ta: '7 நாள் முன்னறிவிப்பு', te: '7 రోజుల అంచనా' },
      link: '/weather',
      color: 'bg-sky-500',
    },
    {
      icon: TrendingUp,
      title: { en: 'Market Prices', hi: 'बाजार मूल्य', ta: 'சந்தை விலை', te: 'మార్కెట్ ధరలు' },
      desc: { en: 'Live rates & trends', hi: 'लाइव दरें और रुझान', ta: 'நேரடி விலைகள் மற்றும் போக்குகள்', te: 'ప్రత్యక్ష ధరలు & ట్రెండ్‌లు' },
      link: '/market-prices',
      color: 'bg-amber-500',
    },
    {
      icon: Mic,
      title: { en: 'Voice Assistant', hi: 'वॉयस सहायक', ta: 'குரல் உதவியாளர்', te: 'వాయిస్ సహాయకుడు' },
      desc: { en: 'Ask in your language', hi: 'अपनी भाषा में पूछें', ta: 'உங்கள் மொழியில் கேளுங்கள்', te: 'మీ భాషలో అడగండి' },
      onClick: () => window.dispatchEvent(new CustomEvent('open-voice-assistant')),
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">🌾 FarmVision</h1>
            <p className="text-sm text-green-100">
              {language === 'en' && 'Smart Farming Advisor'}
              {language === 'hi' && 'स्मार्ट कृषि सलाहकार'}
              {language === 'ta' && 'ஸ்மார்ட் விவசாய ஆலோசகர்'}
              {language === 'te' && 'స్మార్ట్ వ్యవసాయ సలహాదారు'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/profile" className="text-white hover:text-green-200 transition-colors">
              <User className="w-6 h-6" />
            </Link>
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-white hover:bg-green-500 p-1 rounded-full transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-6 h-6" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-20 min-w-[200px] py-2 overflow-hidden">
                  <Link
                    to="/agri-games"
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-gray-700 font-medium transition-colors"
                  >
                    <Gamepad2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Agri Games</p>
                      <p className="text-xs text-gray-500">Learn farming through play</p>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100 mx-3" />
                  <Link
                    to="/reference-papers"
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-gray-700 font-medium transition-colors"
                  >
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Reference Papers</p>
                      <p className="text-xs text-gray-500">Agriculture research library</p>
                    </div>
                  </Link>
                  <div className="h-px bg-gray-100 mx-3" />
                  <Link
                    to="/communication"
                    onClick={() => setShowMoreMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-green-50 text-gray-700 font-medium transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-800">Communication</p>
                      <p className="text-xs text-gray-500">Chat with farmers & buyers</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-20">
        {/* Language Selector */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'en' && 'Select Language'}
            {language === 'hi' && 'भाषा चुनें'}
            {language === 'ta' && 'மொழியைத் தேர்ந்தெடுக்கவும்'}
            {language === 'te' && 'భాషను ఎంచుకోండి'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['en', 'hi', 'ta', 'te'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  language === lang
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang === 'en' && 'English'}
                {lang === 'hi' && 'हिंदी'}
                {lang === 'ta' && 'தமிழ்'}
                {lang === 'te' && 'తెలుగు'}
              </button>
            ))}
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{greeting}</h2>
          <p className="text-gray-600">
            {language === 'en' && `Location: ${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E`}
            {language === 'hi' && `स्थान: ${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E`}
            {language === 'ta' && `இடம்: ${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E`}
            {language === 'te' && `స్థానం: ${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E`}
          </p>
        </div>

        {/* Hero Banner */}
        <div className="mb-6 relative rounded-lg overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1623211269755-569fec0536d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmYXJtZXIlMjBmaWVsZHxlbnwxfHx8fDE3NjkxNDE2NTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Farmer in field"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <div className="p-4 text-white">
              <p className="text-lg font-bold">
                {language === 'en' && 'Empowering Farmers with AI'}
                {language === 'hi' && 'AI से किसानों को सशक्त बनाना'}
                {language === 'ta' && 'AI மூலம் விவசாயிகளுக்கு அதிகாரம் அளித்தல்'}
                {language === 'te' && 'AI తో రైతులను శక్తివంతం చేయడం'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-sky-500 to-sky-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <CloudRain className="w-5 h-5" />
                <span className="font-medium">
                  {language === 'en' && 'Today\'s Weather'}
                  {language === 'hi' && 'आज का मौसम'}
                  {language === 'ta' && 'இன்றைய வானிலை'}
                  {language === 'te' && 'నేటి వాతావరణం'}
                </span>
              </div>
              <p className="text-2xl font-bold">{quickStats.weather?.temp_max}°C</p>
              <p className="text-sm opacity-90">{quickStats.weather?.conditions}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">
                  {language === 'en' && 'Top Market'}
                  {language === 'hi' && 'शीर्ष बाजार'}
                  {language === 'ta' && 'சிறந்த சந்தை'}
                  {language === 'te' && 'టాప్ మార్కెట్'}
                </span>
              </div>
              <p className="text-lg font-bold">{quickStats.topMarketCrop?.name}</p>
              <p className="text-sm">₹{quickStats.topMarketCrop?.currentPrice}/quintal</p>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            
            if (feature.onClick) {
              return (
                <button
                  key={index}
                  onClick={feature.onClick}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4 text-left w-full"
                >
                  <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {feature.title[language as keyof typeof feature.title]}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.desc[language as keyof typeof feature.desc]}
                  </p>
                </button>
              );
            }
            
            return (
              <Link
                key={index}
                to={feature.link!}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-4"
              >
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">
                  {feature.title[language as keyof typeof feature.title]}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.desc[language as keyof typeof feature.desc]}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Demo Banner */}
        <div className="mt-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-2">
            {language === 'en' && '🚀 Try the Demo Scenario'}
            {language === 'hi' && '🚀 डेमो परिदृश्य आजमाएं'}
            {language === 'ta' && '🚀 டெமோ காட்சியை முயற்சிக்கவும்'}
            {language === 'te' && '🚀 డెమో దృశ్యాన్ని ప్రయత్నించండి'}
          </h3>
          <p className="text-purple-100 mb-4 text-sm">
            {language === 'en' && 'Upload soil photo → Get Hindi voice response with maize recommendation'}
            {language === 'hi' && 'मिट्टी की फोटो अपलोड करें → मक्का सिफारिश के साथ हिंदी वॉयस प्रतिक्रिया प्राप्त करें'}
            {language === 'ta' && 'மண் புகைப்படத்தைப் பதிவேற்றவும் → சோள பரிந்துரையுடன் இந்தி குரல் பதில் பெறவும்'}
            {language === 'te' && 'మట్టి ఫోటోను అప్‌లోడ్ చేయండి → మొక్కజొన్న సిఫార్సుతో హిందీ వాయిస్ ప్రతిస్పందన పొందండి'}
          </p>
          <Link
            to="/crop-advisory"
            className="inline-block bg-white text-purple-700 font-bold px-6 py-2 rounded-lg hover:bg-purple-50 transition-colors"
          >
            {language === 'en' && 'Start Demo'}
            {language === 'hi' && 'डेमो शुरू करें'}
            {language === 'ta' && 'டெமோவைத் தொடங்கவும்'}
            {language === 'te' && 'డెమో ప్రారంభించండి'}
          </Link>
        </div>
      </div>
    </div>
  );
}