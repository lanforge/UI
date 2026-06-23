import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface MerchItem {
  _id: string;
  type: string;
  name: string;
  brand: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  sizes?: string[];
  colors?: string[];
  images?: string[];
}

const STORAGE_KEY = 'adminMerchPageState';

const getSavedState = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

const TYPE_OPTIONS = ['tshirt', 'hoodie', 'hat', 'mug', 'sticker', 'poster', 'bag', 'socks', 'pin', 'other'];

const AdminMerchPage: React.FC = () => {
  const navigate = useNavigate();
  const saved = useRef(getSavedState()).current;

  const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm ?? '');
  const [typeFilter, setTypeFilter] = useState<string>(saved?.typeFilter ?? 'all');
  const [statusFilter, setStatusFilter] = useState<string>(saved?.statusFilter ?? 'all');
  const [merch, setMerch] = useState<MerchItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(saved?.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchTerm, typeFilter, statusFilter, page }));
    } catch {}
  }, [searchTerm, typeFilter, statusFilter, page]);

  const fetchMerch = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/merch/admin/all', {
        params: {
          search: searchTerm || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          page,
          limit: 20,
        },
      });
      setMerch(response.data.merch || []);
      setTotalPages(response.data.pages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch merch', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMerch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter]);

  const displayMerch = useMemo(() => {
    if (statusFilter === 'all') return merch;
    return merch.filter(m => statusFilter === 'active' ? m.isActive : !m.isActive);
  }, [merch, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchMerch();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === displayMerch.length) {
      setSelected([]);
    } else {
      setSelected(displayMerch.map(m => m._id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deactivate this merch item?')) return;
    try {
      await api.delete(`/merch/${id}`);
      fetchMerch();
    } catch (error) {
      console.error('Failed to delete merch', error);
      alert('Failed to delete merch');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Deactivate ${selected.length} merch items?`)) return;
    try {
      await api.post('/merch/bulk/delete', { ids: selected });
      setSelected([]);
      fetchMerch();
    } catch (error) {
      console.error('Failed to delete merch', error);
      alert('Failed to delete merch');
    }
  };

  const handleSyncPrintify = async () => {
    if (!window.confirm('Pull all products from Printify? New items will be created; existing items will refresh stock/images/variants only.')) return;
    setIsSyncing(true);
    try {
      const res = await api.post('/merch/admin/sync-printify');
      const { fetched, created, updated, skipped, errors } = res.data || {};
      const errorSummary = (errors?.length || 0) > 0 ? `\nErrors: ${errors.length}` : '';
      alert(`Printify sync complete\nFetched: ${fetched}\nCreated: ${created}\nUpdated: ${updated}\nSkipped: ${skipped}${errorSummary}`);
      fetchMerch();
    } catch (err: any) {
      console.error('Printify sync failed', err);
      alert(`Printify sync failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkActivate = async () => {
    try {
      await api.post('/merch/bulk/update', { ids: selected, update: { isActive: true } });
      setSelected([]);
      fetchMerch();
    } catch (error) {
      console.error('Failed to activate merch', error);
      alert('Failed to activate merch');
    }
  };

  const stockStatus = (stock: number) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
    if (stock <= 5) return { text: 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { text: 'In Stock', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Merch Management</h1>
          <p className="text-slate-500 text-sm mt-1">Apparel, swag, and branded gear</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSyncPrintify}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-md transition-colors text-sm font-medium"
          >
            {isSyncing ? 'Syncing…' : 'Sync from Printify'}
          </button>
          <button
            onClick={() => navigate('/admin/merch/add')}
            className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
          >
            + Add Merch
          </button>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-1 flex items-center bg-[#11141d] border border-[#1f2233] rounded-md px-3">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, brand, or SKU..."
              className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={fetchMerch} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="admin-input"
          >
            <option value="all">All Types</option>
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
        <div className="p-3 border-b border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
              checked={selected.length === displayMerch.length && displayMerch.length > 0}
              onChange={toggleSelectAll}
            />
            <span className="text-slate-500 text-xs">
              {selected.length > 0 ? `${selected.length} selected` : `${displayMerch.length} items (this page)`}
            </span>
          </div>
          {selected.length > 0 && (
            <div className="flex items-center space-x-2">
              <button onClick={handleBulkActivate} className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-md transition-colors">
                Activate
              </button>
              <button onClick={handleBulkDelete} className="px-2.5 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors">
                Deactivate
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Cost</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Stock</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">Loading merch...</td></tr>
              ) : displayMerch.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No merch found.</td></tr>
              ) : displayMerch.map(m => {
                const status = stockStatus(m.stock);
                return (
                  <tr key={m._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3 mb-1">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
                          checked={selected.includes(m._id)}
                          onChange={() => toggleSelect(m._id)}
                        />
                        <p className="text-slate-200 font-medium">{m.name}</p>
                        {m.isFeatured && (
                          <span className="admin-badge bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">Featured</span>
                        )}
                      </div>
                      <p className="text-slate-500 text-xs font-mono mt-1">{m.sku}</p>
                      {(m.sizes?.length || m.colors?.length) ? (
                        <p className="text-slate-500 text-[10px] mt-1">
                          {m.sizes?.length ? `${m.sizes.length} sizes` : ''}
                          {m.sizes?.length && m.colors?.length ? ' · ' : ''}
                          {m.colors?.length ? `${m.colors.length} colors` : ''}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200 capitalize">{m.type}</p>
                      <p className="text-slate-500 text-xs">{m.brand}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-200 font-medium">${m.price?.toFixed(2)}</span>
                        {m.compareAtPrice && (
                          <span className="text-slate-500 line-through text-xs">${m.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-emerald-500 font-medium">
                      {typeof m.cost === 'number' ? `$${m.cost.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-200 font-medium">{m.stock}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge ${m.isActive ? status.color : 'bg-gray-500/10 text-slate-400 border-gray-500/20'}`}>
                        {m.isActive ? status.text : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/merch/edit/${m._id}`)}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(m._id)}
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
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {merch.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, total)} of {total} merch items
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

export default AdminMerchPage;
