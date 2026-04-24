import { useState, useEffect } from 'react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';

const allStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const statusColors = { pending: 'badge-yellow', confirmed: 'badge-blue', processing: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red' };

const statusSelectStyles = {
    pending: { background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' },
    confirmed: { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    processing: { background: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' },
    shipped: { background: '#cffafe', color: '#155e75', border: '1px solid #67e8f9' },
    delivered: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    cancelled: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
};

const filterCards = [
    { key: '', label: 'All Orders', icon: 'shopping_bag', bg: '#334155', color: '#fff' },
    { key: 'pending', label: 'Pending', icon: 'schedule', bg: '#fef3c7', color: '#92400e' },
    { key: 'confirmed', label: 'Confirmed', icon: 'check_circle', bg: '#dbeafe', color: '#1e40af' },
    { key: 'processing', label: 'Processing', icon: 'inventory_2', bg: '#e0e7ff', color: '#3730a3' },
    { key: 'shipped', label: 'Shipped', icon: 'local_shipping', bg: '#cffafe', color: '#155e75' },
    { key: 'delivered', label: 'Delivered', icon: 'task_alt', bg: '#dcfce7', color: '#166534' },
    { key: 'cancelled', label: 'Cancelled', icon: 'cancel', bg: '#fee2e2', color: '#991b1b' },
];

export default function OrderManagement() {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null);
    const [updating, setUpdating] = useState(null);

    // Fetch all orders for counts
    useEffect(() => {
        api.get('/admin/orders')
            .then(({ data }) => setAllOrders(data.orders || data))
            .catch(() => setAllOrders([]));
    }, [orders]);

    const fetchOrders = () => {
        setLoading(true);
        const params = filter ? `?status=${filter}` : '';
        api.get(`/admin/orders${params}`)
            .then(({ data }) => setOrders(data.orders || data))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    };
    useEffect(fetchOrders, [filter]);

    const handleStatusChange = async (orderId, newStatus, oldStatus) => {
        if (newStatus === oldStatus) return;
        if (newStatus === 'cancelled' && !confirm('Cancel this order? Inventory will be restored.')) return;
        setUpdating(orderId);
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Order status changed to ${newStatus}`);
            fetchOrders();
            setSelected(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(null);
        }
    };

    const getCount = (key) => {
        if (!key) return allOrders.length;
        return allOrders.filter(o => o.status === key).length;
    };

    return (
        <div>
            <h1 className="page-title">Order Management</h1>

            {/* Status Filter Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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

            {loading ? <div className="loader"><div className="spinner" /></div> : orders.length === 0 ? (
                <div className="empty-state"><span className="material-icons">receipt_long</span><p>No orders found</p></div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th style={{ minWidth: 180 }}>Change Status</th><th>Actions</th></tr></thead>
                        <tbody>
                            {orders.map(o => (
                                <tr key={o._id}>
                                    <td style={{ fontWeight: 600 }}>{o.orderNumber}</td>
                                    <td>{o.customer?.firstName} {o.customer?.lastName}</td>
                                    <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td>{o.items?.length || 0}</td>
                                    <td style={{ fontWeight: 600 }}>₹{o.totalAmount?.toFixed(2)}</td>
                                    <td><span className={`badge ${statusColors[o.status]}`}>{o.status}</span></td>
                                    <td>
                                        {['delivered', 'cancelled'].includes(o.status) ? (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>Final</span>
                                        ) : (
                                            <select
                                                value={o.status}
                                                disabled={updating === o._id}
                                                onChange={(e) => handleStatusChange(o._id, e.target.value, o.status)}
                                                style={{
                                                    padding: '0.35rem 0.6rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.82rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    outline: 'none',
                                                    textTransform: 'capitalize',
                                                    ...(statusSelectStyles[o.status] || {}),
                                                }}
                                            >
                                                {allStatuses.map(s => (
                                                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        <button className="header-icon-btn" onClick={() => setSelected(selected === o._id ? null : o._id)} title="Details">
                                            <span className="material-icons" style={{ fontSize: '1.1rem' }}>visibility</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Detail Modal */}
            {selected && (() => {
                const o = orders.find(x => x._id === selected);
                if (!o) return null;
                return (
                    <div
                        onClick={() => setSelected(null)}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '2rem', animation: 'fadeIn 0.2s ease',
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: '#fff', borderRadius: '16px', padding: '2rem',
                                width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto',
                                boxShadow: '0 24px 48px rgba(0,0,0,0.2)', animation: 'slideUp 0.25s ease',
                                position: 'relative',
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setSelected(null)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'var(--gray-100)', border: 'none', borderRadius: '50%',
                                    width: '36px', height: '36px', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-200)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-100)'}
                            >
                                <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--gray-600)' }}>close</span>
                            </button>

                            <h3 style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.25rem', paddingRight: '2.5rem' }}>
                                Order {o.orderNumber}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--gray-400)', marginBottom: '1.25rem' }}>
                                Placed on {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>

                            {/* Status badge */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <span className={`badge ${statusColors[o.status]}`} style={{ fontSize: '0.82rem', padding: '0.3rem 0.8rem' }}>
                                    {o.status?.charAt(0).toUpperCase() + o.status?.slice(1)}
                                </span>
                            </div>

                            {/* Order info grid */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 1.5rem',
                                fontSize: '0.88rem', padding: '1rem', background: 'var(--gray-50)',
                                borderRadius: '10px', marginBottom: '1.25rem',
                            }}>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Customer</span><br /><strong>{o.customer?.firstName} {o.customer?.lastName}</strong></div>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Payment</span><br /><strong style={{ textTransform: 'uppercase' }}>{o.paymentMethod}</strong></div>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Subtotal</span><br /><strong>₹{((o.totalAmount || 0) - (o.taxAmount || 0) - (o.shippingCharges || 0)).toFixed(2)}</strong></div>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Tax</span><br /><strong>₹{(o.taxAmount || 0).toFixed(2)}</strong></div>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Shipping</span><br /><strong>{!o.shippingCharges ? 'FREE' : `₹${o.shippingCharges.toFixed(2)}`}</strong></div>
                                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Total</span><br /><strong style={{ fontSize: '1.1rem', color: 'var(--primary-600)' }}>₹{(o.finalAmount || o.totalAmount || 0).toFixed(2)}</strong></div>
                            </div>

                            {/* Shipping address */}
                            {o.shippingAddress && (
                                <div style={{ fontSize: '0.85rem', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--gray-50)', borderRadius: '10px' }}>
                                    <span style={{ color: 'var(--gray-500)', fontSize: '0.78rem' }}>Shipping Address</span><br />
                                    <strong>{o.shippingAddress.fullName || `${o.customer?.firstName} ${o.customer?.lastName}`}</strong><br />
                                    {o.shippingAddress.address}, {o.shippingAddress.city}, {o.shippingAddress.state} - {o.shippingAddress.zip}
                                    {o.shippingAddress.phone && <><br />{o.shippingAddress.phone}</>}
                                </div>
                            )}

                            {/* Items */}
                            <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>Items ({o.items?.length || 0})</h4>
                            <div style={{ borderRadius: '10px', border: '1px solid var(--gray-100)', overflow: 'hidden' }}>
                                {o.items?.map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '0.65rem 1rem', fontSize: '0.875rem',
                                        borderBottom: i < o.items.length - 1 ? '1px solid var(--gray-100)' : 'none',
                                        background: i % 2 === 0 ? '#fff' : 'var(--gray-50)',
                                    }}>
                                        <div>
                                            <span style={{ fontWeight: 500 }}>{item.productName || 'Product'}</span>
                                            <span style={{ color: 'var(--gray-400)', marginLeft: '0.5rem' }}>× {item.quantity}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>₹{(item.subtotal || (item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
