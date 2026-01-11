'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({ pending: 0, total: 0 });

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            // Fetch pending registrations
            const resPending = await fetch('/api/admin/registrations');
            const dataPending = await resPending.json();
            if (dataPending.registrations) {
                setPendingRegistrations(dataPending.registrations);
                setStats(prev => ({ ...prev, pending: dataPending.registrations.length }));
            }

            // Fetch all users
            const resAll = await fetch('/api/admin/users');
            const dataAll = await resAll.json();
            if (dataAll.users) {
                setAllUsers(dataAll.users);
                setStats(prev => ({ ...prev, total: dataAll.users.length }));
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const handleAction = async (userId, status) => {
        if (!confirm(`Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} this registration?`)) return;

        try {
            const res = await fetch('/api/admin/registrations', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, status })
            });

            if (res.ok) {
                setPendingRegistrations(pendingRegistrations.filter(r => r._id !== userId));
                setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
            } else {
                alert('Action failed');
            }
        } catch (error) {
            alert('An error occurred');
        }
    };

    if (loading || !user || user.role !== 'admin') return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;

    return (
        <div className="container">
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Admin Panel</h1>
                    <p style={{ opacity: 0.7 }}>Manage business registrations and platform status</p>
                </div>
                <div className="glass" style={{ padding: '15px 25px', borderRadius: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Pending</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.pending}</div>
                </div>
            </header>

            <section>
                <h2 style={{ marginBottom: '20px' }}>Business Registrations</h2>
                {pendingRegistrations.length === 0 ? (
                    <div className="glass" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '20px' }}>
                        <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>No pending business registrations at the moment.</p>
                    </div>
                ) : (
                    <div className="grid">
                        {pendingRegistrations.map((reg) => (
                            <div key={reg._id} className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{reg.name || 'No Name'}</h3>
                                    <p style={{ margin: '5px 0', fontSize: '0.9rem', opacity: 0.7 }}>{reg.email}</p>

                                    <div style={{
                                        marginTop: '15px',
                                        padding: '12px',
                                        background: 'rgba(108, 92, 231, 0.1)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(108, 92, 231, 0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '5px'
                                    }}>
                                        <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.6, fontWeight: 'bold' }}>Business Contact</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📱</span>
                                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--secondary)' }}>
                                                {reg.phonePrefix} {reg.phoneNumber || 'N/A'}
                                            </span>
                                        </div>
                                        {reg.phoneNumber && (
                                            <a
                                                href={`https://wa.me/${(reg.phonePrefix + reg.phoneNumber).replace(/\+/g, '')}`}
                                                target="_blank"
                                                style={{
                                                    fontSize: '0.85rem',
                                                    color: '#2ecc71',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    marginTop: '5px',
                                                    textDecoration: 'none',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                <span>💬 WhatsApp Business</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                    Registered: {new Date(reg.createdAt).toLocaleDateString()}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                                    <button
                                        onClick={() => handleAction(reg._id, 'approved')}
                                        className="btn"
                                        style={{ flex: 1, background: '#2ecc71', padding: '10px' }}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleAction(reg._id, 'rejected')}
                                        className="btn"
                                        style={{ flex: 1, background: '#e74c3c', padding: '10px' }}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section style={{ marginTop: '60px' }}>
                <h2 style={{ marginBottom: '20px' }}>All Platform Users ({stats.total})</h2>
                <div className="glass" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '15px' }}>Name</th>
                                <th style={{ padding: '15px' }}>Email</th>
                                <th style={{ padding: '15px' }}>Role</th>
                                <th style={{ padding: '15px' }}>Phone</th>
                                <th style={{ padding: '15px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers.map((u) => (
                                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '15px' }}>{u.name || '-'}</td>
                                    <td style={{ padding: '15px' }}>{u.email}</td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            background: u.role === 'admin' ? '#fdcb6e' : u.role === 'business' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                            color: u.role === 'admin' ? 'black' : 'white',
                                            padding: '2px 8px',
                                            borderRadius: '5px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        {u.phoneNumber ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{u.phonePrefix} {u.phoneNumber}</span>
                                                <a
                                                    href={`https://wa.me/${(u.phonePrefix + u.phoneNumber).replace(/\+/g, '')}`}
                                                    target="_blank"
                                                    title="Open in WhatsApp"
                                                    style={{ color: '#2ecc71', fontSize: '1.1rem', textDecoration: 'none' }}
                                                >
                                                    💬
                                                </a>
                                            </div>
                                        ) : (
                                            <span style={{ opacity: 0.3 }}>N/A</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '15px' }}>{u.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <style jsx>{`
                .container {
                    padding-top: 50px;
                    padding-bottom: 50px;
                }
                .card {
                    padding: 25px;
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    border-color: var(--primary);
                }
            `}</style>
        </div>
    );
}
