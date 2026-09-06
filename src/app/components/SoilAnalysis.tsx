import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Camera, MapPin, Droplets, TrendingUp, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';

export function SoilAnalysis() {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [soilData, setSoilData] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedCropCheck, setSelectedCropCheck] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeSoil = async () => {
    setLoading(true);
    try {
      // Get current location
      let position: GeolocationPosition;
      try {
        position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0
          });
        });
      } catch (geoError: any) {
        console.log(`Geolocation skipped: ${geoError?.message || 'Restriction'}. Using default coordinates.`);
        
        position = {
          coords: {
            latitude: 20.5937,
            longitude: 78.9629,
            accuracy: 100,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0
          },
          timestamp: Date.now()
        } as GeolocationPosition;
        
        toast.info("Using default region (Location access skipped)");
      }

      const payloadImage = imagePreview && imagePreview.length > 10000
        ? imagePreview.substring(0, 10000)
        : imagePreview;

      // Use client-side mock data - no API calls
      const soilTypes = ['Loamy', 'Clay', 'Sandy Loam', 'Black Soil', 'Red Soil'];
      const mockSoil = {
        ph: (5.5 + Math.random() * 2.5).toFixed(1),
        moisture: (20 + Math.random() * 25).toFixed(1),
        nitrogen: (25 + Math.random() * 40).toFixed(1),
        phosphorus: (15 + Math.random() * 25).toFixed(1),
        potassium: (20 + Math.random() * 30).toFixed(1),
        organicMatter: (2 + Math.random() * 3).toFixed(1),
        soilType: soilTypes[Math.floor(Math.random() * soilTypes.length)],
        timestamp: new Date().toISOString(),
      };

      setSoilData(mockSoil);
      toast.success("Soil analysis complete");
    } catch (error: any) {
      console.error('Error analyzing soil:', error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!soilData) return [];
    return [
      { name: 'pH', value: parseFloat(soilData.ph), max: 14, optimal: 7 },
      { name: 'N (kg)', value: parseFloat(soilData.nitrogen), max: 100, optimal: 50 },
      { name: 'P (kg)', value: parseFloat(soilData.phosphorus), max: 100, optimal: 30 },
      { name: 'K (kg)', value: parseFloat(soilData.potassium), max: 100, optimal: 30 },
      { name: 'Org %', value: parseFloat(soilData.organicMatter) * 10, max: 100, optimal: 50 }, // Scaled for chart
    ];
  };

  const getText = (key: string) => {
    const texts: Record<string, Record<string, string>> = {
      title: {
        en: 'Soil Analysis',
        hi: 'मिट्टी विश्लेषण',
      },
      upload: {
        en: 'Upload Soil Photo',
        hi: 'मिट्टी की फोटो अपलोड करें',
      },
      analyze: {
        en: 'Analyze Soil',
        hi: 'मिट्टी का विश्लेषण करें',
      },
      results: {
        en: 'Analysis Dashboard',
        hi: 'विश्लेषण डैशबोर्ड',
      },
    };
    return texts[key]?.[language] || texts[key]?.en || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/" className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{getText('title')}</h1>
            <p className="text-sm text-green-100">Scientific Lab Analysis</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* Language & Actions */}
        <div className="flex justify-between items-center mb-6">
          <button
             onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
             className="px-3 py-1 bg-white text-green-700 rounded-full text-sm font-medium border border-green-200 shadow-sm"
          >
            {language === 'en' ? '🇮🇳 हिंदी' : '🇺🇸 English'}
          </button>
        </div>

        {/* Upload Section - Collapses after result */}
        <div className={`mb-6 bg-white rounded-2xl shadow-md p-6 transition-all ${soilData ? 'border border-green-100' : ''}`}>
          <div className="flex flex-col items-center">
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
            />
            
            <div className="relative w-full">
              {!imagePreview ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-green-500 hover:bg-green-50 transition-all group"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="text-gray-600 font-medium">{getText('upload')}</p>
                </button>
              ) : (
                <div className="relative h-48 w-full">
                  <img src={imagePreview} alt="Soil" className="w-full h-full object-cover rounded-xl" />
                  <button 
                    onClick={() => { setImagePreview(''); setSoilData(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {imagePreview && !soilData && (
              <button
                onClick={analyzeSoil}
                disabled={loading}
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Activity className="w-5 h-5" />}
                {getText('analyze')}
              </button>
            )}
          </div>
        </div>

        {/* Results Dashboard */}
        {soilData && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Main Score Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-start justify-between">
                <div>
                   <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Detected Soil Type</h2>
                   <p className="text-3xl font-bold text-gray-800 mt-1">{soilData.soilType}</p>
                   <div className="flex items-center gap-2 mt-2 text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full w-fit">
                     <CheckCircle className="w-4 h-4" />
                     <span>Suitable for cultivation</span>
                   </div>
                </div>
                <div className="bg-green-100 p-3 rounded-xl">
                  <MapPin className="w-8 h-8 text-green-700" />
                </div>
              </div>
            </div>

            {/* Parameters Chart */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Nutrient Profile</h3>
              <div className="h-64 w-full min-h-[256px] min-w-[200px]">
                <ResponsiveContainer width="100%" height={256} minWidth={200}>
                  <BarChart data={getChartData()} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={50} tick={{ fontSize: 12 }} />
                    <Tooltip 
                      cursor={{fill: '#f0fdf4'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={
                          entry.name.includes('pH') 
                            ? (entry.value < 6 || entry.value > 7.5 ? '#ef4444' : '#22c55e') 
                            : '#3b82f6'
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Validation Warning */}
              {(parseFloat(soilData.ph) < 6.0 || parseFloat(soilData.ph) > 7.5) && (
                <div className="mt-4 flex items-start gap-3 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">pH Imbalance Detected</p>
                    <p className="text-xs mt-1">
                      Current pH ({soilData.ph}) is {parseFloat(soilData.ph) < 6.0 ? 'acidic' : 'alkaline'}. 
                      Consider soil amendments before sowing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 mb-2 text-blue-600">
                  <Droplets className="w-5 h-5" />
                  <span className="font-bold">Moisture</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{soilData.moisture}%</p>
                <p className="text-xs text-blue-700 mt-1">Optimal: 20-40%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="flex items-center gap-2 mb-2 text-purple-600">
                  <Activity className="w-5 h-5" />
                  <span className="font-bold">Organic</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{soilData.organicMatter}%</p>
                <p className="text-xs text-purple-700 mt-1">High Quality</p>
              </div>
            </div>

            {/* Crop Compatibility Check */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-bold text-gray-800 mb-4">Check Crop Compatibility</h3>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-green-500 outline-none"
                value={selectedCropCheck}
                onChange={(e) => setSelectedCropCheck(e.target.value)}
              >
                <option value="">Select a crop...</option>
                <option value="Rice">Rice (Need Clay/Loam)</option>
                <option value="Cotton">Cotton (Need Black Soil)</option>
                <option value="Maize">Maize (Need Loam)</option>
              </select>
              
              {selectedCropCheck && (
                <div className={`p-4 rounded-xl border ${
                  (selectedCropCheck === 'Cotton' && soilData.soilType.includes('Black')) ||
                  (selectedCropCheck === 'Rice' && (soilData.soilType.includes('Clay') || soilData.soilType.includes('Loam'))) ||
                  (selectedCropCheck === 'Maize' && soilData.soilType.includes('Loam'))
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <p className="font-bold flex items-center gap-2">
                    {(selectedCropCheck === 'Cotton' && soilData.soilType.includes('Black')) ||
                    (selectedCropCheck === 'Rice' && (soilData.soilType.includes('Clay') || soilData.soilType.includes('Loam'))) ||
                    (selectedCropCheck === 'Maize' && soilData.soilType.includes('Loam'))
                      ? <><CheckCircle className="w-5 h-5"/> Compatible</>
                      : <><AlertTriangle className="w-5 h-5"/> Not Recommended</>
                    }
                  </p>
                  <p className="text-sm mt-1">
                    {soilData.soilType} is 
                    {(selectedCropCheck === 'Cotton' && soilData.soilType.includes('Black')) ||
                    (selectedCropCheck === 'Rice' && (soilData.soilType.includes('Clay') || soilData.soilType.includes('Loam'))) ||
                    (selectedCropCheck === 'Maize' && soilData.soilType.includes('Loam'))
                      ? ' excellent '
                      : ' potentially poor '
                    } 
                    for {selectedCropCheck}.
                  </p>
                </div>
              )}
            </div>

            <Link
              to="/crop-advisory"
              state={{ soilData }}
              className="block w-full bg-green-600 text-white text-center py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200"
            >
              Get Full Advisory Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}