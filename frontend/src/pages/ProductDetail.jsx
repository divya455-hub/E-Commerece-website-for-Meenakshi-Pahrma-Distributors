import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';
import './ProductDetail.css';

export default function ProductDetail() {
    const { id } = useParams();
    const toast = useToast();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('description');
    const [qty, setQty] = useState(1);
    const [similar, setSimilar] = useState([]);

    useEffect(() => {
        setLoading(true);
        api.get(`/products/${id}`)
            .then(({ data }) => {
                setProduct(data);
                if (data.category?._id || data.category) {
                    api.get(`/products?category=${data.category?._id || data.category}&limit=4`)
                        .then(({ data: d }) => setSimilar((d.products || d || []).filter(p => p._id !== id).slice(0, 4)))
                        .catch(() => { });
                }
            })
            .catch(() => setProduct(null))
            .finally(() => setLoading(false));
    }, [id]);

    const addToCart = async () => {
        try {
            await api.post('/cart', { productId: product._id, quantity: qty });
            toast.success(`${product.name} added to cart`);
        } catch (err) {
            if (err.response?.status === 401) {
                toast.error('Please login to add items to cart');
            } else {
                toast.error(err.response?.data?.message || 'Failed to add to cart');
            }
        }
    };

    if (loading) return (
        <div className="pd-loading">
            <div className="pd-spinner"></div>
            <p>Loading product details...</p>
        </div>
    );

    if (!product) return (
        <div className="pd-empty">
            <span className="material-icons" style={{ fontSize: '4rem', color: 'var(--gray-300)' }}>error_outline</span>
            <p>Product not found</p>
            <Link to="/products" className="btn btn-primary">Browse Products</Link>
        </div>
    );

    const tabs = [
        { key: 'description', label: 'Description' },
        { key: 'composition', label: 'Composition' },
        { key: 'sideEffects', label: 'Side Effects' },
        { key: 'safety', label: 'Safety Information' },
    ];

    return (
        <main className="pd-page">
            {/* Breadcrumb */}
            <nav className="pd-breadcrumb">
                <Link to="/">Home</Link>
                <span className="material-icons pd-bc-sep">chevron_right</span>
                <Link to="/products">Products</Link>
                <span className="material-icons pd-bc-sep">chevron_right</span>
                <span>{product.name}</span>
            </nav>

            <div className="pd-main">
                {/* Image */}
                <div className="pd-image-section">
                    <div className="pd-image-box">
                        {product.requiresPrescription && <span className="pd-rx-badge">Rx Required</span>}
                        {product.imageUrl ? (
                            <img src={`${SERVER_URL}${product.imageUrl}`} alt={product.name} className="pd-image" />
                        ) : (
                            <span className="material-icons pd-image-icon">medication</span>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="pd-info-section">
                    <h1 className="pd-title">{product.name}</h1>
                    <p className="pd-manufacturer">by {product.manufacturer || 'Unknown Manufacturer'}</p>

                    <div className="pd-price-box">
                        <span className="pd-price">₹{product.price?.toFixed(2)}</span>
                        {(() => {
                            const s = product.stockQuantity ?? product.stock ?? 0;
                            if (s === 0) return (
                                <span className="pd-stock" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>cancel</span> Out of Stock
                                </span>
                            );
                            if (s < 10) return (
                                <span className="pd-stock" style={{ background: '#fffbeb', color: '#d97706' }}>
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>warning</span> Only {s} left
                                </span>
                            );
                            return (
                                <span className="pd-stock pd-in-stock">
                                    <span className="material-icons" style={{ fontSize: '1rem' }}>check_circle</span> In Stock ({s})
                                </span>
                            );
                        })()}
                    </div>

                    {product.nearestExpiry && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--gray-500)', margin: '0.25rem 0 0.75rem' }}>
                            <span className="material-icons" style={{ fontSize: '0.9rem', verticalAlign: 'middle', marginRight: '0.25rem' }}>event</span>
                            Expiry: {new Date(product.nearestExpiry).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </p>
                    )}

                    <p className="pd-short-desc">{product.description?.substring(0, 150)}</p>

                    <div className="pd-actions">
                        <div className="pd-qty">
                            <button onClick={() => setQty(Math.max(1, qty - 1))} className="pd-qty-btn">−</button>
                            <span className="pd-qty-val">{qty}</span>
                            <button onClick={() => setQty(qty + 1)} className="pd-qty-btn">+</button>
                        </div>
                        <button className="pd-add-btn" onClick={addToCart} disabled={(product.stockQuantity ?? product.stock ?? 0) === 0} style={(product.stockQuantity ?? product.stock ?? 0) === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                            <span className="material-icons" style={{ fontSize: '1.25rem' }}>shopping_cart</span> {(product.stockQuantity ?? product.stock ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                    </div>

                    {product.requiresPrescription && (
                        <div className="pd-rx-notice">
                            <span className="material-icons">info</span>
                            This product requires a valid prescription. Please upload your prescription before checkout.
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="pd-tabs-section">
                <div className="pd-tab-bar">
                    {tabs.map(t => (
                        <button key={t.key} className={`pd-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>{t.label}</button>
                    ))}
                </div>
                <div className="pd-tab-content">
                    {activeTab === 'description' && <p>{product.description || 'No description available'}</p>}
                    {activeTab === 'composition' && <p>{product.composition || 'Composition information not available'}</p>}
                    {activeTab === 'sideEffects' && <p>{product.sideEffects || 'Side effects information not available. Please consult your doctor.'}</p>}
                    {activeTab === 'safety' && (
                        <div>
                            <p><strong>Storage:</strong> Store in a cool dry place. Keep away from direct sunlight.</p>
                            <p><strong>Dosage:</strong> As directed by the physician.</p>
                            <p><strong>Disclaimer:</strong> This information is for educational purposes only. Consult your doctor before taking any medication.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Similar Products */}
            {similar.length > 0 && (
                <section className="pd-similar">
                    <h2 className="pd-similar-title">Similar Products</h2>
                    <div className="pd-similar-grid">
                        {similar.map(p => (
                            <Link to={`/products/${p._id}`} key={p._id} className="pd-similar-card">
                                <div className="pd-similar-img">
                                    <span className="material-icons" style={{ fontSize: '2rem', color: 'var(--gray-300)' }}>medication</span>
                                </div>
                                <div className="pd-similar-body">
                                    <p className="pd-similar-name">{p.name}</p>
                                    <p className="pd-similar-price">₹{p.price?.toFixed(2)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
