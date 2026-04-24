import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            api.get('/users/profile')
                .then(({ data }) => setUser(data))
                .catch(() => { localStorage.clear(); setUser(null); })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        const profile = await api.get('/users/profile');
        setUser(profile.data);
        return data;
    };

    const register = async (formData) => {
        const { data } = await api.post('/auth/register', formData);
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        const profile = await api.get('/users/profile');
        setUser(profile.data);
        return data;
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/';
    };

    const isAdmin = () => user?.role === 'admin';
    const isCustomer = () => user?.role === 'customer';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isCustomer }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
