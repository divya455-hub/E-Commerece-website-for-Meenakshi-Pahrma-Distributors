import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { SERVER_URL } from '../api/api';
import { useToast } from '../context/ToastContext';
import './Products.css';

export default function Products() {
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [sortBy, setSortBy] = useState('relevance');
    const [currentPrice, setCurrentPrice] = useState(5000);
    const [maxPrice] = useState(5000);
    const [rxFilter, setRxFilter] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 24;

    useEffect(() => {
        api.get('/categories').then(({ data }) => setCategories(data)).catch(() => { });
        loadProducts();
    }, []);

    const loadProducts = () => {
        setLoading(true);
        api.get('/products?limit=300')
            .then(({ data }) => setProducts(data.products || data || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    };

    const filtered = products
        .filter(p => !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(p => !selectedCategory || p.category?._id === selectedCategory || p.category === selectedCategory)
        .filter(p => (p.price || 0) <= currentPrice)
        .filter(p => !rxFilter || p.requiresPrescription)
        .sort((a, b) => {
            if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
            if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            return 0;
        });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const clearFilters = () => { setSelectedCategory(''); setCurrentPrice(maxPrice); setRxFilter(false); setSearchQuery(''); setCurrentPage(1); };

    const addToCart = async (product) => {
        try {
            await api.post('/cart', { productId: product._id, quantity: 1 });
            toast.success(`${product.name} added to cart`);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                toast.error('Please login to add items to cart');
            } else {
                toast.error(err.response?.data?.message || 'Failed to add to cart');
            }
        }
    };

    const FiltersContent = () => (
        <>
            <div className="filter-section">
                <label className="filter-heading">Categories</label>
                <div className="filter-options">
                    <label className="filter-check"><input type="checkbox" checked={!selectedCategory} onChange={() => { setSelectedCategory(''); setCurrentPage(1); }} /><span>All Categories</span></label>
                    {categories.map(c => (
                        <label key={c._id} className="filter-check">
                            <input type="checkbox" checked={selectedCategory === c._id} onChange={() => { setSelectedCategory(selectedCategory === c._id ? '' : c._id); setCurrentPage(1); }} />
                            <span>{c.name}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-section">
                <label className="filter-heading">Price Range</label>
                <div className="filter-range-wrap">
                    <input type="range" min="0" max={maxPrice} value={currentPrice} onChange={e => { setCurrentPrice(Number(e.target.value)); setCurrentPage(1); }} className="filter-range" />
                    <div className="filter-range-labels"><span>₹0</span><span>₹{currentPrice}</span></div>
                </div>
            </div>

            <div className="filter-section">
                <label className="filter-heading">Prescription</label>
                <label className="filter-check">
                    <input type="checkbox" checked={rxFilter} onChange={() => { setRxFilter(!rxFilter); setCurrentPage(1); }} />
                    <span className="filter-rx-label"><span className="rx-badge-small">Rx</span> Requires Prescription</span>
                </label>
            </div>

            <button className="filter-clear-btn" onClick={clearFilters}>Clear All Filters</button>
        </>
    );

    return (
        <main className="products-page">
            {/* Mobile filter button */}
            <div className="mobile-filter-btn-wrap">
                <button className="mobile-filter-btn" onClick={() => setShowMobileFilters(true)}>
                    <span className="material-icons">filter_list</span> Filters & Sort
                </button>
            </div>

            <div className="products-layout">
                {/* Sidebar */}
                <aside className="products-sidebar">
                    <h3 className="sidebar-title">Filters</h3>
                    <FiltersContent />
                </aside>

                {/* Main */}
                <div className="products-main">
                    {/* Search + Sort */}
                    <div className="products-toolbar">
                        <div className="products-search-wrap">
                            <span className="material-icons products-search-icon">search</span>
                            <input type="text" className="products-search" placeholder="Search for medicines & health products" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} />
                        </div>
                        <div className="products-sort-wrap">
                            <label>Sort by:</label>
                            <select className="products-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="relevance">Relevance</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="newest">Newest First</option>
                                <option value="name">Name (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* All products section */}
                    <section>
                        <div className="products-section-header">
                            <h2 className="products-section-title">All Products</h2>
                            <div className="products-count">{filtered.length} products</div>
                        </div>

                        {loading ? (
                            <div className="products-grid">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="product-card skeleton"><div className="skeleton-img"></div><div className="skeleton-text"></div><div className="skeleton-text short"></div><div className="skeleton-btn"></div></div>
                                ))}
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="products-empty">
                                <span className="material-icons" style={{ fontSize: '4rem', color: 'var(--gray-300)' }}>search_off</span>
                                <p>No products match your filters.</p>
                                <button className="btn btn-primary" onClick={clearFilters}>Reset Filters</button>
                            </div>
                        ) : (
                            <>
                                <div className="products-grid">
                                    {paginated.map(p => (
                                        <div key={p._id} className="product-card">
                                            {p.requiresPrescription && <span className="product-rx-badge">Rx</span>}
                                            <Link to={`/products/${p._id}`} className="product-img-wrap">
                                                {p.imageUrl ? (
                                                    <img src={`${SERVER_URL}${p.imageUrl}`} alt={p.name} className="product-img" />
                                                ) : (
                                                    <div className="product-img-placeholder">
                                                        <span className="material-icons" style={{ fontSize: '3rem', color: 'var(--gray-300)' }}>medication</span>
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="product-card-body">
                                                <Link to={`/products/${p._id}`} className="product-card-name">{p.name}</Link>
                                                <p className="product-card-desc">{p.description?.substring(0, 60) || 'Premium quality product'}...</p>
                                                <div className="product-card-price-row">
                                                    <span className="product-card-price">₹{p.price?.toFixed(2)}</span>
                                                    {p.manufacturer && <span className="product-card-mfr">by {p.manufacturer}</span>}
                                                </div>
                                                <div className="product-card-actions">
                                                    <button className="product-add-btn" onClick={() => addToCart(p)} disabled={(p.stockQuantity ?? p.stock ?? 0) === 0}>
                                                        <span className="material-icons" style={{ fontSize: '1rem' }}>shopping_cart</span>
                                                        {(p.stockQuantity ?? p.stock ?? 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                    </button>
                                                    <Link to={`/products/${p._id}`} className="product-view-btn">
                                                        <span className="material-icons" style={{ fontSize: '1rem' }}>visibility</span> View
                                                    </Link>
                                                </div>
                                                {(() => {
                                                    const stock = p.stockQuantity ?? p.stock ?? 0;
                                                    if (stock === 0) return (
                                                        <div className="product-stock-status product-stock-out">
                                                            <span className="material-icons" style={{ fontSize: '0.8rem' }}>cancel</span> Out of Stock
                                                        </div>
                                                    );
                                                    if (stock <= 10) return (
                                                        <div className="product-stock-status product-stock-low">
                                                            <span className="material-icons" style={{ fontSize: '0.8rem' }}>warning</span> Low Stock ({stock} left)
                                                        </div>
                                                    );
                                                    return (
                                                        <div className="product-stock-status">
                                                            <span className="material-icons" style={{ fontSize: '0.8rem' }}>check_circle</span> In Stock
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="products-pagination">
                                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="page-btn">Prev</button>
                                        {(() => {
                                            const pages = [];
                                            const addPage = (p) => pages.push(<button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>);
                                            const addEllipsis = (key) => pages.push(<span key={key} className="page-ellipsis">…</span>);
                                            if (totalPages <= 7) {
                                                for (let i = 1; i <= totalPages; i++) addPage(i);
                                            } else {
                                                addPage(1);
                                                if (currentPage > 3) addEllipsis('start');
                                                for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) addPage(i);
                                                if (currentPage < totalPages - 2) addEllipsis('end');
                                                addPage(totalPages);
                                            }
                                            return pages;
                                        })()}
                                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="page-btn">Next</button>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>

            {/* Mobile Filters Modal */}
            {showMobileFilters && (
                <div className="mobile-filters-overlay" onClick={() => setShowMobileFilters(false)}>
                    <div className="mobile-filters-panel" onClick={e => e.stopPropagation()}>
                        <div className="mobile-filters-header">
                            <h3>Filters & Sort</h3>
                            <button onClick={() => setShowMobileFilters(false)}><span className="material-icons">close</span></button>
                        </div>
                        <div className="mobile-filters-body">
                            <div className="filter-section">
                                <label className="filter-heading">Sort By</label>
                                <select className="products-sort" style={{ width: '100%' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                    <option value="relevance">Relevance</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                    <option value="newest">Newest First</option>
                                    <option value="name">Name (A-Z)</option>
                                </select>
                            </div>
                            <FiltersContent />
                            <div className="mobile-filters-actions">
                                <button className="btn btn-ghost" onClick={() => { clearFilters(); setShowMobileFilters(false); }}>Clear Filters</button>
                                <button className="btn btn-primary" onClick={() => setShowMobileFilters(false)}>Apply Filters</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
