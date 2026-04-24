import { useState, useEffect, useMemo, useRef } from 'react';
import api, { SERVER_URL } from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function ProductManagement() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', sku: '', category: '', manufacturer: '', requiresPrescription: false, price: '', costPrice: '', gstRate: 12, hsnCode: '', stock: '', isFeatured: false, isActive: true });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const toast = useToast();
    const fileRef = useRef(null);

    // Category form
    const [showCatForm, setShowCatForm] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', description: '' });

    // Search, filter, sort
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [rxFilter, setRxFilter] = useState(''); // '', 'rx', 'otc'
    const [sortBy, setSortBy] = useState('name-asc');

    const fetchData = () => {
        setLoading(true);
        Promise.all([
            api.get('/products?limit=500').then(({ data }) => setProducts(data.products || data)),
            api.get('/categories').then(({ data }) => setCategories(data)),
        ]).finally(() => setLoading(false));
    };
    useEffect(fetchData, []);

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const resetForm = () => {
        setForm({ name: '', description: '', sku: '', category: '', manufacturer: '', requiresPrescription: false, price: '', costPrice: '', gstRate: 12, hsnCode: '', stock: '', isFeatured: false, isActive: true });
        setEditId(null); setShowForm(false); setImageFile(null); setImagePreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const saveProduct = async () => {
        if (!form.name || !form.category || !form.manufacturer || !form.price || !form.costPrice) {
            toast.error('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name);
            fd.append('description', form.description);
            fd.append('sku', form.sku);
            fd.append('category', form.category);
            fd.append('manufacturer', form.manufacturer);
            fd.append('requiresPrescription', String(form.requiresPrescription));
            fd.append('price', String(Number(form.price)));
            fd.append('costPrice', String(Number(form.costPrice)));
            fd.append('gstRate', String(Number(form.gstRate)));
            if (form.hsnCode) fd.append('hsnCode', String(Number(form.hsnCode)));
            fd.append('stock', String(Number(form.stock || 0)));
            fd.append('isFeatured', String(form.isFeatured));
            fd.append('isActive', String(form.isActive));
            if (imageFile) fd.append('productImage', imageFile);

            if (editId) {
                await api.put(`/admin/products/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Product updated');
            } else {
                await api.post('/admin/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                toast.success('Product created');
            }
            resetForm(); fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const edit = (p) => {
        setForm({
            name: p.name, description: p.description || '', sku: p.sku || '', category: p.category?._id || p.category,
            manufacturer: p.manufacturer || '', requiresPrescription: p.requiresPrescription || false,
            price: p.price, costPrice: p.costPrice || '', gstRate: p.gstRate || 12, stock: p.stockQuantity || p.stock || 0,
            hsnCode: p.hsnCode || '', isFeatured: p.isFeatured || false, isActive: p.isActive !== false,
        });
        setImageFile(null);
        setImagePreview(p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : `${SERVER_URL}${p.imageUrl}`) : null);
        setEditId(p._id); setShowForm(true);
    };

    const del = async (id) => { if (confirm('Deactivate this product?')) { try { await api.delete(`/admin/products/${id}`); fetchData(); } catch { } } };

    const saveCat = async () => { try { await api.post('/admin/products/categories', catForm); setCatForm({ name: '', description: '' }); setShowCatForm(false); fetchData(); } catch { } };
    const delCat = async (id) => { if (confirm('Delete category?')) { try { await api.delete(`/admin/products/categories/${id}`); fetchData(); } catch { toast.error('Cannot delete — products linked'); } } };

    // Filtered & sorted products
    const filtered = useMemo(() => {
        let list = [...products];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                (p.name || '').toLowerCase().includes(q) ||
                (p.sku || '').toLowerCase().includes(q) ||
                (p.manufacturer || '').toLowerCase().includes(q)
            );
        }

        if (catFilter) {
            list = list.filter(p => (p.category?._id || p.category) === catFilter);
        }

        if (rxFilter === 'rx') list = list.filter(p => p.requiresPrescription);
        if (rxFilter === 'otc') list = list.filter(p => !p.requiresPrescription);

        const [field, dir] = sortBy.split('-');
        list.sort((a, b) => {
            if (field === 'name') {
                return dir === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
            }
            if (field === 'price') {
                return dir === 'asc' ? (a.price || 0) - (b.price || 0) : (b.price || 0) - (a.price || 0);
            }
            if (field === 'stock') {
                return dir === 'asc' ? (a.totalStock || 0) - (b.totalStock || 0) : (b.totalStock || 0) - (a.totalStock || 0);
            }
            return 0;
        });

        return list;
    }, [products, search, catFilter, rxFilter, sortBy]);

    const rxCount = products.filter(p => p.requiresPrescription).length;
    const otcCount = products.filter(p => !p.requiresPrescription).length;

    const hasActiveFilters = search || catFilter || rxFilter;

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Product Management</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCatForm(!showCatForm)}>
                        <span className="material-icons" style={{ fontSize: '1rem' }}>category</span> {showCatForm ? 'Close' : 'Add Category'}
                    </button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                        <span className="material-icons" style={{ fontSize: '1rem' }}>{showForm ? 'close' : 'add'}</span> {showForm ? 'Close' : 'Add Product'}
                    </button>
                </div>
            </div>

            {/* Category Form */}
            {showCatForm && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--gray-50)' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>New Category</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}><label className="form-label">Name</label><input className="form-input" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} /></div>
                        <div className="form-group" style={{ flex: 2, marginBottom: 0 }}><label className="form-label">Description</label><input className="form-input" value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} /></div>
                        <button className="btn btn-primary" onClick={saveCat}>Save</button>
                    </div>
                    {categories.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                            {categories.map(c => (
                                <span key={c._id} className="badge badge-blue" style={{ gap: '0.375rem', display: 'flex', alignItems: 'center' }}>
                                    {c.name}
                                    <button onClick={() => delCat(c._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                                        <span className="material-icons" style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>close</span>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Product form */}
            {showForm && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>{editId ? 'Edit Product' : 'New Product'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.name} onChange={set('name')} placeholder="Product name" /></div>
                        <div className="form-group"><label className="form-label">SKU</label><input className="form-input" value={form.sku} onChange={set('sku')} placeholder="Unique SKU code" /></div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><textarea className="form-input" value={form.description} onChange={set('description')} rows="2" placeholder="Product description" /></div>
                        <div className="form-group"><label className="form-label">Category *</label><select className="form-input" value={form.category} onChange={set('category')}><option value="">Select...</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
                        <div className="form-group"><label className="form-label">Manufacturer *</label><input className="form-input" value={form.manufacturer} onChange={set('manufacturer')} placeholder="e.g. Sun Pharma" /></div>
                        <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-input" type="number" value={form.price} onChange={set('price')} placeholder="MRP" /></div>
                        <div className="form-group"><label className="form-label">Cost Price (₹) *</label><input className="form-input" type="number" value={form.costPrice} onChange={set('costPrice')} placeholder="Purchase price" /></div>
                        <div className="form-group"><label className="form-label">GST Rate (%)</label><input className="form-input" type="number" value={form.gstRate} onChange={set('gstRate')} /></div>
                        <div className="form-group"><label className="form-label">HSN Code</label><input className="form-input" type="number" value={form.hsnCode} onChange={set('hsnCode')} placeholder="e.g. 3004" /></div>
                        <div className="form-group"><label className="form-label">Stock Quantity</label><input className="form-input" type="number" min="0" value={form.stock} onChange={set('stock')} placeholder="0" /></div>

                        {/* Image Upload */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Product Image</label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                <label style={{
                                    flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.85rem 1rem', borderRadius: '10px',
                                    border: '2px dashed var(--gray-200)', cursor: 'pointer',
                                    background: imageFile ? 'var(--primary-50)' : '#fff',
                                    transition: 'all 0.2s',
                                }}>
                                    <span className="material-icons" style={{ color: imageFile ? 'var(--primary-500)' : 'var(--gray-400)', fontSize: '1.5rem' }}>
                                        {imageFile ? 'check_circle' : 'add_photo_alternate'}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{imageFile ? imageFile.name : 'Click to upload image'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>JPG, PNG, WebP · Max 5MB</div>
                                    </div>
                                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} style={{ display: 'none' }} />
                                </label>
                                {imagePreview && (
                                    <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--gray-200)', flexShrink: 0 }}>
                                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <button
                                            onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                                            style={{
                                                position: 'absolute', top: 2, right: 2, width: 20, height: 20,
                                                background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                            }}
                                        >
                                            <span className="material-icons" style={{ fontSize: '0.7rem', color: '#fff' }}>close</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '2rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={form.requiresPrescription} onChange={set('requiresPrescription')} id="rxReq" />
                                <label htmlFor="rxReq" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Requires Prescription (Rx)</label>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} id="featured" />
                                <label htmlFor="featured" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Featured Product</label>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} id="active" />
                                <label htmlFor="active" style={{ fontWeight: 500, fontSize: '0.88rem' }}>Active</label>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={saveProduct} disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Product' : 'Create Product'}</button>
                        <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Search + Filters Row */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1rem',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
                    <span className="material-icons" style={{
                        position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--gray-400)', fontSize: '1.2rem', pointerEvents: 'none',
                    }}>search</span>
                    <input
                        className="form-input"
                        placeholder="Search by name, SKU, or manufacturer..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>

                {/* Category filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons" style={{ color: 'var(--gray-400)', fontSize: '1.1rem' }}>category</span>
                    <select
                        className="form-input"
                        value={catFilter}
                        onChange={e => setCatFilter(e.target.value)}
                        style={{ minWidth: 150, fontSize: '0.85rem' }}
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* Rx filter chips */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                        { key: '', label: 'All', count: products.length },
                        { key: 'rx', label: 'Rx', count: rxCount },
                        { key: 'otc', label: 'OTC', count: otcCount },
                    ].map(r => (
                        <button
                            key={r.key}
                            onClick={() => setRxFilter(r.key)}
                            style={{
                                padding: '0.4rem 0.85rem',
                                borderRadius: '20px',
                                border: '1.5px solid',
                                borderColor: rxFilter === r.key ? (r.key === 'rx' ? '#ef4444' : r.key === 'otc' ? '#059669' : '#3b82f6') : 'var(--gray-200)',
                                background: rxFilter === r.key ? (r.key === 'rx' ? '#fef2f2' : r.key === 'otc' ? '#ecfdf5' : '#eff6ff') : '#fff',
                                color: rxFilter === r.key ? (r.key === 'rx' ? '#991b1b' : r.key === 'otc' ? '#065f46' : '#1e40af') : 'var(--gray-600)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                            }}
                        >
                            {r.label}
                            <span style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                opacity: 0.7,
                            }}>({r.count})</span>
                        </button>
                    ))}
                </div>

                {/* Sort */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span className="material-icons" style={{ color: 'var(--gray-400)', fontSize: '1.1rem' }}>sort</span>
                    <select
                        className="form-input"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{ minWidth: 155, fontSize: '0.85rem' }}
                    >
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="stock-asc">Stock: Low → High</option>
                        <option value="stock-desc">Stock: High → Low</option>
                    </select>
                </div>
            </div>

            {/* Result count */}
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                Showing {filtered.length} of {products.length} products
                {search && <> matching "<strong>{search}</strong>"</>}
                {catFilter && <> · Category: <strong>{categories.find(c => c._id === catFilter)?.name}</strong></>}
                {rxFilter && <> · Type: <strong>{rxFilter === 'rx' ? 'Prescription' : 'OTC'}</strong></>}
            </div>

            {/* Table */}
            {loading ? <div className="loader"><div className="spinner" /></div> : filtered.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons">search_off</span>
                    <p>{products.length === 0 ? 'No products added yet' : 'No products match your filters'}</p>
                    {hasActiveFilters && (
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => { setSearch(''); setCatFilter(''); setRxFilter(''); }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Rx</th><th>Stock</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '8px', overflow: 'hidden', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--gray-100)' }}>
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${SERVER_URL}${p.imageUrl}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span className="material-icons" style={{ fontSize: '1.2rem', color: 'var(--gray-300)' }}>medication</span>
                                                )}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{p.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{p.manufacturer}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><code style={{ fontSize: '0.8rem' }}>{p.sku}</code></td>
                                    <td>{p.category?.name || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>₹{p.price?.toFixed(2)}</td>
                                    <td>{p.requiresPrescription ? <span className="badge badge-red">Rx</span> : <span className="badge badge-green">OTC</span>}</td>
                                    <td>
                                        <span style={{ fontWeight: 600, color: (p.stockQuantity || 0) === 0 ? '#ef4444' : (p.stockQuantity || 0) < 10 ? '#f59e0b' : 'var(--gray-800)' }}>
                                            {p.stockQuantity || 0}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="header-icon-btn" onClick={() => edit(p)} title="Edit"><span className="material-icons" style={{ fontSize: '1.1rem' }}>edit</span></button>
                                            <button className="header-icon-btn" onClick={() => del(p._id)} title="Deactivate"><span className="material-icons" style={{ fontSize: '1.1rem', color: 'var(--danger)' }}>delete</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
