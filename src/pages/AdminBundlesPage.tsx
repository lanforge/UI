import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface BundlePart {
  part: {
    _id: string;
    brand: string;
    partModel: string;
    price: number;
    type: string;
    isActive: boolean;
  };
  type: string;
}

interface Bundle {
  _id: string;
  name: string;
  parts: BundlePart[];
  bundlePrice: number;
  isActive: boolean;
  notes: string;
  createdAt: string;
}

const AdminBundlesPage: React.FC = () => {
  const navigate = useNavigate();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBundles = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/bundles/admin/all');
      setBundles(res.data.bundles || []);
    } catch (err) {
      console.error('Failed to fetch bundles', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchBundles(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this bundle? This will not affect any parts or builds.')) return;
    try {
      await api.delete(`/bundles/${id}`);
      fetchBundles();
    } catch (err) {
      alert('Failed to delete bundle');
    }
  };

  const handleToggleActive = async (bundle: Bundle) => {
    try {
      await api.put(`/bundles/${bundle._id}`, { isActive: !bundle.isActive });
      fetchBundles();
    } catch (err) {
      alert('Failed to update bundle');
    }
  };

  const getIndividualTotal = (parts: BundlePart[]) =>
    parts.reduce((sum, p) => sum + (p.part?.price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Part Bundles</h1>
          <p className="text-slate-500 text-sm mt-1">Group parts for combo pricing in the configurator</p>
        </div>
        <button
          onClick={() => navigate('/admin/bundles/add')}
          className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
        >
          + New Bundle
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading bundles...</div>
        ) : bundles.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            <p className="mb-2">No bundles yet.</p>
            <p className="text-xs">Create a bundle to group parts (e.g. CPU + Motherboard) at a combined price in the configurator.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f2233]">
            {bundles.map(bundle => {
              const individualTotal = getIndividualTotal(bundle.parts);
              const savings = individualTotal - bundle.bundlePrice;
              return (
                <div key={bundle._id} className="p-5 hover:bg-[#1f2233]/20 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-white font-medium">{bundle.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          bundle.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                        }`}>
                          {bundle.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {bundle.notes && (
                        <p className="text-xs text-slate-500 mb-2 italic">{bundle.notes}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {bundle.parts.map((bp, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2.5 py-1 rounded-lg border ${
                              bp.part?.isActive !== false
                                ? 'bg-[#0a0c13] border-[#1f2233] text-slate-300'
                                : 'bg-red-500/5 border-red-500/20 text-red-400'
                            }`}
                          >
                            <span className="text-slate-500 uppercase text-[10px] tracking-wider mr-1">{bp.type}</span>
                            {bp.part ? `${bp.part.brand} ${bp.part.partModel}` : 'Unknown Part'}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-400">
                          Individual total: <span className="line-through text-slate-500">${individualTotal.toFixed(2)}</span>
                        </span>
                        <span className="text-white font-semibold">
                          Bundle price: ${bundle.bundlePrice.toFixed(2)}
                        </span>
                        {savings > 0 && (
                          <span className="text-emerald-400 text-xs">
                            saves ${savings.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleActive(bundle)}
                        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                          bundle.isActive
                            ? 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {bundle.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => navigate(`/admin/bundles/edit/${bundle._id}`)}
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(bundle._id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1f2233] rounded-md transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBundlesPage;
