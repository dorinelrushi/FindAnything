'use client';
import { useState, useRef, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditBlogPage({ params }) {
    const { slug } = use(params);
    const { user, loading } = useAuth();
    const router = useRouter();
    const editorRef = useRef(null);

    const [title, setTitle] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [tags, setTags] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [loadingBlog, setLoadingBlog] = useState(true);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [savedSelection, setSavedSelection] = useState(null);
    const [originalSlug, setOriginalSlug] = useState(slug);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        fetchBlog();
    }, [slug]);

    const fetchBlog = async () => {
        try {
            const res = await fetch(`/api/blog/${slug}`);
            const data = await res.json();
            if (data.blog) {
                const b = data.blog;
                setTitle(b.title);
                setCoverImage(b.coverImage || '');
                setTags((b.tags || []).join(', '));
                setSeoTitle(b.seoTitle || '');
                setSeoDescription(b.seoDescription || '');
                setOriginalSlug(b.slug);
                // Set editor content after render
                setTimeout(() => {
                    if (editorRef.current) editorRef.current.innerHTML = b.content;
                }, 100);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingBlog(false);
        }
    };

    const execCmd = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) setSavedSelection(sel.getRangeAt(0).cloneRange());
    };

    const restoreSelection = () => {
        if (savedSelection) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(savedSelection);
        }
    };

    const insertImage = () => {
        if (!imageUrlInput.trim()) return;
        restoreSelection();
        editorRef.current?.focus();
        document.execCommand('insertHTML', false,
            `<figure style="margin: 20px 0; text-align: center;"><img src="${imageUrlInput}" alt="Blog image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.4);" /></figure>`
        );
        setImageUrlInput('');
        setShowImageDialog(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const content = editorRef.current?.innerHTML || '';
        if (!title.trim() || !content || content === '<br>') {
            alert('Please fill in the title and content');
            return;
        }
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/blog/${originalSlug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    title,
                    content,
                    coverImage,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    seoTitle: seoTitle || title,
                    seoDescription,
                    published: true
                })
            });
            const data = await res.json();
            if (res.ok) {
                router.push(`/blog/${data.blog.slug}`);
            } else {
                alert(data.error || 'Failed to update');
            }
        } catch (err) {
            alert('Error updating blog');
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingBlog || !user) return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
    if (user.role !== 'admin') return null;

    const toolBtn = { padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' };

    return (
        <div className="container" style={{ maxWidth: '900px', marginTop: '40px', marginBottom: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: '800' }}>✏️ Edit Blog Post</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href={`/blog/${originalSlug}`} className="btn" style={{ background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>👁️ View</Link>
                    <Link href="/admin" className="btn" style={{ background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>← Admin</Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: '600' }}>Blog Title *</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Blog Title" className="input" required style={{ fontSize: '1.2rem', fontWeight: '600' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: '600' }}>Cover Image URL</label>
                    <input value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://example.com/image.jpg" className="input" />
                    {coverImage && <img src={coverImage} alt="Cover" style={{ marginTop: '10px', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '12px' }} />}
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: '600' }}>Content *</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none', borderRadius: '12px 12px 0 0' }}>
                        {[{ label: 'H1', cmd: 'formatBlock', val: 'h1' }, { label: 'H2', cmd: 'formatBlock', val: 'h2' }, { label: 'H3', cmd: 'formatBlock', val: 'h3' }, { label: 'P', cmd: 'formatBlock', val: 'p' }].map(btn => (
                            <button key={btn.label} type="button" onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val); }} style={toolBtn}>{btn.label}</button>
                        ))}
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
                        {[{ label: 'B', cmd: 'bold' }, { label: 'I', cmd: 'italic' }, { label: 'U', cmd: 'underline' }].map(btn => (
                            <button key={btn.label} type="button" onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd); }} style={{ ...toolBtn, fontStyle: btn.label === 'I' ? 'italic' : 'normal', fontWeight: btn.label === 'B' ? 'bold' : 'normal' }}>{btn.label}</button>
                        ))}
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
                        <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }} style={toolBtn}>• List</button>
                        <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }} style={toolBtn}>1. List</button>
                        <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }} style={toolBtn}>" Quote</button>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
                        <button type="button" onMouseDown={e => { e.preventDefault(); saveSelection(); setShowImageDialog(true); }} style={{ ...toolBtn, background: 'rgba(162,155,254,0.2)', color: '#a29bfe' }}>🖼️ Image</button>
                        <button type="button" onMouseDown={e => { e.preventDefault(); const url = prompt('Enter URL:'); if (url) execCmd('createLink', url); }} style={toolBtn}>🔗 Link</button>
                        <button type="button" onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule'); }} style={toolBtn}>― Line</button>
                    </div>
                    {showImageDialog && (
                        <div style={{ padding: '15px', background: 'rgba(162,155,254,0.1)', border: '1px solid rgba(162,155,254,0.3)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input autoFocus value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="Paste image URL here..." className="input" style={{ flex: 1, margin: 0 }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImage(); } if (e.key === 'Escape') setShowImageDialog(false); }} />
                            <button type="button" className="btn" onClick={insertImage} style={{ background: '#a29bfe' }}>Insert</button>
                            <button type="button" className="btn" onClick={() => setShowImageDialog(false)} style={{ background: 'rgba(255,255,255,0.1)' }}>Cancel</button>
                        </div>
                    )}
                    <div ref={editorRef} contentEditable suppressContentEditableWarning data-placeholder="Start writing..." style={{ minHeight: '400px', padding: '25px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0 0 12px 12px', color: 'white', fontSize: '1.05rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', overflowY: 'auto' }} />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontWeight: '600' }}>Tags (comma-separated)</label>
                    <input value={tags} onChange={e => setTags(e.target.value)} placeholder="history, korça, travel" className="input" />
                </div>

                <div className="glass" style={{ padding: '20px', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#a29bfe' }}>🔍 SEO Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#ccc', fontSize: '0.9rem' }}>SEO Title</label>
                            <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title} className="input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#ccc', fontSize: '0.9rem' }}>SEO Description (max 160 chars)</label>
                            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Description shown in Google..." className="input" rows={3} maxLength={160} style={{ resize: 'vertical' }} />
                            <span style={{ fontSize: '0.75rem', color: seoDescription.length > 140 ? '#ff7675' : '#888' }}>{seoDescription.length}/160</span>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn" disabled={saving} style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', fontSize: '1.1rem', padding: '15px' }}>
                    {saving ? '⏳ Saving...' : '💾 Save Changes'}
                </button>
            </form>

            <style jsx>{`
                [contenteditable]:empty:before { content: attr(data-placeholder); color: rgba(255,255,255,0.2); pointer-events: none; }
                [contenteditable]:focus { outline: none; }
                [contenteditable] h1 { font-size: 2rem; font-weight: 800; margin: 20px 0 10px; }
                [contenteditable] h2 { font-size: 1.6rem; font-weight: 700; margin: 18px 0 8px; color: #a29bfe; }
                [contenteditable] h3 { font-size: 1.3rem; font-weight: 600; margin: 15px 0 6px; color: #fd79a8; }
                [contenteditable] p { margin: 0 0 12px; line-height: 1.8; }
                [contenteditable] blockquote { border-left: 4px solid #a29bfe; padding: 10px 20px; margin: 15px 0; background: rgba(162,155,254,0.05); border-radius: 0 8px 8px 0; font-style: italic; }
                [contenteditable] ul, [contenteditable] ol { padding-left: 25px; margin: 10px 0; }
                [contenteditable] li { margin-bottom: 6px; line-height: 1.7; }
                [contenteditable] img { max-width: 100%; border-radius: 12px; }
                [contenteditable] hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0; }
                [contenteditable] a { color: #a29bfe; text-decoration: underline; }
            `}</style>
        </div>
    );
}
