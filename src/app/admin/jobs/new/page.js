'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewJobPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        companyName: '',
        location: '',
        description: '',
        applicationLink: '',
    });

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const { title, companyName, location, description, applicationLink } = formData;
        if (!title.trim() || !companyName.trim() || !location.trim() || !description.trim() || !applicationLink.trim()) {
            setError('Please fill in all fields.');
            return;
        }

        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (res.ok) {
                router.push('/jobs');
            } else {
                setError(data.error || 'Failed to post job');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return <div className="container-wide py-20 text-center font-bold">Loading...</div>;
    }
    if (user.role !== 'admin') return null;

    return (
        <div className="container-wide max-w-[800px] mt-10 mb-20 bg-surface p-8 md:p-12 rounded-3xl shadow-airbnb border border-border-light">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-border-light">
                <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand">Admin Only</span>
                    <h1 className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">Post a Job</h1>
                </div>
                <div className="flex gap-4">
                    <Link href="/jobs" className="text-text-secondary hover:text-brand font-bold transition-colors text-sm">
                        View Jobs
                    </Link>
                    <Link href="/admin" className="text-text-secondary hover:text-brand font-bold transition-colors text-sm">
                        ← Admin
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">
                        Job Title *
                    </label>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Frontend Developer"
                        className="input font-bold text-lg"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">
                            Company Name *
                        </label>
                        <input
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            placeholder="e.g. TryToFindEverything"
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">
                            Location *
                        </label>
                        <input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Korça, Albania or Remote"
                            className="input"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">
                        Job Description *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe the role, requirements, benefits..."
                        className="input resize-y min-h-[180px]"
                        required
                    />
                </div>

                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">
                        Application Link (Apply Now button) *
                    </label>
                    <input
                        name="applicationLink"
                        value={formData.applicationLink}
                        onChange={handleChange}
                        placeholder="https://forms.google.com/... or mailto:hr@company.com"
                        className="input"
                        required
                    />
                    <p className="mt-2 text-xs text-text-secondary">
                        This URL opens when someone clicks &quot;Apply Now&quot; (Google Form, email, careers page, etc.)
                    </p>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium text-sm">
                        {error}
                    </div>
                )}

                <button type="submit" className="btn-primary w-full py-4 text-lg mt-2" disabled={saving}>
                    {saving ? 'Posting...' : 'Post Job'}
                </button>
            </form>
        </div>
    );
}
