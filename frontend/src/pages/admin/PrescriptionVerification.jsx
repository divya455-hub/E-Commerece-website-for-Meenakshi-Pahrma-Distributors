import { useState, useEffect } from 'react';
import api, { SERVER_URL } from '../../api/api';

const filterCards = [
    { key: '', label: 'All', icon: 'fact_check', bg: '#334155', color: '#fff' },
    { key: 'pending', label: 'Pending', icon: 'schedule', bg: '#fef3c7', color: '#92400e' },
    { key: 'approved', label: 'Approved', icon: 'verified', bg: '#dcfce7', color: '#166534' },
    { key: 'rejected', label: 'Rejected', icon: 'cancel', bg: '#fee2e2', color: '#991b1b' },
];

export default function PrescriptionVerification() {
    const [prescriptions, setPrescriptions] = useState([]);
    const [allPrescriptions, setAllPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [notes, setNotes] = useState({});

    const fetchAll = () => {
        api.get('/admin/prescriptions')
            .then(({ data }) => setAllPrescriptions(data.prescriptions || data))
            .catch(() => setAllPrescriptions([]));
    };

    const fetchFiltered = () => {
        setLoading(true);
        const params = filter ? `?status=${filter}` : '';
        api.get(`/admin/prescriptions${params}`)
            .then(({ data }) => setPrescriptions(data.prescriptions || data))
            .catch(() => setPrescriptions([]))
            .finally(() => setLoading(false));
    };

    useEffect(fetchAll, [prescriptions]);
    useEffect(fetchFiltered, [filter]);

    const verify = async (id, status) => {
        try {
            await api.put(`/admin/prescriptions/${id}/verify`, { status, verificationNotes: notes[id] || '' });
            fetchFiltered();
        } catch { }
    };

    const getCount = (key) => {
        if (!key) return allPrescriptions.length;
        return allPrescriptions.filter(p => p.status === key).length;
    };

    const statusColors = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red' };

    return (
        <div>
            <h1 className="page-title">Prescription Verification</h1>

            {/* Filter Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '2rem',
            }}>
                {filterCards.map(c => {
                    const active = filter === c.key;
                    return (
                        <div
                            key={c.key}
                            onClick={() => setFilter(c.key)}
                            style={{
                                background: c.bg,
                                color: c.color,
                                padding: '1rem 1.1rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                transform: active ? 'scale(1.04)' : 'scale(1)',
                                boxShadow: active
                                    ? '0 6px 20px rgba(0,0,0,0.25), inset 0 0 0 2.5px rgba(255,255,255,0.5)'
                                    : '0 2px 8px rgba(0,0,0,0.1)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.35rem',
                                userSelect: 'none',
                                opacity: active ? 1 : 0.85,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="material-icons" style={{ fontSize: '1.5rem', opacity: 0.9 }}>{c.icon}</span>
                                <span style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1 }}>{getCount(c.key)}</span>
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, opacity: 0.9, letterSpacing: '0.02em' }}>{c.label}</span>
                        </div>
                    );
                })}
            </div>

            {loading ? <div className="loader"><div className="spinner" /></div> : prescriptions.length === 0 ? (
                <div className="empty-state"><span className="material-icons">fact_check</span><p>No prescriptions found</p></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {prescriptions.map(rx => (
                        <div key={rx._id} className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span className="material-icons" style={{ color: 'var(--primary-500)' }}>description</span>
                                        <span style={{ fontWeight: 600 }}>Prescription from {rx.customer?.firstName || 'Customer'} {rx.customer?.lastName || ''}</span>
                                        <span className={`badge ${statusColors[rx.status]}`}>{rx.status}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                                        Uploaded: {new Date(rx.createdAt).toLocaleString('en-IN')}
                                    </div>
                                    {rx.items?.length > 0 && (
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                                            <strong>Linked Products:</strong>
                                            {rx.items.map((item, i) => (
                                                <span key={i} className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{item.product?.name || 'Product'}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {rx.imageUrl && (
                                    <a href={`${SERVER_URL}${rx.imageUrl}`} target="_blank" rel="noopener noreferrer" style={{ flexShrink: 0 }}>
                                        <img src={`${SERVER_URL}${rx.imageUrl}`} alt="Prescription" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }} />
                                    </a>
                                )}
                            </div>

                            {rx.status === 'pending' && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
                                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                                        <input className="form-input" placeholder="Verification notes (optional)" value={notes[rx._id] || ''} onChange={e => setNotes({ ...notes, [rx._id]: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button className="btn btn-primary btn-sm" onClick={() => verify(rx._id, 'approved')}>
                                            <span className="material-icons" style={{ fontSize: '1rem' }}>check_circle</span> Approve
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => verify(rx._id, 'rejected')}>
                                            <span className="material-icons" style={{ fontSize: '1rem' }}>cancel</span> Reject
                                        </button>
                                    </div>
                                </div>
                            )}

                            {rx.verificationNotes && rx.status !== 'pending' && (
                                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                                    Notes: {rx.verificationNotes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
