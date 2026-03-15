'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, login } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        image: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                email: user.email || '',
                image: user.image || ''
            }));
            setLoading(false);
        } else {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setFormData(prev => ({
                    ...prev,
                    name: parsedUser.name || '',
                    email: parsedUser.email || '',
                    image: parsedUser.image || ''
                }));
                setLoading(false);
            } else {
                router.push('/login');
            }
        }
        fetchProfile();
    }, [user, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/user/profile');
            if (res.status === 401) return; // Silent return if not logged in yet
            
            const data = await res.json();
            if (data.success) {
                setFormData(prev => ({
                    ...prev,
                    name: data.user.name || prev.name || '',
                    email: data.user.email || prev.email || '',
                    image: data.user.image || prev.image || ''
                }));
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, image: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password || undefined,
                    image: formData.image
                })
            });

            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Update local storage and auth context
                const updatedUser = { ...user, ...data.user };
                login(updatedUser, localStorage.getItem('token'));
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-text-secondary">Loading your profile...</div>;
    }

    return (
        <main className="min-h-screen bg-bg-light py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-[2.5rem] shadow-soft overflow-hidden border border-border-light">
                    {/* Header/Cover */}
                    <div className="h-48 bg-gradient-to-r from-brand to-rose-500 relative">
                        <div className="absolute -bottom-16 left-8 md:left-12">
                            <div className="relative group">
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] border-4 border-white shadow-lg overflow-hidden bg-bg-light">
                                    {formData.image ? (
                                        <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl font-black text-brand bg-brand/10">
                                            {formData.name?.charAt(0) || formData.email?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2rem]">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider">Change Photo</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 pb-12 px-8 md:px-12">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                            <div>
                                <h1 className="text-3xl font-black text-text-primary tracking-tight">Profile Settings</h1>
                                <p className="text-text-secondary font-medium">Manage your personal information and security.</p>
                            </div>
                            {message.text && (
                                <div className={`px-6 py-3 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${
                                    message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                }`}>
                                    {message.text}
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Personal Info */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center text-brand">👤</span>
                                    Personal Information
                                </h2>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        className="w-full px-5 py-4 rounded-2xl border border-border-light focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium"
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        className="w-full px-5 py-4 rounded-2xl border border-border-light focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            {/* Security */}
                            <div className="space-y-6">
                                <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">🔒</span>
                                    Security & Password
                                </h2>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">New Password</label>
                                    <input 
                                        type="password" 
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full px-5 py-4 rounded-2xl border border-border-light focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium"
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-text-secondary ml-1">Confirm New Password</label>
                                    <input 
                                        type="password" 
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="w-full px-5 py-4 rounded-2xl border border-border-light focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none transition-all font-medium"
                                        placeholder="Confirm your new password"
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-6 flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={saving}
                                    className={`bg-brand text-white px-10 py-4 rounded-[1.5rem] font-black shadow-airbnb hover:bg-brand-hover transition-all active:scale-95 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Saving Changes...
                                        </>
                                    ) : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="mt-8 text-center text-text-secondary text-sm font-medium">
                    Account created on {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown date'}
                </div>
            </div>
        </main>
    );
}
