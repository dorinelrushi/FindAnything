'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, MessageSquare, MapPin, Building, Utensils, Coffee, Home, Car, Navigation, Globe, Loader2, AlertCircle, Pencil, Trash2, Check as CheckIcon, XCircle, Menu } from 'lucide-react';
import AttachmentPicker from './AttachmentPicker';
import Link from 'next/link';

const CATEGORIES = [
    { id: 'general', label: 'General', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'hotel', label: 'Hotels', icon: <Building className="w-5 h-5" /> },
    { id: 'restaurant', label: 'Restaurants', icon: <Utensils className="w-5 h-5" /> },
    { id: 'bar', label: 'Bars & Cafes', icon: <Coffee className="w-5 h-5" /> },
    { id: 'guesthouse', label: 'Guesthouse', icon: <Home className="w-5 h-5" /> },
    { id: 'tour', label: 'Tours', icon: <Navigation className="w-5 h-5" /> },
    { id: 'rentcar', label: 'Rent a Car', icon: <Car className="w-5 h-5" /> },
    { id: 'city', label: 'Cities', icon: <Globe className="w-5 h-5" /> },
];

export default function CommunityChatPopup({ isOpen, onClose }) {
    const [activeCategory, setActiveCategory] = useState('general');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [visitorId, setVisitorId] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [showNameModal, setShowNameModal] = useState(false);
    const [tempName, setTempName] = useState('');
    
    // Input state
    const [inputText, setInputText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Edit/Delete state
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    
    const chatContainerRef = useRef(null);

    // Initialize visitor ID & Name
    useEffect(() => {
        let vId = localStorage.getItem('community_visitor_id');
        if (!vId) {
            vId = 'v_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('community_visitor_id', vId);
        }
        setVisitorId(vId);

        const vName = localStorage.getItem('community_visitor_name');
        if (vName) {
            setVisitorName(vName);
        }
    }, []);

    // Fetch messages when category changes or popup opens
    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            // Polling interval (e.g., every 10 seconds)
            const intervalId = setInterval(fetchMessages, 10000);
            return () => clearInterval(intervalId);
        }
    }, [isOpen, activeCategory]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async () => {
        try {
            setError(null);
            const res = await fetch(`/api/community-chat?category=${activeCategory}`);
            if (res.ok) {
                const data = await res.json();
                // We show newest at the bottom, API returns newest first due to sort(-1)
                setMessages(data.reverse() || []);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async () => {
        if (!inputText.trim() && attachments.length === 0) return;

        // Force name selection first
        if (!visitorName) {
            setShowNameModal(true);
            return;
        }

        setIsSending(true);
        setError(null);

        try {
            const res = await fetch('/api/community-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitorId,
                    visitorName,
                    content: inputText.trim(),
                    category: activeCategory,
                    attachments: attachments.map(a => a._id)
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to send message');
                
                // Clear error automatically after 5 seconds
                setTimeout(() => setError(null), 5000);
            } else {
                // Success
                setInputText('');
                setAttachments([]);
                setError(null);
                
                // Optimistically add message or switch category
                if (data.category === activeCategory) {
                    setMessages(prev => [...prev, data]);
                } else {
                    setActiveCategory(data.category);
                }
            }
        } catch (err) {
            setError('Network error sending message');
        } finally {
            setIsSending(false);
        }
    };

    const handleEdit = async (msgId) => {
        if (!editText.trim()) return;
        setActionLoading(msgId);
        try {
            const res = await fetch(`/api/community-chat/${msgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visitorId, content: editText.trim() })
            });
            if (res.ok) {
                const updated = await res.json();
                setMessages(prev => prev.map(m => m._id === msgId ? updated : m));
                setEditingId(null);
                setEditText('');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to edit');
                setTimeout(() => setError(null), 5000);
            }
        } catch {
            setError('Network error editing message');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (msgId) => {
        if (!confirm('Delete this message?')) return;
        setActionLoading(msgId);
        try {
            const res = await fetch(`/api/community-chat/${msgId}?visitorId=${encodeURIComponent(visitorId)}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setMessages(prev => prev.filter(m => m._id !== msgId));
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete');
                setTimeout(() => setError(null), 5000);
            }
        } catch {
            setError('Network error deleting message');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSaveName = () => {
        if (!tempName.trim()) return;
        localStorage.setItem('community_visitor_name', tempName.trim());
        setVisitorName(tempName.trim());
        setShowNameModal(false);
        // Continue sending if they had text
        if (inputText.trim() || attachments.length > 0) {
            // Need a slight timeout to let visitorName state settle, or pass explicitly
            setTimeout(handleSend, 100); 
        }
    };

    const formatTime = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[998] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm sm:items-end md:items-center">
            <div className="bg-white w-full sm:max-w-5xl h-full sm:h-[85vh] md:h-[700px] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row shadow-orange-500/10 transition-all duration-300">
                
                {/* Sidebar - Categories */}
                <div className={`
                    fixed md:relative inset-y-0 left-0 z-[1001] md:z-0
                    w-72 md:w-64 bg-slate-50 border-r border-gray-100 flex flex-col pt-2 
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    shadow-2xl md:shadow-none
                `}>
                    <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 leading-none">Community</h2>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium uppercase tracking-wider">Select Category</p>
                        </div>
                        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-gray-200 rounded-lg text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveCategory(cat.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-sm font-semibold border-b border-transparent ${
                                    activeCategory === cat.id 
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25 ring-2 ring-orange-100' 
                                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                                }`}
                            >
                                <span className="flex-shrink-0 transition-transform group-hover:scale-110">{cat.icon}</span>
                                <span className="truncate">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-orange-50/50 border-t border-orange-100 hidden md:block">
                        <p className="text-[10px] text-orange-600/70 text-center font-bold">MESSAGES RESET EVERY 24H</p>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] md:hidden transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}


                {/* Right Area - Chat */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden">
                    {/* Header */}
                    <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 bg-white/90 backdrop-blur-md sticky top-0 z-10 transition-all duration-300">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-2 hover:bg-orange-50 text-orange-600 rounded-xl transition-all active:scale-95"
                                title="Open Categories"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500 shadow-sm border border-orange-50/50">
                                {CATEGORIES.find(c => c.id === activeCategory)?.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight">{CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Live Chat</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-90"
                            title="Close Chat"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div ref={chatContainerRef} className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col justify-center items-center text-gray-400 space-y-4">
                                <MessageSquare className="w-12 h-12 opacity-20" />
                                <p>No messages in the last 24 hours.</p>
                                <p className="text-sm">Be the first to suggest!</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.visitorId === visitorId;
                                const showTick = i === messages.length - 1 || messages[i + 1].visitorId !== msg.visitorId;

                                return (
                                    <div key={msg._id} className={`group/msg flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-gray-600 ml-1">
                                                {isMe ? 'You' : msg.visitorName}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {formatTime(msg.createdAt)}
                                            </span>
                                            {/* Edit / Delete actions for own messages */}
                                            {isMe && editingId !== msg._id && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => { setEditingId(msg._id); setEditText(msg.content || ''); }}
                                                        className="p-1 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(msg._id)}
                                                        disabled={actionLoading === msg._id}
                                                        className="p-1 hover:bg-red-100 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit mode */}
                                        {editingId === msg._id ? (
                                            <div className="max-w-[85%] md:max-w-[70%] w-full">
                                                <textarea
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    className="w-full p-3 border border-orange-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 mt-1.5 justify-end">
                                                    <button
                                                        onClick={() => { setEditingId(null); setEditText(''); }}
                                                        className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(msg._id)}
                                                        disabled={actionLoading === msg._id}
                                                        className="px-3 py-1 text-xs bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                                    >
                                                        {actionLoading === msg._id ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                        <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                                            isMe ? 'bg-orange-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                                        }`}>
                                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>

                                            {/* Attachments */}
                                            {msg.attachments && msg.attachments.length > 0 && (
                                                <div className="mt-3 space-y-2 w-full">
                                                    {msg.attachments.map(att => (
                                                        <Link href={`/${att.type}/${att.slug}`} target="_blank" key={att._id} className={`group flex items-center justify-between gap-2 sm:gap-3 p-2 rounded-xl transition-all border shadow-sm ${
                                                            isMe ? 'bg-orange-600 border-orange-400 hover:bg-orange-700' : 'bg-white border-gray-200 hover:border-gray-300'
                                                        }`}>
                                                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden shadow-inner">
                                                                    {att.image ? (
                                                                        <img src={att.image} alt={att.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                                    ) : (
                                                                        <MapPin className="w-5 h-5 m-auto text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`font-semibold text-[13px] sm:text-sm truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>{att.title}</p>
                                                                    <p className={`text-[11px] truncate capitalize mt-0.5 ${isMe ? 'text-orange-200' : 'text-gray-500'}`}>{att.type} • {att.city}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                                                                isMe ? 'bg-orange-500/80 text-white group-hover:bg-orange-500' : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200'
                                                            }`}>
                                                                View
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        {error && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm animate-in slide-in-from-bottom-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Selected Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {attachments.map(att => (
                                    <div key={att._id} className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs text-orange-800">
                                        <span className="truncate max-w-[120px] font-medium">{att.title}</span>
                                        <button onClick={() => setAttachments(prev => prev.filter(p => p._id !== att._id))} className="p-0.5 hover:bg-orange-200 rounded-full transition-colors text-orange-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-2 bg-slate-50 border border-gray-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all">
                            <button 
                                onClick={() => setIsPickerOpen(true)}
                                className="p-3 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors flex-shrink-0"
                                title="Attach a place"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            
                            <textarea
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Share your suggestion or ask a question..."
                                className="flex-1 bg-transparent border-none focus:ring-0 p-3 max-h-32 min-h-[44px] resize-none text-sm text-slate-800"
                                rows={1}
                            />

                            <button
                                onClick={handleSend}
                                disabled={isSending || (!inputText.trim() && attachments.length === 0)}
                                className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-all shadow-md shadow-orange-500/20 flex-shrink-0"
                            >
                                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="mt-2 text-center text-[10px] text-gray-400">
                            Limit: 3 messages per day. Messages automatically expire 24h after sending.
                        </div>
                    </div>
                </div>
            </div>

            {/* Name Modal */}
            {showNameModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Join the Chat</h3>
                        <p className="text-sm text-gray-500 mb-5">Please enter a display name to start chatting and sending suggestions.</p>
                        <input
                            type="text"
                            placeholder="Your Name (e.g., KorcaLover)"
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                            className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowNameModal(false)}
                                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveName}
                                disabled={!tempName.trim()}
                                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl shadow-md transition-colors"
                            >
                                Save & Send
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Attachment Picker Modal */}
            <AttachmentPicker
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                selectedAttachments={attachments}
                onSelect={setAttachments}
                activeCategory={activeCategory}
            />
        </div>
    );
}
