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
        <div style={{ maxWidth: '400px', margin: '50px auto' }} className="glass card">
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{isLogin ? 'Login' : 'Register'}</h2>
            {error && <p style={{ color: 'var(--accent)', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {!isLogin && (
                    <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'center' }}>
                            <label>
                                <input
                                    type="radio"
                                    name="role"
                                    value="person"
                                    checked={formData.role === 'person'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                /> Person
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="role"
                                    value="business"
                                    checked={formData.role === 'business'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                /> Business
                            </label>
                        </div>

                        <input
                            type="text"
                            placeholder={formData.role === 'business' ? "Business Name" : "Full Name"}
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />

                        {formData.role === 'business' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={{ fontSize: '0.85rem', opacity: 0.8, marginLeft: '5px' }}>Business Mobile Number (WhatsApp)</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        className="input"
                                        style={{ width: '100px', cursor: 'pointer' }}
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
                                        className="input"
                                        style={{ flex: 1 }}
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        required={formData.role === 'business'}
                                    />
                                </div>
                                <p style={{ fontSize: '0.7rem', opacity: 0.6, margin: '0 5px' }}>This number will be used by customers to contact you via WhatsApp.</p>
                            </div>
                        )}
                    </>
                )}
                <input
                    type="email"
                    placeholder="Email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
                <button type="submit" className="btn">{isLogin ? 'Login' : 'Register'}</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => setIsLogin(!isLogin)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </p>
        </div>
    );
}
