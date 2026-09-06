import { useEffect } from "react";

const ChatbaseWidget: React.FC = () => {
  useEffect(() => {
    // Defensive error handling for iframe environment
    try {
      // Prevent loading the script multiple times
      if ((window as any).chatbase) return;

      (window as any).chatbase = (...args: any[]) => {
        try {
          ((window as any).chatbase.q =
            (window as any).chatbase.q || []).push(args);
        } catch (e) {
          console.error('Chatbase queue error:', e);
        }
      };

      const script = document.createElement("script");
      script.src = "https://www.chatbase.co/embed.min.js";
      script.id = "W3fT0gOgb2WHUKnKMroBj";
      script.setAttribute("domain", "www.chatbase.co");
      script.async = true;
      
      // Handle script load errors
      script.onerror = (error) => {
        console.warn('Chatbase script failed to load:', error);
      };

      document.body.appendChild(script);
    } catch (error) {
      // Fail silently if chatbase cannot be loaded in iframe environment
      console.warn('Chatbase widget unavailable in this environment:', error);
    }
  }, []);

  return null; // Chatbase renders itself
};

export default ChatbaseWidget;