'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

function companyInitials(name = '') {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || 'J';
}

function isRemote(location = '') {
    return /remote|work from home|wfh|hybrid/i.test(location);
}

function daysAgo(date) {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function JobsPage() {
    const { user } = useAuth();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [locationFilter, setLocationFilter] = useState('all');
    const [companyFilter, setCompanyFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [expandedId, setExpandedId] = useState(null);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const res = await fetch('/api/jobs');
            const data = await res.json();
            if (data.success) setJobs(data.jobs);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (jobId) => {
        if (!confirm('Delete this job posting permanently?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/jobs/${jobId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setJobs((prev) => prev.filter((j) => j._id !== jobId));
            } else {
                const data = await res.json();
                alert(data.error || 'Delete failed');
            }
        } catch {
            alert('Failed to delete job');
        }
    };

    const locations = useMemo(() => {
        const set = new Set(jobs.map((j) => j.location).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [jobs]);

    const companies = useMemo(() => {
        const set = new Set(jobs.map((j) => j.companyName).filter(Boolean));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [jobs]);

    const filteredJobs = useMemo(() => {
        const q = search.trim().toLowerCase();
        let list = jobs.filter((job) => {
            if (locationFilter !== 'all' && job.location !== locationFilter) return false;
            if (companyFilter !== 'all' && job.companyName !== companyFilter) return false;
            if (!q) return true;
            return (
                job.title?.toLowerCase().includes(q) ||
                job.companyName?.toLowerCase().includes(q) ||
                job.location?.toLowerCase().includes(q) ||
                job.description?.toLowerCase().includes(q)
            );
        });

        list = [...list].sort((a, b) => {
            if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
            if (sortBy === 'company') return (a.companyName || '').localeCompare(b.companyName || '');
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        return list;
    }, [jobs, search, locationFilter, companyFilter, sortBy]);

    const hasActiveFilters = locationFilter !== 'all' || companyFilter !== 'all' || sortBy !== 'newest';

    const clearFilters = () => {
        setLocationFilter('all');
        setCompanyFilter('all');
        setSortBy('newest');
    };

    const FiltersPanel = () => (
        <aside className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">Filters</h2>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs font-bold text-brand hover:underline"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Sort */}
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Sort by
                </label>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border-light bg-surface text-text-primary font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand cursor-pointer"
                >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="title">Title A–Z</option>
                    <option value="company">Company A–Z</option>
                </select>
            </div>

            {/* Location */}
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Location
                </label>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <FilterRadio
                        checked={locationFilter === 'all'}
                        onChange={() => setLocationFilter('all')}
                        label="All locations"
                        count={jobs.length}
                    />
                    {locations.map((loc) => (
                        <FilterRadio
                            key={loc}
                            checked={locationFilter === loc}
                            onChange={() => setLocationFilter(loc)}
                            label={loc}
                            count={jobs.filter((j) => j.location === loc).length}
                        />
                    ))}
                    {locations.length === 0 && (
                        <p className="text-xs text-text-secondary italic px-1">No locations yet</p>
                    )}
                </div>
            </div>

            <div className="h-px bg-border-light" />

            {/* Company */}
            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                    Company
                </label>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                    <FilterRadio
                        checked={companyFilter === 'all'}
                        onChange={() => setCompanyFilter('all')}
                        label="All companies"
                        count={jobs.length}
                    />
                    {companies.map((c) => (
                        <FilterRadio
                            key={c}
                            checked={companyFilter === c}
                            onChange={() => setCompanyFilter(c)}
                            label={c}
                            count={jobs.filter((j) => j.companyName === c).length}
                        />
                    ))}
                    {companies.length === 0 && (
                        <p className="text-xs text-text-secondary italic px-1">No companies yet</p>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="pt-2 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-bg-light border border-border-light p-3 text-center">
                    <div className="text-xl font-black text-brand">{jobs.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Jobs</div>
                </div>
                <div className="rounded-2xl bg-bg-light border border-border-light p-3 text-center">
                    <div className="text-xl font-black text-text-primary">{locations.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Places</div>
                </div>
            </div>
        </aside>
    );

    return (
        <main className="min-h-screen bg-background">
            {/* Top header + search only */}
            <section className="border-b border-border-light bg-surface">
                <div className="container-wide py-8 md:py-10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand">
                                Careers
                            </span>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight">
                                Job Openings
                            </h1>
                            <p className="text-text-secondary text-sm md:text-base max-w-lg">
                                Search roles and apply in one click.
                            </p>
                        </div>
                        {user?.role === 'admin' && (
                            <Link
                                href="/admin/jobs/new"
                                className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-3 rounded-xl font-bold text-sm shadow-soft transition-all self-start sm:self-auto"
                            >
                                + Post a Job
                            </Link>
                        )}
                    </div>

                    {/* Search only on top */}
                    <div className="relative max-w-3xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="7" />
                                <path d="M21 21l-4.3-4.3" />
                            </svg>
                        </div>
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search jobs, companies, locations..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border-light bg-bg-light text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent font-medium shadow-soft transition-all"
                        />
                    </div>
                </div>
            </section>

            {/* Filters left + jobs right */}
            <section className="container-wide py-8 md:py-10">
                {/* Mobile filter toggle */}
                <div className="lg:hidden mb-5 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-text-secondary">
                        {loading ? 'Loading…' : (
                            <>
                                <span className="text-text-primary font-black">{filteredJobs.length}</span> jobs
                            </>
                        )}
                    </p>
                    <button
                        type="button"
                        onClick={() => setMobileFiltersOpen((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light bg-surface font-bold text-sm text-text-primary shadow-soft"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                        </svg>
                        Filters
                        {hasActiveFilters && (
                            <span className="w-2 h-2 rounded-full bg-brand" />
                        )}
                    </button>
                </div>

                {mobileFiltersOpen && (
                    <div className="lg:hidden mb-6 p-5 rounded-2xl border border-border-light bg-surface shadow-soft">
                        <FiltersPanel />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Left filters — desktop */}
                    <div className="hidden lg:block w-full max-w-[260px] flex-shrink-0">
                        <div className="sticky top-24 p-5 rounded-2xl border border-border-light bg-surface shadow-soft">
                            <FiltersPanel />
                        </div>
                    </div>

                    {/* Right jobs grid */}
                    <div className="flex-1 min-w-0 space-y-5">
                        <div className="hidden lg:flex items-center justify-between">
                            <p className="text-sm font-semibold text-text-secondary">
                                {loading ? (
                                    'Loading jobs...'
                                ) : (
                                    <>
                                        Showing{' '}
                                        <span className="text-text-primary font-black">{filteredJobs.length}</span>
                                        {filteredJobs.length !== jobs.length && (
                                            <> of <span className="text-text-primary font-black">{jobs.length}</span></>
                                        )}{' '}
                                        {filteredJobs.length === 1 ? 'position' : 'positions'}
                                        {search && (
                                            <>
                                                {' '}for <span className="text-brand font-bold">&quot;{search}&quot;</span>
                                            </>
                                        )}
                                    </>
                                )}
                            </p>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="h-[260px] rounded-[24px] bg-bg-light border border-border-light animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div className="py-16 px-6 bg-surface rounded-[28px] border border-border-light border-dashed text-center space-y-4">
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center text-2xl">
                                    🔍
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-lg font-extrabold text-text-primary">No jobs found</h2>
                                    <p className="text-text-secondary text-sm max-w-sm mx-auto">
                                        {jobs.length === 0
                                            ? 'No openings yet. Check back soon.'
                                            : 'Try another search or clear filters.'}
                                    </p>
                                </div>
                                {(hasActiveFilters || search) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            clearFilters();
                                            setSearch('');
                                        }}
                                        className="inline-flex px-5 py-2.5 rounded-xl bg-brand text-white font-bold text-sm hover:bg-brand-hover"
                                    >
                                        Reset search & filters
                                    </button>
                                )}
                                {user?.role === 'admin' && jobs.length === 0 && (
                                    <Link href="/admin/jobs/new" className="block text-brand font-bold text-sm hover:underline">
                                        Post the first job →
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {filteredJobs.map((job) => {
                                    const expanded = expandedId === job._id;
                                    const desc =
                                        job.description.length > 130 && !expanded
                                            ? job.description.slice(0, 130) + '…'
                                            : job.description;
                                    const remote = isRemote(job.location);

                                    return (
                                        <article
                                            key={job._id}
                                            className="group relative flex flex-col bg-surface border border-border-light rounded-[24px] p-5 shadow-soft hover:shadow-airbnb hover:border-brand/30 hover:-translate-y-0.5 transition-all duration-300"
                                        >
                                            <div className="absolute inset-x-0 top-0 h-1 rounded-t-[24px] bg-gradient-to-r from-brand via-orange-400 to-brand opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand/15 to-brand/5 border border-brand/15 flex items-center justify-center text-brand font-black text-xs flex-shrink-0">
                                                    {companyInitials(job.companyName)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h2 className="text-base font-extrabold text-text-primary tracking-tight leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                                                            {job.title}
                                                        </h2>
                                                        {user?.role === 'admin' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(job._id)}
                                                                className="p-1 rounded-lg text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-semibold text-text-secondary truncate mt-0.5">
                                                        {job.companyName}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-bg-light text-[11px] font-bold text-text-secondary border border-border-light">
                                                    📍 {job.location}
                                                </span>
                                                {remote && (
                                                    <span className="inline-flex px-2 py-1 rounded-lg bg-emerald-500/10 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
                                                        Remote
                                                    </span>
                                                )}
                                                <span className="inline-flex px-2 py-1 rounded-lg bg-bg-light text-[11px] font-bold text-text-secondary border border-border-light">
                                                    {daysAgo(job.createdAt)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-text-secondary leading-relaxed flex-1 whitespace-pre-wrap mb-2">
                                                {desc}
                                            </p>
                                            {job.description.length > 130 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedId(expanded ? null : job._id)}
                                                    className="self-start text-brand font-bold text-xs hover:underline mb-3"
                                                >
                                                    {expanded ? 'Show less' : 'Read more'}
                                                </button>
                                            )}

                                            <div className="mt-auto pt-3 border-t border-border-light">
                                                <a
                                                    href={job.applicationLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex w-full items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl font-bold text-sm shadow-soft transition-all active:scale-[0.98]"
                                                >
                                                    Apply Now
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M7 17L17 7M17 7H7M17 7v10" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}

function FilterRadio({ checked, onChange, label, count }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left text-sm font-semibold transition-colors ${
                checked
                    ? 'bg-brand/10 text-brand'
                    : 'text-text-primary hover:bg-bg-light'
            }`}
        >
            <span className="flex items-center gap-2.5 min-w-0">
                <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        checked ? 'border-brand' : 'border-border-light'
                    }`}
                >
                    {checked && <span className="w-2 h-2 rounded-full bg-brand" />}
                </span>
                <span className="truncate">{label}</span>
            </span>
            <span className={`text-[11px] font-bold flex-shrink-0 ${checked ? 'text-brand' : 'text-text-secondary'}`}>
                {count}
            </span>
        </button>
    );
}
