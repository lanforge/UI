import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const PART_TYPES = ['cpu', 'gpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cpu-cooler', 'fan', 'os'];

interface PCPart {
  _id: string;
  brand: string;
  partModel: string;
  price: number;
  type: string;
  isActive: boolean;
}

interface BundlePartEntry {
  partId: string;
  type: string;
}

const AdminAddBundlePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [bundlePrice, setBundlePrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [bundleParts, setBundleParts] = useState<BundlePartEntry[]>([
    { partId: '', type: 'cpu' },
    { partId: '', type: 'motherboard' },
  ]);

  const [allParts, setAllParts] = useState<PCPart[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/pc-parts/admin/all', { params: { limit: 500 } })
      .then(res => setAllParts(res.data.parts || []))
      .catch(() => setError('Failed to load parts'));

    if (isEditing && id) {
      api.get('/bundles/admin/all')
        .then(res => {
          const bundle = (res.data.bundles || []).find((b: any) => b._id === id);
          if (bundle) {
            setName(bundle.name);
            setNotes(bundle.notes || '');
            setBundlePrice(bundle.bundlePrice.toString());
            setIsActive(bundle.isActive);
            setBundleParts(bundle.parts.map((p: any) => ({
              partId: p.part?._id || p.part,
              type: p.type,
            })));
          }
        })
        .catch(() => setError('Failed to load bundle'));
    }
  }, [id, isEditing]);

  const addPartRow = () => {
    setBundleParts(prev => [...prev, { partId: '', type: 'cpu' }]);
  };

  const removePartRow = (index: number) => {
    if (bundleParts.length <= 2) return;
    setBundleParts(prev => prev.filter((_, i) => i !== index));
  };

  const updatePartRow = (index: number, field: 'partId' | 'type', value: string) => {
    setBundleParts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'type') next[index].partId = '';
      return next;
    });
  };

  const getPartsForType = (type: string) =>
    allParts.filter(p => p.type === type);

  const individualTotal = bundleParts.reduce((sum, bp) => {
    const part = allParts.find(p => p._id === bp.partId);
    return sum + (part?.price || 0);
  }, 0);

  const savings = individualTotal - parseFloat(bundlePrice || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const filledParts = bundleParts.filter(bp => bp.partId);
    if (filledParts.length < 2) {
      setError('Select at least 2 parts for the bundle.');
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name,
      notes,
      bundlePrice: parseFloat(bundlePrice),
      isActive,
      parts: filledParts.map(bp => ({ part: bp.partId, type: bp.type })),
    };

    try {
      if (isEditing && id) {
        await api.put(`/bundles/${id}`, payload);
      } else {
        await api.post('/bundles', payload);
      }
      navigate('/admin/bundles');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save bundle');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div>
        <button
          onClick={() => navigate('/admin/bundles')}
          className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Bundles</span>
        </button>
        <h1 className="text-xl font-medium text-white">{isEditing ? 'Edit Bundle' : 'New Bundle'}</h1>
        <p className="text-slate-500 text-sm mt-1">
          Group parts that are purchased together (e.g. from Microcenter) at a combined price. Customers see a "Bundle Deal" badge in the configurator.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="admin-card p-6 space-y-5">
          <h2 className="text-base font-medium text-white border-b border-[#1f2233] pb-4">Bundle Details</h2>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Internal Name *</label>
            <input
              type="text"
              required
              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl"
              placeholder="e.g. AMD Combo — B850 + 9700X"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <p className="text-xs text-slate-600 mt-1">Only visible internally — customers see "Bundle Deal"</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Internal Notes</label>
            <input
              type="text"
              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl"
              placeholder="e.g. Microcenter bundle, expires 2025-06-01"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              className="w-4 h-4 rounded bg-[#0a0c13] border-[#1f2233] text-emerald-500"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
            />
            <label htmlFor="isActive" className="text-sm text-slate-300 cursor-pointer">Active (shown in configurator)</label>
          </div>
        </div>

        {/* Parts Selection */}
        <div className="admin-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f2233] pb-4">
            <h2 className="text-base font-medium text-white">Bundled Parts</h2>
            <button
              type="button"
              onClick={addPartRow}
              className="text-xs px-3 py-1.5 bg-[#1f2233] hover:bg-[#2a3040] text-slate-300 rounded-lg transition-colors"
            >
              + Add Part
            </button>
          </div>

          <div className="space-y-3">
            {bundleParts.map((bp, index) => {
              const partsForType = getPartsForType(bp.type);
              const selectedPart = allParts.find(p => p._id === bp.partId);
              return (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={bp.type}
                    onChange={e => updatePartRow(index, 'type', e.target.value)}
                    className="admin-input w-36 shrink-0 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl text-xs"
                  >
                    {PART_TYPES.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    value={bp.partId}
                    onChange={e => updatePartRow(index, 'partId', e.target.value)}
                    className="admin-input flex-1 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl text-sm"
                  >
                    <option value="">— Select Part —</option>
                    {partsForType.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.brand} {p.partModel} — ${p.price.toFixed(2)}{!p.isActive ? ' (inactive)' : ''}
                      </option>
                    ))}
                  </select>

                  {selectedPart && (
                    <span className="text-sm text-slate-400 shrink-0 w-20 text-right">
                      ${selectedPart.price.toFixed(2)}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => removePartRow(index)}
                    disabled={bundleParts.length <= 2}
                    className="p-1.5 text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30"
                    title="Remove part"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Price summary */}
          {individualTotal > 0 && (
            <div className="mt-4 p-4 bg-[#0a0c13] rounded-xl border border-[#1f2233] space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Individual total</span>
                <span className="line-through">${individualTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-medium">
                <span>Bundle price</span>
                <span>${parseFloat(bundlePrice || '0').toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs">
                  <span>Customer saves</span>
                  <span>${savings.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bundle Price */}
        <div className="admin-card p-6 space-y-5">
          <h2 className="text-base font-medium text-white border-b border-[#1f2233] pb-4">Bundle Price</h2>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Combined Bundle Price ($) *</label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-xl"
              placeholder="e.g. 399.99"
              value={bundlePrice}
              onChange={e => setBundlePrice(e.target.value)}
            />
            <p className="text-xs text-slate-600 mt-1">
              This replaces the sum of individual part prices in the configurator total when all bundled parts are selected.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/bundles')}
            className="px-6 py-2.5 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddBundlePage;
