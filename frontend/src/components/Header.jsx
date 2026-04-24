import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './Header.css';

export default function Header() {
    const { user, logout, isAdmin, isCustomer } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [notifCount, setNotifCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && isCustomer()) {
            api.get('/cart/summary').then(({ data }) => setCartCount(data.totalItems)).catch(() => { });
            api.get('/notifications?unread=true').then(({ data }) => setNotifCount(data.unreadCount)).catch(() => { });
        }
    }, [user]);

    useEffect(() => {
        const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/products', label: 'Products' },
        { to: '/contact', label: 'Contact' },
    ];

    return (
        <header className="header">
            <div className="header-inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
                    <Link to="/" className="header-brand">
                        <div className="header-brand-icon">MP</div>
                        <span className="header-brand-name">Meenakshi Pharma</span>
                    </Link>
                    <nav className="header-nav">
                        {navLinks.map((l) => (
                            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
                                {l.label}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="header-actions">
                    {user && isCustomer() && (
                        <>
                            <button className="header-icon-btn" onClick={() => navigate('/notifications')} title="Notifications">
                                <span className="material-icons">notifications</span>
                                {notifCount > 0 && <span className="header-badge">{notifCount}</span>}
                            </button>
                            <button className="header-icon-btn" onClick={() => navigate('/cart')} title="Cart">
                                <span className="material-icons">shopping_cart</span>
                                {cartCount > 0 && <span className="header-badge">{cartCount}</span>}
                            </button>
                        </>
                    )}

                    {user ? (
                        <div className="header-user-menu" ref={dropdownRef}>
                            <button className="header-icon-btn" onClick={() => setMenuOpen(!menuOpen)}>
                                <span className="material-icons">account_circle</span>
                            </button>
                            {menuOpen && (
                                <div className="header-dropdown">
                                    <div className="header-dropdown-info">
                                        <p>{user.firstName} {user.lastName}</p>
                                        <p>{user.email}</p>
                                    </div>
                                    {isCustomer() && (
                                        <>
                                            <Link to="/profile" onClick={() => setMenuOpen(false)}>
                                                <span className="material-icons">person</span> Profile
                                            </Link>
                                            <Link to="/orders" onClick={() => setMenuOpen(false)}>
                                                <span className="material-icons">receipt_long</span> Orders
                                            </Link>
                                            <Link to="/prescriptions" onClick={() => setMenuOpen(false)}>
                                                <span className="material-icons">description</span> Prescriptions
                                            </Link>
                                        </>
                                    )}
                                    {isAdmin() && (
                                        <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)}>
                                            <span className="material-icons">admin_panel_settings</span> Admin Dashboard
                                        </Link>
                                    )}
                                    <button onClick={logout}>
                                        <span className="material-icons">logout</span> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="header-auth-btns">
                            <Link to="/auth/login" className="btn btn-ghost">Login</Link>
                            <Link to="/auth/register" className="btn btn-primary">Register</Link>
                        </div>
                    )}

                    <button className="header-icon-btn mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
                        <span className="material-icons">{mobileOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>

            <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
                {navLinks.map((l) => (
                    <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)}>{l.label}</Link>
                ))}
                {!user && (
                    <>
                        <Link to="/auth/login" onClick={() => setMobileOpen(false)}>Login</Link>
                        <Link to="/auth/register" onClick={() => setMobileOpen(false)}>Register</Link>
                    </>
                )}
            </div>
        </header>
    );
}
