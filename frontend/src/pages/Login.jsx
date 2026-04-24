import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return setError('All fields are required');
        setLoading(true); setError('');
        try {
            await login(form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            {/* Back Button */}
            <div className="login-back">
                <Link to="/" className="login-back-link">
                    <span className="material-icons">arrow_back</span> Back
                </Link>
            </div>

            {/* Left - Form */}
            <div className="login-form-section">
                <div className="login-form-container">
                    {/* Mobile Logo */}
                    <div className="login-mobile-logo">
                        <div className="login-logo-circle">
                            <span>MP</span>
                        </div>
                        <span className="login-logo-text">Meenakshi Pharma</span>
                    </div>

                    <h1 className="login-title">Welcome back!</h1>
                    <form onSubmit={submit}>
                        <div className="login-field">
                            <label className="login-label">E-mail</label>
                            <div className="login-input-wrap">
                                <input type="email" className="login-input" placeholder="Enter your email.." value={form.email} onChange={set('email')} required />
                                <span className="material-icons login-input-icon">email</span>
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">Password</label>
                            <div className="login-input-wrap">
                                <input type={showPw ? 'text' : 'password'} className="login-input" placeholder="Enter your password.." value={form.password} onChange={set('password')} required />
                                <span className="material-icons login-input-icon" onClick={() => setShowPw(!showPw)} style={{ cursor: 'pointer' }}>
                                    {showPw ? 'visibility' : 'visibility_off'}
                                </span>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="login-remember"><input type="checkbox" /> Remember me</label>
                            <Link to="/auth/forgot-password" className="login-forgot">Forgot password?</Link>
                        </div>

                        {error && <div className="login-error">{error}</div>}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Signing in...' : 'Login'}
                        </button>
                    </form>

                    <p className="login-signup">New here? <Link to="/auth/register" className="login-signup-link">Create an account</Link></p>
                </div>
            </div>

            {/* Right - Branded Panel */}
            <div className="login-brand-section">
                <div className="login-brand-overlay"></div>
                <div className="login-brand-content">
                    <div className="login-brand-circle">
                        <span className="material-icons" style={{ fontSize: '5rem', color: 'var(--primary-600)' }}>local_pharmacy</span>
                    </div>
                    <h2 className="login-brand-title">Meenakshi Pharma</h2>
                    <p className="login-brand-sub">Your trusted healthcare partner</p>
                </div>
            </div>

            {/* Mobile Background */}
            <div className="login-mobile-bg">
                <div className="login-mobile-bg-circle c1"></div>
                <div className="login-mobile-bg-circle c2"></div>
                <div className="login-mobile-bg-circle c3"></div>
                <div className="login-mobile-bg-circle c4"></div>
            </div>
        </div>
    );
}
