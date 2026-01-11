'use client';
import { useEffect, useRef, useState } from 'react';

export default function RichTextEditor({ value, onChange, placeholder = "Describe your business..." }) {
    const editorRef = useRef(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (editorRef.current && value && !editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    if (!mounted) return <div className="input" style={{ minHeight: '500px', background: 'white' }}>Loading editor...</div>;

    return (
        <div className="rich-text-editor">
            <div className="toolbar">
                <button type="button" onClick={() => execCommand('bold')} title="Bold" className="tool-btn">
                    <strong>B</strong>
                </button>
                <button type="button" onClick={() => execCommand('italic')} title="Italic" className="tool-btn">
                    <em>I</em>
                </button>
                <button type="button" onClick={() => execCommand('underline')} title="Underline" className="tool-btn">
                    <u>U</u>
                </button>

                <span className="divider">|</span>

                <button type="button" onClick={() => execCommand('formatBlock', 'p')} title="Paragraph" className="tool-btn">
                    P
                </button>
                <button type="button" onClick={() => execCommand('formatBlock', 'h2')} title="Heading" className="tool-btn">
                    H2
                </button>

                <span className="divider">|</span>

                <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left" className="tool-btn">
                    ⬅
                </button>
                <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center" className="tool-btn">
                    ↔
                </button>
                <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right" className="tool-btn">
                    ➡
                </button>

                <span className="divider">|</span>

                <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List" className="tool-btn">
                    •
                </button>

                <span className="divider">|</span>

                <button type="button" onClick={insertLink} title="Insert Link" className="tool-btn">
                    🔗
                </button>
            </div>

            <div
                ref={editorRef}
                className="editor-content"
                contentEditable
                onInput={handleInput}
                data-placeholder={placeholder}
            />

            <style jsx>{`
                .rich-text-editor {
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    background: #ffffff;
                    overflow: hidden;
                    transition: border-color 0.2s;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .rich-text-editor:focus-within {
                    border-color: #6c5ce7;
                    box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
                }

                .toolbar {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 14px;
                    background: linear-gradient(to bottom, #fafafa, #f5f5f5);
                    border-bottom: 2px solid #e0e0e0;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                }

                .toolbar::-webkit-scrollbar {
                    height: 4px;
                }

                .toolbar::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 2px;
                }

                .tool-btn {
                    min-width: 36px;
                    height: 36px;
                    padding: 8px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #ffffff;
                    border: 1px solid #d0d0d0;
                    border-radius: 5px;
                    color: #1a1a1a;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s;
                    flex-shrink: 0;
                }

                .tool-btn:hover {
                    background: #f8f8f8;
                    border-color: #6c5ce7;
                    color: #6c5ce7;
                }

                .tool-btn:active {
                    background: #f0f0f0;
                }

                .divider {
                    color: #d0d0d0;
                    font-size: 18px;
                    user-select: none;
                    flex-shrink: 0;
                    padding: 0 2px;
                }

                .editor-content {
                    min-height: 500px;
                    max-height: 800px;
                    overflow-y: auto;
                    padding: 24px;
                    line-height: 1.7;
                    outline: none;
                    color: #000000;
                    background: #ffffff;
                    font-size: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    position: relative;
                }

                .editor-content::-webkit-scrollbar {
                    width: 8px;
                }

                .editor-content::-webkit-scrollbar-track {
                    background: #f8f8f8;
                }

                .editor-content::-webkit-scrollbar-thumb {
                    background: #d0d0d0;
                    border-radius: 4px;
                }

                .editor-content::-webkit-scrollbar-thumb:hover {
                    background: #b0b0b0;
                }

                .editor-content:empty::before {
                    content: attr(data-placeholder);
                    color: #999999;
                    font-size: 16px;
                    line-height: 1.7;
                    position: absolute;
                    pointer-events: none;
                }

                .editor-content:focus::before {
                    color: #bbbbbb;
                }

                .editor-content :global(h2) {
                    font-size: 24px;
                    margin: 18px 0 14px 0;
                    font-weight: 700;
                    color: #000000;
                    line-height: 1.4;
                }

                .editor-content :global(p) {
                    margin: 10px 0;
                    color: #000000;
                }

                .editor-content :global(a) {
                    color: #6c5ce7;
                    text-decoration: underline;
                }

                .editor-content :global(a:hover) {
                    color: #5849c7;
                }

                .editor-content :global(ul) {
                    margin: 12px 0;
                    padding-left: 28px;
                }

                .editor-content :global(li) {
                    margin: 6px 0;
                    color: #000000;
                }

                .editor-content :global(strong) {
                    font-weight: 700;
                    color: #000000;
                }

                .editor-content :global(em) {
                    font-style: italic;
                    color: #000000;
                }

                .editor-content :global(u) {
                    text-decoration: underline;
                    color: #000000;
                }
            `}</style>
        </div>
    );
}
