import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';
import './Cart.css';

export default function Cart() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState([]);
    const fileRef = useRef();
    const [uploading, setUploading] = useState(false);

    // Medicine selection for prescription upload
    const [showRxPicker, setShowRxPicker] = useState(false);
    const [selectedRxIds, setSelectedRxIds] = useState([]);

    const loadCart = () => {
        setLoading(true);
        api.get('/cart')
            .then(({ data }) => setItems(data.items || data || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    const loadPrescriptions = () => {
        api.get('/prescriptions')
            .then(({ data }) => setPrescriptions(data.prescriptions || data || []))
            .catch(() => { });
    };

    useEffect(() => { loadCart(); loadPrescriptions(); }, []);

    const updateQty = (itemId, qty) => {
        if (qty < 1) return removeItem(itemId);
        api.put(`/cart/${itemId}`, { quantity: qty })
            .then(() => { loadCart(); toast.success('Quantity updated'); })
            .catch((err) => toast.error(err.response?.data?.message || 'Failed to update quantity'));
    };

    const removeItem = (itemId) => {
        api.delete(`/cart/${itemId}`)
            .then(() => { loadCart(); toast.info('Item removed from cart'); })
            .catch(() => toast.error('Failed to remove item'));
    };

    // Toggle medicine selection for prescription
    const toggleRxSelection = (productId) => {
        setSelectedRxIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Open the picker — pre-select items that still need a prescription
    const openRxPicker = () => {
        const needsRx = rxItems
            .filter(it => {
                const s = getRxStatusForProduct(it.product._id).status;
                return s === 'none' || s === 'rejected';
            })
            .map(it => it.product._id);
        setSelectedRxIds(needsRx);
        setShowRxPicker(true);
    };

    // Upload prescription linked to SELECTED Rx products only
    const uploadPrescription = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (selectedRxIds.length === 0) {
            toast.error('Please select at least one medicine for this prescription');
            if (fileRef.current) fileRef.current.value = '';
            return;
        }

        const selectedCartItems = items.filter(it => selectedRxIds.includes(it.product?._id));

        const fd = new FormData();
        fd.append('prescription', file);
        selectedCartItems.forEach(it => {
            fd.append('productIds', it.product._id);
            fd.append('quantities', String(it.quantity));
        });

        setUploading(true);
        try {
            await api.post('/prescriptions/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            loadPrescriptions();
            setShowRxPicker(false);
            setSelectedRxIds([]);
            toast.success('Prescription uploaded! It will be reviewed by our pharmacist.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    // --- Prescription status helpers ---
    const rxItems = items.filter(it => it.product?.requiresPrescription);
    const hasRx = rxItems.length > 0;

    // For each Rx product, find its best prescription (approved > pending > none)
    const getRxStatusForProduct = (productId) => {
        // Check for approved prescription first
        const approved = prescriptions.find(rx =>
            rx.status === 'approved' && !rx.isUsed &&
            rx.items?.some(item => (item.product?._id || item.product) === productId)
        );
        if (approved) return { status: 'approved', prescription: approved };

        // Then pending
        const pending = prescriptions.find(rx =>
            rx.status === 'pending' &&
            rx.items?.some(item => (item.product?._id || item.product) === productId)
        );
        if (pending) return { status: 'pending', prescription: pending };

        // Check for rejected (user may need to re-upload)
        const rejected = prescriptions.find(rx =>
            rx.status === 'rejected' &&
            rx.items?.some(item => (item.product?._id || item.product) === productId)
        );
        if (rejected) return { status: 'rejected', prescription: rejected };

        return { status: 'none', prescription: null };
    };

    // Checkout eligibility: all Rx items must have approved prescriptions
    const allRxApproved = rxItems.every(it => {
        const { status } = getRxStatusForProduct(it.product._id);
        return status === 'approved';
    });
    const canCheckout = !hasRx || allRxApproved;

    // Any Rx items still waiting?
    const anyRxPending = rxItems.some(it => getRxStatusForProduct(it.product._id).status === 'pending');
    const anyRxMissing = rxItems.some(it => {
        const s = getRxStatusForProduct(it.product._id).status;
        return s === 'none' || s === 'rejected';
    });

    const subtotal = items.reduce((s, it) => s + (it.product?.price || 0) * (it.quantity || 0), 0);
    const shipping = subtotal > 500 ? 0 : 40;
    const total = subtotal + shipping;

    const getCheckoutMessage = () => {
        if (!hasRx) return null;
        if (allRxApproved) return null;
        if (anyRxPending && !anyRxMissing) return 'Checkout locked — your prescription is being reviewed by our pharmacist.';
        if (anyRxMissing) return 'Checkout locked — please upload a prescription for the Rx items in your cart.';
        return 'Checkout locked — prescription approval required.';
    };

    if (loading) return (
        <div className="cart-loading"><div className="cart-spinner"></div><p>Loading cart...</p></div>
    );

    return (
        <main className="cart-page">
            <nav className="cart-breadcrumb">
                <Link to="/">Home</Link>
                <span className="material-icons bc-sep">chevron_right</span>
                <Link to="/products">Products</Link>
                <span className="material-icons bc-sep">chevron_right</span>
                <span>Cart</span>
            </nav>

            <h1 className="cart-heading">Shopping Cart</h1>

            {items.length === 0 ? (
                <div className="cart-empty">
                    <span className="material-icons" style={{ fontSize: '4rem', color: 'var(--gray-300)' }}>shopping_cart</span>
                    <p>Your cart is empty</p>
                    <Link to="/products" className="btn btn-primary">Browse Products</Link>
                </div>
            ) : (
                <div className={`cart-layout ${hasRx ? 'has-rx' : 'no-rx'}`}>
                    {/* Items */}
                    <div className="cart-items-section">
                        <div className="cart-section-card">
                            <h2 className="cart-section-title">Cart Items ({items.length})</h2>
                            <div className="cart-items-list">
                                {items.map(it => {
                                    const rxStatus = it.product?.requiresPrescription
                                        ? getRxStatusForProduct(it.product._id)
                                        : null;

                                    return (
                                        <div key={it._id} className="cart-item">
                                            <div className="cart-item-img">
                                                {it.product?.imageUrl ? (
                                                    <img src={`${SERVER_URL}${it.product.imageUrl}`} alt={it.product?.name} />
                                                ) : (
                                                    <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--gray-300)' }}>medication</span>
                                                )}
                                            </div>
                                            <div className="cart-item-info">
                                                <Link to={`/products/${it.product?._id}`} className="cart-item-name">{it.product?.name || 'Product'}</Link>
                                                <p className="cart-item-mfr">{it.product?.manufacturer}</p>
                                                {it.product?.requiresPrescription && (
                                                    <div className="cart-item-rx-row">
                                                        <span className="cart-rx-tag">Rx Required</span>
                                                        {rxStatus && (
                                                            <span className={`cart-rx-status cart-rx-status-${rxStatus.status}`}>
                                                                <span className="material-icons" style={{ fontSize: '0.85rem' }}>
                                                                    {rxStatus.status === 'approved' ? 'check_circle' :
                                                                        rxStatus.status === 'pending' ? 'schedule' :
                                                                            rxStatus.status === 'rejected' ? 'cancel' : 'upload_file'}
                                                                </span>
                                                                {rxStatus.status === 'approved' ? 'Prescription Approved' :
                                                                    rxStatus.status === 'pending' ? 'Awaiting Approval' :
                                                                        rxStatus.status === 'rejected' ? 'Prescription Rejected' : 'No Prescription'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="cart-item-qty">
                                                <button onClick={() => updateQty(it._id, it.quantity - 1)} className="cart-qty-btn">−</button>
                                                <input
                                                    type="number"
                                                    className="cart-qty-input"
                                                    value={it.quantity}
                                                    min={1}
                                                    max={it.stockQuantity || 999}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === '') return;
                                                        const num = parseInt(val, 10);
                                                        if (!isNaN(num) && num >= 1) {
                                                            updateQty(it._id, num);
                                                        }
                                                    }}
                                                    onBlur={(e) => {
                                                        const num = parseInt(e.target.value, 10);
                                                        if (isNaN(num) || num < 1) {
                                                            updateQty(it._id, 1);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') e.target.blur();
                                                    }}
                                                />
                                                <button onClick={() => updateQty(it._id, it.quantity + 1)} className="cart-qty-btn">+</button>
                                            </div>
                                            <div className="cart-item-price">₹{((it.product?.price || 0) * it.quantity).toFixed(2)}</div>
                                            <button className="cart-item-remove" onClick={() => removeItem(it._id)}>
                                                <span className="material-icons">delete_outline</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Prescription Section - only shown when cart has Rx items */}
                    {hasRx && (
                        <div className="cart-prescription-section">
                            <div className="cart-section-card">
                                <h2 className="cart-section-title">
                                    <span className="material-icons" style={{ fontSize: '1.25rem', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--primary-500)' }}>medical_information</span>
                                    Prescription
                                </h2>

                                {/* Show Rx products summary */}
                                <div className="cart-rx-products">
                                    <p className="cart-rx-info">The following items require a prescription:</p>
                                    <div className="cart-rx-product-list">
                                        {rxItems.map(it => {
                                            const st = getRxStatusForProduct(it.product._id);
                                            return (
                                                <div key={it._id} className={`cart-rx-product-item cart-rx-product-${st.status}`}>
                                                    <span className="cart-rx-product-name">{it.product?.name}</span>
                                                    <span className={`cart-rx-status-pill cart-rx-pill-${st.status}`}>
                                                        {st.status === 'approved' ? '✓ Approved' :
                                                            st.status === 'pending' ? '⏳ Pending' :
                                                                st.status === 'rejected' ? '✗ Rejected' : '— Not Uploaded'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Upload area — show if any Rx item is missing or rejected */}
                                {anyRxMissing && !showRxPicker && (
                                    <button
                                        className="cart-upload-trigger"
                                        onClick={openRxPicker}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '10px',
                                            border: '2px dashed var(--primary-300)',
                                            background: 'var(--primary-50)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '0.35rem',
                                            marginTop: '0.75rem',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span className="material-icons" style={{ fontSize: '2rem', color: 'var(--primary-400)' }}>cloud_upload</span>
                                        <span style={{ fontWeight: 600, color: 'var(--primary-600)', fontSize: '0.9rem' }}>Upload Prescription</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Select medicines & upload</span>
                                    </button>
                                )}

                                {/* Medicine selection picker */}
                                {showRxPicker && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        border: '1.5px solid var(--primary-200)',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: '#fff',
                                    }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            background: 'var(--primary-50)',
                                            borderBottom: '1px solid var(--primary-100)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gray-800)' }}>
                                                    Select Medicines for this Prescription
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px' }}>
                                                    Choose which medicines are covered by this prescription
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => { setShowRxPicker(false); setSelectedRxIds([]); }}
                                                style={{
                                                    border: 'none', background: 'none', cursor: 'pointer',
                                                    padding: '4px', borderRadius: '6px', display: 'flex',
                                                }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--gray-400)' }}>close</span>
                                            </button>
                                        </div>

                                        <div style={{ padding: '0.5rem' }}>
                                            {rxItems.map(it => {
                                                const st = getRxStatusForProduct(it.product._id);
                                                const isSelected = selectedRxIds.includes(it.product._id);
                                                const alreadyCovered = st.status === 'approved' || st.status === 'pending';

                                                return (
                                                    <label
                                                        key={it._id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            padding: '0.65rem 0.75rem',
                                                            borderRadius: '8px',
                                                            cursor: alreadyCovered ? 'default' : 'pointer',
                                                            background: isSelected ? 'var(--primary-50)' : 'transparent',
                                                            border: isSelected ? '1.5px solid var(--primary-300)' : '1.5px solid transparent',
                                                            transition: 'all 0.15s ease',
                                                            opacity: alreadyCovered ? 0.55 : 1,
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            disabled={alreadyCovered}
                                                            onChange={() => toggleRxSelection(it.product._id)}
                                                            style={{
                                                                width: 18, height: 18,
                                                                accentColor: 'var(--primary-500)',
                                                                cursor: alreadyCovered ? 'default' : 'pointer',
                                                            }}
                                                        />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--gray-800)' }}>
                                                                {it.product?.name}
                                                            </div>
                                                            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>
                                                                {it.product?.manufacturer} · Qty: {it.quantity}
                                                            </div>
                                                        </div>
                                                        {alreadyCovered && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                color: st.status === 'approved' ? '#059669' : '#d97706',
                                                                background: st.status === 'approved' ? '#ecfdf5' : '#fffbeb',
                                                                padding: '2px 8px',
                                                                borderRadius: '10px',
                                                            }}>
                                                                {st.status === 'approved' ? '✓ Covered' : '⏳ Pending'}
                                                            </span>
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>

                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderTop: '1px solid var(--gray-100)',
                                            display: 'flex',
                                            gap: '0.5rem',
                                            alignItems: 'center',
                                        }}>
                                            <button
                                                className="btn btn-primary"
                                                disabled={selectedRxIds.length === 0 || uploading}
                                                onClick={() => fileRef.current?.click()}
                                                style={{ flex: 1, fontSize: '0.85rem' }}
                                            >
                                                <span className="material-icons" style={{ fontSize: '1rem', marginRight: '0.35rem' }}>upload_file</span>
                                                {uploading ? 'Uploading...' : `Upload for ${selectedRxIds.length} medicine${selectedRxIds.length !== 1 ? 's' : ''}`}
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileRef}
                                                onChange={uploadPrescription}
                                                accept="image/*,.pdf"
                                                style={{ display: 'none' }}
                                            />
                                        </div>

                                        {selectedRxIds.length === 0 && (
                                            <div style={{
                                                padding: '0 1rem 0.75rem',
                                                fontSize: '0.75rem',
                                                color: '#d97706',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                            }}>
                                                <span className="material-icons" style={{ fontSize: '0.85rem' }}>info</span>
                                                Select at least one medicine to upload a prescription
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Show existing prescriptions */}
                                {prescriptions.length > 0 && (
                                    <div className="cart-rx-uploaded">
                                        <h3 className="cart-rx-uploaded-title">Your Prescriptions</h3>
                                        <div className="cart-rx-list">
                                            {prescriptions.filter(rx => !rx.isUsed).map(rx => (
                                                <div key={rx._id} className={`cart-rx-card cart-rx-card-${rx.status}`}>
                                                    <div className="cart-rx-card-header">
                                                        {rx.imageUrl && (
                                                            <a href={`${SERVER_URL}${rx.imageUrl}`} target="_blank" rel="noopener noreferrer" className="cart-rx-thumb">
                                                                <img src={`${SERVER_URL}${rx.imageUrl}`} alt="Prescription" />
                                                            </a>
                                                        )}
                                                        <div className="cart-rx-card-info">
                                                            <span className={`cart-rx-status-pill cart-rx-pill-${rx.status}`}>
                                                                {rx.status === 'approved' ? '✓ Approved' :
                                                                    rx.status === 'pending' ? '⏳ Pending Review' :
                                                                        '✗ Rejected'}
                                                            </span>
                                                            <span className="cart-rx-card-date">
                                                                {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {rx.items?.length > 0 && (
                                                        <div className="cart-rx-card-products">
                                                            {rx.items.map((item, i) => (
                                                                <span key={i} className="cart-rx-card-product-tag">{item.product?.name || 'Product'}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {rx.status === 'rejected' && rx.verificationNotes && (
                                                        <div className="cart-rx-reject-note">
                                                            <span className="material-icons" style={{ fontSize: '0.9rem' }}>info</span>
                                                            {rx.verificationNotes}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Status message */}
                                {anyRxPending && !anyRxMissing && (
                                    <div className="cart-rx-pending-msg">
                                        <span className="material-icons">hourglass_top</span>
                                        <p>Your prescription is being reviewed by our pharmacist. You'll be notified once approved.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="cart-summary-section">
                        <div className="cart-section-card">
                            <h2 className="cart-section-title">Order Summary</h2>
                            <div className="cart-summary-rows">
                                <div className="cart-summary-row"><span>Subtotal ({items.length} items)</span><span>₹{subtotal.toFixed(2)}</span></div>
                                <div className="cart-summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span></div>
                                <div className="cart-summary-row total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
                                {subtotal < 500 && <p className="cart-free-ship">Add ₹{(500 - subtotal).toFixed(2)} more for free shipping</p>}
                            </div>

                            {/* Checkout button — locked when Rx not approved */}
                            {getCheckoutMessage() && (
                                <div className="cart-checkout-locked-msg">
                                    <span className="material-icons">lock</span>
                                    <p>{getCheckoutMessage()}</p>
                                </div>
                            )}
                            <button
                                className={`cart-checkout-btn ${!canCheckout ? 'cart-checkout-disabled' : ''}`}
                                onClick={() => canCheckout ? navigate('/checkout') : toast.warning('Please wait for prescription approval before checkout')}
                                disabled={!canCheckout}
                            >
                                <span className="material-icons" style={{ fontSize: '1.25rem' }}>
                                    {canCheckout ? 'shopping_bag' : 'lock'}
                                </span>
                                {canCheckout ? 'Proceed to Checkout' : 'Checkout Locked'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
