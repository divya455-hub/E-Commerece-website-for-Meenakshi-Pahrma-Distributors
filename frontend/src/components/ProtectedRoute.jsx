import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
    const { user, loading } = useAuth();

    if (loading) return <div className="loader"><div className="spinner" /></div>;
    if (!user) return <Navigate to="/auth/login" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;

    return children;
}
