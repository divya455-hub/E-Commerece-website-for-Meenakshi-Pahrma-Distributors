import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import './AdminSidebar.css';

const menuItems = [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/admin/products', icon: 'inventory_2', label: 'Products' },
    { to: '/admin/orders', icon: 'receipt_long', label: 'Orders' },
    { to: '/admin/inventory', icon: 'warehouse', label: 'Inventory' },
    { to: '/admin/prescriptions', icon: 'fact_check', label: 'Prescriptions', badgeKey: 'pendingRx' },
    { to: '/admin/reports', icon: 'assessment', label: 'Reports' },
];

export default function AdminSidebar({ isOpen, onClose }) {
    const { logout } = useAuth();
    const [pendingRxCount, setPendingRxCount] = useState(0);

    useEffect(() => {
        const fetchPendingCount = () => {
            api.get('/admin/prescriptions?status=pending')
                .then(({ data }) => {
                    const list = data.prescriptions || data;
                    setPendingRxCount(Array.isArray(list) ? list.length : 0);
                })
                .catch(() => setPendingRxCount(0));
        };

        fetchPendingCount();
        // Poll every 30 seconds for new prescriptions
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const getBadgeCount = (key) => {
        if (key === 'pendingRx') return pendingRxCount;
        return 0;
    };

    return (
        <>
            <div className={`admin-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-profile">
                    <div className="admin-sidebar-logo">MP</div>
                    <div>
                        <h1>Meenakshi Pharma</h1>
                        <p>Admin Portal</p>
                    </div>
                </div>

                <nav>
                    {menuItems.map((item) => {
                        const badgeCount = item.badgeKey ? getBadgeCount(item.badgeKey) : 0;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={onClose}
                                className={({ isActive }) => isActive ? 'active' : ''}
                            >
                                <span className="material-icons">{item.icon}</span>
                                {item.label}
                                {badgeCount > 0 && (
                                    <span className="sidebar-badge">{badgeCount > 99 ? '99+' : badgeCount}</span>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-logout">
                    <button onClick={logout}>
                        <span className="material-icons">logout</span>
                        Logout
                    </button>
                </div>
            </aside>
        </>
    );
}
