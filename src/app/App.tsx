import { useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { SplashScreen } from "./components/SplashScreen";
import { AuthProvider } from "./components/AuthProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "sonner";
import ChatbaseWidget from "./chatbot/ChatbaseWidget";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Global error handler for iframe environment
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error);
      // Prevent the error from propagating and causing iframe abort
      event.preventDefault();
      return true;
    };

    const handleUnhandledRejection = (
      event: PromiseRejectionEvent,
    ) => {
      console.error(
        "Unhandled promise rejection:",
        event.reason,
      );
      // Prevent the error from propagating
      event.preventDefault();
    };

    try {
      window.addEventListener("error", handleError);
      window.addEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );

      return () => {
        window.removeEventListener("error", handleError);
        window.removeEventListener(
          "unhandledrejection",
          handleUnhandledRejection,
        );
      };
    } catch (e) {
      console.error("Error handler setup failed:", e);
    }
  }, []);

  // Ensure iframe is fully initialized before rendering router
  useEffect(() => {
    // Defensive initialization with error handling
    let mounted = true;

    const init = () => {
      try {
        const timer = setTimeout(() => {
          if (mounted) {
            setIsMounted(true);
          }
        }, 100);

        return () => {
          mounted = false;
          clearTimeout(timer);
        };
      } catch (error) {
        console.error("App initialization error:", error);
        // Force mounted even on error to prevent infinite loading
        if (mounted) {
          setIsMounted(true);
        }
      }
    };

    return init();
  }, []);

  // Prevent state updates during critical iframe initialization
  const handleSplashComplete = () => {
    try {
      // Use requestAnimationFrame to defer state update
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => {
          setShowSplash(false);
        });
      } else {
        // Fallback for environments without requestAnimationFrame
        setTimeout(() => {
          setShowSplash(false);
        }, 0);
      }
    } catch (e) {
      console.error("Splash complete error:", e);
      // Fallback on error
      setShowSplash(false);
    }
  };

  if (showSplash || !isMounted) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" richColors />
        <ChatbaseWidget />
      </AuthProvider>
    </ErrorBoundary>
  );
}