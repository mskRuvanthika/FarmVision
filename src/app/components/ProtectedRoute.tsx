import { Navigate } from 'react-router';
import { useAuth } from './AuthProvider';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Defensive cleanup on unmount in iframe environment
  useEffect(() => {
    return () => {
      // Prevent state updates after unmount
      try {
        // No-op cleanup to ensure clean unmount
      } catch (error) {
        console.error('ProtectedRoute cleanup error:', error);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-green-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}