import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { useToast } from '../context/ToastContext';
import './Profile.css';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('personal');
    const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', date_of_birth: '', gender: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Address state
    const [addresses, setAddresses] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [addressForm, setAddressForm] = useState({ type: 'home', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false });

    // Security state
    const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Orders & Prescriptions
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [prescriptions, setPrescriptions] = useState([]);
    const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
    const [prescriptionPage, setPrescriptionPage] = useState(1);
    const prescriptionPageSize = 5;
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        if (user) {
            setProfileForm({ first_name: user.firstName || '', last_name: user.lastName || '', email: user.email || '', phone_number: user.phone || '', date_of_birth: '', gender: '' });
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'address') loadAddresses();
        if (activeTab === 'orders') loadOrders();
        if (activeTab === 'prescriptions') loadPrescriptions();
    }, [activeTab]);

    const loadAddresses = () => { api.get('/users/addresses').then(({ data }) => setAddresses(data.addresses || data || [])).catch(() => { }); };
    const loadOrders = () => { setIsLoadingOrders(true); api.get('/orders').then(({ data }) => setOrders(data.orders || data || [])).catch(() => { }).finally(() => setIsLoadingOrders(false)); };
    const loadPrescriptions = () => { setIsLoadingPrescriptions(true); api.get('/prescriptions').then(({ data }) => setPrescriptions(data.prescriptions || data || [])).catch(() => { }).finally(() => setIsLoadingPrescriptions(false)); };

    const updateProfile = async (e) => {
        e.preventDefault(); setIsSaving(true);
        try { await api.put('/auth/profile', profileForm); toast.success('Profile updated'); } catch { toast.error('Failed to update profile'); }
        finally { setIsSaving(false); }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) return toast.warning('Passwords do not match');
        setIsChangingPassword(true);
        try { await api.put('/auth/change-password', passwordForm); toast.success('Password updated'); setPasswordForm({ current_password: '', new_password: '', confirm_password: '' }); }
        catch { toast.error('Failed to change password'); } finally { setIsChangingPassword(false); }
    };

    const openAddressModal = (addr) => { setEditingAddress(addr || null); setAddressForm(addr ? { type: addr.type || 'home', addressLine1: addr.addressLine1 || '', addressLine2: addr.addressLine2 || '', city: addr.city || '', state: addr.state || '', zipCode: addr.zipCode || '', country: addr.country || 'India', isDefault: addr.isDefault || false } : { type: 'home', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'India', isDefault: false }); setShowAddressModal(true); };

    const saveAddress = async (e) => {
        e.preventDefault();
        if (!/^\d{6}$/.test(addressForm.zipCode)) { toast.error('PIN code must be exactly 6 digits'); return; }
        setIsSavingAddress(true);
        try {
            if (editingAddress) await api.put(`/users/addresses/${editingAddress._id}`, addressForm);
            else await api.post('/users/addresses', addressForm);
            loadAddresses(); setShowAddressModal(false);
            toast.success('Address saved');
        } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save address'); } finally { setIsSavingAddress(false); }
    };

    const deleteAddress = async (id) => { if (confirm('Delete this address?')) { try { await api.delete(`/users/addresses/${id}`); loadAddresses(); toast.success('Address deleted'); } catch { toast.error('Failed to delete address'); } } };

    const doLogout = () => { logout(); navigate('/auth/login'); };

    const totalPrescriptionPages = Math.ceil(prescriptions.length / prescriptionPageSize);
    const pagedPrescriptions = prescriptions.slice((prescriptionPage - 1) * prescriptionPageSize, prescriptionPage * prescriptionPageSize);

    const tabs = [
        { key: 'personal', icon: 'account_circle', label: 'Personal Information' },
        { key: 'address', icon: 'menu_book', label: 'Address Book' },
        { key: 'orders', icon: 'shopping_bag', label: 'Order History' },
        { key: 'security', icon: 'shield', label: 'Security & Login' },
    ];

    return (
        <main className="prof-page">
            <h1 className="prof-heading">My Profile</h1>
            <div className="prof-layout">
                {/* Sidebar */}
                <div className="prof-sidebar">
                    {tabs.map(t => (
                        <button key={t.key} className={`prof-nav-item ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                            <span className="material-icons prof-nav-icon">{t.icon}</span><span>{t.label}</span>
                        </button>
                    ))}
                    <button className="prof-nav-item prof-logout" onClick={doLogout}>
                        <span className="material-icons prof-nav-icon">logout</span><span>Logout</span>
                    </button>
                </div>

                {/* Content */}
                <div className="prof-content">
                    {/* Personal */}
                    {activeTab === 'personal' && (
                        <div className="prof-card">
                            <h2 className="prof-card-title">Personal Information</h2>
                            <div className="prof-avatar-row">
                                <div className="prof-avatar"><span className="material-icons" style={{ fontSize: '3rem', color: 'var(--gray-400)' }}>account_circle</span></div>
                                <div>
                                    <h3 className="prof-name">{user?.firstName} {user?.lastName}</h3>
                                    <p className="prof-email">{user?.email}</p>
                                    <p className="prof-phone">{user?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            <form onSubmit={updateProfile} className="prof-form-grid">
                                <div className="prof-field"><label>First Name</label><input value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} /></div>
                                <div className="prof-field"><label>Last Name</label><input value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} /></div>
                                <div className="prof-field"><label>Email Address</label><input value={profileForm.email} disabled className="disabled" /></div>
                                <div className="prof-field"><label>Phone Number</label><input value={profileForm.phone_number} onChange={e => setProfileForm({ ...profileForm, phone_number: e.target.value })} /></div>
                                <div className="prof-field"><label>Date of Birth</label><input type="date" value={profileForm.date_of_birth} onChange={e => setProfileForm({ ...profileForm, date_of_birth: e.target.value })} /></div>
                                <div className="prof-field"><label>Gender</label><select value={profileForm.gender} onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}><option value="">Select Gender</option><option value="female">Female</option><option value="male">Male</option><option value="other">Other</option></select></div>
                                <div className="prof-field-full"><button type="submit" className="prof-save-btn" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button></div>
                            </form>
                        </div>
                    )}

                    {/* Addresses */}
                    {activeTab === 'address' && (
                        <div className="prof-card">
                            <div className="prof-card-header">
                                <h2 className="prof-card-title">Address Book</h2>
                                <button className="prof-add-btn" onClick={() => openAddressModal()}>
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>add</span> Add New Address
                                </button>
                            </div>
                            {addresses.length === 0 ? (
                                <p className="prof-empty">No addresses found. Add your first address.</p>
                            ) : (
                                <div className="prof-addr-list">
                                    {addresses.map(addr => (
                                        <div key={addr._id} className="prof-addr-card">
                                            <div className="prof-addr-top">
                                                <div><span className="prof-addr-type">{addr.type || 'Address'}</span>{addr.isDefault && <span className="prof-default-badge">Default</span>}</div>
                                                <div className="prof-addr-actions">
                                                    <button onClick={() => openAddressModal(addr)} className="prof-addr-edit"><span className="material-icons" style={{ fontSize: '1rem' }}>edit</span> Edit</button>
                                                    <button onClick={() => deleteAddress(addr._id)} className="prof-addr-delete"><span className="material-icons" style={{ fontSize: '1rem' }}>delete</span> Delete</button>
                                                </div>
                                            </div>
                                            <p className="prof-addr-line">{addr.addressLine1} {addr.addressLine2}</p>
                                            <p className="prof-addr-line">{addr.city}, {addr.state} {addr.zipCode}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Orders */}
                    {activeTab === 'orders' && (
                        <div className="prof-card">
                            <h2 className="prof-card-title">Order History</h2>
                            {isLoadingOrders ? (
                                <div className="prof-loading"><div className="prof-spinner"></div><p>Loading orders...</p></div>
                            ) : orders.length === 0 ? (
                                <p className="prof-empty">No orders found.</p>
                            ) : (
                                <>
                                    <div className="prof-orders-list">
                                        {orders.slice(0, 5).map(order => (
                                            <div key={order._id} className="prof-order-card">
                                                <div className="prof-order-top"><span className="prof-order-id">Order #{order.orderNumber || order._id?.slice(-6)}</span><span className="prof-order-date">{new Date(order.createdAt).toLocaleDateString()}</span></div>
                                                <p>Total: Rs {(order.totalAmount || 0).toFixed(2)}</p>
                                                <div className="prof-order-bottom">
                                                    <span className={`prof-status-badge ${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'blue'}`}>{order.status}</span>
                                                    <Link to={`/orders/${order._id}`} className="prof-view-link">View Details</Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="prof-center-link"><Link to="/orders" className="prof-view-all-btn">View All Orders</Link></div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === 'security' && (
                        <div className="prof-card">
                            <h2 className="prof-card-title">Security & Login</h2>
                            <h3 className="prof-sub-title">Change Password</h3>
                            <form onSubmit={changePassword}>
                                <div className="prof-field-stack">
                                    <div className="prof-field"><label>Current Password</label><input type="password" value={passwordForm.current_password} onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })} /></div>
                                    <div className="prof-field"><label>New Password</label><input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })} /></div>
                                    <div className="prof-field"><label>Confirm New Password</label><input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} /></div>
                                </div>
                                <button type="submit" className="prof-save-btn" disabled={isChangingPassword}>{isChangingPassword ? 'Updating...' : 'Update Password'}</button>
                            </form>
                        </div>
                    )}


                </div>
            </div>

            {/* Address Modal */}
            {showAddressModal && (
                <div className="prof-modal-overlay" onClick={() => setShowAddressModal(false)}>
                    <div className="prof-modal" onClick={e => e.stopPropagation()}>
                        <div className="prof-modal-header">
                            <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                            <button onClick={() => setShowAddressModal(false)} className="prof-modal-close">&times;</button>
                        </div>
                        <form onSubmit={saveAddress}>
                            <div className="prof-field"><label>Address Type *</label><select value={addressForm.type} onChange={e => setAddressForm({ ...addressForm, type: e.target.value })}><option value="home">Home</option><option value="work">Work</option><option value="other">Other</option></select></div>
                            <div className="prof-field"><label>Street Address *</label><input placeholder="Street address" value={addressForm.addressLine1} onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })} /></div>
                            <div className="prof-field"><label>Address Line 2</label><input placeholder="Apartment, suite, etc." value={addressForm.addressLine2} onChange={e => setAddressForm({ ...addressForm, addressLine2: e.target.value })} /></div>
                            <div className="prof-form-row">
                                <div className="prof-field"><label>City *</label><input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} /></div>
                                <div className="prof-field"><label>State *</label><input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} /></div>
                            </div>
                            <div className="prof-form-row">
                                <div className="prof-field"><label>PIN Code *</label><input value={addressForm.zipCode} inputMode="numeric" maxLength={6} placeholder="6-digit PIN code" onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setAddressForm({ ...addressForm, zipCode: v }); }} /></div>
                                <div className="prof-field"><label>Country *</label><input value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} /></div>
                            </div>
                            <label className="prof-checkbox"><input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} /> Set as default address</label>
                            <div className="prof-modal-actions">
                                <button type="button" onClick={() => setShowAddressModal(false)} className="prof-modal-cancel">Cancel</button>
                                <button type="submit" className="prof-modal-save" disabled={isSavingAddress}>{isSavingAddress ? 'Saving...' : 'Save Address'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Prescription View Modal */}
            {showPrescriptionModal && selectedPrescription && (
                <div className="prof-modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
                    <div className="prof-modal prof-modal-img" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowPrescriptionModal(false)} className="prof-modal-close-abs">&times;</button>
                        {selectedPrescription.imageUrl ? (
                            <img src={selectedPrescription.imageUrl} alt="Prescription" className="prof-rx-image" />
                        ) : (
                            <div className="prof-rx-placeholder"><span className="material-icons" style={{ fontSize: '4rem', color: 'var(--gray-300)' }}>description</span><p>No image available</p></div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
