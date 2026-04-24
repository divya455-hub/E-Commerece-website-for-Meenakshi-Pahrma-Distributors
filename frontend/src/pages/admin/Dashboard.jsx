import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';

const STATUS_CHART_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#8b5cf6',
    shipped: '#06b6d4',
    delivered: '#059669',
    cancelled: '#ef4444',
};

const PAYMENT_COLORS = {
    cod: '#f59e0b',
    upi: '#8b5cf6',
    card: '#3b82f6',
    net_banking: '#06b6d4',
};

const PAYMENT_LABELS = {
    cod: 'Cash on Delivery',
    upi: 'UPI',
    card: 'Card',
    net_banking: 'Net Banking',
};

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/dashboard').then(({ data }) => setStats(data)).catch(() => { }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="loader"><div className="spinner" /></div>;
    if (!stats) return <p>Failed to load dashboard</p>;

    const cards = [
        { icon: 'receipt_long', label: 'Total Orders', value: stats.totalOrders || 0, color: 'var(--primary-500)', bg: 'var(--primary-50)', to: '/admin/orders' },
        { icon: 'currency_rupee', label: 'Total Sales', value: `₹${(stats.totalSales || 0).toFixed(2)}`, color: '#059669', bg: '#d1fae5', to: null },
        { icon: 'people', label: 'Customers', value: stats.totalCustomers || 0, color: '#7c3aed', bg: '#ede9fe', to: null },
        { icon: 'inventory_2', label: 'Products', value: stats.totalProducts || 0, color: '#ea580c', bg: '#fff7ed', to: '/admin/products' },
    ];

    const statusColors = { pending: 'badge-yellow', confirmed: 'badge-blue', shipped: 'badge-blue', delivered: 'badge-green', cancelled: 'badge-red' };

    // Order status data for donut chart
    const statusData = (stats.ordersByStatus || []).map(s => ({
        status: s._id,
        count: s.count,
        color: STATUS_CHART_COLORS[s._id] || '#94a3b8',
    }));
    const totalStatusOrders = statusData.reduce((sum, d) => sum + d.count, 0);

    // Daily sales for bar chart
    const dailySales = stats.dailySales || [];
    const maxRevenue = Math.max(...dailySales.map(d => d.revenue), 1);

    // Top products
    const topProducts = stats.topProducts || [];
    const maxProductRevenue = Math.max(...topProducts.map(p => p.revenue), 1);

    // Payment methods
    const paymentMethods = stats.paymentMethods || [];
    const totalPaymentOrders = paymentMethods.reduce((sum, p) => sum + p.count, 0);

    // Donut chart SVG helper
    const buildDonutSegments = (data, total) => {
        let cumulativePercent = 0;
        return data.map(d => {
            const percent = total > 0 ? (d.count / total) * 100 : 0;
            const startAngle = (cumulativePercent / 100) * 360;
            const endAngle = ((cumulativePercent + percent) / 100) * 360;
            cumulativePercent += percent;

            const startRad = ((startAngle - 90) * Math.PI) / 180;
            const endRad = ((endAngle - 90) * Math.PI) / 180;
            const largeArc = percent > 50 ? 1 : 0;
            const r = 80;
            const cx = 100, cy = 100;

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            return { ...d, percent, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
        });
    };

    const donutSegments = buildDonutSegments(statusData, totalStatusOrders);

    return (
        <div>
            <h1 className="page-title">Dashboard</h1>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                {cards.map(c => (
                    <div key={c.label} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-lg)', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-icons" style={{ color: c.color, fontSize: '1.5rem' }}>{c.icon}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 500 }}>{c.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{c.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 — Revenue + Order Status Donut */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Revenue Bar Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Revenue (Last 7 Days)</h2>
                    {dailySales.length === 0 ? (
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', padding: '2rem 0', textAlign: 'center' }}>No sales data yet</p>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: 200, paddingTop: '1rem' }}>
                            {dailySales.map(d => {
                                const heightPct = (d.revenue / maxRevenue) * 100;
                                const dayLabel = new Date(d._id + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' });
                                return (
                                    <div key={d._id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--gray-600)' }}>₹{Math.round(d.revenue)}</span>
                                        <div
                                            style={{
                                                width: '100%',
                                                maxWidth: 50,
                                                height: `${Math.max(heightPct, 4)}%`,
                                                background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                                                borderRadius: '6px 6px 2px 2px',
                                                transition: 'height 0.5s ease',
                                                minHeight: 4,
                                            }}
                                            title={`₹${d.revenue.toFixed(2)} | ${d.count} orders`}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)', fontWeight: 500 }}>{dayLabel}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Order Status Donut */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Order Status</h2>
                    {statusData.length === 0 ? (
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No orders yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ position: 'relative', width: 160, height: 160 }}>
                                <svg viewBox="0 0 200 200" style={{ width: '100%', height: '100%' }}>
                                    {donutSegments.map(s => (
                                        <path key={s.status} d={s.path} fill={s.color} stroke="white" strokeWidth="2" />
                                    ))}
                                    <circle cx="100" cy="100" r="50" fill="white" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gray-800)' }}>{totalStatusOrders}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>Orders</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center' }}>
                                {statusData.map(s => (
                                    <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                                        <span style={{ textTransform: 'capitalize', color: 'var(--gray-600)' }}>{s.status}</span>
                                        <span style={{ fontWeight: 700, color: 'var(--gray-800)' }}>({s.count})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 — Top Products + Payment Methods */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Top Products */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Top Products by Revenue</h2>
                    {topProducts.length === 0 ? (
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No data yet</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
                            {topProducts.map((p, i) => {
                                const barColors = ['#667eea', '#059669', '#f59e0b', '#8b5cf6', '#ef4444'];
                                const widthPct = (p.revenue / maxProductRevenue) * 100;
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--gray-700)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p._id}</span>
                                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-600)' }}>₹{Math.round(p.revenue)} · {p.unitsSold} sold</span>
                                        </div>
                                        <div style={{ height: 8, background: 'var(--gray-100)', borderRadius: 4, overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${widthPct}%`,
                                                background: barColors[i % barColors.length],
                                                borderRadius: 4,
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title">Payment Methods</h2>
                    {paymentMethods.length === 0 ? (
                        <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No data yet</p>
                    ) : (
                        <div>
                            {/* Stacked bar */}
                            <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden', marginBottom: '1rem', marginTop: '0.5rem' }}>
                                {paymentMethods.map(p => {
                                    const pct = totalPaymentOrders > 0 ? (p.count / totalPaymentOrders) * 100 : 0;
                                    return (
                                        <div
                                            key={p._id}
                                            style={{
                                                width: `${pct}%`,
                                                background: PAYMENT_COLORS[p._id] || '#94a3b8',
                                                transition: 'width 0.5s ease',
                                                minWidth: pct > 0 ? 4 : 0,
                                            }}
                                            title={`${PAYMENT_LABELS[p._id] || p._id}: ${p.count} orders (${pct.toFixed(0)}%)`}
                                        />
                                    );
                                })}
                            </div>
                            {/* Legend */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {paymentMethods.map(p => {
                                    const pct = totalPaymentOrders > 0 ? ((p.count / totalPaymentOrders) * 100).toFixed(0) : 0;
                                    return (
                                        <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <div style={{ width: 12, height: 12, borderRadius: 3, background: PAYMENT_COLORS[p._id] || '#94a3b8' }} />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>{PAYMENT_LABELS[p._id] || p._id}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{p.count} orders</span>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray-800)' }}>{pct}%</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row — Alerts + Recent Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Alerts */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="material-icons" style={{ color: 'var(--warning)' }}>warning</span> Alerts
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fef3c7', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className="material-icons" style={{ color: '#92400e', fontSize: '1.1rem' }}>inventory</span>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Low Stock Items</span>
                            </div>
                            <span className="badge badge-yellow">{Array.isArray(stats.lowStockAlerts) ? stats.lowStockAlerts.length : stats.lowStockAlerts || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fee2e2', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span className="material-icons" style={{ color: '#991b1b', fontSize: '1.1rem' }}>schedule</span>
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>Expiring Soon</span>
                            </div>
                            <span className="badge badge-red">{Array.isArray(stats.expiryAlerts) ? stats.expiryAlerts.length : stats.expiryAlerts || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Orders</h2>
                        <Link to="/admin/orders" style={{ color: 'var(--primary-600)', fontSize: '0.85rem', fontWeight: 500 }}>View All</Link>
                    </div>
                    {(stats.recentOrders || []).length === 0 ? <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>No recent orders</p> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {stats.recentOrders.slice(0, 5).map(o => (
                                <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-100)' }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.orderNumber}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                        <span className={`badge ${statusColors[o.status]}`}>{o.status}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>₹{o.totalAmount?.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
