import { useEffect, useRef, useState } from "react";
import { X, Mic, MicOff, Volume2, Send, Bot, User } from "lucide-react";
import { Card } from "./ui/card";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
}

const API_BASE_URL = "https://farmvision-5krp.onrender.com";
const LANGUAGES = {
  "en-US": "English",
  "ta-IN": "Tamil",
  "hi-IN": "Hindi",
  "te-IN": "Telugu",
} as const;

export function VoiceAssistantModal({
  isOpen,
  onClose,
}: VoiceAssistantModalProps) {
  const [isListening, setIsListening] = useState(false);

  const [input, setInput] = useState("");

  const [language, setLanguage] = useState("en-US");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hello! I'm your Farm AI Assistant. Ask me about crops, soil, sugarcane diseases, treatment, prevention, or farm management.",
    },
  ]);

  const recognitionRef = useRef<any>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrlRef = useRef<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------
  // Cleanup audio
  // ---------------------------------------------------------

  const cleanupAudio = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    } catch {
      // Ignore cleanup errors.
    }
  };

  // ---------------------------------------------------------
  // Speech recognition
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError(
          "Voice input is not available in this browser. Please type your question.",
        );
        return;
      }

      const recognition = new SpeechRecognition();

      recognition.continuous = false;

      recognition.interimResults = true;

      // Selected language for microphone input
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        try {
          const current = event.resultIndex;

          const transcript = event.results[current][0].transcript;

          setInput(transcript);

          if (event.results[current].isFinal) {
            sendMessage(transcript);
          }
        } catch (err) {
          console.error("Speech result error:", err);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);

        if (
          event.error !== "not-allowed" &&
          event.error !== "service-not-allowed"
        ) {
          setError("Voice recognition error. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Speech recognition error:", err);
    }

    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors.
      }
    };
  }, [isOpen, language]);

  // ---------------------------------------------------------
  // Scroll
  // ---------------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ---------------------------------------------------------
  // Start voice input
  // ---------------------------------------------------------

  const startListening = () => {
    try {
      if (!recognitionRef.current) {
        setError(
          "Voice input is not available in this browser. Please type your question.",
        );
        return;
      }

      setInput("");
      setError(null);

      recognitionRef.current.start();
    } catch (err) {
      console.error("Start listening error:", err);

      setError("Could not start voice recognition.");
    }
  };

  // ---------------------------------------------------------
  // Stop voice input
  // ---------------------------------------------------------

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore stop errors.
    }

    setIsListening(false);
  };

  // ---------------------------------------------------------
  // Gemini TTS
  // ---------------------------------------------------------

  const speakWithGemini = async (text: string, selectedLanguage: string) => {
    try {
      cleanupAudio();

      const response = await fetch(`${API_BASE_URL}/api/gemini-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        let detail = "Gemini TTS request failed.";

        try {
          const data = await response.json();

          detail = data?.detail || detail;
        } catch {
          // Ignore JSON parsing errors.
        }

        throw new Error(detail);
      }

      const audioBlob = await response.blob();

      if (!audioBlob.size) {
        throw new Error("Gemini returned empty audio.");
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      audioUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);

      audioRef.current = audio;

      audio.onended = () => {
        if (audioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);

          audioUrlRef.current = null;
        }
      };

      audio.onerror = () => {
        setError("The generated voice audio could not be played.");
      };

      await audio.play();
    } catch (err) {
      console.error("Gemini TTS error:", err);

      const message =
        err instanceof Error ? err.message : "Unable to generate voice.";

      setError(message);
    }
  };

  // ---------------------------------------------------------
  // Send message to Gemini
  // ---------------------------------------------------------

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();

    if (!question || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      text: question,
    };

    setMessages((previous) => [...previous, userMessage]);

    setInput("");
    setError(null);
    setLoading(true);

    try {
      const recentConversation = [...messages, userMessage]
        .slice(-8)
        .map((message) => {
          const speaker =
            message.role === "user" ? "Farmer" : "Farm AI Assistant";

          return `${speaker}: ${message.text}`;
        })
        .join("\n");

      const languageName =
        LANGUAGES[language as keyof typeof LANGUAGES] || "English";

      const response = await fetch(`${API_BASE_URL}/api/gemini-advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          question,

          crop: "Sugarcane",

          disease: "",

          context: `
You are the Farm AI Assistant
for an agriculture application.

IMPORTANT LANGUAGE RULE:
Reply ONLY in ${languageName}.
Do not reply in English unless English is selected.

Use simple, natural language suitable
for a farmer.

Selected language:
${languageName}

Recent conversation:
${recentConversation}

Give practical, easy-to-understand
advice for a farmer.

For disease or crop-health questions,
explain:
- what it may mean
- possible causes
- management or treatment steps
- prevention

Do not invent test results.

If information is uncertain,
clearly say so.
              `.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Gemini request failed.");
      }

      const answer =
        typeof data?.answer === "string"
          ? data.answer
          : "I could not generate a response. Please try again.";

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        text: answer,
      };

      setMessages((previous) => [...previous, assistantMessage]);

      // Generate voice using Gemini TTS
      await speakWithGemini(answer, language);
    } catch (err) {
      console.error("Gemini request error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "Unable to contact the AI assistant.";

      setError(message);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Sorry, I could not connect to the Farm AI Assistant.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------
  // Enter key
  // ---------------------------------------------------------

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  };

  // ---------------------------------------------------------
  // Quick questions
  // ---------------------------------------------------------

  const quickQuestions = [
    "How can I improve sugarcane growth?",
    "How do I identify sugarcane Rust?",
    "How can I prevent crop diseases?",
    "Explain soil health for my crop",
  ];

  // ---------------------------------------------------------
  // Close
  // ---------------------------------------------------------

  const handleClose = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore.
    }

    cleanupAudio();

    setIsListening(false);
    setInput("");
    setError(null);

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="flex h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="bg-gradient-to-r from-green-600 to-green-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="h-7 w-7" />

                <h2 className="text-xl font-bold">Farm AI Assistant</h2>
              </div>

              <p className="mt-1 text-sm text-green-100">Powered by Gemini</p>
            </div>

            <button
              onClick={handleClose}
              className="rounded-full p-2 transition hover:bg-white/20"
              aria-label="Close assistant"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Language selector */}

          <div className="mt-4">
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);

                setError(null);
              }}
              className="w-full rounded-lg bg-white p-2 text-sm text-gray-800 outline-none"
            >
              <option value="en-US">English</option>

              <option value="ta-IN">தமிழ் (Tamil)</option>

              <option value="hi-IN">हिंदी (Hindi)</option>

              <option value="te-IN">తెలుగు (Telugu)</option>
            </select>
          </div>
        </div>

        {/* Chat area */}

        <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-5">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[85%] gap-2 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-green-600 text-white"
                      : "bg-white text-green-700 shadow"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>

                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-tr-sm bg-green-600 text-white"
                      : "rounded-tl-sm bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
                Gemini is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error */}

        {error && (
          <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Quick questions */}

        <div className="border-t bg-white px-4 pt-3">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Quick questions
          </p>

          <div className="flex gap-2 overflow-x-auto pb-3">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => sendMessage(question)}
                disabled={loading}
                className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-2 text-xs text-gray-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}

        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white transition ${
                isListening
                  ? "animate-pulse bg-red-500 hover:bg-red-600"
                  : "bg-green-600 hover:bg-green-700"
              } disabled:opacity-50`}
              title={isListening ? "Stop listening" : "Speak"}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Ask your farming question..."
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
              title="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
            <Volume2 className="h-3 w-3" />
            Gemini voice responses enabled
          </div>
        </div>
      </Card>
    </div>
  );
}
