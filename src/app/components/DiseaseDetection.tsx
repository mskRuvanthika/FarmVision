import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Upload, Camera, AlertTriangle, CheckCircle, ShieldAlert, Loader } from 'lucide-react';
import { toast } from 'sonner';

export function DiseaseDetection() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      setSelectedFile(file);
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null); // Reset previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const detectDisease = async () => {
    if (!selectedFile) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const apiUrl = import.meta.env.VITE_DISEASE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let message = 'Disease detection failed';
        try {
          const errorData = await response.json();
          message = errorData.detail || message;
        } catch {
          // Keep the default message when the API does not return JSON.
        }
        throw new Error(message);
      }

      const data = await response.json();

setResult({
  ...data,
  name: data.disease,
  confidence: data.confidence_percent,
  severity: 'Detected',
  description: `The AI model detected ${data.disease} in the uploaded crop image.`,
  descriptionHindi: '',
  treatment: [],
  treatmentHindi: [],
});

toast.success('Disease detected successfully');
    } catch (error) {
      console.error('Disease detection error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to connect to the disease detection server'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-800">Disease Detection</h1>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        
        {/* Upload Area */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          {!image ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="bg-green-50 p-4 rounded-full mb-4">
                <Camera className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-bold text-gray-700">Upload Crop Photo</p>
              <p className="text-sm text-gray-400 mt-1">Tap to take a picture or select file</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200">
              <img src={image} alt="Crop" className="w-full h-64 object-cover" />
              <button 
                onClick={() => { setImage(null); setSelectedFile(null); setResult(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          {image && !result && (
            <button
              onClick={detectDisease}
              disabled={loading}
              className="w-full mt-4 bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Detect Disease'}
            </button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-2xl shadow-lg border-l-4 border-red-500 overflow-hidden animate-in slide-in-from-bottom-4">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-red-800">{result.name}</h2>
                <div className="flex gap-2 mt-1">
                   <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                     {result.confidence}% Confidence
                   </span>
                   <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                     Severity: {result.severity}
                   </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 text-sm">{result.description}</p>
                <p className="text-gray-500 text-xs italic mt-1">{result.descriptionHindi}</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                   <CheckCircle className="w-4 h-4 text-green-600" /> Treatment
                </h3>
                {result.treatment.length > 0 && (
  <>
    <ul className="space-y-2">
      {(result.treatment || []).map((t: string, i: number) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
          {t}
        </li>
      ))}
    </ul>

    {result.treatmentHindi.length > 0 && (
      <div className="mt-2 p-3 bg-green-50 rounded-lg text-xs text-green-800">
        <strong>Hindi:</strong> {(result.treatmentHindi || []).join(', ')}
      </div>
    )}
  </>
)}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-500">
                ⚠️ This is an AI diagnosis. Please consult an expert before applying chemicals.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
