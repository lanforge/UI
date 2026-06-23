import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Optimization {
  _id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

const STORAGE_KEY = 'adminOptimizationsPageState';

const getSavedState = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

const CATEGORY_OPTIONS = ['tuning', 'cooling', 'aesthetics', 'software', 'hardware', 'performance', 'support', 'other'];

const AdminOptimizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const saved = useRef(getSavedState()).current;

  const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm ?? '');
  const [categoryFilter, setCategoryFilter] = useState<string>(saved?.categoryFilter ?? 'all');
  const [statusFilter, setStatusFilter] = useState<string>(saved?.statusFilter ?? 'all');
  const [items, setItems] = useState<Optimization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(saved?.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchTerm, categoryFilter, statusFilter, page }));
    } catch {}
  }, [searchTerm, categoryFilter, statusFilter, page]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/optimizations/admin/all', {
        params: {
          search: searchTerm || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          page,
          limit: 20,
        },
      });
      setItems(response.data.optimizations || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch optimizations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, categoryFilter]);

  const displayItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter(o => statusFilter === 'active' ? o.isActive : !o.isActive);
  }, [items, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this optimization?')) return;
    try {
      await api.delete(`/optimizations/${id}`);
      fetchItems();
    } catch (error) {
      console.error('Failed to delete optimization', error);
      alert('Failed to delete optimization');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Optimizations</h1>
          <p className="text-slate-500 text-sm mt-1">PC add-ons — not available standalone</p>
        </div>
        <button
          onClick={() => navigate('/admin/optimizations/add')}
          className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
        >
          + Add Optimization
        </button>
      </div>

      <div className="admin-card p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-1 flex items-center bg-[#11141d] border border-[#1f2233] rounded-md px-3">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or slug..."
              className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={fetchItems} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="admin-input"
          >
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="admin-input"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={handleSearch}
            className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md py-2 font-medium transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Category</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Cost</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Sort</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">Loading optimizations...</td></tr>
              ) : displayItems.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No optimizations found.</td></tr>
              ) : displayItems.map(o => (
                <tr key={o._id} className="hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-200 font-medium">{o.name}</p>
                      {o.isFeatured && (
                        <span className="admin-badge bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">Featured</span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs font-mono mt-1">{o.slug}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-slate-200 capitalize">{o.category}</p>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-200 font-medium">${o.price?.toFixed(2)}</span>
                      {o.compareAtPrice && (
                        <span className="text-slate-500 line-through text-xs">${o.compareAtPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right text-emerald-500 font-medium">
                    {typeof o.cost === 'number' ? `$${o.cost.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-200 font-medium">{o.sortOrder ?? 0}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`admin-badge ${
                      o.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-gray-500/10 text-slate-400 border-gray-500/20'
                    }`}>
                      {o.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => navigate(`/admin/optimizations/edit/${o._id}`)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(o._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1f2233] rounded-md transition-colors"
                        title="Deactivate"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {items.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, total)} of {total} optimizations
          </div>
          <div className="flex items-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-500 text-xs px-2">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOptimizationsPage;
