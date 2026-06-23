import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminUsedPartModal, { EditingUsedPart } from '../components/AdminUsedPartModal';

type UsedPartType = 'cpu' | 'gpu' | 'ram' | 'storage' | 'case' | 'psu' | 'cpu-cooler' | 'motherboard' | 'fan' | 'other';

interface EbayStats {
  count: number;
  rawCount?: number;
  outliersRemoved?: number;
  min: number;
  median: number;
  mean: number;
  max: number;
  suggested: number;
  currency: string;
  fetchedAt: string;
}

interface UsedPart {
  _id: string;
  type: UsedPartType;
  brand: string;
  partModel: string;
  price: number;
  notes?: string;
  upc?: string;
  ebayQuery?: string;
  ebayStats?: EbayStats | null;
  autoUpdatePrice?: boolean;
  createdAt: string;
}

const TYPE_OPTIONS: UsedPartType[] = ['cpu', 'gpu', 'ram', 'storage', 'case', 'psu', 'cpu-cooler', 'motherboard', 'fan', 'other'];

const TYPE_LABEL: Record<UsedPartType, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage: 'Storage',
  case: 'Case',
  psu: 'Power Supply',
  'cpu-cooler': 'CPU Cooler',
  motherboard: 'Motherboard',
  fan: 'Fan',
  other: 'Other',
};

const formatRelative = (date: string): string => {
  const then = new Date(date).getTime();
  const diff = Date.now() - then;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(date).toLocaleDateString();
};

const AdminUsedPartsPage: React.FC = () => {
  const [parts, setParts] = useState<UsedPart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | UsedPartType>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditingUsedPart | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  const fetchParts = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/used-parts/admin/all', { params });
      setParts(res.data.parts || []);
      setTotalPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error('Failed to fetch used parts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, typeFilter]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: UsedPart) => {
    setEditing({
      _id: p._id,
      type: p.type,
      brand: p.brand,
      partModel: p.partModel,
      price: p.price,
      notes: p.notes,
      upc: p.upc,
      ebayQuery: p.ebayQuery,
      autoUpdatePrice: p.autoUpdatePrice,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this used part?')) return;
    try {
      await api.delete(`/used-parts/${id}`);
      fetchParts();
    } catch (e: any) {
      alert('Failed to delete: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchParts();
  };

  const refreshOne = async (id: string) => {
    setRefreshingId(id);
    try {
      const res = await api.post(`/used-parts/${id}/refresh-ebay`);
      const updated: UsedPart = res.data.part;
      setParts(prev => prev.map(p => p._id === id ? { ...p, ebayStats: updated.ebayStats, price: updated.price } : p));
    } catch (e: any) {
      alert('Failed to refresh: ' + (e.response?.data?.message || e.message));
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshAll = async () => {
    if (!window.confirm('Refresh eBay pricing for all used parts? This runs in the background.')) return;
    setRefreshingAll(true);
    try {
      const res = await api.post('/used-parts/refresh-ebay-all');
      alert(res.data.message);
    } catch (e: any) {
      alert('Failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setRefreshingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Used Parts Catalog</h1>
          <p className="text-slate-500 text-sm mt-1">Market-price reference used to value customer trade-ins · medians auto-refresh daily from eBay</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            disabled={refreshingAll}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white rounded-md text-sm font-medium transition-colors"
          >
            {refreshingAll ? 'Triggered...' : 'Refresh All Pricing'}
          </button>
          <button
            onClick={fetchParts}
            className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors"
            title="Reload"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={openCreate}
            className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md font-medium transition-colors"
          >
            + Add Used Part
          </button>
        </div>
      </div>

      <div className="admin-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#07090e] border border-[#1f2233] rounded-md focus-within:border-white/20 transition-all">
            <svg className="w-4 h-4 text-slate-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search brand or model..."
              className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value as any); setPage(1); }}
            className="admin-input w-40"
          >
            <option value="all">All Types</option>
            {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md font-medium transition-colors"
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Part</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Type</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Catalog Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">eBay Median</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">Loading...</td></tr>
              ) : parts.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">Catalog is empty. Add an entry to start tracking market prices.</td></tr>
              ) : parts.map(p => {
                const stats = p.ebayStats;
                const median = stats?.median;
                const delta = stats && p.price > 0 ? ((p.price - median!) / median!) * 100 : null;
                return (
                  <tr key={p._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-200 font-medium">{p.brand} {p.partModel}</p>
                        {p.autoUpdatePrice && (
                          <span title="Price auto-updates daily" className="admin-badge bg-blue-500/10 text-blue-400 border border-blue-500/30">AUTO</span>
                        )}
                        {p.upc && (
                          <span title={`UPC: ${p.upc}`} className="admin-badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">UPC</span>
                        )}
                      </div>
                      {p.upc && <p className="text-slate-600 text-[10px] font-mono mt-0.5">UPC {p.upc}</p>}
                      {p.notes && <p className="text-slate-500 text-xs mt-1 truncate max-w-md">{p.notes}</p>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="admin-badge bg-[#1f2233]/50 text-slate-300 border border-[#1f2233]">{TYPE_LABEL[p.type]}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-emerald-500 font-medium">${(p.price ?? 0).toFixed(2)}</p>
                      {delta !== null && Math.abs(delta) >= 5 && (
                        <p className={`text-[10px] mt-0.5 ${delta > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                          {delta > 0 ? '+' : ''}{delta.toFixed(0)}% vs median
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {stats ? (
                        <div>
                          <p className="text-slate-200 font-medium">${stats.median.toFixed(2)}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {stats.count} listings
                            {stats.outliersRemoved ? <span className="text-amber-500" title="Outliers removed via IQR filter"> · −{stats.outliersRemoved}</span> : null}
                            {' · '}{formatRelative(stats.fetchedAt)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs italic">No data</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => refreshOne(p._id)}
                          disabled={refreshingId === p._id}
                          className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-[#1f2233] rounded-md transition-colors disabled:opacity-50"
                          title="Refresh eBay pricing"
                        >
                          <svg className={`w-4 h-4 ${refreshingId === p._id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1f2233] rounded-md transition-colors"
                          title="Delete"
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
            {parts.length > 0 ? `${(page - 1) * 25 + 1}-${Math.min(page * 25, total)} of ${total}` : '0 of 0'}
          </div>
          <div className="flex items-center gap-2">
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

      <AdminUsedPartModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchParts}
        editing={editing}
      />
    </div>
  );
};

export default AdminUsedPartsPage;
