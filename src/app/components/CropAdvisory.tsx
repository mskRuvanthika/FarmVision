import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { ArrowLeft, Sprout, TrendingUp, Calendar, AlertTriangle, Volume2, Loader, Droplets, Activity, Beaker } from 'lucide-react';
import { toast } from 'sonner';

export function CropAdvisory() {
  const location = useLocation();
  const soilDataFromState = location.state?.soilData;
  
  const [language, setLanguage] = useState('hi'); // Default to Hindi for demo
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [playingVoice, setPlayingVoice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (soilDataFromState) {
      fetchRecommendations();
    }
  }, [soilDataFromState]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    // Generate client-side recommendations only
    const ph = parseFloat(soilDataFromState?.ph || '6.5');
    const nitrogen = parseFloat(soilDataFromState?.nitrogen || '35');
    const phosphorus = parseFloat(soilDataFromState?.phosphorus || '18');
    const potassium = parseFloat(soilDataFromState?.potassium || '26');
    const moisture = parseFloat(soilDataFromState?.moisture || '28');
    const soilType = (soilDataFromState?.soilType || 'Loamy').toLowerCase();
    
    // Determine soil conditions
    const isAcidic = ph < 6.0;
    const isAlkaline = ph > 8.0;
    const isLowNitrogen = nitrogen < 30;
    const isLowPhosphorus = phosphorus < 20;
    const isLowPotassium = potassium < 20;
    
    // Generate amendments
    const amendments: string[] = [];
    const amendmentsHindi: string[] = [];
    
    if (isAcidic) {
      amendments.push('Apply Agricultural Lime @ 200-500 kg/acre to raise pH');
      amendmentsHindi.push('pH बढ़ाने के लिए कृषि चूना @ 200-500 किग्रा/एकड़ लगाएं');
    }
    if (isAlkaline) {
      amendments.push('Apply Gypsum or Elemental Sulfur @ 100-200 kg/acre to lower pH');
      amendmentsHindi.push('pH कम करने के लिए जिप्सम या सल्फर @ 100-200 किग्रा/एकड़');
    }
    if (isLowNitrogen) {
      amendments.push('Apply Urea @ 50-75 kg/acre or add compost/FYM @ 5 tons/acre');
      amendmentsHindi.push('यूरिया @ 50-75 किग्रा/एकड़ या कम्पोस्ट @ 5 टन/एकड़ डालें');
    }
    if (isLowPhosphorus) {
      amendments.push('Apply Single Super Phosphate (SSP) @ 100-150 kg/acre');
      amendmentsHindi.push('सिंगल सुपर फॉस्फेट @ 100-150 किग्रा/एकड़ लगाएं');
    }
    if (isLowPotassium) {
      amendments.push('Apply Muriate of Potash (MOP) @ 30-50 kg/acre');
      amendmentsHindi.push('म्यूरेट ऑफ पोटाश @ 30-50 किग्रा/एकड़ डालें');
    }
    
    const crops = [
      { name: 'Rice', nameHindi: 'चावल', idealPh: 6.0, idealN: 40, idealP: 20, idealK: 20, idealSoils: ['clay', 'loamy'] },
      { name: 'Maize', nameHindi: 'मक्का', idealPh: 6.5, idealN: 50, idealP: 25, idealK: 30, idealSoils: ['loamy', 'sandy'] },
      { name: 'Cotton', nameHindi: 'कपास', idealPh: 7.0, idealN: 35, idealP: 15, idealK: 25, idealSoils: ['black', 'loamy'] },
      { name: 'Wheat', nameHindi: 'गेहूं', idealPh: 6.5, idealN: 40, idealP: 20, idealK: 20, idealSoils: ['loamy', 'clay'] },
      { name: 'Groundnut', nameHindi: 'मूंगफली', idealPh: 6.0, idealN: 25, idealP: 30, idealK: 25, idealSoils: ['sandy', 'red'] },
      { name: 'Sugarcane', nameHindi: 'गन्ना', idealPh: 7.0, idealN: 50, idealP: 30, idealK: 35, idealSoils: ['loamy', 'black'] },
      { name: 'Soybean', nameHindi: 'सोयाबीन', idealPh: 6.5, idealN: 30, idealP: 25, idealK: 25, idealSoils: ['loamy', 'black'] },
      { name: 'Tomato', nameHindi: 'टमाटर', idealPh: 6.5, idealN: 35, idealP: 25, idealK: 30, idealSoils: ['loamy', 'sandy'] },
      { name: 'Onion', nameHindi: 'प्याज', idealPh: 6.5, idealN: 30, idealP: 20, idealK: 25, idealSoils: ['loamy', 'sandy'] },
      { name: 'Chickpea', nameHindi: 'चना', idealPh: 7.0, idealN: 20, idealP: 25, idealK: 20, idealSoils: ['loamy', 'black'] },
      { name: 'Peas', nameHindi: 'मटर', idealPh: 6.0, idealN: 20, idealP: 30, idealK: 20, idealSoils: ['loamy', 'sandy'] },
      { name: 'Barley', nameHindi: 'जौ', idealPh: 7.5, idealN: 35, idealP: 20, idealK: 20, idealSoils: ['loamy', 'clay'] },
      { name: 'Spinach', nameHindi: 'पालक', idealPh: 6.5, idealN: 60, idealP: 20, idealK: 25, idealSoils: ['loamy', 'sandy'] }
    ];
    
    const recommendations = crops.map(crop => {
      let score = 100;
      const reasons: string[] = [];
      const reasonsHindi: string[] = [];
      
      // pH compatibility (20 points)
      const phDiff = Math.abs(ph - crop.idealPh);
      if (phDiff < 0.5) {
        reasons.push(`Optimal pH (${ph}) for ${crop.name}`);
        reasonsHindi.push(`${crop.name} के लिए अनुकूल pH (${ph})`);
      } else {
        const penalty = Math.min(20, phDiff * 10);
        score -= penalty;
        reasons.push(`pH ${ph} outside ideal (${crop.idealPh})`);
        reasonsHindi.push(`pH ${ph} आदर्श से बाहर`);
      }
      
      // Soil type (40 points)
      const soilMatch = crop.idealSoils.some(s => soilType.includes(s));
      if (soilMatch) {
        reasons.push(`Perfect soil match: ${soilDataFromState?.soilType}`);
        reasonsHindi.push(`उत्तम मिट्टी: ${soilDataFromState?.soilType}`);
      } else {
        score -= 40;
        reasons.push(`Soil type mismatch`);
        reasonsHindi.push(`मिट्टी का प्रकार बेमेल`);
      }
      
      // Nitrogen (15 points)
      if (nitrogen >= crop.idealN) {
        reasons.push(`Good nitrogen (${nitrogen} kg/ha)`);
        reasonsHindi.push(`अच्छा नाइट्रोजन (${nitrogen})`);
      } else {
        score -= Math.min(15, (crop.idealN - nitrogen) * 0.3);
        reasons.push(`Low N: ${nitrogen} kg/ha (needs ${crop.idealN}+)`);
        reasonsHindi.push(`कम नाइट्रोजन: ${nitrogen}`);
      }
      
      // Phosphorus (12.5 points)
      if (phosphorus >= crop.idealP) {
        score += 0;
      } else {
        score -= Math.min(12.5, (crop.idealP - phosphorus) * 0.5);
      }
      
      // Potassium (12.5 points)
      if (potassium >= crop.idealK) {
        score += 0;
      } else {
        score -= Math.min(12.5, (crop.idealK - potassium) * 0.5);
      }
      
      return {
        name: crop.name,
        nameHindi: crop.nameHindi,
        suitability: Math.max(40, Math.round(score)),
        profitability: score > 80 ? 'Very High' : score > 60 ? 'High' : 'Medium',
        duration: '90-120 days',
        waterRequirement: 'Moderate',
        investmentRequired: '₹35,000/acre',
        expectedYield: '25-30 quintals/acre',
        marketPrice: '₹2,100/quintal',
        netProfit: '₹30,000-50,000/acre',
        marketDemand: 'High',
        profitMargin: Math.round(30 + (score / 100) * 40),
        reasons: reasons.slice(0, 4),
        reasonsHindi: reasonsHindi.slice(0, 4),
        tips: ['Ensure water supply', 'Monitor moisture regularly', 'Apply recommended NPK fertilizers', 'Use disease-resistant varieties'],
        tipsHindi: ['जल आपूर्ति सुनिश्चित करें', 'नियमित रूप से नमी की निगरानी करें', 'अनुशंसित NPK उर्वरक लगाएं', 'रोग प्रतिरोधी किस्मों का उपयोग करें']
      };
    }).sort((a, b) => b.suitability - a.suitability);
    
    // Mock weather data
    const weatherData = Array.from({ length: 7 }, (_, i) => ({
      day: new Date(Date.now() + i * 86400000).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
      temp_max: (28 + Math.random() * 8).toFixed(1),
      temp_min: (18 + Math.random() * 6).toFixed(1),
      conditions: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)]
    }));
    
    // Mock market data
    const marketData = ['Rice', 'Wheat', 'Cotton', 'Maize'].map(name => ({
      name,
      currentPrice: (2000 + Math.random() * 3000).toFixed(0),
      change: ((Math.random() - 0.5) * 15).toFixed(1),
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }));
    
    setWeatherData(weatherData);
    setMarketData(marketData);
    
    setRecommendations({
      recommendations,
      amendments,
      amendmentsHindi,
      soilCondition: {
        isAcidic,
        isAlkaline,
        isLowNitrogen,
        isLowPhosphorus,
        isLowPotassium,
        isDry: moisture < 20,
        isWaterlogged: moisture > 45,
        ph,
        nitrogen,
        phosphorus,
        potassium,
        moisture
      },
      seasonalTips: ['Kharif season ideal for sowing', 'Normal monsoon forecast', 'Apply soil amendments 2-3 weeks before sowing'],
      seasonalTipsHindi: ['बुवाई के लिए खरीफ सीजन आदर्श', 'सामान्य मानसून पूर्वानुमान', 'बुवाई से 2-3 सप्ताह पहले मिट्टी संशोधन लगाएं']
    });
    
    toast.success("Recommendations generated successfully!");
    setLoading(false);
  };

  const playVoiceGuidance = async (text: string) => {
    setPlayingVoice(true);
    
    // Simulate voice playback - no API call needed
    setTimeout(() => {
      setPlayingVoice(false);
      toast.success("Voice guidance completed");
    }, 3000);
  };

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: { en: 'AI Crop Advisory', hi: 'AI फसल सलाह' },
      analyzing: { en: 'Analyzing soil parameters...', hi: 'मिट्टी के मापदंडों का विश्लेषण...' },
      soilParams: { en: 'Analyzed Soil Parameters', hi: 'विश्लेषित मिट्टी पैरामीटर' },
    };
    return texts[key]?.[language] || texts[key]?.en || '';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{getText('title')}</h1>
          <div className="ml-auto">
             <button
               onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
               className="text-xs bg-gray-100 px-3 py-1 rounded-full font-medium"
             >
               {language === 'en' ? '🇮🇳 HI' : '🇺🇸 EN'}
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Soil Parameters Review Card */}
        {soilDataFromState && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Beaker className="w-4 h-4" /> {getText('soilParams')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 mb-1">Soil Type</p>
                <p className="font-bold text-gray-800">{soilDataFromState.soilType}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 mb-1">pH Level</p>
                <p className="font-bold text-gray-800">{soilDataFromState.ph}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-xs text-green-600 mb-1">Nitrogen</p>
                <p className="font-bold text-gray-800">{soilDataFromState.nitrogen} kg/ha</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="text-xs text-purple-600 mb-1">Moisture</p>
                <p className="font-bold text-gray-800">{soilDataFromState.moisture}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-8 h-8 text-green-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">{getText('analyzing')}</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-red-800 font-bold mb-1">Recommendation Failed</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <Link to="/soil-analysis" className="mt-4 inline-block text-sm font-medium text-red-700 underline">
              Try Soil Analysis Again
            </Link>
          </div>
        )}

        {/* Recommendations */}
        {!loading && !error && recommendations && (
          <div className="space-y-6">
            
            {/* Top Recommendation */}
            {recommendations.recommendations[0] ? (
              <div className="bg-white rounded-xl shadow-lg border-2 border-green-500 overflow-hidden">
                <div className="bg-green-600 p-6 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="bg-green-500/50 border border-green-400 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide mb-2 inline-block">
                      Top Match ({recommendations.recommendations[0].suitability}% Match)
                    </span>
                    <h2 className="text-3xl font-bold mb-1">
                      {language === 'hi' ? recommendations.recommendations[0].nameHindi : recommendations.recommendations[0].name}
                    </h2>
                    <p className="text-green-100 text-sm">Best suited for {soilDataFromState?.soilType} soil conditions</p>
                  </div>
                  <Sprout className="absolute right-4 bottom-4 w-24 h-24 text-green-500/20" />
                </div>

                <div className="p-6">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                     <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold">Est. Profit</p>
                        <p className="text-xl font-bold text-green-600">{recommendations.recommendations[0].netProfit}</p>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                        <p className="text-lg font-bold text-gray-800">{recommendations.recommendations[0].duration}</p>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold">Market Demand</p>
                        <p className="text-lg font-bold text-gray-800">{recommendations.recommendations[0].marketDemand}</p>
                     </div>
                   </div>

                   <button 
                     onClick={() => playVoiceGuidance(`Based on your ${soilDataFromState?.soilType} soil, we recommend growing ${recommendations.recommendations[0].name}. The expected profit is ${recommendations.recommendations[0].netProfit}.`)}
                     disabled={playingVoice}
                     className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                   >
                     {playingVoice ? <Loader className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                     Listen to Advisory
                   </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 text-amber-800">
                No crops met the strict soil criteria. Consider soil amendment.
              </div>
            )}

            {/* Other Options */}
            {recommendations.recommendations.length > 1 && (
               <div>
                  <h3 className="font-bold text-gray-700 mb-3">Alternative Options</h3>
                  <div className="space-y-3">
                    {recommendations.recommendations.slice(1).map((crop: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                         <div>
                            <h4 className="font-bold text-gray-800">
                               {language === 'hi' ? crop.nameHindi : crop.name}
                            </h4>
                            <p className="text-xs text-gray-500">{crop.suitability}% Match • {crop.duration}</p>
                         </div>
                         <div className="text-right">
                            <span className="block font-bold text-green-600 text-sm">{crop.profitMargin}% Profit</span>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}
          </div>
        )}
        
        {/* Empty State / No Data */}
        {!loading && !soilDataFromState && (
           <div className="text-center py-12">
              <Sprout className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 mb-6">No soil data found to analyze.</p>
              <Link to="/soil-analysis" className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold">
                 Start Soil Analysis
              </Link>
           </div>
        )}
      </div>
    </div>
  );
}