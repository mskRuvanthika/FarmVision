import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, User, MapPin, Phone, Mail, Globe, Settings, LogOut } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [language, setLanguage] = useState('en');
  const [profile, setProfile] = useState({
    name: user?.user_metadata?.full_name || 'Ramesh Kumar',
    phone: '+91 98765 43210',
    email: user?.email || 'ramesh.kumar@example.com',
    location: 'Nashik, Maharashtra',
    farmSize: '5 hectares',
    crops: ['Maize', 'Cotton', 'Soybean'],
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      // Use requestAnimationFrame to prevent iframe port destruction
      requestAnimationFrame(() => {
        navigate('/login', { replace: true });
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
      // Force navigation even if sign out fails
      try {
        navigate('/login', { replace: true });
      } catch (navError) {
        console.error('Navigation error:', navError);
      }
    }
  };

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: {
        en: 'Profile',
        hi: 'प्रोफ़ाइल',
        ta: 'சுயவிவரம்',
        te: 'ప్రొఫైల్',
      },
      farmInfo: {
        en: 'Farm Information',
        hi: 'खेत की जानकारी',
        ta: 'பண்ணை தகவல்',
        te: 'వ్యవసాయ సమాచారం',
      },
      farmSize: {
        en: 'Farm Size',
        hi: 'खेत का आकार',
        ta: 'பண்ணை அளவு',
        te: 'వ్యవసాయ పరిమాణం',
      },
      currentCrops: {
        en: 'Current Crops',
        hi: 'वर्तमान फसलें',
        ta: 'தற்போதைய பயிர்கள்',
        te: 'ప్రస్తుత పంటలు',
      },
      settings: {
        en: 'Settings',
        hi: 'सेटिंग्स',
        ta: 'அமைப்புகள்',
        te: 'సెట్టింగ్‌లు',
      },
    };
    return texts[key]?.[language] || texts[key]?.en || '';
  };

  const stats = [
    {
      label: { en: 'Analyses Done', hi: 'विश्लेषण पूर्ण', ta: 'முடிக்கப்பட்ட பகுப்பாய்வுகள்', te: 'పూర్తయిన విశ్లేషణలు' },
      value: '23',
      color: 'bg-green-500',
    },
    {
      label: { en: 'Recommendations', hi: 'सिफारिशें', ta: 'பரிந்துரைகள்', te: 'సిఫార్సులు' },
      value: '18',
      color: 'bg-blue-500',
    },
    {
      label: { en: 'Diseases Detected', hi: 'रोग पहचाने गए', ta: 'கண்டறியப்பட்ட நோய்கள்', te: 'గుర్తించబడిన వ్యాధులు' },
      value: '7',
      color: 'bg-red-500',
    },
    {
      label: { en: 'Days Active', hi: 'सक्रिय दिन', ta: 'செயலில் உள்ள நாட்கள்', te: 'యాక్టివ్ రోజులు' },
      value: '45',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">{getText('title')}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Language Selector */}
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-4 gap-2">
            {['en', 'hi', 'ta', 'te'].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  language === lang
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang === 'en' && 'EN'}
                {lang === 'hi' && 'हिं'}
                {lang === 'ta' && 'த'}
                {lang === 'te' && 'తె'}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-blue-100">
                  {language === 'en' && 'Farmer'}
                  {language === 'hi' && 'किसान'}
                  {language === 'ta' && 'விவசாயி'}
                  {language === 'te' && 'రైతు'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="w-5 h-5 text-blue-600" />
              <span>{profile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="w-5 h-5 text-blue-600" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>{profile.location}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-4">
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-2`}>
                <span className="text-white font-bold">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label[language as keyof typeof stat.label]}</p>
            </div>
          ))}
        </div>

        {/* Farm Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">{getText('farmInfo')}</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{getText('farmSize')}</p>
              <p className="text-lg font-bold text-gray-900">{profile.farmSize}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">{getText('currentCrops')}</p>
              <div className="flex flex-wrap gap-2">
                {profile.crops.map((crop, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Language Preference */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            {language === 'en' && 'Language Preference'}
            {language === 'hi' && 'भाषा प्राथमिकता'}
            {language === 'ta' && 'மொழி விருப்பம்'}
            {language === 'te' && 'భాష ప్రాధాన్యత'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { code: 'en', name: 'English' },
              { code: 'hi', name: 'हिंदी (Hindi)' },
              { code: 'ta', name: 'தமிழ் (Tamil)' },
              { code: 'te', name: 'తెలుగు (Telugu)' },
            ].map((lang) => (
              <button
                key={lang.code}
                className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{lang.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            {getText('settings')}
          </h3>
          <div className="space-y-3">
            {[
              { en: 'Notifications', hi: 'सूचनाएं', ta: 'அறிவிப்புகள்', te: 'నోటిఫికేషన్లు' },
              { en: 'Offline Mode', hi: 'ऑफ़लाइन मोड', ta: 'ஆஃफ்லைன் பயன்முறை', te: 'ఆఫ్‌లైన్ మోడ్' },
              { en: 'Data Sync', hi: 'डेटा सिंक', ta: 'தரவு ஒத்திசைவு', te: 'డేటా సింక్' },
              { en: 'Help & Support', hi: 'सहायता और समर्थन', ta: 'உதவி & ஆதரவு', te: 'సహాయం & మద్దతు' },
            ].map((item, idx) => (
              <button
                key={idx}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
              >
                <span className="text-gray-900">{item[language as keyof typeof item]}</span>
                <span className="text-gray-400">›</span>
              </button>
            ))}
          </div>
        </div>

        {/* App Info */}
        <div className="mt-6 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg p-6 text-center">
          <h3 className="font-bold text-lg mb-2">🌾 FarmVision v1.0</h3>
          <p className="text-sm text-green-100 mb-1">
            {language === 'en' && 'Smart Farming Advisory Platform'}
            {language === 'hi' && 'स्मार्ट कृषि सलाहकार मंच'}
            {language === 'ta' && 'ஸ்மார்ட் விவசாய ஆலோசனை தளம்'}
            {language === 'te' && 'స్మార్ట్ వ్యవసాయ సలహా వేదిక'}
          </p>
          <p className="text-xs text-green-200">
            {language === 'en' && 'Powered by AI4Bharat, SoilGrids, and Advanced ML'}
            {language === 'hi' && 'AI4Bharat, SoilGrids और Advanced ML द्वारा संचालित'}
            {language === 'ta' && 'AI4Bharat, SoilGrids மற்றும் Advanced ML மூலம் இயக்கப்படுகிறது'}
            {language === 'te' && 'AI4Bharat, SoilGrids మరియు Advanced ML ద్వారా శక్తినిస్తుంది'}
          </p>
        </div>

        {/* Logout Button */}
        <div className="mt-6">
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            <span>
              {language === 'en' && 'Sign Out'}
              {language === 'hi' && 'लॉग आउट'}
              {language === 'ta' && 'வெளியேறு'}
              {language === 'te' && 'సైన్ అవుట్'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}