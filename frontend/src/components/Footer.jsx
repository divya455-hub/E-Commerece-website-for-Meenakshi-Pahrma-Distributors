import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-grid">
                <div>
                    <div className="footer-brand-name">
                        <div className="footer-brand-icon">MP</div>
                        Meenakshi Pharma
                    </div>
                    <p className="footer-desc">
                        Your trusted partner in healthcare. We provide genuine medicines, healthcare products,
                        and expert advice to keep you and your family healthy.
                    </p>
                    <div className="footer-social">
                        <a href="#" aria-label="Facebook"><span className="material-icons">public</span></a>
                        <a href="#" aria-label="Phone"><span className="material-icons">phone</span></a>
                        <a href="#" aria-label="Email"><span className="material-icons">email</span></a>
                    </div>
                </div>

                <div>
                    <h3>Quick Links</h3>
                    <div className="footer-links">
                        <Link to="/">Home</Link>
                        <Link to="/products">Products</Link>
                        <Link to="/orders">Orders</Link>
                        <Link to="/contact">Contact</Link>
                    </div>
                </div>

                <div>
                    <h3>Contact Us</h3>
                    <ul className="footer-contact">
                        <li><span className="material-icons">location_on</span> Salem, Tamil Nadu</li>
                        <li><span className="material-icons">phone</span> +91 98765 43210</li>
                        <li><span className="material-icons">email</span> support@meenakshipharma.com</li>
                        <li><span className="material-icons">access_time</span> Mon-Sat: 8AM - 10PM</li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© 2026 Meenakshi Pharma Distributors. All rights reserved.</p>
                <div className="footer-bottom-links">
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms of Service</a>
                    <a href="#">Returns Policy</a>
                </div>
            </div>
        </footer>
    );
}
