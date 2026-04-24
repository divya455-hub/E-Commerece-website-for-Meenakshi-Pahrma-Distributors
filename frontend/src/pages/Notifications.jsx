import { useState, useEffect } from 'react';
import api from '../api/api';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetch = () => { api.get('/notifications').then(({ data }) => setNotifications(data.notifications || data)).catch(() => { }).finally(() => setLoading(false)); };
    useEffect(fetch, []);

    const markRead = async (id) => {
        try { await api.put(`/notifications/${id}/read`); fetch(); } catch { }
    };
    const markAllRead = async () => {
        try { await api.put('/notifications/read-all'); fetch(); } catch { }
    };

    const iconMap = { order: 'receipt_long', prescription: 'description', delivery: 'local_shipping', default: 'notifications' };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 800 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 className="page-title" style={{ marginBottom: 0 }}>Notifications</h1>
                    {notifications.some(n => !n.isRead) && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>}
                </div>

                {loading ? <div className="loader"><div className="spinner" /></div> : notifications.length === 0 ? (
                    <div className="empty-state"><span className="material-icons">notifications_none</span><p>No notifications</p></div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {notifications.map(n => (
                            <div key={n._id} className="card" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: n.isRead ? '#fff' : 'var(--primary-50)', cursor: n.isRead ? 'default' : 'pointer' }} onClick={() => !n.isRead && markRead(n._id)}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: n.isRead ? 'var(--gray-100)' : 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <span className="material-icons" style={{ fontSize: '1.1rem', color: n.isRead ? 'var(--gray-400)' : 'var(--primary-600)' }}>{iconMap[n.type] || iconMap.default}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.95rem' }}>{n.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.125rem' }}>{n.message}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.375rem' }}>{new Date(n.createdAt).toLocaleString('en-IN')}</div>
                                </div>
                                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-500)', flexShrink: 0, marginTop: 6 }} />}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
