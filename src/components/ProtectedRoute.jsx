import React from 'react';
    import { Navigate, useLocation } from 'react-router-dom';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const ProtectedRoute = ({ children, level }) => {
      const { user, loading } = useAuth();
      const location = useLocation();

      if (loading) {
        return (
          <div className="h-screen w-full flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        );
      }

      if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
      }
      
      if (level && user.accessLevel < level) {
         return <Navigate to="/" replace />;
      }

      return children;
      
    };

    export default ProtectedRoute;