'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const DESCRIPTION_LIMIT = 160;

export default function TouristBudgetsPage() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null); // null = create mode, object = edit mode
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        budget: '',
        whatsappNumber: '',
        instagramLink: '',
        facebookLink: ''
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchBudgets();
    }, []);

    const fetchBudgets = async () => {
        try {
            const res = await fetch('/api/budgets');
            const data = await res.json();
            if (data.success) {
                setBudgets(data.budgets);
            }
        } catch (err) {
            console.error('Error fetching budgets:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        if (!user) {
            setError('Please log in to post your budget.');
            setMessage('You need to be logged in with a personal/visitor account to post a budget request.');
            setEditingBudget(null);
            setModalOpen(true);
            return;
        }

        if (user.role !== 'person' && user.role !== 'admin') {
            setError('Only visitor/client accounts can post budgets.');
            setMessage('As a business account, you are encouraged to contact these tourists, but you cannot post a tourist budget yourself.');
            setEditingBudget(null);
            setModalOpen(true);
            return;
        }

        setEditingBudget(null);
        setFormData({
            title: '',
            description: '',
            budget: '',
            whatsappNumber: user.phoneNumber ? ((user.phonePrefix || '') + user.phoneNumber) : '',
            instagramLink: '',
            facebookLink: ''
        });
        setError('');
        setMessage('');
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingBudget(item);
        setFormData({
            title: item.title || '',
            description: item.description || '',
            budget: item.budget || '',
            whatsappNumber: item.whatsappNumber || '',
            instagramLink: item.instagramLink || '',
            facebookLink: item.facebookLink || ''
        });
        setError('');
        setMessage('');
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user || (user.role !== 'person' && user.role !== 'admin')) return;

        setError('');
        setSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const isEdit = !!editingBudget;
            const url = isEdit ? `/api/budgets?id=${editingBudget._id}` : '/api/budgets';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (data.success) {
                if (isEdit) {
                    setBudgets(prev => prev.map(b => b._id === editingBudget._id ? data.budget : b));
                } else {
                    setBudgets(prev => [data.budget, ...prev]);
                }
                setModalOpen(false);
                setEditingBudget(null);
                setFormData({ title: '', description: '', budget: '', whatsappNumber: '', instagramLink: '', facebookLink: '' });
            } else {
                setError(data.error || (isEdit ? 'Failed to update post.' : 'Failed to submit budget request.'));
            }
        } catch (err) {
            setError('Failed to connect to server.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (budgetId) => {
        if (!confirm('Are you sure you want to delete this budget request?')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/budgets?id=${budgetId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setBudgets(prev => prev.filter(b => b._id !== budgetId));
            } else {
                alert(data.error || 'Failed to delete budget request.');
            }
        } catch (err) {
            alert('Failed to connect to server.');
        }
    };

    const cleanPhone = (num) => {
        if (!num) return '';
        return num.replace(/[^\d]/g, '');
    };

    const formatLink = (url) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const getInitialsAvatar = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarBg = (name) => {
        if (!name) return 'bg-brand/10 text-brand';
        const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [
            'bg-pink-100 text-pink-700', 'bg-purple-100 text-purple-700',
            'bg-indigo-100 text-indigo-700', 'bg-blue-100 text-blue-700',
            'bg-teal-100 text-teal-700', 'bg-emerald-100 text-emerald-700',
            'bg-amber-100 text-amber-700', 'bg-orange-100 text-orange-700',
            'bg-rose-100 text-rose-700',
        ];
        return colors[charCodeSum % colors.length];
    };

    // Determine modal header label
    const getModalTitle = () => {
        if (error && !user) return 'Authentication Required';
        if (user && user.role !== 'person' && user.role !== 'admin') return 'Invalid Account Type';
        return editingBudget ? 'Edit Your Request' : 'Post Your Request';
    };

    return (
        <main className="container-wide py-12 space-y-10 min-h-screen">
            {/* Page Header */}
            <section className="text-center space-y-4 max-w-3xl mx-auto">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand bg-brand/10 px-4 py-2 rounded-full">Tourist Hub</span>
                <h1 className="text-4xl md:text-5xl font-black text-text-primary tracking-tight leading-tight">
                    Visitor Requests &amp; <span className="text-brand">Budgets</span>
                </h1>
                <p className="text-lg text-text-secondary font-medium px-4">
                    Tourists and travelers publish their budgets, dates, and accommodation/service needs. Businesses can view posts and contact them directly.
                </p>
                <div className="pt-4">
                    <button
                        onClick={openCreateModal}
                        className="bg-brand hover:bg-brand-hover text-white px-8 py-4 rounded-2xl font-bold shadow-soft transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                        📝 Post My Budget / Request
                    </button>
                </div>
            </section>

            {/* List / Grid of Budgets */}
            {loading ? (
                <div className="text-center py-20 font-bold text-text-secondary">Loading budgets...</div>
            ) : budgets.length === 0 ? (
                <div className="bg-bg-light rounded-[2rem] p-12 text-center border border-border-light max-w-lg mx-auto space-y-4">
                    <div className="text-5xl">🛎️</div>
                    <h2 className="text-xl font-bold text-text-primary">No requests posted yet</h2>
                    <p className="text-text-secondary text-sm">
                        Be the first tourist to request services by posting your budget range and contact links!
                    </p>
                    <button onClick={openCreateModal} className="btn-outline text-sm py-2 px-5">
                        Post Request
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {budgets.map((item) => {
                        const posterName = item.user?.name || 'Visitor';
                        const isOwner = user && (user._id === item.user?._id || user.role === 'admin');
                        const isLong = item.description && item.description.length > DESCRIPTION_LIMIT;
                        const displayDesc = isLong
                            ? item.description.slice(0, DESCRIPTION_LIMIT) + '…'
                            : item.description;

                        return (
                            <div
                                key={item._id}
                                className="bg-white rounded-[2rem] border border-border-light/40 p-6 shadow-soft hover:shadow-airbnb hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                            >
                                <div className="space-y-4">
                                    {/* Card Header (Poster Info + Actions) */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {item.user?.image ? (
                                                <img
                                                    src={item.user.image}
                                                    alt={posterName}
                                                    className="w-10 h-10 rounded-full object-cover border border-border-light/35"
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${getAvatarBg(posterName)}`}>
                                                    {getInitialsAvatar(posterName)}
                                                </div>
                                            )}
                                            <div>
                                                <h4 className="font-extrabold text-sm text-text-primary leading-tight">{posterName}</h4>
                                                <span className="text-[10px] text-text-secondary font-semibold">
                                                    📅 {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Owner action buttons */}
                                        {isOwner && (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="p-2 hover:bg-blue-50 text-blue-500 rounded-full hover:scale-105 active:scale-90 transition-all cursor-pointer"
                                                    title="Edit Post"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="p-2 hover:bg-rose-50 text-rose-500 rounded-full hover:scale-105 active:scale-90 transition-all cursor-pointer"
                                                    title="Delete Post"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Content */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xl font-bold text-text-primary tracking-tight line-clamp-1">{item.title}</h3>
                                            <span className="bg-brand/10 text-brand text-xs font-black px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1">
                                                💰 {item.budget}
                                            </span>
                                        </div>
                                        <p className="text-sm text-text-secondary leading-relaxed font-medium break-words overflow-hidden">
                                            {displayDesc}
                                        </p>
                                        {isLong && (
                                            <Link
                                                href={`/budgets/${item._id}`}
                                                className="inline-flex items-center gap-1 text-brand text-xs font-bold hover:underline mt-1 transition-all"
                                            >
                                                Read more →
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Contact Action Buttons */}
                                <div className="pt-6 border-t border-border-light/30 mt-6 space-y-3">
                                    <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest block text-center">
                                        Contact Tourist Directly
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        {item.whatsappNumber ? (
                                            <a
                                                href={`https://wa.me/${cleanPhone(item.whatsappNumber)}`}
                                                target="_blank"
                                                className="bg-[#25D366] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-soft"
                                                title="WhatsApp message"
                                            >
                                                💬 WA
                                            </a>
                                        ) : (
                                            <span className="bg-bg-light text-text-secondary/40 py-2.5 rounded-xl text-xs flex items-center justify-center border border-dashed select-none">
                                                💬 N/A
                                            </span>
                                        )}

                                        {item.instagramLink ? (
                                            <a
                                                href={formatLink(item.instagramLink)}
                                                target="_blank"
                                                className="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-soft"
                                                title="Instagram Profile"
                                            >
                                                📸 IG
                                            </a>
                                        ) : (
                                            <span className="bg-bg-light text-text-secondary/40 py-2.5 rounded-xl text-xs flex items-center justify-center border border-dashed select-none">
                                                📸 N/A
                                            </span>
                                        )}

                                        {item.facebookLink ? (
                                            <a
                                                href={formatLink(item.facebookLink)}
                                                target="_blank"
                                                className="bg-[#1877F2] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all shadow-soft"
                                                title="Facebook Profile"
                                            >
                                                👥 FB
                                            </a>
                                        ) : (
                                            <span className="bg-bg-light text-text-secondary/40 py-2.5 rounded-xl text-xs flex items-center justify-center border border-dashed select-none">
                                                👥 N/A
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Post / Edit Modal Dialog */}
            {modalOpen && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-airbnb border border-border-light overflow-hidden p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-2xl font-black text-text-primary tracking-tight">
                                {getModalTitle()}
                            </h2>
                            <button
                                onClick={() => { setModalOpen(false); setEditingBudget(null); }}
                                className="text-2xl text-text-secondary hover:text-black font-bold p-1 rounded-full active:scale-90 transition-all cursor-pointer"
                            >
                                ×
                            </button>
                        </div>

                        {/* Error Warning Block for Unauthorized */}
                        {error && (!user || (user.role !== 'person' && user.role !== 'admin')) ? (
                            <div className="space-y-6 text-center py-4">
                                <div className="text-5xl">🔒</div>
                                <p className="text-text-secondary text-sm font-medium leading-relaxed">
                                    {message}
                                </p>
                                <div className="pt-2 flex flex-col gap-3">
                                    {!user ? (
                                        <Link
                                            href="/login"
                                            onClick={() => setModalOpen(false)}
                                            className="w-full bg-brand text-white py-3.5 rounded-xl font-bold hover:bg-brand-hover transition-colors shadow-soft text-center block"
                                        >
                                            Log In to Post
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={() => setModalOpen(false)}
                                            className="w-full bg-text-primary text-white py-3.5 rounded-xl font-bold hover:bg-black transition-colors shadow-soft"
                                        >
                                            Close Panel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Budget Create / Edit Form */
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="bg-rose-50 text-rose-500 font-semibold p-3.5 rounded-xl text-xs border border-rose-100">
                                        ⚠️ {error}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">Title / What you need</label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Guesthouse for 3 nights in Korçë"
                                        className="input-airbnb"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">Budget / Price Range</label>
                                    <input
                                        type="text"
                                        name="budget"
                                        required
                                        value={formData.budget}
                                        onChange={handleInputChange}
                                        placeholder="e.g., €40/night, €120 max total"
                                        className="input-airbnb"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">Detailed Requirements</label>
                                    <textarea
                                        name="description"
                                        required
                                        rows={4}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe what you are looking for (dates, room requirements, location preference, number of people etc.)"
                                        className="input-airbnb h-28 resize-none py-3"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">WhatsApp Number</label>
                                    <input
                                        type="text"
                                        name="whatsappNumber"
                                        required
                                        value={formData.whatsappNumber}
                                        onChange={handleInputChange}
                                        placeholder="e.g., +355691234567"
                                        className="input-airbnb"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">Instagram Link (Optional)</label>
                                    <input
                                        type="text"
                                        name="instagramLink"
                                        value={formData.instagramLink}
                                        onChange={handleInputChange}
                                        placeholder="e.g., instagram.com/myusername"
                                        className="input-airbnb"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-black text-text-primary uppercase tracking-wider block">Facebook Link (Optional)</label>
                                    <input
                                        type="text"
                                        name="facebookLink"
                                        value={formData.facebookLink}
                                        onChange={handleInputChange}
                                        placeholder="e.g., facebook.com/myprofile"
                                        className="input-airbnb"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => { setModalOpen(false); setEditingBudget(null); }}
                                        className="flex-1 bg-bg-light hover:bg-border-light/50 text-text-primary py-3.5 rounded-xl font-bold transition-all text-center border cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-brand hover:bg-brand-hover text-white py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-soft"
                                    >
                                        {submitting ? (editingBudget ? 'Saving...' : 'Publishing...') : (editingBudget ? '💾 Save Changes' : 'Publish Request')}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
