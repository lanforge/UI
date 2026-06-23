import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../utils/api';

type UsedPartType = 'cpu' | 'gpu' | 'ram' | 'storage' | 'case' | 'psu' | 'cpu-cooler' | 'motherboard' | 'fan' | 'other';

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

interface EbayItem {
  title: string;
  price: number;
  currency: string;
  condition?: string;
  url?: string;
  imageUrl?: string;
  sellerFeedback?: string;
}

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
}

interface EbayProductInfo {
  title?: string;
  brand?: string;
  mpn?: string;
  gtin?: string;
  imageUrl?: string;
  categoryPath?: string;
  detectedType?: UsedPartType;
}

interface EbayResult {
  query: string;
  upc?: string;
  dataSource?: 'sold-14d' | 'active';
  stats: EbayStats | null;
  productInfo?: EbayProductInfo;
  items: EbayItem[];
}

export interface EditingUsedPart {
  _id: string;
  type: UsedPartType;
  brand: string;
  partModel: string;
  price: number;
  notes?: string;
  upc?: string;
  ebayQuery?: string;
  autoUpdatePrice?: boolean;
}

interface AdminUsedPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editing?: EditingUsedPart | null;
}

const detectType = (text: string): UsedPartType => {
  const t = text.toLowerCase();
  if (/\b(rtx|gtx|radeon|geforce|gpu|graphics|video card|arc a[0-9]{3})\b/.test(t)) return 'gpu';
  if (/\b(ryzen|threadripper|core i[3579]|xeon|pentium|celeron|cpu|processor)\b/.test(t)) return 'cpu';
  if (/\b(ddr[345]|memory|ram)\b/.test(t)) return 'ram';
  if (/\b(ssd|hdd|nvme|m\.2|sata drive|hard drive)\b/.test(t)) return 'storage';
  if (/\b(motherboard|mobo|mainboard|atx|micro-?atx|mini-?itx)\b/.test(t)) return 'motherboard';
  if (/\b(power supply|psu|\d{3,4}\s*w(att)?)\b/.test(t)) return 'psu';
  if (/\b(cooler|aio|heatsink|liquid)\b/.test(t)) return 'cpu-cooler';
  if (/\b(case|chassis|tower)\b/.test(t)) return 'case';
  if (/\b(fan)\b/.test(t)) return 'fan';
  return 'other';
};

const splitBrandModel = (title: string): { brand: string; model: string } => {
  const cleaned = title.replace(/\s{2,}/g, ' ').trim();
  const tokens = cleaned.split(' ');
  if (tokens.length <= 1) return { brand: cleaned, model: '' };
  return { brand: tokens[0], model: tokens.slice(1).join(' ') };
};

const emptyState = {
  search: '',
  upc: '',
  type: 'other' as UsedPartType,
  brand: '',
  partModel: '',
  price: '',
  notes: '',
  autoUpdatePrice: false,
};

