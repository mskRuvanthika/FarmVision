import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, Leaf } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;
    
    try {
      interval = setInterval(() => {
        if (!mounted) return;
        
        setProgress((prev) => {
          if (prev >= 100) {
            if (interval) clearInterval(interval);
            setTimeout(() => {
              if (mounted) {
                try {
                  onComplete();
                } catch (e) {
                  console.error('Splash complete callback error:', e);
                }
              }
            }, 300);
            return 100;
          }
          return prev + 20;
        });
      }, 200);
    } catch (error) {
      console.error('SplashScreen interval error:', error);
      // On error, complete immediately
      try {
        onComplete();
      } catch (e) {
        console.error('Fallback complete error:', e);
      }
    }

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-green-600 via-green-700 to-green-800 flex flex-col items-center justify-center">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            rotate: [360, 0],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"
        />
        <Leaf className="absolute top-20 left-10 text-white/10 w-24 h-24 rotate-[-20deg]" />
        <Leaf className="absolute bottom-32 right-16 text-white/10 w-32 h-32 rotate-[30deg]" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 200, 
          damping: 15,
          duration: 0.8
        }}
        className="relative z-10 mb-8"
      >
        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3">
          <Sprout className="w-16 h-16 text-green-600" />
        </div>
      </motion.div>

      {/* Brand Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
          FarmVision
        </h1>
        <p className="text-green-100 text-lg font-medium">
          Cultivating Success Together
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-64 relative"
      >
        <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-white rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-white/80 text-sm text-center mt-3 font-medium">
          Loading your farm dashboard...
        </p>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-1/2 -translate-x-1/2"
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-white rounded-full"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}