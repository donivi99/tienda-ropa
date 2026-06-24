import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2a2520] border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/iniciar-sesion" replace />;
  }

  return <>{children}</>;
}
