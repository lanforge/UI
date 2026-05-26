import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface PurchasedPC {
  _id: string;
  serialNumber: string;
  name: string;
  status: string;
  color?: string;
  specs: Record<string, string>;
  parts?: Array<{
    partType: string;
    part?: string;
    name?: string;
    price?: number;
  }>;
  notes?: string;
  order?: {
    _id: string;
    orderNumber: string;
    status: string;
  };
  customer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

const AdminPurchasedPCDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [pc, setPc] = useState<PurchasedPC | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchPCDetails();
    }
  }, [id]);

  const fetchPCDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/purchased-pcs/${id}`);
      setPc(response.data.pc);
      setStatus(response.data.pc.status);
      setNotes(response.data.pc.notes || '');
    } catch (err: any) {
      console.error('Failed to fetch PC details:', err);
      setError('Failed to load PC details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/purchased-pcs/${id}`, {
        status,
        notes,
      });
      setPc(response.data.pc);
      setSuccess('PC details updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update PC details:', err);
      setError('Failed to update PC details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-white text-center">Loading PC details...</div>;
  }

  if (error && !pc) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Go Back
        </button>
      </div>
    );
  }

  if (!pc) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-medium text-white">{pc.name}</h1>
            <p className="text-slate-400 mt-1 font-mono">
              S/N: {pc.serialNumber}
            </p>
            {pc.color && (
              <p className="text-slate-500 text-sm mt-1">
                Color: <span className="text-emerald-400">{pc.color}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {success && <span className="text-emerald-500">{success}</span>}
          {error && <span className="text-red-500">{error}</span>}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Specifications / Parts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pc.parts && pc.parts.length > 0 ? (
                pc.parts.map((p, idx) => (
                  <div key={idx} className="bg-[#11141d] p-3 rounded-lg border border-[#1f2233]">
                    <div className="text-xs text-slate-400 capitalize mb-1 flex justify-between">
                      <span>{p.partType.replace(/([A-Z])/g, ' $1').trim()}</span>
                      {typeof p.price === 'number' && <span className="text-emerald-400 font-mono">${p.price.toFixed(2)}</span>}
                    </div>
                    <div className="text-sm text-white font-medium break-words">{p.name || 'Unknown Part'}</div>
                    {p.part && (
                      <div className="text-xs text-slate-600 mt-1 cursor-pointer hover:text-slate-400" onClick={() => navigate(`/admin/parts/edit/${p.part}`)}>
                        ID: {p.part}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                Object.entries(pc.specs || {}).map(([key, val]) => (
                  <div key={key} className="bg-[#11141d] p-3 rounded-lg border border-[#1f2233]">
                    <div className="text-xs text-slate-400 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-sm text-white font-medium break-words">{val}</div>
                  </div>
                ))
              )}
              {((!pc.parts || pc.parts.length === 0) && (!pc.specs || Object.keys(pc.specs).length === 0)) && (
                <div className="text-slate-500 col-span-full">No specifications available.</div>
              )}
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this PC build, testing results, or issues..."
              className="w-full h-32 px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white resize-none"
            />
          </div>
        </div>

        {/* Right Column: Status & References */}
        <div className="space-y-6">
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Status & Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Build Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                >
                  <option value="building">Building</option>
                  <option value="benchmarking">Benchmarking</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-slate-500 mb-1">Created On</label>
                <div className="text-white text-sm">{new Date(pc.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Linked Order</h2>
            {pc.order ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Order #:</span>
                  <button 
                    onClick={() => navigate(`/admin/orders/${pc.order?._id}`)}
                    className="text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {pc.order.orderNumber}
                  </button>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Order Status:</span>
                  <span className="text-white capitalize">{pc.order.status}</span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-sm">No linked order.</div>
            )}
          </div>

          {pc.customer && (
            <div className="admin-card p-6">
              <h2 className="text-lg font-medium text-white mb-4">Customer</h2>
              <div className="space-y-2 text-sm">
                <div className="text-white font-medium">{pc.customer.firstName} {pc.customer.lastName}</div>
                <div className="text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {pc.customer.email}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPurchasedPCDetailsPage;