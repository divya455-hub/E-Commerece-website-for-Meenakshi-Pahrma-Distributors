import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';
import './Checkout.css';

export default function Checkout() {
    const navigate = useNavigate();
    const toast = useToast();
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderType, setOrderType] = useState('delivery');
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [selectedAddressId, setSelectedAddressId] = useState('');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [placing, setPlacing] = useState(false);
    const [addressForm, setAddressForm] = useState({ type: 'home', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'India' });

    useEffect(() => {
        Promise.all([
            api.get('/cart'),
            api.get('/users/addresses')
        ]).then(([cartRes, addrRes]) => {
            const items = cartRes.data.items || cartRes.data || [];
            const addrs = addrRes.data.addresses || addrRes.data || [];
            setCartItems(items);
            setAddresses(addrs);
            if (addrs.length > 0) setSelectedAddressId(addrs[0]._id);
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const subtotal = cartItems.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0);
    const shipping = orderType === 'pickup' ? 0 : 40;
    const total = subtotal + shipping;

    const saveAddress = async () => {
        try {
            await api.post('/users/addresses', addressForm);
            const { data } = await api.get('/users/addresses');
            const addrs = data.addresses || data || [];
            setAddresses(addrs);
            if (addrs.length > 0 && !selectedAddressId) setSelectedAddressId(addrs[0]._id);
            setShowAddressModal(false);
            setAddressForm({ type: 'home', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'India' });
            toast.success('Address saved successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save address');
        }
    };

    const placeOrder = async () => {
        setPlacing(true);
        try {
            const orderData = {
                orderType,
                paymentMethod,
                addressId: orderType === 'delivery' ? selectedAddressId : undefined,
            };
            await api.post('/orders', orderData);
            toast.success('Order placed successfully!');
            navigate('/orders');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to place order');
        } finally { setPlacing(false); setShowConfirmDialog(false); }
    };

    if (loading) return <div className="co-loading"><div className="co-spinner"></div><p>Loading checkout...</p></div>;

    return (
        <main className="co-page">
            <nav className="co-breadcrumb">
                <a href="/products" className="co-bc-link"><span className="material-icons" style={{ fontSize: '1rem' }}>home</span> Shop</a>
                <span className="material-icons co-bc-sep">chevron_right</span>
                <span>Checkout</span>
            </nav>

            <div className="co-grid">
                {/* Left */}
                <div className="co-left">
                    {/* 1. Order Type */}
                    <div className="co-card">
                        <h2 className="co-step-title">1. Order Type</h2>
                        <div className="co-radio-group">
                            <label className="co-radio"><input type="radio" name="orderType" value="delivery" checked={orderType === 'delivery'} onChange={() => setOrderType('delivery')} /><span>Delivery</span></label>
                            <label className="co-radio"><input type="radio" name="orderType" value="pickup" checked={orderType === 'pickup'} onChange={() => setOrderType('pickup')} /><span>Pickup from Store</span></label>
                        </div>
                    </div>

                    {/* 2. Payment Method */}
                    <div className="co-card">
                        <h2 className="co-step-title">2. Payment Method</h2>
                        <div className="co-radio-group">
                            <label className="co-radio"><input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} /><span>Cash on Delivery</span></label>
                            <label className="co-radio"><input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} /><span>UPI</span></label>
                            <label className="co-radio"><input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} /><span>Card</span></label>
                            <label className="co-radio"><input type="radio" name="payment" value="net_banking" checked={paymentMethod === 'net_banking'} onChange={() => setPaymentMethod('net_banking')} /><span>Net Banking</span></label>
                        </div>
                    </div>

                    {/* 3. Delivery Address */}
                    {orderType === 'delivery' && (
                        <div className="co-card">
                            <h2 className="co-step-title">3. Delivery Address</h2>
                            {addresses.length === 0 ? (
                                <p className="co-no-addr">No addresses found.</p>
                            ) : (
                                <div className="co-address-list">
                                    {addresses.map(addr => (
                                        <div key={addr._id}
                                            className={`co-address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}
                                            onClick={() => setSelectedAddressId(addr._id)}>
                                            <input type="radio" name="address" checked={selectedAddressId === addr._id} onChange={() => setSelectedAddressId(addr._id)} />
                                            <div>
                                                <p className="co-addr-type">{addr.type || 'Address'}</p>
                                                <p className="co-addr-line">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button className="co-add-addr-btn" onClick={() => setShowAddressModal(true)}>
                                <span className="material-icons" style={{ fontSize: '1rem' }}>add</span> Add New Address
                            </button>
                        </div>
                    )}
                </div>

                {/* Right - Order Summary */}
                <div className="co-right">
                    <div className="co-card">
                        <h2 className="co-step-title">Order Summary</h2>
                        <div className="co-summary-items">
                            {cartItems.map(it => (
                                <div key={it.product?._id} className="co-summary-item">
                                    <div className="co-summary-item-left">
                                        <div className="co-summary-img">
                                            {it.product?.imageUrl ? (
                                                <img src={`${SERVER_URL}${it.product.imageUrl}`} alt={it.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            ) : (
                                                <span className="material-icons" style={{ fontSize: '1.5rem', color: 'var(--gray-300)' }}>medication</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="co-summary-name">{it.product?.name}</p>
                                            <p className="co-summary-qty">Qty: {it.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="co-summary-price">₹{((it.product?.price || 0) * it.quantity).toFixed(0)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="co-totals">
                            <div className="co-total-row"><span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span></div>
                            <div className="co-total-row"><span>Shipping</span><span>₹{shipping}</span></div>
                            <div className="co-total-row final"><span>Total</span><span>₹{total.toFixed(0)}</span></div>
                        </div>

                        <button className="co-place-btn" onClick={() => setShowConfirmDialog(true)}>Proceed to Confirm</button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmDialog && (
                <div className="co-modal-overlay" onClick={() => setShowConfirmDialog(false)}>
                    <div className="co-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="co-modal-title">Confirm Order Placement</h3>
                        <p className="co-modal-text">Are you sure you want to place this order?</p>
                        <div className="co-modal-actions">
                            <button className="co-modal-cancel" onClick={() => setShowConfirmDialog(false)}>Cancel</button>
                            <button className="co-modal-confirm" onClick={placeOrder} disabled={placing}>{placing ? 'Placing...' : 'Confirm'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
                <div className="co-modal-overlay" onClick={() => setShowAddressModal(false)}>
                    <div className="co-modal co-modal-lg" onClick={e => e.stopPropagation()}>
                        <h2 className="co-modal-title">Add New Address</h2>
                        <div className="co-form-grid">
                            <div className="co-form-field">
                                <label>Address Type</label>
                                <select value={addressForm.type} onChange={e => setAddressForm({ ...addressForm, type: e.target.value })}>
                                    <option value="home">Home</option>
                                    <option value="work">Work</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="co-form-field"><label>Street Address</label><input placeholder="Street, House No." value={addressForm.addressLine1} onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })} /></div>
                            <div className="co-form-field"><label>Address Line 2</label><input placeholder="Apartment, Landmark" value={addressForm.addressLine2} onChange={e => setAddressForm({ ...addressForm, addressLine2: e.target.value })} /></div>
                            <div className="co-form-row">
                                <div className="co-form-field"><label>City</label><input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
                                <div className="co-form-field"><label>State</label><input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} /></div>
                            </div>
                            <div className="co-form-row">
                                <div className="co-form-field"><label>Pin Code</label><input placeholder="6-digit PIN code" inputMode="numeric" maxLength={6} value={addressForm.zipCode} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setAddressForm({ ...addressForm, zipCode: v }); }} /></div>
                                <div className="co-form-field"><label>Country</label><input value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} /></div>
                            </div>
                        </div>
                        <div className="co-modal-actions">
                            <button className="co-modal-cancel" onClick={() => setShowAddressModal(false)}>Cancel</button>
                            <button className="co-modal-confirm" onClick={saveAddress}>Save Address</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
