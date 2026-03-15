'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'person',
        name: '',
        phoneNumber: '',
        phonePrefix: '+355'
    });
    const { login } = useAuth();
    const router = useRouter();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const url = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Something went wrong');

            if (isLogin) {
                login(data.user, data.token);
            } else {
                alert('Registration successful! Please login.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <main className="min-h-screen bg-bg-light flex items-center justify-center p-4">
            <div className="w-full max-w-[450px] bg-white rounded-3xl shadow-airbnb border border-border-light p-8 md:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-2 text-center">
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">
                        {isLogin ? 'Welcome back' : 'Join TryToFindEverything'}
                    </h1>
                    <p className="text-text-secondary font-medium">
                        {isLogin ? 'Please enter your details to sign in.' : 'Create an account to get started.'}
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold text-center animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div className="space-y-5">
                            <div className="flex bg-bg-light p-1 rounded-xl">
                                <label className={`flex-1 text-center py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${formData.role === 'person' ? 'bg-white shadow-soft text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="person"
                                        className="hidden"
                                        checked={formData.role === 'person'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    /> 
                                    Personal User
                                </label>
                                <label className={`flex-1 text-center py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${formData.role === 'business' ? 'bg-white shadow-soft text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="business"
                                        className="hidden"
                                        checked={formData.role === 'business'}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    /> 
                                    Business Account
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">
                                    {formData.role === 'business' ? "Business Name" : "Full Name"}
                                </label>
                                <input
                                    type="text"
                                    placeholder={formData.role === 'business' ? "e.g. TryToFindEverything Agency" : "e.g. John Doe"}
                                    className="input-airbnb w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.role === 'business' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">WhatsApp Contact</label>
                                    <div className="flex gap-2">
                                        <select
                                            className="input-airbnb w-[120px] bg-white cursor-pointer"
                                            value={formData.phonePrefix}
                                            onChange={(e) => setFormData({ ...formData, phonePrefix: e.target.value })}
                                        >
                                            <option value="+355">+355 🇦🇱</option>
                                            <option value="+1">+1 🇺🇸</option>
                                            <option value="+39">+39 🇮🇹</option>
                                            <option value="+44">+44 🇬🇧</option>
                                            <option value="+49">+49 🇩🇪</option>
                                            <option value="+30">+30 🇬🇷</option>
                                        </select>
                                        <input
                                            type="tel"
                                            placeholder="Phone Number"
                                            className="input-airbnb flex-1"
                                            value={formData.phoneNumber}
                                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                            required={formData.role === 'business'}
                                        />
                                    </div>
                                    <p className="text-[10px] text-text-secondary font-medium ml-1">Customers will contact you via WhatsApp.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="e.g. hello@example.com"
                            className="input-airbnb w-full"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-text-secondary uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            className="input-airbnb w-full"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full py-4 text-lg mt-2 font-extrabold focus:outline-none focus:ring-4 focus:ring-brand/30">
                        {isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
                
                <div className="pt-6 border-t border-border-light text-center">
                    <p className="text-sm font-medium text-text-secondary">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-bold text-text-primary hover:text-brand transition-colors underline decoration-2 underline-offset-4"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}
