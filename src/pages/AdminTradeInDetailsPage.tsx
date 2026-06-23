import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

type TradeInStatus = 'pending' | 'evaluated' | 'accepted' | 'declined' | 'completed';

interface TradeIn {
  _id: string;
  tradeCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  components: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    storage?: string;
    motherboard?: string;
    psu?: string;
    case?: string;
    cooler?: string;
    other?: string;
  };
  tradeInValue?: number;
  status: TradeInStatus;
  notes?: string;
  scannerReport?: any;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS: TradeInStatus[] = ['pending', 'evaluated', 'accepted', 'declined', 'completed'];

const STATUS_CLASSES: Record<TradeInStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  evaluated: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  accepted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  declined: 'bg-red-500/10 text-red-400 border-red-500/30',
  completed: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

const Card: React.FC<{ title: string; children: React.ReactNode; actions?: React.ReactNode }> = ({ title, children, actions }) => (
  <div className="admin-card p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h2>
      {actions}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
    <p className="text-slate-200 text-sm break-words">{value ?? <span className="text-slate-600">—</span>}</p>
  </div>
);

interface SuggestedValueBreakdownItem {
  key: string;
  reported: string;
  marketMedian: number;
  suggestedValue: number;
  match: {
    catalogId: string;
    brand: string;
    partModel: string;
    upc?: string;
    median: number;
    count: number;
  } | null;
}

interface SuggestedValueResponse {
  tradeCode: string;
  haircut: number;
  breakdown: SuggestedValueBreakdownItem[];
  marketTotal: number;
  suggestedOffer: number;
}

const COMPONENT_LABEL: Record<string, string> = {
  cpu: 'CPU',
  gpu: 'GPU',
  ram: 'RAM',
  storage: 'Storage',
  motherboard: 'Motherboard',
  psu: 'Power Supply',
  case: 'Case',
  cooler: 'CPU Cooler',
};

const AdminTradeInDetailsPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [tradeIn, setTradeIn] = useState<TradeIn | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<TradeInStatus>('pending');
  const [tradeInValue, setTradeInValue] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [haircutPct, setHaircutPct] = useState<string>('70');
  const [suggested, setSuggested] = useState<SuggestedValueResponse | null>(null);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);

  const fetchTradeIn = async () => {
    if (!code) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/trade-ins/${code}`);
      const t: TradeIn = res.data;
      setTradeIn(t);
      setStatus(t.status);
      setTradeInValue(typeof t.tradeInValue === 'number' ? String(t.tradeInValue) : '');
      setNotes(t.notes || '');
    } catch (e) {
      console.error('Failed to fetch trade-in', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchSuggested = async (haircutOverride?: number) => {
    if (!code) return;
    const hc = haircutOverride !== undefined ? haircutOverride : parseFloat(haircutPct);
    const haircutDecimal = !isNaN(hc) && hc > 0 && hc <= 100 ? hc / 100 : 0.7;
    setSuggestedLoading(true);
    setSuggestedError(null);
    try {
      const res = await api.get(`/trade-ins/${code}/suggested-value`, { params: { haircut: haircutDecimal } });
      setSuggested(res.data);
    } catch (e: any) {
      setSuggestedError(e.response?.data?.error || e.message || 'Failed to compute suggested value');
      setSuggested(null);
    } finally {
      setSuggestedLoading(false);
    }
  };

  useEffect(() => {
    if (tradeIn) fetchSuggested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeIn?._id]);

  const applySuggested = () => {
    if (!suggested) return;
    setTradeInValue(suggested.suggestedOffer.toFixed(2));
  };

  const handleSave = async () => {
    if (!code) return;
    setIsSaving(true);
    try {
      const payload: any = { status, notes };
      const valNum = parseFloat(tradeInValue);
      if (!isNaN(valNum)) payload.tradeInValue = valNum;
      else if (tradeInValue === '') payload.tradeInValue = null;
      const res = await api.put(`/trade-ins/${code}`, payload);
      setTradeIn(res.data);
    } catch (e: any) {
      alert('Failed to save: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!code) return;
    if (!window.confirm(`Delete trade-in ${code}? This cannot be undone.`)) return;
    try {
      await api.delete(`/trade-ins/${code}`);
      navigate('/admin/trade-ins');
    } catch (e: any) {
      alert('Failed to delete: ' + (e.response?.data?.error || e.message));
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Loading trade-in...</div>;
  }

  if (!tradeIn) {
    return (
      <div className="admin-card p-12 text-center">
        <p className="text-slate-400">Trade-in not found.</p>
        <button onClick={() => navigate('/admin/trade-ins')} className="mt-4 px-3 py-1.5 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md">
          Back to list
        </button>
      </div>
    );
  }

  const report = tradeIn.scannerReport || {};
  const summary = report.summary || {};
  const system = report.system || {};
  const cpuList = Array.isArray(report.cpu) ? report.cpu : [];
  const gpuList = Array.isArray(report.gpu) ? report.gpu : [];
  const ram = report.ram || {};
  const storage = report.storage || {};
  const mobo = report.motherboard || {};
  const bios = report.bios || {};
  const windows = report.windows || {};
  const security = report.security || {};
  const warnings: string[] = Array.isArray(report.warnings) ? report.warnings : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/admin/trade-ins')}
            className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 mb-2"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Trade-Ins
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium text-white font-mono">{tradeIn.tradeCode}</h1>
            <span className={`admin-badge border ${STATUS_CLASSES[tradeIn.status]}`}>{tradeIn.status}</span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Created {new Date(tradeIn.createdAt).toLocaleString()} · Updated {new Date(tradeIn.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Customer">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Name" value={tradeIn.customerName || '—'} />
              <Field label="Email" value={tradeIn.customerEmail || '—'} />
              <Field label="Phone" value={tradeIn.customerPhone || '—'} />
            </div>
          </Card>

          <Card title="Components (User-Reported)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CPU" value={tradeIn.components.cpu} />
              <Field label="GPU" value={tradeIn.components.gpu} />
              <Field label="RAM" value={tradeIn.components.ram} />
              <Field label="Storage" value={tradeIn.components.storage} />
              <Field label="Motherboard" value={tradeIn.components.motherboard} />
              <Field label="PSU" value={tradeIn.components.psu} />
              <Field label="Case" value={tradeIn.components.case} />
              <Field label="Cooler" value={tradeIn.components.cooler} />
              <div className="md:col-span-2">
                <Field label="Other" value={tradeIn.components.other} />
              </div>
            </div>
          </Card>

          {(summary.scannerId || system.manufacturer || cpuList.length > 0) && (
            <Card title="Scanner Report">
              {(summary.scannerId || summary.scannedAt) && (
                <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4 pb-4 border-b border-[#1f2233]">
                  <Field label="Scanner ID" value={summary.scannerId} />
                  <Field label="Scanned At" value={summary.scannedAt ? new Date(summary.scannedAt).toLocaleString() : undefined} />
                  <Field label="Warnings" value={summary.warningCount ?? warnings.length} />
                </div>
              )}

              {(system.manufacturer || system.model) && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">System</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Field label="Manufacturer" value={system.manufacturer} />
                    <Field label="Model" value={system.model} />
                    <Field label="Computer Name" value={system.computerName} />
                    <Field label="System Type" value={system.systemType} />
                    <Field label="Total RAM" value={system.totalRamGB ? `${system.totalRamGB} GB` : undefined} />
                  </div>
                </div>
              )}

              {cpuList.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">CPU</h3>
                  {cpuList.map((c: any, i: number) => (
                    <div key={i} className="bg-[#07090e] border border-[#1f2233] rounded-md p-3 mb-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <Field label="Name" value={c.name} />
                      <Field label="Cores / Threads" value={c.cores && c.logicalProcessors ? `${c.cores} / ${c.logicalProcessors}` : undefined} />
                      <Field label="Max Clock" value={c.maxClockMHz ? `${c.maxClockMHz} MHz` : undefined} />
                      <Field label="Socket" value={c.socket} />
                      <Field label="L3 Cache" value={c.l3CacheKB ? `${c.l3CacheKB} KB` : undefined} />
                      <Field label="Virtualization" value={typeof c.virtualizationEnabled === 'boolean' ? (c.virtualizationEnabled ? 'Enabled' : 'Disabled') : undefined} />
                    </div>
                  ))}
                </div>
              )}

              {gpuList.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">GPU</h3>
                  {gpuList.map((g: any, i: number) => (
                    <div key={i} className="bg-[#07090e] border border-[#1f2233] rounded-md p-3 mb-2 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <Field label="Name" value={g.name} />
                      <Field label="VRAM (guess)" value={g.vramGuessGB ? `${g.vramGuessGB} GB` : undefined} />
                      <Field label="Driver" value={g.driverVersion} />
                      <Field label="Resolution" value={g.resolution} />
                      <Field label="Refresh Rate" value={g.refreshRate ? `${g.refreshRate} Hz` : undefined} />
                      <Field label="Status" value={g.status} />
                      {g.vramNote && <div className="md:col-span-3"><Field label="VRAM Note" value={g.vramNote} /></div>}
                    </div>
                  ))}
                </div>
              )}

              {ram.totalGB !== undefined && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">RAM</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                    <Field label="Total" value={ram.totalGB ? `${ram.totalGB} GB` : undefined} />
                    <Field label="Layout" value={ram.moduleLayout} />
                    <Field label="Type" value={ram.primaryMemoryType} />
                    <Field label="Speed" value={ram.configuredSpeedMHz ? `${ram.configuredSpeedMHz} MHz` : undefined} />
                  </div>
                  {Array.isArray(ram.modules) && ram.modules.length > 0 && (
                    <details className="text-xs">
                      <summary className="text-slate-500 cursor-pointer hover:text-slate-300">{ram.modules.length} modules</summary>
                      <ul className="mt-2 space-y-1">
                        {ram.modules.map((m: any, i: number) => (
                          <li key={i} className="text-slate-400">
                            <span className="text-slate-300">{m.manufacturer || '?'} {m.partNumber || ''}</span>
                            <span className="text-slate-500 ml-2">{m.capacityGB}GB @ {m.configuredMHz || m.speedMHz}MHz · Slot {m.slot || '?'}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {storage.internalStorageTotalGB !== undefined && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Storage</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs mb-2">
                    <Field label="Total" value={storage.internalStorageTotalGB ? `${storage.internalStorageTotalGB} GB` : undefined} />
                    <Field label="Disk Count" value={storage.diskCount} />
                  </div>
                  {Array.isArray(storage.physicalDisks) && storage.physicalDisks.length > 0 && (
                    <details className="text-xs">
                      <summary className="text-slate-500 cursor-pointer hover:text-slate-300">{storage.physicalDisks.length} disks</summary>
                      <ul className="mt-2 space-y-1">
                        {storage.physicalDisks.map((d: any, i: number) => (
                          <li key={i} className="text-slate-400">
                            <span className="text-slate-300">{d.model || 'Unknown disk'}</span>
                            <span className="text-slate-500 ml-2">{d.sizeGB ? `${d.sizeGB} GB` : ''} · {d.interfaceType || ''} · {d.mediaType || ''}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}

              {(mobo.manufacturer || mobo.product) && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Motherboard</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <Field label="Manufacturer" value={mobo.manufacturer} />
                    <Field label="Product" value={mobo.product} />
                    <Field label="Version" value={mobo.version} />
                    <Field label="Serial" value={mobo.serialNumber} />
                  </div>
                </div>
              )}

              {(windows.caption || bios.manufacturer) && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">OS / BIOS</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <Field label="Windows" value={windows.caption} />
                    <Field label="Version" value={windows.version} />
                    <Field label="Architecture" value={windows.architecture} />
                    <Field label="BIOS" value={bios.name} />
                    <Field label="BIOS Version" value={bios.version} />
                    <Field label="Release Date" value={bios.releaseDate} />
                  </div>
                </div>
              )}

              {(security.secureBoot !== undefined || security.tpmPresent !== undefined) && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Security</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <Field label="Secure Boot" value={String(security.secureBoot)} />
                    <Field label="TPM Present" value={String(security.tpmPresent)} />
                    <Field label="TPM Version" value={security.tpmVersion} />
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-2">Warnings ({warnings.length})</h3>
                  <ul className="space-y-1 text-xs text-amber-300/80">
                    {warnings.map((w, i) => <li key={i}>• {w}</li>)}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card
            title="Suggested Offer"
            actions={
              <button
                onClick={() => fetchSuggested()}
                disabled={suggestedLoading}
                className="text-slate-500 hover:text-slate-300 text-xs disabled:opacity-50"
                title="Recompute"
              >
                <svg className={`w-3.5 h-3.5 ${suggestedLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            }
          >
            {suggestedError ? (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">{suggestedError}</div>
            ) : suggestedLoading && !suggested ? (
              <p className="text-slate-500 text-xs text-center py-3">Matching components against catalog...</p>
            ) : suggested ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Haircut %</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={haircutPct}
                      onChange={e => setHaircutPct(e.target.value)}
                      onBlur={() => fetchSuggested()}
                      onKeyDown={e => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
                      className="admin-input"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Market Total</p>
                    <p className="text-slate-300 font-medium">${suggested.marketTotal.toFixed(2)}</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-md flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-500">Suggested Offer</p>
                    <p className="text-emerald-400 text-xl font-semibold">${suggested.suggestedOffer.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={applySuggested}
                    className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded transition-colors whitespace-nowrap"
                  >
                    Apply to Value
                  </button>
                </div>

                <div className="space-y-1.5">
                  {suggested.breakdown.filter(b => b.reported).map(b => (
                    <div key={b.key} className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 uppercase text-[10px] tracking-wider">{COMPONENT_LABEL[b.key] || b.key}</span>
                        {b.match ? (
                          <span className="text-slate-300">${b.marketMedian.toFixed(2)} <span className="text-emerald-400">→ ${b.suggestedValue.toFixed(2)}</span></span>
                        ) : (
                          <span className="text-slate-600 italic">no match</span>
                        )}
                      </div>
                      <div className="text-slate-500 truncate" title={b.reported}>{b.reported}</div>
                      {b.match && (
                        <div className="text-slate-600 text-[10px] truncate">
                          matched: {b.match.brand} {b.match.partModel}{b.match.count > 0 ? ` · ${b.match.count} listings` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-600">
                  Catalog matches use eBay USED medians (refreshed daily). Components without a match show no suggested value — add them to the catalog with a UPC to include them next time.
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-3">No components to value.</p>
            )}
          </Card>

          <Card title="Status & Value">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TradeInStatus)}
                  className="admin-input"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Trade-In Value ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tradeInValue}
                  onChange={e => setTradeInValue(e.target.value)}
                  className="admin-input"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-1">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="admin-input"
                  placeholder="Notes for internal review..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-2 bg-white text-black hover:bg-gray-200 disabled:opacity-50 text-sm rounded-md font-medium transition-colors"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminTradeInDetailsPage;
