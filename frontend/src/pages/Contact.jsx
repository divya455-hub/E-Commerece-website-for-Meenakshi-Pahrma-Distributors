import { useState } from 'react';
import { useToast } from '../context/ToastContext';

export default function Contact() {
    const toast = useToast();
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success('Message sent! We will get back to you soon.');
        setForm({ name: '', email: '', subject: '', message: '' });
    };

    const contactInfo = [
        { icon: 'storefront', label: 'Shop', value: '14/36, Ground Floor, Pulikkuthi 4th Street', sub: 'Gugai, Salem - 636006, Tamil Nadu' },
        { icon: 'phone', label: 'Cell', value: '+91 97901 60671', href: 'tel:+919790160671' },
        { icon: 'phone_in_talk', label: 'Shop Landline', value: '0427 - 2467017', href: 'tel:04272467017' },
        { icon: 'email', label: 'Email', value: 'support@meenakshipharma.com', href: 'mailto:support@meenakshipharma.com' },
        { icon: 'badge', label: 'GSTIN', value: '33AADFM1338C1ZX' },
        { icon: 'access_time', label: 'Business Hours', value: 'Mon – Sat: 8:00 AM – 10:00 PM', sub: 'Sunday: Closed' },
    ];

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 1000 }}>

                {/* Hero Banner */}
                <div style={{
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
                    borderRadius: '16px',
                    padding: '2.5rem 2rem',
                    marginBottom: '2rem',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: -40, right: -40,
                        width: 200, height: 200, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: -60, left: '30%',
                        width: 160, height: 160, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.05)',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span className="material-icons" style={{ fontSize: '2rem' }}>local_pharmacy</span>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Meenakshi Pharma Distributors</h1>
                        </div>
                        <p style={{ opacity: 0.85, fontSize: '1rem', maxWidth: 500, lineHeight: 1.5, margin: 0 }}>
                            Your trusted pharmaceutical partner in Salem. Reach out to us for any queries, orders, or support.
                        </p>
                    </div>
                </div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                    {/* Contact Info Card */}
                    <div className="card" style={{ padding: '1.75rem' }}>
                        <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-icons" style={{ color: 'var(--primary-500)', fontSize: '1.3rem' }}>contact_phone</span>
                            Get in Touch
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            {contactInfo.map(item => (
                                <div key={item.label} style={{
                                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                                    padding: '0.75rem',
                                    borderRadius: '10px',
                                    background: 'var(--gray-50)',
                                    transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray-50)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                >
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '10px',
                                        background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <span className="material-icons" style={{ color: '#fff', fontSize: '1.15rem' }}>{item.icon}</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                            {item.label}
                                        </div>
                                        {item.href ? (
                                            <a href={item.href} style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none' }}>
                                                {item.value}
                                            </a>
                                        ) : (
                                            <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gray-800)' }}>{item.value}</div>
                                        )}
                                        {item.sub && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '1px' }}>{item.sub}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Contact Form */}
                        <div className="card" style={{ padding: '1.75rem' }}>
                            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="material-icons" style={{ color: 'var(--primary-500)', fontSize: '1.3rem' }}>mail</span>
                                Send a Message
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Name</label>
                                        <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label">Email</label>
                                        <input className="form-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@email.com" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Subject</label>
                                    <input className="form-input" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What's this about?" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Message</label>
                                    <textarea className="form-input" rows="4" required style={{ resize: 'vertical' }} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help..." />
                                </div>
                                <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '0.7rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                                    <span className="material-icons" style={{ fontSize: '1.1rem' }}>send</span>
                                    Send Message
                                </button>
                            </form>
                        </div>

                        {/* Map / Location embed */}
                        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <iframe
                                title="Meenakshi Pharma Location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3907.0!2d78.16!3d11.65!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDM5JzAwLjAiTiA3OMKwMDknMzYuMCJF!5e0!3m2!1sen!2sin!4v1600000000000"
                                width="100%"
                                height="200"
                                style={{ border: 0, display: 'block' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                            <div style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--gray-50)' }}>
                                <span className="material-icons" style={{ color: 'var(--primary-500)', fontSize: '1rem' }}>location_on</span>
                                <span style={{ fontSize: '0.82rem', color: 'var(--gray-600)' }}>
                                    14/36, Pulikkuthi 4th Street, Gugai, Salem - 636006
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Contact Pills */}
                <div style={{
                    marginTop: '1.5rem',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                }}>
                    {[
                        { icon: 'phone', label: 'Call Us', href: 'tel:+919790160671', bg: 'linear-gradient(135deg, #059669, #10b981)' },
                        { icon: 'email', label: 'Email Us', href: 'mailto:support@meenakshipharma.com', bg: 'linear-gradient(135deg, #2563eb, #3b82f6)' },
                        { icon: 'location_on', label: 'Get Directions', href: 'https://www.google.com/maps/search/Pulikkuthi+4th+Street+Gugai+Salem+636006', bg: 'linear-gradient(135deg, #d97706, #f59e0b)' },
                    ].map(btn => (
                        <a
                            key={btn.label}
                            href={btn.href}
                            target={btn.href.startsWith('http') ? '_blank' : undefined}
                            rel={btn.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.7rem 1.5rem',
                                borderRadius: '50px',
                                background: btn.bg,
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.88rem',
                                textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                        >
                            <span className="material-icons" style={{ fontSize: '1.1rem' }}>{btn.icon}</span>
                            {btn.label}
                        </a>
                    ))}
                </div>

            </div>
        </div>
    );
}
