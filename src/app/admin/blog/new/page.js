'use client';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewBlogPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const editorRef = useRef(null);

    const [title, setTitle] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [tags, setTags] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [showImageDialog, setShowImageDialog] = useState(false);
    const [savedSelection, setSavedSelection] = useState(null);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, loading, router]);

    const execCmd = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
    };

    const saveSelection = () => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            setSavedSelection(sel.getRangeAt(0).cloneRange());
        }
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
            `<figure style="margin: 20px 0; text-align: center;">
                <img src="${imageUrlInput}" alt="Blog image" style="max-width: 100%; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.4);" />
            </figure>`
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
            const res = await fetch('/api/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
                alert(data.error || 'Failed to publish');
            }
        } catch (err) {
            alert('Error publishing blog');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) return <div className="container" style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
    if (user.role !== 'admin') return null;

    return (
        <div className="container-wide max-w-[900px] mt-10 mb-20 bg-white p-8 md:p-12 rounded-3xl shadow-airbnb border border-border-light">
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-border-light">
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">✍️ New Blog Post</h1>
                <Link href="/admin" className="text-text-secondary hover:text-brand font-bold transition-colors">← Back to Admin</Link>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                {/* Title */}
                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">Blog Title *</label>
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Historic Places in Korça"
                        className="input font-bold text-lg"
                        required
                    />
                </div>

                {/* Cover Image URL */}
                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">Cover Image URL</label>
                    <input
                        value={coverImage}
                        onChange={e => setCoverImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="input"
                    />
                    {coverImage && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-border-light max-h-[300px]">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Rich Text Editor */}
                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">Content *</label>

                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-2 p-3 bg-bg-light border border-border-light border-b-0 rounded-t-xl items-center">
                        {[
                            { label: 'H1', cmd: 'formatBlock', val: 'h1', title: 'Heading 1' },
                            { label: 'H2', cmd: 'formatBlock', val: 'h2', title: 'Heading 2' },
                            { label: 'H3', cmd: 'formatBlock', val: 'h3', title: 'Heading 3' },
                            { label: 'P', cmd: 'formatBlock', val: 'p', title: 'Paragraph' },
                        ].map(btn => (
                            <button key={btn.label} type="button" title={btn.title}
                                onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd, btn.val); }}
                                className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">
                                {btn.label}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-border-light mx-1" />
                        {[
                            { label: 'B', cmd: 'bold', title: 'Bold' },
                            { label: 'I', cmd: 'italic', title: 'Italic' },
                            { label: 'U', cmd: 'underline', title: 'Underline' },
                        ].map(btn => (
                            <button key={btn.label} type="button" title={btn.title}
                                onMouseDown={e => { e.preventDefault(); execCmd(btn.cmd); }}
                                className={`px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm text-text-primary hover:text-brand transition-colors shadow-sm ${btn.label === 'I' ? 'italic' : ''} ${btn.label === 'B' ? 'font-bold' : 'font-medium'}`}>
                                {btn.label}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-border-light mx-1" />
                        <button type="button" title="Unordered List"
                            onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
                            className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">• List</button>
                        <button type="button" title="Ordered List"
                            onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}
                            className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">1. List</button>
                        <button type="button" title="Blockquote"
                            onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', 'blockquote'); }}
                            className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">" Quote</button>
                        <div className="w-[1px] h-6 bg-border-light mx-1" />
                        <button type="button" title="Insert Image URL"
                            onMouseDown={e => { e.preventDefault(); saveSelection(); setShowImageDialog(true); }}
                            className="px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-lg text-sm font-bold text-brand hover:brightness-90 transition-colors shadow-sm">
                            🖼️ Image
                        </button>
                        <button type="button" title="Insert Link"
                            onMouseDown={e => {
                                e.preventDefault();
                                const url = prompt('Enter URL:');
                                if (url) execCmd('createLink', url);
                            }}
                            className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">🔗 Link</button>
                        <button type="button" title="Horizontal Line"
                            onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
                            className="px-3 py-1.5 bg-white border border-border-light rounded-lg text-sm font-bold text-text-primary hover:text-brand transition-colors shadow-sm">― Line</button>
                    </div>

                    {/* Image URL Dialog */}
                    {showImageDialog && (
                        <div className="p-4 bg-brand/5 border border-brand/20 border-b-0 flex gap-3 items-center">
                            <input
                                autoFocus
                                value={imageUrlInput}
                                onChange={e => setImageUrlInput(e.target.value)}
                                placeholder="Paste image URL here..."
                                className="input flex-1 m-0"
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImage(); } if (e.key === 'Escape') setShowImageDialog(false); }}
                            />
                            <button type="button" className="btn-primary py-2 px-6" onClick={insertImage}>Insert</button>
                            <button type="button" className="px-6 py-2 bg-bg-light hover:bg-border-light rounded-xl font-bold transition-all text-text-primary" onClick={() => setShowImageDialog(false)}>Cancel</button>
                        </div>
                    )}

                    {/* Editor */}
                    <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        data-placeholder="Start writing your blog post here... Click the toolbar above to add headings, bold text, images, and more."
                        className="min-h-[400px] p-6 bg-white border border-border-light rounded-b-xl text-text-primary text-lg leading-relaxed whitespace-pre-wrap outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-inner"
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block mb-2 text-text-secondary font-bold text-sm uppercase tracking-wide">Tags (comma-separated)</label>
                    <input
                        value={tags}
                        onChange={e => setTags(e.target.value)}
                        placeholder="e.g. history, korça, travel, tourism"
                        className="input"
                    />
                </div>

                {/* SEO Section */}
                <div className="bg-bg-light p-6 rounded-2xl border border-border-light space-y-4">
                    <h3 className="text-brand font-bold text-lg flex items-center gap-2">🔍 SEO Settings</h3>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block mb-2 text-text-secondary font-bold text-sm">SEO Title (optional)</label>
                            <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={title || "SEO Title for Google"} className="input" />
                        </div>
                        <div>
                            <label className="block mb-2 text-text-secondary font-bold text-sm">SEO Description (shown in Google search results, max 160 chars)</label>
                            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Brief description that will appear under your title in Google results..." className="input resize-y min-h-[100px]" maxLength={160} />
                            <div className={`text-xs mt-2 font-bold text-right ${seoDescription.length > 140 ? 'text-red-500' : 'text-text-secondary'}`}>
                                {seoDescription.length}/160
                            </div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-lg mt-4" disabled={saving}>
                    {saving ? '⏳ Publishing...' : '🚀 Publish Blog Post'}
                </button>
            </form>

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: rgba(0,0,0,0.3);
                    pointer-events: none;
                }
                [contenteditable]:focus { outline: none; }
                [contenteditable] h1 { font-size: 2rem; font-weight: 800; margin: 20px 0 10px; }
                [contenteditable] h2 { font-size: 1.6rem; font-weight: 700; margin: 18px 0 8px; color: var(--color-brand); }
                [contenteditable] h3 { font-size: 1.3rem; font-weight: 600; margin: 15px 0 6px; }
                [contenteditable] p { margin: 0 0 12px; line-height: 1.8; }
                [contenteditable] blockquote { border-left: 4px solid var(--color-brand); padding: 10px 20px; margin: 15px 0; background: rgba(255,90,0,0.05); border-radius: 0 8px 8px 0; font-style: italic; color: var(--color-text-secondary); }
                [contenteditable] ul, [contenteditable] ol { padding-left: 25px; margin: 10px 0; list-style-position: inside; }
                [contenteditable] ul { list-style-type: disc; }
                [contenteditable] ol { list-style-type: decimal; }
                [contenteditable] li { margin-bottom: 6px; line-height: 1.7; }
                [contenteditable] img { max-width: 100%; border-radius: 12px; }
                [contenteditable] hr { border: none; border-top: 1px solid var(--color-border-light); margin: 25px 0; }
                [contenteditable] a { color: var(--color-brand); text-decoration: underline; }
            `}</style>
        </div>
    );
}
