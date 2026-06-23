import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface GiftCard {
  _id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: string;
  purchaserName?: string;
  purchaserEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  message?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

interface NewGiftCard {
  initialBalance: number;
  recipientName: string;
  recipientEmail: string;
  purchaserName: string;
  purchaserEmail: string;
  message: string;
  expiresAt: string;
}

const emptyForm: NewGiftCard = {
  initialBalance: 50,
  recipientName: '',
  recipientEmail: '',
  purchaserName: '',
  purchaserEmail: '',
  message: '',
  expiresAt: '',
};

const AdminGiftcardsPage: React.FC = () => {
  const [giftcards, setGiftcards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<NewGiftCard>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [adjustingCard, setAdjustingCard] = useState<GiftCard | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract' | 'set'>('add');

  const [issuedCard, setIssuedCard] = useState<GiftCard | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const buildShareMessage = (card: GiftCard) => {
    const url = `${window.location.origin}/giftcard`;
    const lines = [
      'Your LANForge gift card is ready!',
      '',
      `Balance: $${card.currentBalance.toFixed(2)}`,
      `Code: ${card.code}`,
    ];
    if (card.expiresAt) {
      lines.push(`Expires: ${new Date(card.expiresAt).toLocaleDateString()}`);
    }
    lines.push('', 'Check balance & details:', url);
    return lines.join('\n');
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
    } catch {}
  };

  const fetchGiftcards = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/giftcards/admin/all', { params: { page, limit: 20 } });
      setGiftcards(res.data.giftcards || []);
      setPages(res.data.pages || 1);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGiftcards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload: any = {
        initialBalance: form.initialBalance,
      };
      if (form.recipientName) payload.recipientName = form.recipientName;
      if (form.recipientEmail) payload.recipientEmail = form.recipientEmail;
      if (form.purchaserName) payload.purchaserName = form.purchaserName;
      if (form.purchaserEmail) payload.purchaserEmail = form.purchaserEmail;
      if (form.message) payload.message = form.message;
      if (form.expiresAt) payload.expiresAt = form.expiresAt;

      const res = await api.post('/giftcards', payload);
      setIssuedCard(res.data.giftcard);
      setIsCreateOpen(false);
      setForm(emptyForm);
      fetchGiftcards();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating gift card');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCard) return;
    try {
      await api.put(`/giftcards/${adjustingCard._id}/adjust`, {
        amount: adjustAmount,
        type: adjustType,
      });
      setAdjustingCard(null);
      setAdjustAmount(0);
      setAdjustType('add');
      fetchGiftcards();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error adjusting balance');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this gift card? This cannot be undone.')) return;
    try {
      await api.delete(`/giftcards/${id}`);
      fetchGiftcards();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error deleting gift card');
    }
  };

  const filtered = giftcards.filter((g) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      g.code.toLowerCase().includes(q) ||
      (g.recipientEmail || '').toLowerCase().includes(q) ||
      (g.recipientName || '').toLowerCase().includes(q) ||
      (g.purchaserEmail || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total,
    active: giftcards.filter((g) => g.isActive).length,
    outstanding: giftcards.reduce((sum, g) => sum + (g.currentBalance || 0), 0),
    issued: giftcards.reduce((sum, g) => sum + (g.initialBalance || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Gift Cards</h1>
          <p className="text-slate-500 text-sm mt-1">Generate and manage gift cards</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
        >
          + Generate Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="admin-card p-4 border border-[#1f2233]">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Total Cards</p>
          <p className="text-xl font-medium text-white mt-1">{stats.total}</p>
        </div>
        <div className="admin-card p-4 border border-[#1f2233]">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Active (page)</p>
          <p className="text-xl font-medium text-white mt-1">{stats.active}</p>
        </div>
        <div className="admin-card p-4 border border-[#1f2233]">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Outstanding (page)</p>
          <p className="text-xl font-medium text-emerald-500 mt-1">${stats.outstanding.toFixed(2)}</p>
        </div>
        <div className="admin-card p-4 border border-[#1f2233]">
          <p className="text-slate-500 text-xs uppercase tracking-wider">Issued (page)</p>
          <p className="text-xl font-medium text-white mt-1">${stats.issued.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by code, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input pl-10"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button onClick={fetchGiftcards} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-hidden">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[#1f2233] bg-[#07090e]">
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Code</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Recipient</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Balance</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Initial</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Expires</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2233]">
            {isLoading ? (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500 text-sm">Loading gift cards...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-slate-500 text-sm">No gift cards found</td></tr>
            ) : (
              filtered.map((g) => (
                <tr key={g._id} className="hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-emerald-500 font-medium">{g.code}</span>
                      <button
                        onClick={() => copyText(g.code, `code-${g._id}`)}
                        className="text-slate-500 hover:text-white transition-colors"
                        title="Copy code"
                      >
                        {copiedKey === `code-${g._id}` ? (
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {g.recipientName || g.recipientEmail ? (
                      <div>
                        <div className="text-slate-200">{g.recipientName || '—'}</div>
                        {g.recipientEmail && <div className="text-slate-500 text-xs">{g.recipientEmail}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-emerald-500 font-medium">${g.currentBalance.toFixed(2)}</td>
                  <td className="py-4 px-6 text-slate-400">${g.initialBalance.toFixed(2)}</td>
                  <td className="py-4 px-6 text-slate-400">
                    {g.expiresAt ? new Date(g.expiresAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`admin-badge ${
                      g.isActive && g.currentBalance > 0
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-gray-500/10 text-slate-400 border-gray-500/20'
                    }`}>
                      {!g.isActive ? 'Inactive' : g.currentBalance <= 0 ? 'Used' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => copyText(buildShareMessage(g), `link-${g._id}`)}
                        className="px-2 py-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-md transition-colors flex items-center gap-1"
                        title="Copy shareable message with URL and code"
                      >
                        {copiedKey === `link-${g._id}` ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Copy Link
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setAdjustingCard(g);
                          setAdjustAmount(0);
                          setAdjustType('add');
                        }}
                        className="px-2 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors"
                      >
                        Adjust
                      </button>
                      <button
                        onClick={() => handleDelete(g._id)}
                        className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#1f2233]">
            <span className="text-xs text-slate-500">Page {page} of {pages}</span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="px-3 py-1.5 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#11141d] border border-[#1f2233] rounded-md w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-[#1f2233] flex justify-between items-center bg-[#07090e]">
              <h2 className="text-sm font-medium text-white">Generate Gift Card</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount $ *</label>
                <input
                  type="number"
                  value={form.initialBalance}
                  onChange={(e) => setForm({ ...form, initialBalance: parseFloat(e.target.value) || 0 })}
                  className="admin-input"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Recipient Name</label>
                  <input
                    type="text"
                    value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Recipient Email</label>
                  <input
                    type="email"
                    value={form.recipientEmail}
                    onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Purchaser Name</label>
                  <input
                    type="text"
                    value={form.purchaserName}
                    onChange={(e) => setForm({ ...form, purchaserName: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Purchaser Email</label>
                  <input
                    type="email"
                    value={form.purchaserEmail}
                    onChange={(e) => setForm({ ...form, purchaserEmail: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="admin-input"
                  rows={2}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Expires At (optional)</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-2 px-4 border border-[#1f2233] rounded-md text-slate-400 hover:bg-[#1f2233]/50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 px-4 bg-white hover:bg-gray-200 text-black rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust modal */}
      {adjustingCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#11141d] border border-[#1f2233] rounded-md w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#1f2233] flex justify-between items-center bg-[#07090e]">
              <h2 className="text-sm font-medium text-white">Adjust Balance</h2>
              <button onClick={() => setAdjustingCard(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdjust} className="p-6 space-y-4">
              <div className="bg-[#07090e] border border-[#1f2233] rounded-md p-3">
                <div className="text-xs text-slate-500 uppercase tracking-wider">Code</div>
                <div className="font-mono text-emerald-500 font-medium">{adjustingCard.code}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mt-2">Current Balance</div>
                <div className="text-slate-200">${adjustingCard.currentBalance.toFixed(2)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Action</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="admin-input"
                  >
                    <option value="add">Add</option>
                    <option value="subtract">Subtract</option>
                    <option value="set">Set to</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Amount $</label>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                    className="admin-input"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setAdjustingCard(null)} className="flex-1 py-2 px-4 border border-[#1f2233] rounded-md text-slate-400 hover:bg-[#1f2233]/50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 px-4 bg-white hover:bg-gray-200 text-black rounded-md transition-colors text-sm font-medium">
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issued card success modal */}
      {issuedCard && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#11141d] border border-[#1f2233] rounded-md w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-[#1f2233] flex justify-between items-center bg-[#07090e]">
              <h2 className="text-sm font-medium text-white">Gift Card Generated</h2>
              <button onClick={() => setIssuedCard(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border border-emerald-500/30 rounded-lg p-6 text-center">
                <p className="text-xs text-emerald-400 uppercase tracking-wider mb-2">Gift Card Code</p>
                <p className="font-mono text-2xl text-white font-bold tracking-wider">{issuedCard.code}</p>
                <p className="text-3xl text-white font-bold mt-4">${issuedCard.initialBalance.toFixed(2)}</p>
                {issuedCard.recipientName && (
                  <p className="text-slate-300 text-sm mt-3">For {issuedCard.recipientName}</p>
                )}
              </div>

              <button
                onClick={() => copyText(buildShareMessage(issuedCard), 'issued-link')}
                className="w-full py-2 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-md transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                {copiedKey === 'issued-link' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Message Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copy Shareable Message
                  </>
                )}
              </button>

              <button
                onClick={() => copyText(issuedCard.code, 'issued-code')}
                className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
              >
                {copiedKey === 'issued-code' ? 'Code Copied!' : 'Copy Code Only'}
              </button>

              <button
                onClick={() => setIssuedCard(null)}
                className="w-full py-2 px-4 bg-white hover:bg-gray-200 text-black rounded-md transition-colors text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGiftcardsPage;