const AdminUsedPartModal: React.FC<AdminUsedPartModalProps> = ({ isOpen, onClose, onSuccess, editing }) => {
  const [form, setForm] = useState(emptyState);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [ebayResult, setEbayResult] = useState<EbayResult | null>(null);
  const [ebayLoading, setEbayLoading] = useState(false);
  const [ebayError, setEbayError] = useState<string | null>(null);
  const [pickedTitle, setPickedTitle] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      const seed = editing.ebayQuery || `${editing.brand} ${editing.partModel}`.trim();
      setForm({
        search: seed,
        upc: editing.upc || '',
        type: editing.type,
        brand: editing.brand,
        partModel: editing.partModel,
        price: String(editing.price ?? ''),
        notes: editing.notes || '',
        autoUpdatePrice: !!editing.autoUpdatePrice,
      });
      setShowAdvanced(true);
      setPickedTitle(null);
      setEbayResult(null);
      setEbayError(null);
    } else {
      setForm(emptyState);
      setShowAdvanced(false);
      setPickedTitle(null);
      setEbayResult(null);
      setEbayError(null);
    }
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editing]);

  const runSearch = async (opts: { query?: string; upc?: string }) => {
    const q = (opts.query || '').trim();
    const upcDigits = (opts.upc || '').replace(/\D/g, '');
    if (!q && !upcDigits) {
      setEbayResult(null);
      return;
    }
    setEbayLoading(true);
    setEbayError(null);
    try {
      const params: any = { condition: 'USED', limit: 50 };
      if (upcDigits) params.upc = upcDigits;
      else params.q = q;
      const res = await api.get('/used-parts/ebay/comparables', { params });
      setEbayResult(res.data);
      // Auto-apply product info when looking up by UPC
      if (upcDigits && res.data?.productInfo) {
        applyProductInfo(res.data.productInfo, res.data.stats?.suggested);
      }
    } catch (e: any) {
      setEbayResult(null);
      setEbayError(e.response?.data?.message || e.message || 'eBay lookup failed');
    } finally {
      setEbayLoading(false);
    }
  };

  const applyProductInfo = (info: EbayProductInfo, suggestedPrice?: number) => {
    const { brand: parsedBrand, model: parsedModel } = splitBrandModel(info.title || '');
    setForm(prev => ({
      ...prev,
      brand: info.brand || prev.brand || parsedBrand,
      partModel: info.mpn || (info.title ? (parsedModel || info.title) : prev.partModel),
      type: (info.detectedType as UsedPartType) || (prev.type === 'other' ? detectType(info.title || '') : prev.type),
      price: suggestedPrice ? suggestedPrice.toFixed(2) : prev.price,
    }));
    setShowAdvanced(true);
  };

  // Debounced search as user types (text only — UPC lookups are explicit)
  useEffect(() => {
    if (!isOpen || editing) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (form.upc.replace(/\D/g, '').length >= 8) {
      // User is typing a UPC — don't run a free-text search.
      setEbayResult(null);
      return;
    }
    if (form.search.trim().length < 3) {
      setEbayResult(null);
      return;
    }
    searchTimer.current = setTimeout(() => runSearch({ query: form.search }), 500);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.search, form.upc, isOpen, editing]);

  const lookupByUpc = () => {
    const digits = form.upc.replace(/\D/g, '');
    if (digits.length < 8) {
      setEbayError('Enter a valid UPC/EAN (8+ digits).');
      return;
    }
    runSearch({ upc: digits });
  };

  const pickListing = (item: EbayItem) => {
    const { brand, model } = splitBrandModel(item.title);
    const detected = detectType(item.title);
    setForm(prev => ({
      ...prev,
      brand,
      partModel: model,
      type: detected,
      price: (ebayResult?.stats?.suggested || item.price).toFixed(2),
    }));
    setPickedTitle(item.title);
    setShowAdvanced(true);
  };

  const useSuggestedFromCurrentResult = () => {
    if (!ebayResult) return;
    const inferredFromQuery = detectType(form.search);
    const { brand, model } = splitBrandModel(form.search);
    setForm(prev => ({
      ...prev,
      brand: prev.brand || brand,
      partModel: prev.partModel || model,
      type: prev.type === 'other' ? inferredFromQuery : prev.type,
      price: ebayResult.stats ? ebayResult.stats.suggested.toFixed(2) : prev.price,
    }));
    setShowAdvanced(true);
  };

  const enterManually = () => {
    const inferred = detectType(form.search);
    const { brand, model } = splitBrandModel(form.search);
    setForm(prev => ({
      ...prev,
      brand: prev.brand || brand,
      partModel: prev.partModel || model,
      type: prev.type === 'other' ? inferred : prev.type,
    }));
    setShowAdvanced(true);
  };

  const canSubmit = useMemo(() => {
    if (!form.brand && !form.partModel) return false;
    return true;
  }, [form]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Add a brand or model.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        type: form.type,
        brand: form.brand.trim(),
        partModel: form.partModel.trim(),
        price: parseFloat(form.price) || 0,
        notes: form.notes.trim(),
        upc: form.upc.replace(/\D/g, '') || undefined,
        ebayQuery: form.search.trim() || undefined,
        autoUpdatePrice: form.autoUpdatePrice,
      };
      if (editing) {
        await api.put(`/used-parts/${editing._id}`, payload);
      } else {
        await api.post('/used-parts', payload);
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || e.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-5 border-b border-[#1f2233] shrink-0">
          <div>
            <h2 className="text-lg font-medium text-white">{editing ? 'Edit Used Part' : 'Add Used Part'}</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {editing ? 'Update part details and pricing strategy.' : 'Search eBay to find a match, or enter manually.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-medium text-emerald-400 mb-1.5">
              UPC / Barcode <span className="text-slate-500 font-normal normal-case">(recommended — most accurate)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.upc}
                onChange={e => setForm({ ...form, upc: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); lookupByUpc(); } }}
                placeholder="e.g. 730143314060"
                className="admin-input font-mono flex-1"
                inputMode="numeric"
                autoFocus={!editing}
              />
              <button
                type="button"
                onClick={lookupByUpc}
                disabled={ebayLoading || form.upc.replace(/\D/g, '').length < 8}
                className="px-4 py-2 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-40 rounded-md transition-colors whitespace-nowrap"
              >
                {ebayLoading ? 'Looking up...' : 'Lookup UPC'}
              </button>
            </div>
            <p className="text-[11px] text-slate-600">
              Pulls used-condition sales from the past 14 days (or current active listings if sold-data scope isn't enabled),
              takes the median (single parts only — bundles excluded), and auto-fills product details. The daily refresh keeps this UPC's pricing current.
            </p>
          </div>

          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1f2233]" /></div>
            <div className="relative flex justify-center"><span className="bg-[#0a0c13] px-2 text-[10px] uppercase tracking-wider text-slate-600">or</span></div>
          </div>

          {!editing && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Search by name</label>
              <input
                type="text"
                value={form.search}
                onChange={e => setForm({ ...form, search: e.target.value })}
                placeholder="e.g. AMD Ryzen 5 7600X, RTX 4070 Founders Edition..."
                className="admin-input"
              />
              <p className="text-[11px] text-slate-600 mt-1">Less accurate than UPC — text matches can pull in unrelated listings.</p>
            </div>
          )}

          {!editing && ebayLoading && (
            <div className="text-xs text-slate-500 text-center py-4">Searching eBay...</div>
          )}

          {!editing && ebayError && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded p-2">
              {ebayError}
            </div>
          )}

          {ebayResult && (
            <div className="space-y-3">
              {ebayResult.upc && ebayResult.productInfo && (
                <div className="flex items-center gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-md">
                  {ebayResult.productInfo.imageUrl && (
                    <img src={ebayResult.productInfo.imageUrl} alt="" className="w-12 h-12 object-cover rounded border border-[#1f2233] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="text-blue-300">Auto-filled from UPC <span className="font-mono text-slate-300">{ebayResult.upc}</span></p>
                    <p className="text-slate-200 truncate mt-0.5">{ebayResult.productInfo.title || 'Untitled listing'}</p>
                    <p className="text-slate-500 mt-0.5">
                      {ebayResult.productInfo.brand && <span>Brand: {ebayResult.productInfo.brand}</span>}
                      {ebayResult.productInfo.mpn && <span className="ml-3">MPN: {ebayResult.productInfo.mpn}</span>}
                    </p>
                  </div>
                </div>
              )}

              {ebayResult.stats && (
                <div className="flex items-center justify-between gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md">
                  <div className="text-xs">
                    <div>
                      <span className="text-slate-400">
                        Median of {ebayResult.stats.count}{' '}
                        {ebayResult.dataSource === 'sold-14d' ? 'sold in last 14 days' : 'active listings'}:{' '}
                      </span>
                      <span className="text-emerald-400 font-semibold">${ebayResult.stats.median.toFixed(2)}</span>
                      <span className="text-slate-500"> · range ${ebayResult.stats.min.toFixed(2)}–${ebayResult.stats.max.toFixed(2)}</span>
                    </div>
                    {!!ebayResult.stats.outliersRemoved && ebayResult.stats.outliersRemoved > 0 && (
                      <div className="text-slate-500 mt-0.5">
                        Filtered out {ebayResult.stats.outliersRemoved} outlier{ebayResult.stats.outliersRemoved === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={useSuggestedFromCurrentResult}
                    className="px-3 py-1 text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded transition-colors whitespace-nowrap"
                  >
                    Use ${ebayResult.stats.suggested.toFixed(2)}
                  </button>
                </div>
              )}

              {ebayResult.items.length > 0 && (
                <div className="max-h-56 overflow-y-auto pr-1 space-y-1">
                  {ebayResult.items.slice(0, 8).map((item, i) => {
                    const isPicked = pickedTitle === item.title;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => pickListing(item)}
                        className={`w-full flex items-center gap-3 p-2 rounded border transition-colors text-left ${
                          isPicked ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-[#1f2233] bg-[#07090e] hover:border-[#2a2f43]'
                        }`}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded border border-[#1f2233] shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-[#1f2233] rounded shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 text-xs truncate">{item.title}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">{item.condition || 'Used'}{item.sellerFeedback ? ` · ${item.sellerFeedback}% seller` : ''}</p>
                        </div>
                        <span className="text-emerald-400 text-sm font-medium shrink-0">${item.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {ebayResult.items.length === 0 && (
                <div className="text-xs text-slate-500 text-center py-2">
                  No listings found.{' '}
                  <button type="button" onClick={enterManually} className="text-emerald-400 hover:underline">Enter manually →</button>
                </div>
              )}
            </div>
          )}

          {!editing && !showAdvanced && form.search.trim().length >= 3 && (
            <button
              type="button"
              onClick={enterManually}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip eBay and enter manually →
            </button>
          )}

          {(showAdvanced || editing) && (
            <div className="space-y-4 pt-4 border-t border-[#1f2233]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as UsedPartType })}
                    className="admin-input"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Market Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="admin-input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 p-3 bg-[#07090e] border border-[#1f2233] rounded-md cursor-pointer hover:border-[#2a2f43] transition-colors">
                <input
                  type="checkbox"
                  checked={form.autoUpdatePrice}
                  onChange={e => setForm({ ...form, autoUpdatePrice: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded bg-[#11141d] border-[#1f2233]"
                />
                <div className="flex-1">
                  <p className="text-slate-200 text-sm">Auto-update price daily</p>
                  <p className="text-slate-500 text-xs mt-0.5">Replace this price with the new median every 24 hours when eBay stats refresh.</p>
                </div>
              </label>

              <details className="text-sm">
                <summary className="cursor-pointer text-slate-400 hover:text-slate-300 text-xs">Advanced details (brand, model, notes)</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#1f2233]">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Brand</label>
                    <input
                      type="text"
                      value={form.brand}
                      onChange={e => setForm({ ...form, brand: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                    <input
                      type="text"
                      value={form.partModel}
                      onChange={e => setForm({ ...form, partModel: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="admin-input"
                      rows={2}
                      placeholder="Condition, included accessories..."
                    />
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-[#1f2233] flex items-center justify-end gap-2 shrink-0 bg-[#07090e]/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !canSubmit}
            className="px-4 py-1.5 text-xs bg-white text-black hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-md font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Add Part'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminUsedPartModal;
