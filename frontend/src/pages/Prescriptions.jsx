import { useState, useEffect } from 'react';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';

export default function Prescriptions() {
    const toast = useToast();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [selectedRx, setSelectedRx] = useState(null);

    const load = () => {
        api.get('/prescriptions')
            .then(({ data }) => setPrescriptions(data.prescriptions || data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };
    useEffect(load, []);

    const upload = async () => {
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('prescription', file);
        try {
            await api.post('/prescriptions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            load();
            setFile(null);
            toast.success('Prescription uploaded!');
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const statusConfig = {
        pending: { color: '#f59e0b', bg: '#fef3c7', icon: 'schedule', label: 'Pending Review' },
        approved: { color: '#10b981', bg: '#d1fae5', icon: 'check_circle', label: 'Approved' },
        rejected: { color: '#ef4444', bg: '#fee2e2', icon: 'cancel', label: 'Rejected' },
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 900 }}>
                <h1 className="page-title">My Prescriptions</h1>

                {/* Upload Card */}
                <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-icons" style={{ color: 'var(--primary-500)' }}>cloud_upload</span>
                        Upload Prescription
                    </h2>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{
                            flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: '0.75rem 1rem', borderRadius: '10px',
                            border: '2px dashed var(--gray-200)', cursor: 'pointer',
                            background: file ? 'var(--primary-50)' : '#fff',
                            transition: 'all 0.2s',
                        }}>
                            <span className="material-icons" style={{ color: file ? 'var(--primary-500)' : 'var(--gray-400)' }}>
                                {file ? 'image' : 'add_photo_alternate'}
                            </span>
                            <span style={{ fontSize: '0.88rem', color: file ? 'var(--gray-800)' : 'var(--gray-500)' }}>
                                {file ? file.name : 'Choose file (image or PDF)'}
                            </span>
                            <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} />
                        </label>
                        <button className="btn btn-primary" onClick={upload} disabled={!file || uploading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.5rem' }}>
                            <span className="material-icons" style={{ fontSize: '1.1rem' }}>{uploading ? 'hourglass_top' : 'upload'}</span>
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>
                </div>

                {/* Prescriptions List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
                ) : prescriptions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                        <span className="material-icons" style={{ fontSize: '3rem', marginBottom: '0.5rem', display: 'block' }}>description</span>
                        <p>No prescriptions uploaded yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {prescriptions.map(rx => {
                            const cfg = statusConfig[rx.status] || statusConfig.pending;
                            const imgSrc = rx.imageUrl?.startsWith('http') ? rx.imageUrl : `${SERVER_URL}${rx.imageUrl}`;
                            const pdf = rx.imageUrl?.toLowerCase().endsWith('.pdf');
                            return (
                                <div
                                    key={rx._id}
                                    className="card"
                                    onClick={() => setSelectedRx(rx)}
                                    style={{
                                        padding: 0, overflow: 'hidden', cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1.5px solid var(--gray-100)',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                                >
                                    {/* Image/PDF Preview */}
                                    <div style={{
                                        width: '100%', height: 180,
                                        background: 'var(--gray-50)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        overflow: 'hidden', position: 'relative',
                                    }}>
                                        {rx.imageUrl && !pdf ? (
                                            <img
                                                src={imgSrc}
                                                alt="Prescription"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                            />
                                        ) : null}
                                        {pdf ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                                <span className="material-icons" style={{ fontSize: '3rem', color: '#ef4444' }}>picture_as_pdf</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gray-600)' }}>PDF Document</span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Click to preview</span>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: rx.imageUrl ? 'none' : 'flex',
                                                flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                            }}>
                                                <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--gray-300)' }}>description</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>No preview</span>
                                            </div>
                                        )}
                                        {/* Hover Overlay */}
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'rgba(0,0,0,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            opacity: 0, transition: 'opacity 0.2s',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                        >
                                            <span className="material-icons" style={{ color: '#fff', fontSize: '2rem' }}>visibility</span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div style={{ padding: '0.85rem 1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>Prescription</span>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                                padding: '0.2rem 0.6rem', borderRadius: '20px',
                                                fontSize: '0.72rem', fontWeight: 600,
                                                color: cfg.color, background: cfg.bg,
                                            }}>
                                                <span className="material-icons" style={{ fontSize: '0.8rem' }}>{cfg.icon}</span>
                                                {cfg.label}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <span className="material-icons" style={{ fontSize: '0.85rem' }}>calendar_today</span>
                                            {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                        {rx.items?.length > 0 && (
                                            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span className="material-icons" style={{ fontSize: '0.85rem' }}>medication</span>
                                                {rx.items.length} medicine{rx.items.length > 1 ? 's' : ''} linked
                                            </div>
                                        )}
                                        {rx.verificationNotes && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                                                "{rx.verificationNotes}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Full Preview Modal */}
            {selectedRx && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '1.5rem',
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={() => setSelectedRx(null)}
                >
                    <div
                        style={{
                            background: '#fff', borderRadius: '16px',
                            maxWidth: 700, width: '100%', maxHeight: '90vh',
                            overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                            animation: 'slideUp 0.25s ease',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--gray-100)',
                        }}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Prescription Preview</h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', margin: 0 }}>
                                    Uploaded on {new Date(selectedRx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {(() => {
                                    const cfg = statusConfig[selectedRx.status] || statusConfig.pending;
                                    return (
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                                            padding: '0.3rem 0.7rem', borderRadius: '20px',
                                            fontSize: '0.78rem', fontWeight: 600,
                                            color: cfg.color, background: cfg.bg,
                                        }}>
                                            <span className="material-icons" style={{ fontSize: '0.85rem' }}>{cfg.icon}</span>
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                                <button
                                    onClick={() => setSelectedRx(null)}
                                    style={{
                                        background: 'var(--gray-100)', border: 'none', borderRadius: '8px',
                                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>close</span>
                                </button>
                            </div>
                        </div>

                        {/* Image / PDF Preview */}
                        {(() => {
                            const rxUrl = selectedRx.imageUrl?.startsWith('http') ? selectedRx.imageUrl : `${SERVER_URL}${selectedRx.imageUrl}`;
                            const isPdf = selectedRx.imageUrl?.toLowerCase().endsWith('.pdf');
                            return (
                                <div style={{
                                    flex: 1, overflow: 'auto', padding: '1rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'var(--gray-50)',
                                    minHeight: 400,
                                }}>
                                    {selectedRx.imageUrl ? (
                                        isPdf ? (
                                            <iframe
                                                src={rxUrl}
                                                title="Prescription PDF"
                                                style={{ width: '100%', height: '65vh', border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                        ) : (
                                            <img
                                                src={rxUrl}
                                                alt="Prescription"
                                                style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                        )
                                    ) : (
                                        <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
                                            <span className="material-icons" style={{ fontSize: '3rem' }}>image_not_supported</span>
                                            <p>No image available</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Modal Footer - linked medicines */}
                        {(selectedRx.items?.length > 0 || selectedRx.verificationNotes) && (
                            <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid var(--gray-100)' }}>
                                {selectedRx.items?.length > 0 && (
                                    <div style={{ marginBottom: selectedRx.verificationNotes ? '0.5rem' : 0 }}>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 600, marginBottom: '0.3rem' }}>
                                            Linked Medicines ({selectedRx.items.length})
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                            {selectedRx.items.map((itm, i) => (
                                                <span key={i} style={{
                                                    padding: '0.25rem 0.65rem', borderRadius: '20px',
                                                    fontSize: '0.75rem', fontWeight: 500,
                                                    background: 'var(--primary-50)', color: 'var(--primary-700)',
                                                }}>
                                                    {itm.product?.name || `Product ${i + 1}`} × {itm.quantity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedRx.verificationNotes && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                                        <strong>Note:</strong> {selectedRx.verificationNotes}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
