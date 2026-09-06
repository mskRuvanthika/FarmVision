import { Link, useLocation } from 'react-router';
import { Home, Leaf, Camera, Mic, TrendingUp, User } from 'lucide-react';

interface BottomNavProps {
  onOpenVoice?: () => void;
}

export function BottomNav({ onOpenVoice }: BottomNavProps) {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && !path.startsWith('#') && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/soil-analysis', icon: Leaf, label: 'Soil' },
    { path: '/disease-detection', icon: Camera, label: 'Disease' },
    { path: '#voice', icon: Mic, label: 'Voice', onClick: onOpenVoice },
    { path: '/market-prices', icon: TrendingUp, label: 'Market' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-6xl mx-auto px-2 py-2">
        <div className="grid grid-cols-6 gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.onClick) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all text-gray-600 hover:bg-gray-100"
                >
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </button>
              );
            }

            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
                  active
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-green-700' : 'text-gray-600'}`} />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
