import { Outlet } from 'react-router';
import { useState } from 'react';
import { BottomNav } from './BottomNav';
import { VoiceAssistantModal } from './VoiceAssistantModal';
import { Mic } from 'lucide-react';

export function Layout() {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Main Content */}
      <Outlet />

      {/* Bottom Navigation */}
      <BottomNav onOpenVoice={() => setIsVoiceOpen(true)} />

      {/* Floating Voice Assistant Button */}
      <button
        onClick={() => setIsVoiceOpen(true)}
        className="fixed bottom-24 right-6 bg-green-600 text-white p-4 rounded-full shadow-lg hover:bg-green-700 transition-all z-40"
        aria-label="Open Voice Assistant"
      >
        <Mic className="w-6 h-6" />
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal 
        isOpen={isVoiceOpen} 
        onClose={() => setIsVoiceOpen(false)} 
      />
    </div>
  );
}
