import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { SERVER_URL } from '../api/api';
import './Home.css';

export default function Home() {
    const { user, isCustomer } = useAuth();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [featured, setFeatured] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => { });
        api.get('/products?limit=6').then(({ data }) => setFeatured(data.products || data)).catch(() => { });
    }, []);

    useEffect(() => {
        if (featured.length <= 1) return;
        const timer = setInterval(() => setCurrentSlide(p => (p + 1) % featured.length), 4000);
        return () => clearInterval(timer);
    }, [featured.length]);

    const handleSearch = async (q) => {
        setSearchQuery(q);
        if (q.trim().length < 2) { setShowResults(false); return; }
        setShowResults(true);
        try {
            const { data } = await api.get(`/products?search=${q}&limit=5`);
            setSearchResults(data.products || data);
        } catch { setSearchResults([]); }
    };

    const addToCart = async (productId) => {
        if (!user) { navigate('/auth/login'); return; }
        try {
            await api.post('/cart', { productId, quantity: 1 });
            navigate('/cart');
        } catch { }
    };

    const howItWorks = [
        { icon: 'search', title: 'Search Medicine', desc: 'Search for your prescribed or OTC medicines' },
        { icon: 'fact_check', title: 'Upload Prescription', desc: 'Upload your prescription for Rx medicines' },
        { icon: 'shopping_cart', title: 'Place Order', desc: 'Add to cart and complete checkout' },
        { icon: 'local_shipping', title: 'Fast Delivery', desc: 'Get medicines delivered to your doorstep' },
    ];

    const faqItems = [
        { q: 'How do I order medicines online?', a: 'Simply search for your medicine, add it to cart, upload prescription if required, and complete checkout.' },
        { q: 'Do I need a prescription?', a: 'Prescription medicines require a valid prescription. OTC medicines can be ordered without one.' },
        { q: 'What are the delivery charges?', a: 'Delivery is free for orders above ₹500. A flat ₹40 fee applies for smaller orders.' },
        { q: 'How can I track my order?', a: 'Go to Orders section in your profile to track real-time status of all your orders.' },
    ];

    const [openFaq, setOpenFaq] = useState(-1);

    return (
        <div className="home">
            {/* Hero */}
            <section className="hero">
                <div className="hero-overlay" />
                <div className="hero-content">
                    <h1>Your Health, Our Priority</h1>
                    <p>Get your medications delivered safely and quickly to your doorstep. Manage your prescriptions and orders with ease.</p>
                    <div className="hero-search">
                        <input
                            type="text"
                            placeholder="Search for medicines, health products..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onBlur={() => setTimeout(() => setShowResults(false), 200)}
                        />
                        <span className="material-icons">search</span>
                        {showResults && (
                            <div className="search-dropdown">
                                {searchResults.length > 0 ? searchResults.map(p => (
                                    <Link key={p._id} to={`/products/${p._id}`} className="search-item">
                                        <div>
                                            <div className="search-item-name">{p.name}</div>
                                            <div className="search-item-mfg">{p.manufacturer}</div>
                                        </div>
                                        <span className="search-item-price">₹{p.price}</span>
                                    </Link>
                                )) : <div className="search-empty">No products found</div>}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <div className="container">
                    <div className="features-grid">
                        {[
                            { icon: 'verified', title: 'Genuine Medicines', desc: '100% authentic medicines from trusted manufacturers', color: 'var(--primary-100)', iconColor: 'var(--primary-600)' },
                            { icon: 'schedule', title: 'Fast Delivery', desc: 'Quick doorstep delivery within 24 hours', color: '#d1fae5', iconColor: '#059669' },
                            { icon: 'shield', title: 'Secure & Safe', desc: 'Your health data is protected and secure', color: '#ede9fe', iconColor: '#7c3aed' },
                        ].map(f => (
                            <div key={f.title} className="feature-card">
                                <div className="feature-icon" style={{ background: f.color }}><span className="material-icons" style={{ color: f.iconColor }}>{f.icon}</span></div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="categories-section">
                    <div className="container">
                        <div className="section-header">
                            <h2 className="section-title">Shop by Category</h2>
                            <Link to="/products" className="view-all-link">View All <span className="material-icons">chevron_right</span></Link>
                        </div>
                        <div className="categories-grid">
                            {categories.map(cat => (
                                <Link key={cat._id} to={`/products?category=${cat._id}`} className="category-card">
                                    <div className="category-icon"><span className="material-icons">medication</span></div>
                                    <span>{cat.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Featured Products Carousel */}
            {featured.length > 0 && (
                <section className="featured-section">
                    <div className="container">
                        <h2 className="section-title">Featured Products</h2>
                        <div className="carousel">
                            <div className="carousel-track">
                                {featured.map((product, i) => (
                                    <div key={product._id} className={`carousel-slide ${i === currentSlide ? 'active' : ''}`}>
                                        <div className="carousel-card">
                                            {product.requiresPrescription && <span className="rx-badge">Rx</span>}
                                            <div className="carousel-card-body">
                                                <div className="carousel-img">
                                                    {product.imageUrl ? (
                                                        <img src={`${SERVER_URL}${product.imageUrl}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    ) : (
                                                        <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--gray-300)' }}>medication</span>
                                                    )}
                                                </div>
                                                <div className="carousel-info">
                                                    <Link to={`/products/${product._id}`}><h3>{product.name}</h3></Link>
                                                    <p className="carousel-desc">{product.description || 'Premium quality product for your health and wellness needs.'}</p>
                                                    <div className="carousel-price">₹{product.price?.toFixed(2)}</div>
                                                    {product.manufacturer && <span className="carousel-mfg">by {product.manufacturer}</span>}
                                                    <div className="carousel-actions">
                                                        <button className="btn btn-primary" onClick={() => addToCart(product._id)}>
                                                            <span className="material-icons" style={{ fontSize: '1rem' }}>shopping_cart</span> Add to Cart
                                                        </button>
                                                        <Link to={`/products/${product._id}`} className="btn btn-secondary">View Details</Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="carousel-dots">
                                {featured.map((_, i) => (
                                    <button key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} onClick={() => setCurrentSlide(i)} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* How It Works */}
            <section className="how-section">
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center' }}>How It Works</h2>
                    <div className="how-grid">
                        {howItWorks.map((step, i) => (
                            <div key={i} className="how-card">
                                <div className="how-icon"><span className="material-icons">{step.icon}</span></div>
                                <h3>{i + 1}. {step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="faq-section">
                <div className="container">
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>Frequently Asked Questions</h2>
                    <div className="faq-list">
                        {faqItems.map((faq, i) => (
                            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
                                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                                    <span>{faq.q}</span>
                                    <span className="material-icons">{openFaq === i ? 'expand_less' : 'expand_more'}</span>
                                </button>
                                {openFaq === i && <div className="faq-answer">{faq.a}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
