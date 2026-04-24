import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../../api/api';

const statusFilters = [
    { key: '', label: 'All', icon: 'inventory_2', bg: '#334155', color: '#fff' },
    { key: 'normal', label: 'Normal', icon: 'check_circle', bg: '#dcfce7', color: '#166534' },
    { key: 'low', label: 'Low Stock', icon: 'warning', bg: '#fef3c7', color: '#92400e' },
    { key: 'out_of_stock', label: 'Out of Stock', icon: 'remove_circle', bg: '#fee2e2', color: '#991b1b' },
    { key: 'expiring_soon', label: 'Expiring Soon', icon: 'schedule', bg: '#fef3c7', color: '#92400e' },
    { key: 'expired', label: 'Expired', icon: 'dangerous', bg: '#fee2e2', color: '#991b1b' },
];

const sortOptions = [
    { key: 'name-asc', label: 'Name A–Z' },
    { key: 'name-desc', label: 'Name Z–A' },
    { key: 'stock-asc', label: 'Stock: Low → High' },
    { key: 'stock-desc', label: 'Stock: High → Low' },
    { key: 'expiry-asc', label: 'Expiry: Soonest' },
];

export default function InventoryManagement() {
    const [summary, setSummary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ product: '', batchNumber: '', quantityInStock: '', expiryDate: '', costPrice: '', sellingPrice: '', lowStockThreshold: 10 });
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [saving, setSaving] = useState(false);

    // Filters & search (for the table)
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('name-asc');

    // Searchable product dropdown state
    const [productSearch, setProductSearch] = useState('');
    const [productCatFilter, setProductCatFilter] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const fetchData = () => {
        setLoading(true);
        api.get('/admin/inventory/summary').then(({ data }) => setSummary(data)).catch(() => { }).finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchData();
        api.get('/products?limit=500').then(({ data }) => setProducts(data.products || data)).catch(() => { });
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => { });
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowProductDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    // Filtered products for the dropdown
    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (productCatFilter) {
            list = list.filter(p => (p.category?._id || p.category) === productCatFilter);
        }
        if (productSearch.trim()) {
            const q = productSearch.toLowerCase();
            list = list.filter(p => (p.name || '').toLowerCase().includes(q) || (p.manufacturer || '').toLowerCase().includes(q));
        }
        return list;
    }, [products, productSearch, productCatFilter]);

    const selectedProduct = products.find(p => p._id === form.product);

    const selectProduct = (p) => {
        setForm({ ...form, product: p._id });
        setProductSearch('');
        setShowProductDropdown(false);
    };

    const clearProduct = () => {
        setForm({ ...form, product: '' });
        setProductSearch('');
    };

    const save = async () => {
        setSaving(true);
        try {
            await api.post('/admin/inventory', { ...form, quantityInStock: Number(form.quantityInStock), costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), lowStockThreshold: Number(form.lowStockThreshold) });
            setForm({ product: '', batchNumber: '', quantityInStock: '', expiryDate: '', costPrice: '', sellingPrice: '', lowStockThreshold: 10 });
            setProductSearch(''); setProductCatFilter('');
            setShowForm(false); fetchData();
        } catch { } finally { setSaving(false); }
    };

    // Filter + search + sort (for inventory table)
    const filtered = useMemo(() => {
        let list = [...summary];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(s => {
                const name = (s.productName || s.product?.name || '').toLowerCase();
                return name.includes(q);
            });
        }
        if (statusFilter) {
            list = list.filter(s => s.status === statusFilter);
        }
        const [field, dir] = sortBy.split('-');
        list.sort((a, b) => {
            if (field === 'name') {
                const nameA = (a.productName || a.product?.name || '').toLowerCase();
                const nameB = (b.productName || b.product?.name || '').toLowerCase();
                return dir === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            }
            if (field === 'stock') return dir === 'asc' ? a.totalStock - b.totalStock : b.totalStock - a.totalStock;
            if (field === 'expiry') {
                const dA = a.nearestExpiry ? new Date(a.nearestExpiry).getTime() : Infinity;
                const dB = b.nearestExpiry ? new Date(b.nearestExpiry).getTime() : Infinity;
                return dA - dB;
            }
            return 0;
        });
        return list;
    }, [summary, search, statusFilter, sortBy]);

    const getCount = (key) => {
        if (!key) return summary.length;
        return summary.filter(s => s.status === key).length;
    };

    const statusStyles = { normal: 'badge-green', low: 'badge-yellow', out_of_stock: 'badge-red', expired: 'badge-red', expiring_soon: 'badge-yellow' };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>Inventory Management</h1>
            </div>

            {/* Status Filter Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '0.6rem',
                marginBottom: '1rem',
            }}>
                {statusFilters.map(c => {
                    const active = statusFilter === c.key;
                    return (
                        <div
                            key={c.key}
                            onClick={() => setStatusFilter(c.key)}
                            style={{
                                background: c.bg,
                                color: c.color,
                                padding: '0.75rem 0.9rem',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                                transform: active ? 'scale(1.03)' : 'scale(1)',
                                boxShadow: active
                                    ? '0 4px 14px rgba(0,0,0,0.2), inset 0 0 0 2px rgba(255,255,255,0.4)'
                                    : '0 1px 4px rgba(0,0,0,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                userSelect: 'none',
                                opacity: active ? 1 : 0.85,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="material-icons" style={{ fontSize: '1.2rem', opacity: 0.9 }}>{c.icon}</span>
                                <span style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1 }}>{getCount(c.key)}</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.9 }}>{c.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Search Bar + Sort */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.25rem',
                alignItems: 'center',
            }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <span className="material-icons" style={{
                        position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        color: 'var(--gray-400)', fontSize: '1.2rem', pointerEvents: 'none',
                    }}>search</span>
                    <input
                        className="form-input"
                        placeholder="Search products by name..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: '2.5rem', width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="material-icons" style={{ color: 'var(--gray-400)', fontSize: '1.2rem' }}>sort</span>
                    <select
                        className="form-input"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{ minWidth: 170, fontSize: '0.85rem' }}
                    >
                        {sortOptions.map(o => (
                            <option key={o.key} value={o.key}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '0.5rem' }}>
                Showing {filtered.length} of {summary.length} products
                {search && <> matching "<strong>{search}</strong>"</>}
                {statusFilter && <> · Status: <strong style={{ textTransform: 'capitalize' }}>{statusFilter.replace('_', ' ')}</strong></>}
            </div>

            {/* Table */}
            {loading ? <div className="loader"><div className="spinner" /></div> : filtered.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons">search_off</span>
                    <p>{summary.length === 0 ? 'No inventory data' : 'No products match your filters'}</p>
                    {(search || statusFilter) && (
                        <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => { setSearch(''); setStatusFilter(''); }}>
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead><tr><th>Product</th><th>Total Stock</th><th>Batches</th><th>Nearest Expiry</th><th>Status</th></tr></thead>
                        <tbody>
                            {filtered.map(s => {
                                const isWarning = s.status === 'low' || s.status === 'expiring_soon';
                                const isDanger = s.status === 'out_of_stock' || s.status === 'expired';
                                return (
                                    <tr key={s._id || s.product?._id} style={{
                                        background: isDanger ? '#fef2f2' : isWarning ? '#fffbeb' : undefined,
                                    }}>
                                        <td style={{ fontWeight: 500 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {isDanger && <span className="material-icons" style={{ fontSize: '1rem', color: '#ef4444' }}>error</span>}
                                                {isWarning && <span className="material-icons" style={{ fontSize: '1rem', color: '#f59e0b' }}>warning</span>}
                                                {s.productName || s.product?.name || '—'}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontWeight: 700,
                                                color: isDanger ? '#ef4444' : isWarning ? '#d97706' : 'var(--gray-800)',
                                            }}>{s.totalStock}</span>
                                        </td>
                                        <td>{s.batchCount || s.batches || '—'}</td>
                                        <td>{s.nearestExpiry ? new Date(s.nearestExpiry).toLocaleDateString('en-IN') : '—'}</td>
                                        <td><span className={`badge ${statusStyles[s.status] || 'badge-gray'}`}>{(s.status || 'unknown').replace('_', ' ')}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
