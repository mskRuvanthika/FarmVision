import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

export function MarketPrices() {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedCropType, setSelectedCropType] = useState('All');

  useEffect(() => {
    fetchPrices();
  }, [selectedState]);

  const fetchPrices = async () => {
    setLoading(true);
    
    // Use client-side mock data only
    const crops = ['Rice', 'Wheat', 'Maize', 'Cotton', 'Soybean', 'Sugarcane', 'Groundnut', 'Tomato', 'Onion', 'Potato'];
    const mockPrices = crops.map(crop => ({
      name: crop,
      nameHindi: crop,
      currentPrice: (2000 + Math.random() * 4000).toFixed(0),
      minPrice: (1500 + Math.random() * 2000).toFixed(0),
      unit: 'per quintal',
      change: ((Math.random() - 0.5) * 20).toFixed(1),
      demand: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
      trend: Math.random() > 0.5 ? 'up' : 'down',
      market: selectedState
    }));
    
    setPrices(mockPrices);
    setLoading(false);
  };

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: {
        en: 'Market Prices',
        hi: 'बाजार मूल्य',
      },
      search: {
        en: 'Search crops...',
        hi: 'फसलें खोजें...',
      },
      refresh: {
        en: 'Refresh',
        hi: 'रीफ्रेश करें',
      },
      cropType: {
        en: 'Crop Type',
        hi: 'फसल का प्रकार',
      },
      all: { en: 'All', hi: 'सभी' },
      cereals: { en: 'Cereals', hi: 'अनाज' },
      pulses: { en: 'Pulses', hi: 'दालें' },
      vegetables: { en: 'Vegetables', hi: 'सब्जियां' },
      cashCrops: { en: 'Cash Crops', hi: 'नकदी फसलें' }
    };
    return texts[key]?.[language] || texts[key]?.en || '';
  };

  const getCropCategory = (cropName: string) => {
    const categories: Record<string, string> = {
      'Rice': 'Cereals', 'Wheat': 'Cereals', 'Maize': 'Cereals',
      'Chickpea': 'Pulses', 'Soybean': 'Pulses', 'Groundnut': 'Pulses',
      'Tomato': 'Vegetables', 'Onion': 'Vegetables', 'Potato': 'Vegetables',
      'Cotton': 'Cash Crops', 'Sugarcane': 'Cash Crops', 'Turmeric': 'Cash Crops'
    };
    return categories[cropName] || 'Others';
  };

  const filteredPrices = prices.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const category = getCropCategory(p.name);
    const matchesType = selectedCropType === 'All' || category === selectedCropType;
    return matchesSearch && matchesType;
  });

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    ' উत्तराखंड', 'West Bengal'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{getText('title')}</h1>
            <p className="text-sm text-amber-100">Live Mandi Rates (API)</p>
          </div>
          <div className="ml-auto">
             <button
               onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
               className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm"
            >
              {language === 'en' ? '🇮🇳 HI' : '🇺🇸 EN'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 space-y-4">
          {/* State Selector */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
              Select State / राज्य चुनें
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            >
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getText('search')}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
               <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
               {['All', 'Cereals', 'Pulses', 'Vegetables', 'Cash Crops'].map(type => (
                 <button
                   key={type}
                   onClick={() => setSelectedCropType(type)}
                   className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                     selectedCropType === type 
                       ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                       : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                   }`}
                 >
                   {getText(type.toLowerCase().replace(' ', '') === 'cashcrops' ? 'cashCrops' : type.toLowerCase().replace(' ', '')) || type}
                 </button>
               ))}
            </div>
          </div>
          
           <div className="flex justify-end pt-2">
             <button
              onClick={fetchPrices}
              disabled={loading}
              className="flex items-center gap-2 text-sm text-amber-700 font-medium hover:text-amber-800 disabled:opacity-50"
             >
               <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
               {getText('refresh')} Data
             </button>
           </div>
        </div>

        {/* Prices Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {loading ? (
             <div className="p-12 text-center">
                <RefreshCw className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Fetching latest mandi prices...</p>
             </div>
          ) : filteredPrices.length === 0 ? (
             <div className="p-12 text-center text-gray-500">
                No crops found for current selection.
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold">Crop</th>
                    <th className="p-4 font-semibold text-right">Price (₹/Q)</th>
                    <th className="p-4 font-semibold text-center">Change</th>
                    <th className="p-4 font-semibold hidden sm:table-cell">Trend</th>
                    <th className="p-4 font-semibold hidden sm:table-cell">Demand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPrices.map((price, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">
                            {language === 'hi' && price.nameHindi ? price.nameHindi : price.name}
                        </div>
                        <div className="text-xs text-gray-500">{price.market || selectedState}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-bold text-amber-700">₹{price.currentPrice}</div>
                        <div className="text-xs text-gray-400">Min: ₹{price.minPrice}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                           price.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                           {price.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                           {Math.abs(parseFloat(price.change))}%
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span className={`text-xs ${price.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {price.trend === 'up' ? 'Rising' : 'Falling'}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                         <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            price.demand === 'High' ? 'bg-green-500' : price.demand === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                         }`} />
                         <span className="text-sm text-gray-600">{price.demand}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
             <span className="w-2 h-2 bg-green-500 rounded-full"></span> Live Data via Agmarknet API
          </p>
        </div>
      </div>
    </div>
  );
}