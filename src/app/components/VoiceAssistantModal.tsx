import { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import { Card } from './ui/card';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Updated responses for Soil Analysis, Disease Detection, Integration, and Utility modules
const mockResponses: Record<string, string> = {
  // Soil Analysis Module
  "check soil condition": "Your soil parameters have been analyzed. The fertility level is moderate, and balanced nutrient management is recommended.",
  "suggest a crop": "Based on the soil values provided, the system suggests crops that match the current soil condition.",
  "explain soil ph": "Soil pH affects how nutrients are available to plants. Maintaining a balanced pH supports healthy growth.",

  // Disease Detection Module  
  "detect disease": "The image has been analyzed. Signs of disease are detected, and preventive measures are advised.",
  "is my crop healthy": "The leaf image shows no major disease symptoms. The crop appears healthy.",
  "identify spots": "The system detects irregular patterns on the leaf. This may indicate disease, and monitoring is recommended.",

  // Integration & Decision Support
  "farm report": "The soil analysis and disease detection results have been combined. Recommendations are provided for crop management.",
  "action today": "The system suggests general actions such as monitoring soil moisture, checking leaf health, and applying balanced nutrients.",
  "farm history": "Your past soil and disease records are displayed for comparison with current conditions.",

  // Deployment & Utility
  "save farm data": "Your soil and crop health records have been stored securely.",
  "translate": "Recommendations are now available in your preferred language.",
  "connect sensor": "Sensor connected successfully. Real-time data is now available.",

  // Fallback
  default: "I'm your FarmVision AI assistant. Try asking: 'Check soil condition', 'Detect disease', 'Give me a farm report', or 'Save my farm data'.",
};

export function VoiceAssistantModal({ isOpen, onClose }: VoiceAssistantModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis with error handling
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    } catch (err) {
      console.error('Speech synthesis not available:', err);
    }
  }, []);

  // Initialize speech recognition with defensive error handling
  useEffect(() => {
    if (!isOpen) return;

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        try {
          const current = event.resultIndex;
          const transcriptText = event.results[current][0].transcript;
          setTranscript(transcriptText);

          if (event.results[current].isFinal) {
            processCommand(transcriptText);
          }
        } catch (err) {
          // Silently handle errors
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed') {
          setError('Voice recognition error. Please try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      // Silently handle initialization errors in sandbox
    }

    return () => {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (err) {
        // Silently handle cleanup errors
      }
    };
  }, [isOpen, language]);

  const startListening = () => {
    try {
      if (!recognitionRef.current) {
        setError('Voice input not available. Please type your query.');
        return;
      }
      
      setTranscript('');
      setResponse('');
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      setError('Could not start voice recognition. Please try typing your query.');
    }
  };

  const stopListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } catch (err) {
      setIsListening(false);
    }
  };

  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    let reply = mockResponses.default;

    // Match exact phrases from the new command set
    const commandKeys = Object.keys(mockResponses);
    for (const key of commandKeys) {
      if (key === 'default') continue;
      
      // Check if user input contains the exact command phrase
      if (lowerText.includes(key)) {
        reply = mockResponses[key as keyof typeof mockResponses]!;
        break;
      }
    }

    setResponse(reply);
    speakResponse(reply);
  };

  const speakResponse = (text: string) => {
    try {
      if (!synthRef.current) return;

      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      synthRef.current.speak(utterance);
    } catch (err) {
      // Silently handle speech synthesis errors
    }
  };

  const handleClose = () => {
    try {
      stopListening();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } catch (err) {
      // Silently handle errors
    }
    setTranscript('');
    setResponse('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Voice Assistant</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 rounded-lg text-gray-800 bg-white"
          >
            <option value="en-US">English</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
            <option value="pa-IN">ਪੰਜਾਬੀ (Punjabi)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
            <option value="te-IN">తెలుగు (Telugu)</option>
            <option value="bn-IN">বাংলা (Bengali)</option>
          </select>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Microphone Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-8 rounded-full transition-all ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white shadow-lg`}
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
              {isListening ? (
                <MicOff className="w-12 h-12" />
              ) : (
                <Mic className="w-12 h-12" />
              )}
            </button>
          </div>

          {/* Status */}
          <div className="text-center mb-4">
            <p className="text-gray-600">
              {isListening ? 'Listening...' : 'Tap the microphone to speak'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Mic className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">You said:</p>
                  <p className="text-gray-800">{transcript}</p>
                </div>
              </div>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Volume2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-green-700 mb-1">Assistant:</p>
                  <p className="text-gray-800">{response}</p>
                </div>
              </div>
            </div>
          )}

          {/* Updated Quick Commands */}
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Check soil condition',
                'Detect disease', 
                'Farm report',
                'Save farm data',
                'Action today',
                'Connect sensor'
              ].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setTranscript(cmd);
                    processCommand(cmd);
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}