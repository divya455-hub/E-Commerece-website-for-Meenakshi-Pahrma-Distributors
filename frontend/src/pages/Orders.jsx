import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import './Orders.css';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('current');
    const [currentPage, setCurrentPage] = useState(1);
    const [pastPage, setPastPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        api.get('/orders')
            .then(({ data }) => setOrders(data.orders || data || []))
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const currentOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status));
    const currentTotal = Math.ceil(currentOrders.length / pageSize);
    const pastTotal = Math.ceil(pastOrders.length / pageSize);
    const paginatedCurrent = currentOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const paginatedPast = pastOrders.slice((pastPage - 1) * pageSize, pastPage * pageSize);

    return (
        <main className="orders-page">
            <h1 className="orders-heading">My Orders</h1>
            <p className="orders-subhead">Track and manage your orders</p>

            {/* Tabs */}
            <div className="orders-tabs">
                <button className={`orders-tab ${activeTab === 'current' ? 'active' : ''}`} onClick={() => setActiveTab('current')}>Current Orders</button>
                <button className={`orders-tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>Past Orders</button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="orders-skeleton">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="orders-skel-card"><div className="skel-line w33"></div><div className="skel-line w50"></div></div>
                    ))}
                </div>
            )}

            {/* Current */}
            {!loading && activeTab === 'current' && (
                <>
                    <div className="orders-list">
                        {paginatedCurrent.length === 0 ? (
                            <div className="orders-empty"><p>No current orders</p></div>
                        ) : paginatedCurrent.map(order => (
                            <Link to={`/orders/${order._id}`} key={order._id} className="orders-card">
                                <div className="orders-card-left">
                                    <p className="orders-card-number">Order #{order.orderNumber || order._id?.slice(-6)}</p>
                                    <p className="orders-card-status">Status: <span className="capitalize">{order.status}</span></p>
                                </div>
                                <p className="orders-card-amount">₹{order.totalAmount?.toFixed(0) || order.finalAmount?.toFixed(0)}</p>
                            </Link>
                        ))}
                    </div>
                    {currentTotal > 1 && (
                        <div className="orders-pagination">
                            <button className="page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
                            <span className="page-info">Page {currentPage} of {currentTotal}</span>
                            <button className="page-btn" disabled={currentPage === currentTotal} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                        </div>
                    )}
                </>
            )}

            {/* Past */}
            {!loading && activeTab === 'past' && (
                <>
                    <div className="orders-list">
                        {paginatedPast.length === 0 ? (
                            <div className="orders-empty"><p>No past orders</p></div>
                        ) : paginatedPast.map(order => (
                            <Link to={`/orders/${order._id}`} key={order._id} className="orders-card">
                                <div className="orders-card-left">
                                    <p className="orders-card-number">Order #{order.orderNumber || order._id?.slice(-6)}</p>
                                    <p className="orders-card-status">Status: <span className="capitalize">{order.status}</span></p>
                                </div>
                                <p className="orders-card-amount">₹{order.totalAmount?.toFixed(0) || order.finalAmount?.toFixed(0)}</p>
                            </Link>
                        ))}
                    </div>
                    {pastTotal > 1 && (
                        <div className="orders-pagination">
                            <button className="page-btn" disabled={pastPage === 1} onClick={() => setPastPage(pastPage - 1)}>Prev</button>
                            <span className="page-info">Page {pastPage} of {pastTotal}</span>
                            <button className="page-btn" disabled={pastPage === pastTotal} onClick={() => setPastPage(pastPage + 1)}>Next</button>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}
