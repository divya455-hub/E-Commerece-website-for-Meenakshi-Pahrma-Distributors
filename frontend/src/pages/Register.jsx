import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        if (!form.firstName || !form.email || !form.password) return setError('Required fields are missing');
        if (form.password !== form.confirmPassword) return setError('Passwords do not match');
        if (form.password.length < 8) return setError('Password must be at least 8 characters');
        setLoading(true); setError('');
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="login-page">
            <div className="login-back">
                <Link to="/" className="login-back-link">
                    <span className="material-icons">arrow_back</span> Back
                </Link>
            </div>

            <div className="login-form-section">
                <div className="login-form-container" style={{ maxWidth: '480px' }}>
                    <div className="login-mobile-logo">
                        <div className="login-logo-circle"><span>MP</span></div>
                        <span className="login-logo-text">Meenakshi Pharma</span>
                    </div>

                    <h1 className="login-title">Create Account</h1>
                    <form onSubmit={submit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="login-field">
                                <label className="login-label">First Name *</label>
                                <input className="login-input" placeholder="First name" value={form.firstName} onChange={set('firstName')} required />
                            </div>
                            <div className="login-field">
                                <label className="login-label">Last Name</label>
                                <input className="login-input" placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">E-mail *</label>
                            <div className="login-input-wrap">
                                <input type="email" className="login-input" placeholder="Enter your email.." value={form.email} onChange={set('email')} required />
                                <span className="material-icons login-input-icon">email</span>
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">Phone Number</label>
                            <div className="login-input-wrap">
                                <input type="tel" className="login-input" placeholder="Enter your phone number.." value={form.phone} onChange={set('phone')} />
                                <span className="material-icons login-input-icon">phone</span>
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">Password *</label>
                            <div className="login-input-wrap">
                                <input type={showPw ? 'text' : 'password'} className="login-input" placeholder="Create a password.." value={form.password} onChange={set('password')} required />
                                <span className="material-icons login-input-icon" onClick={() => setShowPw(!showPw)} style={{ cursor: 'pointer' }}>
                                    {showPw ? 'visibility' : 'visibility_off'}
                                </span>
                            </div>
                        </div>

                        <div className="login-field">
                            <label className="login-label">Confirm Password *</label>
                            <div className="login-input-wrap">
                                <input type={showPw ? 'text' : 'password'} className="login-input" placeholder="Confirm your password.." value={form.confirmPassword} onChange={set('confirmPassword')} required />
                            </div>
                        </div>

                        {error && <div className="login-error">{error}</div>}

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="login-signup">Already have an account? <Link to="/auth/login" className="login-signup-link">Login</Link></p>
                </div>
            </div>

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

            <div className="login-mobile-bg">
                <div className="login-mobile-bg-circle c1"></div>
                <div className="login-mobile-bg-circle c2"></div>
                <div className="login-mobile-bg-circle c3"></div>
                <div className="login-mobile-bg-circle c4"></div>
            </div>
        </div>
    );
}
