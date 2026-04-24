import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CustomerLayout() {
    return (
        <>
            <Header />
            <main style={{ marginTop: '64px', minHeight: 'calc(100vh - 64px)' }}>
                <Outlet />
            </main>
            <Footer />
        </>
    );
}
