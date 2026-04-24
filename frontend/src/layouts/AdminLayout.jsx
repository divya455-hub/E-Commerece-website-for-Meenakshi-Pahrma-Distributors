import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div style={{ flex: 1, marginLeft: '260px', background: 'var(--gray-50)' }}>
                {/* Mobile topbar */}
                <div className="admin-topbar" style={{
                    display: 'none', padding: '0.75rem 1rem', background: '#fff',
                    borderBottom: '1px solid var(--gray-200)', alignItems: 'center', gap: '0.75rem'
                }}>
                    <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
                        <span className="material-icons">menu</span>
                    </button>
                    <span style={{ fontWeight: 600 }}>Admin Panel</span>
                </div>
                <div style={{ padding: '1.5rem' }}>
                    <Outlet />
                </div>
            </div>
            <style>{`
        @media (max-width: 1024px) {
          .admin-topbar { display: flex !important; }
          div[style*="marginLeft: '260px'"] { margin-left: 0 !important; }
        }
      `}</style>
        </div>
    );
}
