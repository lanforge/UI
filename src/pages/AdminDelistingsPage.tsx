import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface DelistReview {
  reason: 'price_drop' | 'price_spike';
  oldCost: number;
  newCost: number;
  triggeredAt: string;
}

interface PartReview {
  _id: string;
  type: string;
  brand: string;
  partModel: string;
  sku: string;
  price: number;
  cost: number;
  productUrl?: string;
  delistReview: DelistReview;
}

interface ProductReview {
  _id: string;
  name: string;
  sku: string;
  slug: string;
  price: number;
  cost: number;
  images: string[];
  parts: Array<{ _id: string; brand: string; partModel: string; sku: string; cost?: number; productUrl?: string; isActive: boolean }>;
  delistReview: DelistReview & {
    triggeringPartId?: { _id: string; brand: string; partModel: string; sku: string } | string;
  };
}

const formatMoney = (n: number) => `$${(n ?? 0).toFixed(2)}`;
const percentChange = (oldVal: number, newVal: number) => {
  if (!oldVal) return 0;
  return ((newVal - oldVal) / oldVal) * 100;
};

const ReasonBadge: React.FC<{ reason: 'price_drop' | 'price_spike' }> = ({ reason }) => {
  if (reason === 'price_drop') {
    return <span className="admin-badge bg-red-500/10 text-red-400 border border-red-500/30">Price Drop</span>;
  }
  return <span className="admin-badge bg-amber-500/10 text-amber-400 border border-amber-500/30">Price Spike</span>;
};

const AdminDelistingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'parts' | 'products'>('parts');
  const [parts, setParts] = useState<PartReview[]>([]);
  const [products, setProducts] = useState<ProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [partsRes, productsRes] = await Promise.all([
        api.get('/pc-parts/admin/delistings/list'),
        api.get('/products/admin/delistings/list'),
      ]);
      setParts(partsRes.data.parts || []);
      setProducts(productsRes.data.products || []);
    } catch (e) {
      console.error('Failed to fetch delistings', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePartAction = async (id: string, action: 'approve' | 'deny') => {
    setActingOn(id);
    try {
      const url = action === 'approve' ? `/pc-parts/${id}/approve-delist` : `/pc-parts/${id}/deny-delist`;
      await api.post(url);
      setParts(prev => prev.filter(p => p._id !== id));
    } catch (e: any) {
      alert(`Failed to ${action}: ${e.response?.data?.message || e.message}`);
    } finally {
      setActingOn(null);
    }
  };

  const handleProductAction = async (id: string, action: 'approve' | 'deny') => {
    setActingOn(id);
    try {
      const url = action === 'approve' ? `/products/${id}/approve-delist` : `/products/${id}/deny-delist`;
      await api.post(url);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (e: any) {
      alert(`Failed to ${action}: ${e.response?.data?.message || e.message}`);
    } finally {
      setActingOn(null);
    }
  };

  const totalCount = parts.length + products.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Delisting Reviews</h1>
          <p className="text-slate-500 text-sm mt-1">
            Parts and products auto-delisted by the price safeguard. Approve to rescrape and restore, deny to keep inactive.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="admin-card p-1 inline-flex">
        <button
          onClick={() => setTab('parts')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
            tab === 'parts' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Parts <span className="ml-2 text-xs opacity-70">({parts.length})</span>
        </button>
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
            tab === 'products' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Products <span className="ml-2 text-xs opacity-70">({products.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="admin-card p-12 text-center text-slate-500 text-sm">Loading…</div>
      ) : totalCount === 0 ? (
        <div className="admin-card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400 text-sm">No items pending review.</p>
          <p className="text-slate-600 text-xs mt-1">The price safeguard hasn't flagged anything.</p>
        </div>
      ) : tab === 'parts' ? (
        <div className="space-y-3">
          {parts.length === 0 ? (
            <div className="admin-card p-8 text-center text-slate-500 text-sm">No parts pending review.</div>
          ) : parts.map(part => {
            const pct = percentChange(part.delistReview.oldCost, part.delistReview.newCost);
            const dropped = part.delistReview.reason === 'price_drop';
            return (
              <div key={part._id} className="admin-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <ReasonBadge reason={part.delistReview.reason} />
                      <span className="text-slate-500 text-xs uppercase tracking-wider">{part.type}</span>
                      <span className="text-slate-600 text-xs">
                        {new Date(part.delistReview.triggeredAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="text-slate-100 font-medium">{part.brand} {part.partModel}</h3>
                    <p className="text-slate-500 text-xs font-mono mt-0.5">{part.sku}</p>

                    <div className="grid grid-cols-3 gap-4 mt-4 max-w-md">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Old Cost</p>
                        <p className="text-slate-300 font-medium">{formatMoney(part.delistReview.oldCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">New Cost</p>
                        <p className={`font-medium ${dropped ? 'text-red-400' : 'text-amber-400'}`}>
                          {formatMoney(part.delistReview.newCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Change</p>
                        <p className={`font-medium ${dropped ? 'text-red-400' : 'text-amber-400'}`}>
                          {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {part.productUrl && (
                      <a
                        href={part.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-500 text-xs hover:underline mt-3"
                      >
                        View source listing
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handlePartAction(part._id, 'approve')}
                      disabled={actingOn === part._id}
                      className="px-4 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      {actingOn === part._id ? 'Working…' : 'Approve & Restore'}
                    </button>
                    <button
                      onClick={() => handlePartAction(part._id, 'deny')}
                      disabled={actingOn === part._id}
                      className="px-4 py-1.5 text-xs bg-[#1f2233]/50 text-slate-300 border border-[#1f2233] hover:bg-[#1f2233] rounded-md transition-colors disabled:opacity-50"
                    >
                      Deny (Keep Inactive)
                    </button>
                    <button
                      onClick={() => navigate(`/admin/parts/edit/${part._id}`)}
                      className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Edit Part
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {products.length === 0 ? (
            <div className="admin-card p-8 text-center text-slate-500 text-sm">No products pending review.</div>
          ) : products.map(product => {
            const pct = percentChange(product.delistReview.oldCost, product.delistReview.newCost);
            const dropped = product.delistReview.reason === 'price_drop';
            const triggeringPart = typeof product.delistReview.triggeringPartId === 'object'
              ? product.delistReview.triggeringPartId
              : null;
            return (
              <div key={product._id} className="admin-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <ReasonBadge reason={product.delistReview.reason} />
                      <span className="text-slate-600 text-xs">
                        {new Date(product.delistReview.triggeredAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="w-12 h-12 object-cover rounded border border-[#1f2233]" />
                      )}
                      <div className="min-w-0">
                        <h3 className="text-slate-100 font-medium">{product.name}</h3>
                        <p className="text-slate-500 text-xs font-mono mt-0.5">{product.sku}</p>
                      </div>
                    </div>

                    {triggeringPart && (
                      <p className="text-slate-500 text-xs mt-3">
                        Triggered by part:{' '}
                        <span className="text-slate-300">{triggeringPart.brand} {triggeringPart.partModel}</span>
                        <span className="text-slate-600 font-mono ml-2">({triggeringPart.sku})</span>
                      </p>
                    )}

                    <div className="grid grid-cols-3 gap-4 mt-4 max-w-md">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Old Cost</p>
                        <p className="text-slate-300 font-medium">{formatMoney(product.delistReview.oldCost)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">New Cost</p>
                        <p className={`font-medium ${dropped ? 'text-red-400' : 'text-amber-400'}`}>
                          {formatMoney(product.delistReview.newCost)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Change</p>
                        <p className={`font-medium ${dropped ? 'text-red-400' : 'text-amber-400'}`}>
                          {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {product.parts?.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-slate-500 text-xs cursor-pointer hover:text-slate-300">
                          {product.parts.length} parts in this build
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs">
                          {product.parts.map(p => (
                            <li key={p._id} className="text-slate-400 flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              <span>{p.brand} {p.partModel}</span>
                              <span className="text-slate-600 font-mono">{p.sku}</span>
                              <span className="text-slate-500 ml-auto">{formatMoney(p.cost || 0)}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleProductAction(product._id, 'approve')}
                      disabled={actingOn === product._id}
                      className="px-4 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      {actingOn === product._id ? 'Working…' : 'Approve & Restore'}
                    </button>
                    <button
                      onClick={() => handleProductAction(product._id, 'deny')}
                      disabled={actingOn === product._id}
                      className="px-4 py-1.5 text-xs bg-[#1f2233]/50 text-slate-300 border border-[#1f2233] hover:bg-[#1f2233] rounded-md transition-colors disabled:opacity-50"
                    >
                      Deny (Keep Inactive)
                    </button>
                    <button
                      onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                      className="px-4 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Edit Product
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDelistingsPage;
