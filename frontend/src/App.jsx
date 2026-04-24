import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Prescriptions from './pages/Prescriptions';
import Notifications from './pages/Notifications';
import Contact from './pages/Contact';

import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/ProductManagement';
import AdminOrders from './pages/admin/OrderManagement';
import AdminInventory from './pages/admin/InventoryManagement';
import AdminPrescriptions from './pages/admin/PrescriptionVerification';
import AdminReports from './pages/admin/Reports';

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Routes>
                        {/* Customer Layout */}
                        <Route element={<CustomerLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/products" element={<Products />} />
                            <Route path="/products/:id" element={<ProductDetail />} />
                            <Route path="/contact" element={<Contact />} />

                            {/* Protected customer routes */}
                            <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
                            <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute role="customer"><Orders /></ProtectedRoute>} />
                            <Route path="/orders/:id" element={<ProtectedRoute role="customer"><OrderDetail /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute role="customer"><Profile /></ProtectedRoute>} />
                            <Route path="/prescriptions" element={<ProtectedRoute role="customer"><Prescriptions /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute role="customer"><Notifications /></ProtectedRoute>} />
                        </Route>

                        {/* Auth pages (no layout) */}
                        <Route path="/auth/login" element={<Login />} />
                        <Route path="/auth/register" element={<Register />} />

                        {/* Admin Layout */}
                        <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboard />} />
                            <Route path="products" element={<AdminProducts />} />
                            <Route path="orders" element={<AdminOrders />} />
                            <Route path="inventory" element={<AdminInventory />} />
                            <Route path="prescriptions" element={<AdminPrescriptions />} />
                            <Route path="reports" element={<AdminReports />} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    );
}
