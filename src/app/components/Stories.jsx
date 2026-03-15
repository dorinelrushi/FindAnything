'use client';
import { useState, useEffect } from 'react';
import StoryViewer from './StoryViewer';

export default function Stories() {
    const [groups, setGroups] = useState([]);
    const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const res = await fetch('/api/stories');
            const data = await res.json();
            if (data.success) {
                setGroups(data.groups);
            }
        } catch (error) {
            console.error('Failed to fetch stories', error);
        }
    };

    if (groups.length === 0) return null;

    return (
        <section className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary pl-1">
                Story-t nga Bizneset
            </h2>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide px-1">
                {groups.map((group, index) => (
                    <button 
                        key={group.businessId} 
                        className="flex flex-col items-center gap-2 group transition-transform active:scale-95"
                        onClick={() => setSelectedGroupIndex(index)}
                    >
                        <div className={`w-20 h-20 rounded-full p-1 border-2 transition-all group-hover:p-0.5 ${
                            group.allSeen 
                            ? 'border-border-light' 
                            : 'border-brand shadow-[0_0_15px_rgba(255,56,92,0.3)]'
                        }`}>
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-bg-light">
                                <img 
                                    src={group.avatar || 'https://via.placeholder.com/100'} 
                                    alt={group.name} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-text-secondary group-hover:text-text-primary h-4 overflow-hidden text-ellipsis whitespace-nowrap w-20 text-center">
                            {group.name}
                        </span>
                    </button>
                ))}

                {selectedGroupIndex !== null && (
                    <StoryViewer
                        groups={groups}
                        initialGroupIndex={selectedGroupIndex}
                        onClose={() => {
                            setSelectedGroupIndex(null);
                            fetchStories();
                        }}
                    />
                )}
            </div>
        </section>
    );
}
