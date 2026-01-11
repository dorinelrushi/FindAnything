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
        <div className="glass" style={{
            padding: '20px',
            borderRadius: '20px',
            marginBottom: '40px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
            <h2 style={{
                margin: '0 0 15px 0',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span> Business Stories
            </h2>

            <div className="stories-container" style={{
                display: 'flex',
                gap: '20px',
                overflowX: 'auto',
                padding: '5px 0',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                WebkitOverflowScrolling: 'touch'
            }}>
                <style jsx>{`
                    .stories-container::-webkit-scrollbar {
                        display: none;
                    }
                    .story-circle {
                        flex: 0 0 auto;
                        width: 75px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        cursor: pointer;
                        transition: transform 0.2s;
                    }
                    .story-circle:active {
                        transform: scale(0.95);
                    }
                    .avatar-ring {
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        padding: 3px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                    .story-circle:hover .avatar-ring {
                        transform: scale(1.05);
                    }
                    .avatar-ring.unseen {
                        background: linear-gradient(45deg, #2ecc71, #27ae60, #1abc9c);
                        box-shadow: 0 0 15px rgba(46, 204, 113, 0.3);
                    }
                    .avatar-ring.seen {
                        background: #333;
                    }
                    .avatar-img {
                        width: 100%;
                        height: 100%;
                        border-radius: 50%;
                        background: #111;
                        object-fit: cover;
                        border: 2px solid #000;
                    }
                    .business-name {
                        font-size: 0.75rem;
                        margin-top: 8px;
                        color: #bbb;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        width: 100%;
                        text-align: center;
                        font-weight: 500;
                    }
                `}</style>

                {groups.map((group, index) => (
                    <div key={group.businessId} className="story-circle" onClick={() => setSelectedGroupIndex(index)}>
                        <div className={`avatar-ring ${group.allSeen ? 'seen' : 'unseen'}`}>
                            <img src={group.avatar} alt={group.name} className="avatar-img" />
                        </div>
                        <span className="business-name">{group.name}</span>
                    </div>
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
        </div>
    );
}
