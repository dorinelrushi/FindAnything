'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function StoryViewer({ groups, initialGroupIndex, onClose }) {
    const { user } = useAuth();
    const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const group = groups[currentGroupIndex];
    const story = group?.stories[currentStoryIndex];

    // Check if the current user is the owner of this business story
    const isOwner = user && group && (user._id === group.businessId || user.role === 'admin');

    const markAsSeen = useCallback(async (storyId) => {
        try {
            await fetch(`/api/stories/${storyId}/view`, { method: 'POST' });
        } catch (error) {
            console.error('Failed to mark story as seen', error);
        }
    }, []);

    const nextStory = useCallback(() => {
        if (!group) return;
        if (currentStoryIndex < group.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentGroupIndex < groups.length - 1) {
            setCurrentGroupIndex(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentStoryIndex, currentGroupIndex, group, groups.length, onClose]);

    const prevStory = useCallback(() => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else if (currentGroupIndex > 0) {
            setCurrentGroupIndex(prev => prev - 1);
            setCurrentStoryIndex(groups[currentGroupIndex - 1].stories.length - 1);
            setProgress(0);
        }
    }, [currentStoryIndex, currentGroupIndex, groups]);

    const deleteStory = async (e) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this story?')) return;

        try {
            const res = await fetch(`/api/stories/${story._id}`, { method: 'DELETE' });
            if (res.ok) {
                // After deletion, we close to refresh the parent list
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete story');
            }
        } catch (error) {
            console.error('Failed to delete story', error);
        }
    };

    useEffect(() => {
        if (story) {
            markAsSeen(story._id);
        }
    }, [story, markAsSeen]);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + 2;
            });
        }, 100);

        return () => clearInterval(interval);
    }, [story]);

    useEffect(() => {
        if (progress === 100) {
            nextStory();
        }
    }, [progress, nextStory]);

    if (!story) return null;

    return (
        <div className="story-modal">
            <style jsx>{`
                .story-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: rgba(0,0,0,0.98);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    backdrop-filter: blur(12px);
                }
                .story-content {
                    position: relative;
                    width: 100%;
                    max-width: 450px;
                    height: 100vh;
                    background: #000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                }
                @media (min-width: 450px) {
                    .story-content {
                        height: 92vh;
                        border-radius: 16px;
                    }
                }
                .story-header {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    padding: 15px 15px 30px 15px;
                    z-index: 10;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
                }
                .progress-bars {
                    display: flex;
                    gap: 5px;
                    margin-bottom: 12px;
                }
                .progress-bar {
                    height: 2px;
                    background: rgba(255,255,255,0.2);
                    flex: 1;
                    border-radius: 2px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: #fff;
                    transition: width 0.1s linear;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: 2px solid #2ecc71;
                    background: #000;
                    object-fit: cover;
                }
                .user-name {
                    font-weight: 600;
                    font-size: 0.95rem;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
                }
                .header-actions {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .delete-btn {
                    background: none;
                    border: none;
                    color: #ff7675;
                    cursor: pointer;
                    font-size: 1.3rem;
                    padding: 5px;
                    opacity: 0.8;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .delete-btn:hover { 
                    opacity: 1;
                    transform: scale(1.1);
                }
                .close-btn {
                    font-size: 2.5rem;
                    cursor: pointer;
                    line-height: 1;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .close-btn:hover { opacity: 1; }
                
                .story-image {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                    background: #000;
                    user-select: none;
                    -webkit-user-drag: none;
                }
                .nav-btn {
                    position: absolute;
                    top: 0;
                    height: 100%;
                    width: 40%;
                    z-index: 5;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .nav-btn.prev { left: 0; }
                .nav-btn.next { right: 0; }
                .story-footer {
                    position: absolute;
                    bottom: 0;
                    width: 100%;
                    padding: 30px 20px;
                    background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
                    text-align: center;
                    font-size: 0.85rem;
                    opacity: 0.9;
                    pointer-events: none;
                }
            `}</style>

            <div className="story-content">
                <div className="story-header" onClick={e => e.stopPropagation()}>
                    <div className="progress-bars">
                        {group.stories.map((_, i) => (
                            <div key={i} className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: i === currentStoryIndex ? `${progress}%` : i < currentStoryIndex ? '100%' : '0%'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="user-info">
                        <img src={group.avatar} alt={group.name} className="user-avatar" />
                        <span className="user-name">{group.name}</span>
                        <div className="header-actions">
                            {isOwner && (
                                <button className="delete-btn" onClick={deleteStory} title="Delete Story">
                                    🗑️
                                </button>
                            )}
                            <div className="close-btn" onClick={onClose}>&times;</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Blocks */}
                <div className="nav-btn prev" onClick={prevStory}></div>
                <div className="nav-btn next" onClick={nextStory}></div>

                <img
                    src={story.imageUrl}
                    alt="Story"
                    className="story-image"
                    id="story-img-element"
                />

                <div className="story-footer">
                    {new Date(story.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
}
