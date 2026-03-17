'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';

// Map chat category names to the actual listing type stored in DB
const CATEGORY_TO_DB_TYPE = {
    hotel: 'hotel',
    restaurant: 'restaurant',
    bar: 'bar',
    guesthouse: 'bujtina',
    tour: 'tour',
    rentcar: 'rentcar',
    city: 'city',
};

// Human-readable labels for categories
const getCategoryLabel = (cat) => {
    const labels = {
        hotel: 'Hotels',
        restaurant: 'Restaurants',
        bar: 'Bars & Cafes',
        guesthouse: 'Guesthouses',
        tour: 'Tours',
        rentcar: 'Rent a Car',
        city: 'Cities',
        general: 'All',
    };
    return labels[cat] || cat;
};

export default function AttachmentPicker({ isOpen, onClose, onSelect, selectedAttachments = [], activeCategory = '' }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [listings, setListings] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');
    
    // We maintain local state of selected items so they can pick multiple and then "Confirm"
    const [localSelected, setLocalSelected] = useState([...selectedAttachments]);

    // When inside a specific category, lock the type filter
    const isCategoryLocked = activeCategory && activeCategory !== 'general';

    // Compute the actual DB type to query
    const getDbType = (chatCategory) => {
        return CATEGORY_TO_DB_TYPE[chatCategory] || chatCategory;
    };

    useEffect(() => {
        if (isOpen) {
            setLocalSelected([...selectedAttachments]);
            setSearchQuery('');
            if (isCategoryLocked) {
                // Set the filter to the mapped DB type
                const dbType = getDbType(activeCategory);
                setTypeFilter(dbType);
                // Fetch immediately with the correct type
                fetchListings(dbType);
            } else {
                setTypeFilter('');
                fetchListings('');
            }
        }
    }, [isOpen, activeCategory]);

    // Fetch when search or type changes (with debounce)
    useEffect(() => {
        if (isOpen) {
            const delayDebounceFn = setTimeout(() => {
                fetchListings(typeFilter);
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery, typeFilter]);

    const fetchListings = async (filterOverride) => {
        setIsLoading(true);
        try {
            const effectiveType = filterOverride !== undefined ? filterOverride : typeFilter;
            let url = `/api/listings?limit=20`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
            if (effectiveType) url += `&type=${effectiveType}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings || []);
            }
        } catch (error) {
            console.error('Error fetching listings for attachment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (listing) => {
        const isSelected = localSelected.some(item => item._id === listing._id);
        if (isSelected) {
            setLocalSelected(prev => prev.filter(item => item._id !== listing._id));
        } else {
            // Cap at 3 attachments for example, to prevent crazy messages
            if (localSelected.length >= 3) {
                alert("You can only attach up to 3 items per message.");
                return;
            }
            setLocalSelected(prev => [...prev, listing]);
        }
    };

    const handleConfirm = () => {
        onSelect(localSelected);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white sm:rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col h-full sm:h-[85vh] sm:max-h-[600px] transition-all duration-300">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Attach near you</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="p-4 space-y-3 bg-gray-50/50">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={isCategoryLocked ? `Search ${getCategoryLabel(activeCategory)}...` : "Search places..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm"
                        />
                    </div>
                    {isCategoryLocked ? (
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-orange-500 text-white rounded-full text-xs font-medium">
                                {getCategoryLabel(activeCategory)} only
                            </span>
                            <span className="text-xs text-gray-400">Filtered by current tab</span>
                        </div>
                    ) : (
                        // Filter Bars
                        <div className="flex overflow-x-auto p-3 gap-1 no-scrollbar bg-slate-50 border-b scroll-smooth snap-x">
                            {['all', 'hotel', 'restaurant', 'bar', 'bujtina', 'tour', 'rentcar', 'city'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`snap-start whitespace-nowrap px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${
                                        typeFilter === type 
                                        ? 'border-orange-500 text-orange-600 bg-orange-50/50' 
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {getCategoryLabel(type)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : listings.length > 0 ? (
                        <div className="space-y-1">
                            {listings.map(listing => {
                                const isSelected = localSelected.some(item => item._id === listing._id);
                                return (
                                    <div 
                                        key={listing._id}
                                        onClick={() => toggleSelection(listing)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                            isSelected ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 relative">
                                            {listing.image ? (
                                                <img src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xs text-gray-400">No img</div>
                                            )}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-orange-500/80 flex items-center justify-center backdrop-blur-[1px]">
                                                    <Check className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-gray-900 truncate">{listing.title}</h4>
                                            <p className="text-xs text-gray-500 capitalize truncate">
                                                {listing.type === 'bujtina' ? 'Guesthouse' : listing.type === 'rentcar' ? 'Rent a Car' : listing.type} {listing.city ? `• ${listing.city}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            <p>No listings found.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        Confirm Selection {localSelected.length > 0 && `(${localSelected.length})`}
                    </button>
                </div>
            </div>
        </div>
    );
}
