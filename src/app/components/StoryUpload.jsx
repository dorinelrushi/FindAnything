'use client';
import { useState } from 'react';

export default function StoryUpload({ onStoryUploaded }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

            const storyRes = await fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: uploadData.url })
            });
            const storyData = await storyRes.json();
            if (!storyRes.ok) throw new Error(storyData.error || 'Failed to save story');

            if (onStoryUploaded) onStoryUploaded();
            alert('Story u ngarkua me sukses!');
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="relative group overflow-hidden bg-white border-2 border-dashed border-border-light rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-brand hover:bg-brand/5 transition-all cursor-pointer min-w-[200px]">
            <div className="w-12 h-12 bg-bg-light rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {uploading ? '⏳' : '📸'}
            </div>
            
            <div className="text-center">
                <div className="text-sm font-bold text-text-primary">
                    {uploading ? 'Duke u ngarkuar...' : 'Shto një Story'}
                </div>
                {!uploading && (
                    <div className="text-[10px] font-medium text-text-secondary uppercase tracking-widest mt-1">
                        (Limit 3 në ditë)
                    </div>
                )}
            </div>

            <input 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                disabled={uploading} 
                className="absolute inset-0 opacity-0 cursor-pointer"
            />

            {error && (
                <div className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}
