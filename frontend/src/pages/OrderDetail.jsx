import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';
import './OrderDetail.css';

export default function OrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [reordering, setReordering] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [refundData, setRefundData] = useState({ reason: '', refund_method: 'upi', refund_upi_id: '', bank_name: '', account_holder_name: '', bank_account_last4: '' });

    const cancelReasons = [
        'Changed my mind',
        'Found a better price elsewhere',
        'Ordered by mistake',
        'Delivery taking too long',
        'Need to change order items',
        'Other',
    ];

    useEffect(() => {
        api.get(`/orders/${id}`)
            .then(({ data }) => setOrder(data))
            .catch(() => setOrder(null))
            .finally(() => setLoading(false));
    }, [id]);

    const handleCancelClick = () => {
        setCancelReason('');
        setCustomReason('');
        if (order?.paymentMethod === 'online') {
            setShowRefundModal(true);
        } else {
            setShowCancelModal(true);
        }
    };

    const confirmCancel = async () => {
        const reason = cancelReason === 'Other' ? customReason : cancelReason;
        if (!reason.trim()) { toast.error('Please select a reason for cancellation'); return; }
        setCancelling(true);
        try {
            await api.post(`/orders/${id}/cancel`, { reason });
            setOrder({ ...order, status: 'cancelled' });
            setShowCancelModal(false);
            toast.success('Order cancelled successfully');
        } catch { toast.error('Failed to cancel order'); }
        finally { setCancelling(false); }
    };

    const submitRefund = async () => {
        if (!refundData.reason.trim()) { toast.error('Please provide a reason'); return; }
        setCancelling(true);
        try { await api.post(`/orders/${id}/cancel`, refundData); setOrder({ ...order, status: 'cancelled' }); setShowRefundModal(false); toast.success('Refund request submitted'); } catch { toast.error('Failed to submit refund'); }
        finally { setCancelling(false); }
    };

    const reorder = async () => {
        setReordering(true);
        try {
            for (const item of (order?.items || [])) {
                await api.post('/cart', { productId: item.product?._id || item.productId, quantity: item.quantity });
            }
            navigate('/cart');
        } catch { toast.error('Failed to reorder'); }
        finally { setReordering(false); }
    };

    if (loading) return <div className="od-loading"><div className="od-spinner"></div><p>Loading order details...</p></div>;
    if (!order) return <div className="od-empty"><p>Order not found</p><Link to="/orders" className="btn btn-primary">My Orders</Link></div>;

    const tracking = order.tracking || [];
    const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const statusLabels = { pending: 'Placed', confirmed: 'Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
    const statusIcons = { pending: 'shopping_cart', confirmed: 'check_circle', processing: 'inventory_2', shipped: 'local_shipping', delivered: 'task_alt' };
    const currentIdx = statusSteps.indexOf(order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <main className="od-page">
            {/* Breadcrumb */}
            <nav className="od-breadcrumb">
                <Link to="/products"><span className="material-icons" style={{ fontSize: '1rem' }}>home</span> Home</Link>
                <span className="material-icons od-bc-sep">chevron_right</span>
                <Link to="/orders">My Orders</Link>
                <span className="material-icons od-bc-sep">chevron_right</span>
                <span>Order Details</span>
            </nav>

            {/* Header */}
            <div className="od-header">
                <h1 className="od-title">Order Details</h1>
                <p className="od-order-number">Order #{order.orderNumber || order._id?.slice(-6)}</p>
                <p className="od-meta"><span className="od-label">Order Type:</span> <span className="capitalize">{order.orderType}</span></p>
                <p className="od-meta"><span className="od-label">Placed on:</span> {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
            </div>

            {/* Status Progress Bar */}
            <div className="od-card" style={{ marginBottom: '2rem' }}>
                {isCancelled ? (
                    <div className="od-cancelled-bar">
                        <span className="material-icons" style={{ fontSize: '2rem', color: '#ef4444' }}>cancel</span>
                        <div>
                            <p style={{ fontWeight: 700, color: '#ef4444', fontSize: '1.1rem' }}>Order Cancelled</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                                {order.cancelledAt ? `Cancelled on ${new Date(order.cancelledAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}` : 'This order has been cancelled'}
                            </p>
                            {order.cancellationReason && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                                    <strong>Reason:</strong> {order.cancellationReason}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="od-stepper">
                        {statusSteps.map((step, i) => {
                            const done = i <= currentIdx;
                            const active = i === currentIdx;
                            return (
                                <div key={step} className={`od-step ${done ? 'od-step-done' : ''} ${active ? 'od-step-active' : ''}`}>
                                    <div className="od-step-icon-wrap">
                                        {i > 0 && <div className={`od-step-line ${done ? 'od-step-line-done' : ''}`} />}
                                        <div className={`od-step-circle ${done ? 'od-step-circle-done' : ''} ${active ? 'od-step-circle-active' : ''}`}>
                                            <span className="material-icons" style={{ fontSize: '1.2rem' }}>{done ? 'check' : statusIcons[step]}</span>
                                        </div>
                                    </div>
                                    <p className={`od-step-label ${done ? 'od-step-label-done' : ''}`}>{statusLabels[step]}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="od-grid">
                {/* Left */}
                <div className="od-left">
                    {/* Address */}
                    {order.orderType === 'delivery' && order.shippingAddress && (
                        <div className="od-card">
                            <h2 className="od-card-title">Delivery Address</h2>
                            <div className="od-address">
                                <p className="od-addr-type capitalize">{order.shippingAddress.type || 'Address'}</p>
                                <p>{order.shippingAddress.addressLine1}, {order.shippingAddress.addressLine2}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                            </div>
                        </div>
                    )}

                    {order.orderType === 'pickup' && (
                        <div className="od-card">
                            <h2 className="od-card-title">Pickup Information</h2>
                            <p><span className="od-label">Pickup Time:</span> {order.pickupTime || 'Not scheduled'}</p>
                            <p><span className="od-label">Ready At:</span> {order.readyAt || '—'}</p>
                            <p><span className="od-label">Picked Up At:</span> {order.pickedUpAt || 'Not picked up yet'}</p>
                        </div>
                    )}

                    {/* Tracking Timeline */}
                    {tracking.length > 0 && (
                        <div className="od-card">
                            <h2 className="od-card-title">Activity Log</h2>
                            <div className="od-timeline">
                                {tracking.map((step, i) => (
                                    <div key={i} className="od-timeline-step">
                                        <span className="material-icons od-tl-icon">check_circle</span>
                                        <div>
                                            <p className="od-tl-event">{step.event}</p>
                                            <p className="od-tl-time">{new Date(step.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items */}
                    <div className="od-card">
                        <h2 className="od-card-title">Items</h2>
                        {(order.items || []).map((item, i) => (
                            <div key={i} className="od-item">
                                <div className="od-item-left">
                                    <div className="od-item-img">
                                        {item.product?.imageUrl ? (
                                            <img src={`${SERVER_URL}${item.product.imageUrl}`} alt={item.product?.name || 'Product'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                        ) : (
                                            <span className="material-icons" style={{ fontSize: '2rem', color: 'var(--gray-300)' }}>medication</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="od-item-name">{item.product?.name || item.productName || 'Product'}</p>
                                        <p className="od-item-qty">Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p className="od-item-price">₹{(item.subtotal || (item.unitPrice || 0) * item.quantity).toFixed(0)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right */}
                <div className="od-right">
                    {/* Summary */}
                    <div className="od-card">
                        <h2 className="od-card-title">Order Summary</h2>
                        <div className="od-summary-rows">
                            <div className="od-summary-row"><span>Subtotal</span><span>₹{(order.totalAmount || 0).toFixed(0)}</span></div>
                            {order.orderType === 'delivery' && <div className="od-summary-row"><span>Shipping</span><span>₹{(order.shippingCharges || 0).toFixed(0)}</span></div>}
                            <div className="od-summary-row total"><span>Total</span><span>₹{(order.finalAmount || order.totalAmount || 0).toFixed(0)}</span></div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="od-actions">
                        <button className="od-btn-reorder" onClick={reorder} disabled={reordering}>{reordering ? 'Adding...' : 'Reorder Items'}</button>
                        {!['delivered', 'cancelled'].includes(order.status) && (
                            <button className="od-btn-cancel" onClick={handleCancelClick} disabled={cancelling}>{cancelling ? 'Cancelling...' : 'Cancel Order'}</button>
                        )}
                        {order.status === 'delivered' && (
                            <button
                                className="od-btn-receipt"
                                disabled={downloadingInvoice}
                                onClick={async () => {
                                    setDownloadingInvoice(true);
                                    try {
                                        await api.post(`/invoices/generate/${order._id}`);
                                        const res = await api.get(`/invoices/${order._id}/download`, { responseType: 'blob' });
                                        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `Invoice-${order.orderNumber}.pdf`;
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                        toast.success('Invoice downloaded');
                                    } catch {
                                        toast.error('Failed to download invoice');
                                    } finally {
                                        setDownloadingInvoice(false);
                                    }
                                }}
                            >
                                <span className="material-icons" style={{ fontSize: '1rem', marginRight: '0.3rem' }}>receipt</span>
                                {downloadingInvoice ? 'Generating...' : 'Download Invoice'}
                            </button>
                        )}
                        <button className="od-btn-receipt" onClick={async () => {
                            try {
                                const { default: jsPDF } = await import('jspdf');
                                const doc = new jsPDF();
                                doc.setFontSize(18);
                                doc.setFont('helvetica', 'bold');
                                doc.text('Meenakshi Pharma Distributors', 105, 18, { align: 'center' });
                                doc.setFontSize(10);
                                doc.setFont('helvetica', 'normal');
                                doc.text('Payment Receipt', 105, 25, { align: 'center' });
                                doc.setDrawColor(38, 166, 91);
                                doc.setLineWidth(0.5);
                                doc.line(14, 30, 196, 30);

                                let y = 38;
                                doc.setFontSize(10);
                                doc.text(`Order: ${order.orderNumber}`, 14, y);
                                doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}`, 140, y);
                                y += 7;
                                doc.text(`Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`, 14, y);
                                doc.text(`Payment: ${(order.paymentMethod || 'N/A').toUpperCase()}`, 140, y);
                                y += 10;

                                if (order.shippingAddress) {
                                    doc.setFont('helvetica', 'bold');
                                    doc.text('Shipping Address:', 14, y);
                                    y += 6;
                                    doc.setFont('helvetica', 'normal');
                                    doc.text(`${order.shippingAddress.addressLine1 || ''}, ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.zipCode || ''}`, 14, y);
                                    y += 10;
                                }

                                doc.setFont('helvetica', 'bold');
                                doc.text('Items', 14, y);
                                y += 6;
                                doc.setFont('helvetica', 'normal');
                                doc.setFontSize(9);
                                doc.text('Product', 14, y); doc.text('Qty', 130, y); doc.text('Price', 155, y); doc.text('Subtotal', 175, y);
                                y += 2; doc.line(14, y, 196, y); y += 5;

                                (order.items || []).forEach(item => {
                                    doc.text((item.product?.name || item.productName || 'Product').substring(0, 50), 14, y);
                                    doc.text(String(item.quantity), 130, y);
                                    doc.text(`Rs.${(item.unitPrice || 0).toFixed(2)}`, 155, y);
                                    doc.text(`Rs.${(item.subtotal || (item.unitPrice || 0) * item.quantity).toFixed(2)}`, 175, y);
                                    y += 6;
                                });

                                y += 2; doc.line(14, y, 196, y); y += 7;
                                doc.setFontSize(10);
                                doc.text(`Subtotal: Rs.${(order.totalAmount || 0).toFixed(2)}`, 140, y); y += 6;
                                if (order.shippingCharges) { doc.text(`Shipping: Rs.${order.shippingCharges.toFixed(2)}`, 140, y); y += 6; }
                                doc.setFont('helvetica', 'bold');
                                doc.text(`Total: Rs.${(order.finalAmount || order.totalAmount || 0).toFixed(2)}`, 140, y);
                                y += 15;

                                doc.setFontSize(8);
                                doc.setFont('helvetica', 'normal');
                                doc.text('Thank you for shopping with Meenakshi Pharma Distributors!', 105, y, { align: 'center' });

                                doc.save(`Receipt-${order.orderNumber}.pdf`);
                                toast.success('Receipt downloaded');
                            } catch { toast.error('Failed to generate receipt'); }
                        }}>Payment Receipt</button>
                    </div>
                </div>
            </div>

            {/* Cancel Reason Modal (for COD / non-online orders) */}
            {showCancelModal && (
                <div className="od-modal-overlay" onClick={() => setShowCancelModal(false)}>
                    <div className="od-modal" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span className="material-icons" style={{ color: '#ef4444', fontSize: '1.5rem' }}>warning</span>
                            <h2 className="od-modal-title" style={{ margin: 0 }}>Cancel Order</h2>
                        </div>
                        <p style={{ fontSize: '0.88rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                            Are you sure you want to cancel order <strong>#{order.orderNumber}</strong>? Please select a reason:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                            {cancelReasons.map(r => (
                                <label
                                    key={r}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        padding: '0.6rem 0.75rem', borderRadius: '8px',
                                        border: cancelReason === r ? '1.5px solid var(--primary-400)' : '1.5px solid var(--gray-200)',
                                        background: cancelReason === r ? 'var(--primary-50)' : '#fff',
                                        cursor: 'pointer', transition: 'all 0.15s',
                                        fontSize: '0.88rem',
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="cancelReason"
                                        value={r}
                                        checked={cancelReason === r}
                                        onChange={() => setCancelReason(r)}
                                        style={{ accentColor: 'var(--primary-500)' }}
                                    />
                                    {r}
                                </label>
                            ))}
                        </div>

                        {cancelReason === 'Other' && (
                            <div className="od-form-field" style={{ marginBottom: '1rem' }}>
                                <label>Please specify</label>
                                <textarea
                                    placeholder="Tell us why you're cancelling..."
                                    rows="3"
                                    value={customReason}
                                    onChange={e => setCustomReason(e.target.value)}
                                    style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--gray-200)', padding: '0.6rem', fontSize: '0.88rem', resize: 'vertical' }}
                                />
                            </div>
                        )}

                        <div className="od-modal-actions">
                            <button className="od-modal-cancel" onClick={() => setShowCancelModal(false)}>Keep Order</button>
                            <button
                                className="od-modal-submit"
                                onClick={confirmCancel}
                                disabled={cancelling || !cancelReason || (cancelReason === 'Other' && !customReason.trim())}
                                style={{ background: '#ef4444' }}
                            >
                                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal (for online payment orders) */}
            {showRefundModal && (
                <div className="od-modal-overlay" onClick={() => setShowRefundModal(false)}>
                    <div className="od-modal" onClick={e => e.stopPropagation()}>
                        <h2 className="od-modal-title">Cancel Order & Request Refund</h2>
                        <div className="od-form-field"><label>Reason</label><textarea placeholder="Why are you cancelling?" rows="3" value={refundData.reason} onChange={e => setRefundData({ ...refundData, reason: e.target.value })} /></div>
                        <div className="od-form-field"><label>Refund Method</label>
                            <select value={refundData.refund_method} onChange={e => setRefundData({ ...refundData, refund_method: e.target.value })}>
                                <option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        {refundData.refund_method === 'upi' && (
                            <div className="od-form-field"><label>UPI ID</label><input placeholder="example@upi" value={refundData.refund_upi_id} onChange={e => setRefundData({ ...refundData, refund_upi_id: e.target.value })} /></div>
                        )}
                        {refundData.refund_method === 'bank_transfer' && (
                            <>
                                <div className="od-form-field"><label>Bank Name</label><input value={refundData.bank_name} onChange={e => setRefundData({ ...refundData, bank_name: e.target.value })} /></div>
                                <div className="od-form-field"><label>Account Holder</label><input value={refundData.account_holder_name} onChange={e => setRefundData({ ...refundData, account_holder_name: e.target.value })} /></div>
                                <div className="od-form-field"><label>Last 4 digits</label><input maxLength="4" placeholder="1234" value={refundData.bank_account_last4} onChange={e => setRefundData({ ...refundData, bank_account_last4: e.target.value })} /></div>
                            </>
                        )}
                        <div className="od-modal-actions">
                            <button className="od-modal-cancel" onClick={() => setShowRefundModal(false)}>Close</button>
                            <button className="od-modal-submit" onClick={submitRefund} disabled={cancelling}>{cancelling ? 'Submitting...' : 'Submit Refund'}</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
