'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BlogActions({ slug, userRole }) {
    const [deleting, setDeleting] = useState(false);
    const router = useRouter();

    if (userRole !== 'admin') return null;

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this blog post?')) return;
        setDeleting(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/blog/${slug}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                router.push('/blog');
            } else {
                alert('Failed to delete');
                setDeleting(false);
            }
        } catch (err) {
            alert('Error deleting blog');
            setDeleting(false);
        }
    };

    return (
        <div className="flex gap-3">
            <Link href={`/admin/blog/edit/${slug}`} className="px-4 py-2 bg-text-primary text-white rounded-xl text-xs font-bold shadow-soft hover:bg-black transition-colors">✏️ Edit</Link>
            <button 
                onClick={handleDelete} 
                disabled={deleting} 
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold shadow-soft hover:bg-red-100 transition-colors"
            >
                {deleting ? '⏳ Deleting...' : '🗑️ Delete'}
            </button>
        </div>
    );
}
