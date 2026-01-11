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
            // Upload the file
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

            // Save story to DB
            const storyRes = await fetch('/api/stories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: uploadData.url })
            });
            const storyData = await storyRes.json();

            if (!storyRes.ok) throw new Error(storyData.error || 'Failed to save story');

            if (onStoryUploaded) onStoryUploaded();
            alert('Story uploaded successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="story-upload-btn glass" style={{
            padding: '15px',
            borderRadius: '12px',
            background: 'linear-gradient(45deg, #6c5ce7, #a29bfe)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textAlign: 'center',
            minWidth: '150px'
        }}>
            <style jsx>{`
                .story-upload-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-2px);
                    transition: all 0.2s;
                }
                input[type="file"] {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    cursor: pointer;
                }
                .icon {
                    font-size: 2rem;
                }
            `}</style>

            <div className="icon">📸</div>
            <div style={{ fontWeight: 'bold' }}>{uploading ? 'Uploading...' : 'Add Story'}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>(3 daily limit)</div>

            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />

            {error && <div style={{ color: '#ff7675', fontSize: '0.8rem', marginTop: '5px' }}>{error}</div>}
        </div>
    );
}
