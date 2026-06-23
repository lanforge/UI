import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

type TradeInStatus = 'pending' | 'evaluated' | 'accepted' | 'declined' | 'completed';

interface TradeIn {
  _id: string;
  tradeCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  components?: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    motherboard?: string;
  };
  tradeInValue?: number;
  status: TradeInStatus;
  scannerReport?: { summary?: { primaryCpu?: string; primaryGpu?: string; scannedAt?: string } };
  createdAt: string;
}

const STATUS_META: Record<TradeInStatus, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  evaluated: { label: 'Evaluated', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  accepted: { label: 'Accepted', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  declined: { label: 'Declined', classes: 'bg-red-500/10 text-red-400 border-red-500/30' },
  completed: { label: 'Completed', classes: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
};

const AdminTradeInsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tradeIns, setTradeIns] = useState<TradeIn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | TradeInStatus>('all');
  const [search, setSearch] = useState('');

  const fetchTradeIns = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/trade-ins', { params });
      setTradeIns(res.data || []);
    } catch (e) {
      console.error('Failed to load trade-ins', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeIns();
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tradeIns;
    const q = search.toLowerCase();
    return tradeIns.filter(t =>
      t.tradeCode.toLowerCase().includes(q) ||
      (t.customerName || '').toLowerCase().includes(q) ||
      (t.customerEmail || '').toLowerCase().includes(q) ||
      (t.components?.cpu || '').toLowerCase().includes(q) ||
      (t.components?.gpu || '').toLowerCase().includes(q)
    );
  }, [tradeIns, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tradeIns.length };
    (Object.keys(STATUS_META) as TradeInStatus[]).forEach(s => {
      c[s] = tradeIns.filter(t => t.status === s).length;
    });
    return c;
  }, [tradeIns]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Trade-Ins</h1>
          <p className="text-slate-500 text-sm mt-1">Review incoming trade-in requests and scanner reports</p>
        </div>
        <button
          onClick={fetchTradeIns}
          className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="admin-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#07090e] border border-[#1f2233] rounded-md focus-within:border-white/20 transition-all">
            <svg className="w-4 h-4 text-slate-500 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search code, name, email, CPU, GPU..."
              className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {(['all', 'pending', 'evaluated', 'accepted', 'declined', 'completed'] as const).map(key => {
            const active = statusFilter === key;
            const label = key === 'all' ? 'All' : STATUS_META[key].label;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#1f2233]/40 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {label} <span className="opacity-60 ml-1">({counts[key] || 0})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Code</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Key Components</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Value</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">Loading trade-ins...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No trade-ins found.</td></tr>
              ) : filtered.map(t => {
                const cpu = t.components?.cpu || t.scannerReport?.summary?.primaryCpu;
                const gpu = t.components?.gpu || t.scannerReport?.summary?.primaryGpu;
                const meta = STATUS_META[t.status];
                return (
                  <tr
                    key={t._id}
                    onClick={() => navigate(`/admin/trade-ins/${t.tradeCode}`)}
                    className="hover:bg-[#1f2233]/30 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-mono text-xs">{t.tradeCode}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200">{t.customerName || <span className="text-slate-600 italic">No name</span>}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{t.customerEmail || '—'}</p>
                    </td>
                    <td className="py-4 px-6">
                      {cpu && <p className="text-slate-300 text-xs truncate max-w-xs"><span className="text-slate-500">CPU:</span> {cpu}</p>}
                      {gpu && <p className="text-slate-300 text-xs truncate max-w-xs mt-0.5"><span className="text-slate-500">GPU:</span> {gpu}</p>}
                      {!cpu && !gpu && <span className="text-slate-600 text-xs italic">No scan yet</span>}
                    </td>
                    <td className="py-4 px-6 text-right text-emerald-500 font-medium">
                      {typeof t.tradeInValue === 'number' ? `$${t.tradeInValue.toFixed(2)}` : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge border ${meta.classes}`}>{meta.label}</span>
                    </td>
                    <td className="py-4 px-6 text-right text-slate-400 text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTradeInsPage;
