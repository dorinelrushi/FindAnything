'use client';
import { useRouter } from 'next/navigation';

export default function BlogActions({ slug, userRole }) {
    const router = useRouter();
    const isAdmin = userRole === 'admin';

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this story?')) return;
        try {
            const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' });
            if (res.ok) router.push('/blog');
        } catch (e) {
            console.error(e);
        }
    };

    if (!isAdmin) return null;

    return (
        <div className="flex gap-4">
            <button 
                onClick={() => router.push(`/admin/blog/edit/${slug}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold"
            >
                Edit
            </button>
            <button 
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold"
            >
                Delete
            </button>
        </div>
    );
}
