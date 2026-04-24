import { useState } from 'react';
import api from '../../api/api';
import { useToast } from '../../context/ToastContext';

export default function Reports() {
    const toast = useToast();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activePreset, setActivePreset] = useState('');

    const presets = [
        { key: '5m', label: 'Past 5 mins', ms: 5 * 60 * 1000 },
        { key: '6h', label: 'Past 6 hours', ms: 6 * 60 * 60 * 1000 },
        { key: '7d', label: 'Past 7 days', ms: 7 * 24 * 60 * 60 * 1000 },
        { key: '1mo', label: 'Past 1 month', ms: 30 * 24 * 60 * 60 * 1000 },
        { key: 'custom', label: 'Custom' },
    ];

    const fetchReport = async (fromVal, toVal) => {
        const f = fromVal || from;
        const t = toVal || to;
        if (!f || !t) { toast.error('Please select a date range'); return; }
        setLoading(true);
        try {
            const { data: d } = await api.get(`/admin/reports?from=${f}&to=${t}`);
            setData(d);
        } catch { toast.error('Failed to fetch report'); }
        finally { setLoading(false); }
    };

    const selectPreset = (preset) => {
        setActivePreset(preset.key);
        if (preset.key === 'custom') return;
        const now = new Date();
        const fromDate = new Date(now.getTime() - preset.ms);
        const f = fromDate.toISOString().split('T')[0];
        const t = now.toISOString().split('T')[0];
        setFrom(f);
        setTo(t);
        fetchReport(f, t);
    };

    const downloadPDF = async () => {
        if (!data) return;
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Meenakshi Pharma Distributors', 105, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sales Report', 105, 25, { align: 'center' });
        doc.text(`Period: ${new Date(from).toLocaleDateString('en-IN')} to ${new Date(to).toLocaleDateString('en-IN')}`, 105, 31, { align: 'center' });
        doc.setDrawColor(38, 166, 91);
        doc.setLineWidth(0.5);
        doc.line(14, 35, 196, 35);

        // Summary
        let y = 42;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, y);
        y += 7;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const s = data.summary;
        doc.text(`Total Orders: ${s.totalOrders}`, 14, y);
        doc.text(`Total Revenue: Rs.${s.totalRevenue.toLocaleString('en-IN')}`, 105, y);
        y += 6;
        doc.text(`Total Items Sold: ${s.totalItems}`, 14, y);
        doc.text(`Avg Order Value: Rs.${s.avgOrderValue.toLocaleString('en-IN')}`, 105, y);
        y += 10;

        // Status breakdown
        doc.setFont('helvetica', 'bold');
        doc.text('Order Status Breakdown', 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        Object.entries(s.byStatus || {}).forEach(([status, count]) => {
            doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 14, y);
            y += 5;
        });
        y += 5;

        // Top products
        if (data.topProducts?.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.text('Top Products', 14, y);
            y += 2;
            autoTable(doc, {
                startY: y,
                head: [['#', 'Product', 'Qty Sold', 'Revenue']],
                body: data.topProducts.map((p, i) => [
                    i + 1, p.name, p.quantity, `Rs.${p.revenue.toFixed(2)}`
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [38, 166, 91] },
                margin: { left: 14 },
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        // Orders table
        if (data.orders?.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text('Order Details', 14, y);
            y += 2;
            autoTable(doc, {
                startY: y,
                head: [['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status']],
                body: data.orders.map(o => [
                    o.orderNumber,
                    o.customer,
                    new Date(o.date).toLocaleDateString('en-IN'),
                    o.items,
                    `Rs.${o.total.toFixed(2)}`,
                    o.status.charAt(0).toUpperCase() + o.status.slice(1),
                ]),
                styles: { fontSize: 8 },
                headStyles: { fillColor: [38, 166, 91] },
                margin: { left: 14 },
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        // Top Customers
        if (data.topCustomers?.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text('Top Customers', 14, y);
            y += 2;
            autoTable(doc, {
                startY: y,
                head: [['#', 'Customer', 'Email', 'Orders', 'Total Spent']],
                body: data.topCustomers.map((c, i) => [
                    i + 1, c.name, c.email, c.totalOrders, `Rs.${c.totalSpent.toFixed(2)}`
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [99, 102, 241] },
                margin: { left: 14 },
            });
            y = doc.lastAutoTable.finalY + 10;
        }

        // Most Bought Products
        if (data.topBoughtProducts?.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFont('helvetica', 'bold');
            doc.text('Most Bought Products', 14, y);
            y += 2;
            autoTable(doc, {
                startY: y,
                head: [['#', 'Product', 'Qty Sold', 'Revenue']],
                body: data.topBoughtProducts.map((p, i) => [
                    i + 1, p.name, p.quantity, `Rs.${p.revenue.toFixed(2)}`
                ]),
                styles: { fontSize: 9 },
                headStyles: { fillColor: [245, 158, 11] },
                margin: { left: 14 },
            });
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on ${new Date().toLocaleString('en-IN')} • Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`MeenakshiPharma_Report_${from}_to_${to}.pdf`);
        toast.success('Report downloaded');
    };

    const card = (icon, label, value, color) => (
        <div style={{
            background: '#fff', borderRadius: '14px', padding: '1.25rem 1.5rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem',
            border: '1px solid var(--gray-100)',
        }}>
            <div style={{
                width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: color + '18', color,
            }}>
                <span className="material-icons" style={{ fontSize: '1.5rem' }}>{icon}</span>
            </div>
            <div>
                <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: '0.15rem' }}>{label}</p>
                <p style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gray-800)' }}>{value}</p>
            </div>
        </div>
    );

    return (
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Reports</h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Generate and download sales reports</p>
                </div>
            </div>

            {/* Date Selection */}
            <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '0.6rem' }}>Select Time Range</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: activePreset === 'custom' ? '1rem' : 0 }}>
                    {presets.map(p => (
                        <button
                            key={p.key}
                            onClick={() => selectPreset(p)}
                            style={{
                                padding: '0.45rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                border: activePreset === p.key ? '2px solid var(--primary-500)' : '1.5px solid var(--gray-200)',
                                background: activePreset === p.key ? 'var(--primary-50)' : '#fff',
                                color: activePreset === p.key ? 'var(--primary-600)' : 'var(--gray-600)',
                                cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {p.label}
                        </button>
                    ))}

                    {data && (
                        <button className="btn" onClick={downloadPDF}
                            style={{
                                padding: '0.45rem 1.2rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginLeft: 'auto',
                            }}>
                            <span className="material-icons" style={{ fontSize: '1rem' }}>picture_as_pdf</span>
                            Download PDF
                        </button>
                    )}
                </div>

                {activePreset === 'custom' && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>From</label>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.88rem' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.25rem' }}>To</label>
                            <input type="date" value={to} onChange={e => setTo(e.target.value)}
                                style={{ padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--gray-200)', fontSize: '0.88rem' }} />
                        </div>
                        <button className="btn btn-primary" onClick={() => fetchReport()} disabled={loading}
                            style={{ padding: '0.45rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.88rem' }}>
                            <span className="material-icons" style={{ fontSize: '1rem' }}>search</span>
                            {loading ? 'Loading...' : 'Generate'}
                        </button>
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="admin-spinner" />
                    <p style={{ color: 'var(--gray-500)', marginTop: '0.5rem' }}>Generating report...</p>
                </div>
            )}

            {/* Report Data */}
            {data && !loading && (
                <>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                        {card('receipt_long', 'Total Orders', data.summary.totalOrders, '#6366f1')}
                        {card('payments', 'Total Revenue', `₹${data.summary.totalRevenue.toLocaleString('en-IN')}`, '#22c55e')}
                        {card('inventory_2', 'Items Sold', data.summary.totalItems, '#f59e0b')}
                        {card('analytics', 'Avg Order Value', `₹${data.summary.avgOrderValue.toLocaleString('en-IN')}`, '#3b82f6')}
                    </div>

                    {/* Status & Payment Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Order Status</h3>
                            {Object.entries(data.summary.byStatus || {}).map(([status, count]) => (
                                <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.88rem' }}>
                                    <span style={{ textTransform: 'capitalize' }}>{status}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                        <div className="card" style={{ padding: '1.25rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Payment Methods</h3>
                            {Object.entries(data.summary.byPayment || {}).map(([method, count]) => (
                                <div key={method} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--gray-100)', fontSize: '0.88rem' }}>
                                    <span style={{ textTransform: 'uppercase' }}>{method}</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Customers */}
                    {data.topCustomers?.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.2rem', color: '#6366f1' }}>people</span>
                                Top Customers
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th></tr></thead>
                                    <tbody>
                                        {data.topCustomers.map((c, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td><strong>{c.name}</strong></td>
                                                <td>{c.email}</td>
                                                <td>{c.phone || '—'}</td>
                                                <td>{c.totalOrders}</td>
                                                <td>₹{c.totalSpent.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Most Bought Products (by quantity) */}
                    {data.topBoughtProducts?.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons" style={{ fontSize: '1.2rem', color: '#f59e0b' }}>trending_up</span>
                                Most Bought Products
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                                    <tbody>
                                        {data.topBoughtProducts.map((p, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{p.name}</td>
                                                <td><strong>{p.quantity}</strong></td>
                                                <td>₹{p.revenue.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Top Products (by revenue) */}
                    {data.topProducts?.length > 0 && (
                        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Top Products (by Revenue)</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table" style={{ width: '100%' }}>
                                    <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                                    <tbody>
                                        {data.topProducts.map((p, i) => (
                                            <tr key={i}>
                                                <td>{i + 1}</td>
                                                <td>{p.name}</td>
                                                <td>{p.quantity}</td>
                                                <td>₹{p.revenue.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Orders Table */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.75rem' }}>Orders ({data.orders?.length || 0})</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table" style={{ width: '100%' }}>
                                <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th></tr></thead>
                                <tbody>
                                    {data.orders?.map((o, i) => (
                                        <tr key={i}>
                                            <td><strong>{o.orderNumber}</strong></td>
                                            <td>{o.customer}</td>
                                            <td>{new Date(o.date).toLocaleDateString('en-IN')}</td>
                                            <td>{o.items}</td>
                                            <td>₹{o.total.toFixed(2)}</td>
                                            <td><span className={`badge ${o.status === 'delivered' ? 'badge-green' : o.status === 'cancelled' ? 'badge-red' : o.status === 'pending' ? 'badge-yellow' : 'badge-blue'}`}>{o.status}</span></td>
                                            <td style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>{o.paymentMethod}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty state */}
            {!data && !loading && (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--gray-400)' }}>
                    <span className="material-icons" style={{ fontSize: '4rem', color: 'var(--gray-200)' }}>assessment</span>
                    <p style={{ marginTop: '0.5rem', fontSize: '1rem' }}>Select a date range and click "Generate Report" to view data</p>
                </div>
            )}
        </div>
    );
}
