'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [stats, setStats] = useState({ pending: 0, total: 0 });
    const [blogs, setBlogs] = useState([]);
    const [listings, setListings] = useState([]);
    const [blogsLoaded, setBlogsLoaded] = useState(false);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchData();
            fetchBlogs();
            fetchListings();
        }
    }, [user]);

    const fetchListings = async () => {
        try {
            const res = await fetch('/api/admin/listings');
            const data = await res.json();
            if (data.listings) setListings(data.listings);
        } catch (error) {
            console.error('Failed to fetch listings', error);
        }
    };

    const fetchData = async () => {
        try {
            const resPending = await fetch('/api/admin/registrations');
            const dataPending = await resPending.json();
            if (dataPending.registrations) {
                setPendingRegistrations(dataPending.registrations);
                setStats(prev => ({ ...prev, pending: dataPending.registrations.length }));
            }

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

    const fetchBlogs = async () => {
        try {
            const res = await fetch('/api/blog?limit=50');
            const data = await res.json();
            if (data.blogs) setBlogs(data.blogs);
        } catch (err) {
            console.error('Failed to fetch blogs', err);
        } finally {
            setBlogsLoaded(true);
        }
    };

    const deleteBlog = async (slug) => {
        if (!confirm('Delete this post?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/blog/${slug}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setBlogs(prev => prev.filter(b => b.slug !== slug));
        } else {
            alert('Delete failed');
        }
    };

    const deleteListing = async (id) => {
        if (!confirm('Delete this listing permanently?')) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/listings?id=${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setListings(prev => prev.filter(l => l._id !== id));
        } else {
            alert('Delete failed');
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

    if (loading || !user || user.role !== 'admin') return <div className="container-wide py-20 text-center font-bold">Loading...</div>;

    return (
        <main className="min-h-screen bg-white">
            <div className="container-wide py-10 space-y-12">
                {/* 1. Header & Stats Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8">
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Platform Admin</span>
                        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">Admin Dashboard</h1>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-bg-light border border-border-light px-6 py-4 rounded-2xl flex items-center gap-4">
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Pending</div>
                            <div className="text-2xl font-black text-brand">{stats.pending}</div>
                        </div>
                        <div className="bg-bg-light border border-border-light px-6 py-4 rounded-2xl flex items-center gap-4">
                            <div className="text-xs font-bold text-text-secondary uppercase tracking-widest">Total Users</div>
                            <div className="text-2xl font-black text-text-primary">{stats.total}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Pending business Registrations Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                        <h2 className="text-xl font-bold text-text-primary">New Business Registrations</h2>
                    </div>

                    {pendingRegistrations.length === 0 ? (
                        <div className="py-16 bg-bg-light rounded-[32px] border border-border-light border-dashed text-center">
                            <p className="text-text-secondary font-medium italic">No pending registrations at the moment.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingRegistrations.map((reg) => (
                                <div key={reg._id} className="p-8 bg-white border border-border-light rounded-[24px] shadow-soft hover:shadow-airbnb transition-all space-y-6 flex flex-col">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-extrabold text-text-primary">{reg.name || 'No Name'}</h3>
                                        <p className="text-sm text-text-secondary font-medium">{reg.email}</p>
                                    </div>

                                    <div className="p-4 bg-bg-light rounded-xl space-y-2 border border-border-light">
                                        <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Business Contact</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">📱</span>
                                            <span className="text-base font-bold text-text-primary">{reg.phonePrefix} {reg.phoneNumber}</span>
                                        </div>
                                        {reg.phoneNumber && (
                                            <a 
                                                href={`https://wa.me/${(reg.phonePrefix + reg.phoneNumber).replace(/\+/g, '')}`} 
                                                target="_blank"
                                                className="text-xs font-bold text-[#25D366] flex items-center gap-1 hover:underline"
                                            >
                                                <span>💬 WhatsApp Business</span>
                                            </a>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 flex gap-3">
                                        <button 
                                            onClick={() => handleAction(reg._id, 'approved')}
                                            className="flex-1 bg-brand text-white py-3 rounded-xl font-bold text-sm shadow-soft hover:bg-brand-hover transition-colors"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleAction(reg._id, 'rejected')}
                                            className="flex-1 bg-bg-light text-text-secondary py-3 rounded-xl font-bold text-sm hover:bg-border-light transition-colors"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 3. Blog Management Section */}
                <section className="space-y-6 pt-10 border-t">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-text-primary">Blog Management</h2>
                        <Link href="/admin/blog/new" className="bg-text-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-black transition-colors">
                            ✍️ New Post
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {blogs.map(blog => (
                            <div key={blog._id} className="p-4 bg-white border border-border-light rounded-2xl flex items-center gap-4 hover:shadow-soft transition-all group">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-bg-light flex-shrink-0">
                                    <img src={blog.coverImage || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-text-primary truncate">{blog.title}</h3>
                                    <p className="text-[10px] text-text-secondary uppercase font-black tracking-widest">{new Date(blog.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link href={`/admin/blog/edit/${blog.slug}`} className="p-2 hover:bg-bg-light rounded-lg text-text-secondary">
                                        ✏️
                                    </Link>
                                    <button onClick={() => deleteBlog(blog.slug)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Business Listings Management Section */}
                <section className="space-y-6 pt-10 border-t">
                    <h2 className="text-xl font-bold text-text-primary">Business Listings</h2>
                    <div className="overflow-x-auto rounded-[24px] border border-border-light shadow-soft">
                        <table className="w-full text-left">
                            <thead className="bg-bg-light border-b border-border-light">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Listing</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Owner</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {listings.map((l) => (
                                    <tr key={l._id} className="hover:bg-bg-light/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg-light flex-shrink-0">
                                                    <img src={l.image || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="font-bold text-text-primary truncate max-w-[200px]">{l.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-text-primary">{l.owner?.name || 'Deleted User'}</div>
                                            <div className="text-[10px] text-text-secondary">{l.owner?.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-brand/10 text-brand px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider">{l.type}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">📍 {l.city}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Link href={`/${l.type}/${l.slug || l._id}`} target="_blank" className="p-2 hover:bg-bg-light rounded-lg text-text-secondary">
                                                    👁️
                                                </Link>
                                                <button onClick={() => deleteListing(l._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {listings.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-text-secondary italic">No listings created yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 5. User List Table Section */}
                <section className="space-y-6 pt-10 border-t">
                    <h2 className="text-xl font-bold text-text-primary">All Users</h2>
                    <div className="overflow-x-auto rounded-[24px] border border-border-light shadow-soft">
                        <table className="w-full text-left">
                            <thead className="bg-bg-light border-b border-border-light">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Email</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Contact</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light">
                                {allUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-bg-light/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-text-primary">{u.name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-text-secondary">{u.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                                u.role === 'admin' ? 'bg-orange-100 text-orange-700' : 
                                                u.role === 'business' ? 'bg-brand/10 text-brand' : 
                                                'bg-bg-light text-text-secondary'
                                            }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {u.phoneNumber ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-text-primary">{u.phonePrefix} {u.phoneNumber}</span>
                                                    <a href={`https://wa.me/${(u.phonePrefix + u.phoneNumber).replace(/\+/g, '')}`} target="_blank" className="text-[#25D366]">💬</a>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold ${u.status === 'approved' ? 'text-green-600' : 'text-orange-500'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
