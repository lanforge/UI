import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface CustomBuild {
  _id: string;
  buildId: string;
  name: string;
  customer?: { _id: string; firstName: string; lastName: string; email: string };
  guestEmail?: string;
  status: 'draft' | 'saved' | 'purchased' | 'completed';
  total: number;
  subtotal: number;
  laborFee: number;
  parts: any[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    _id: string;
    orderNumber: string;
    status: string;
  };
  serialNumber?: string;
}

const AdminCustomBuildDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [build, setBuild] = useState<CustomBuild | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchBuildDetails = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/custom-builds/${id}`);
      if (response.data.build) {
        setBuild(response.data.build);
      }
    } catch (err: any) {
      console.error('Failed to fetch build details', err);
      setError(err.response?.data?.message || 'Failed to load custom build details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBuildDetails();
    }
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this custom build?')) {
      try {
        await api.delete(`/custom-builds/${build?.buildId}`);
        navigate('/admin/custom-builds');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete build');
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await api.put(`/custom-builds/${build?.buildId}/status`, { status: newStatus });
      setBuild(response.data.build);
      setSuccess(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (isLoading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Loading build details...</div>;
  }

  if (error || !build) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error || 'Build not found.'}
        </div>
        <button onClick={() => navigate('/admin/custom-builds')} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Back to Custom Builds
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/custom-builds')}
            className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-4">
              Build {build.buildId}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Created on {new Date(build.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {success && <span className="text-emerald-500 text-sm font-medium mr-2">{success}</span>}
          <button 
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-medium border border-red-500/30"
          >
            Delete Build
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Parts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Configuration Details</h2>
            <div className="space-y-4">
              {build.parts.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between bg-[#0a0c13] p-4 rounded-xl border border-[#1f2233]">
                  <div className="flex items-center gap-4">
                    {item.part?.images?.[0] ? (
                      <img src={item.part.images[0]} alt={item.part.name} className="w-16 h-16 object-contain rounded-lg bg-white p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-[#11141d] rounded-lg flex items-center justify-center text-slate-500">No Image</div>
                    )}
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{item.partType}</div>
                      <div className="font-medium text-white">{item.part?.brand} {item.part?.partModel || item.part?.name}</div>
                      <div className="text-sm text-slate-400">Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="font-medium text-emerald-400">
                    {formatCurrency((item.part?.price || 0) * item.quantity)}
                  </div>
                </div>
              ))}
              
              {build.parts.length === 0 && (
                <div className="text-center py-6 text-slate-500">No parts selected in this build.</div>
              )}
            </div>
            
            <div className="mt-8 border-t border-[#1f2233] pt-6">
              <h3 className="text-md font-medium text-white mb-4">Build Notes</h3>
              {build.notes ? (
                <div className="bg-[#0a0c13] p-4 rounded-lg border border-[#1f2233] text-slate-300 whitespace-pre-wrap">
                  {build.notes}
                </div>
              ) : (
                <p className="text-slate-500 italic">No special notes provided for this build.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Totals */}
        <div className="space-y-6">
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Customer Details</h2>
            {build.customer ? (
              <div className="space-y-2">
                <p className="text-white font-medium">{build.customer.firstName} {build.customer.lastName}</p>
                <p className="text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {build.customer.email}
                </p>
                <button 
                  onClick={() => navigate(`/admin/customers/${build.customer?._id}`)}
                  className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  View Customer Profile
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-400 italic">Guest Customer</p>
                {build.guestEmail && (
                  <p className="text-slate-400 flex items-center gap-2 mt-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {build.guestEmail}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Status & Link</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-400 mb-2">Build Status</label>
              <select
                value={build.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 rounded-lg text-white"
              >
                <option value="draft">Draft</option>
                <option value="saved">Saved</option>
                <option value="purchased">Purchased</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            {build.order && (
              <div className="mt-4 pt-4 border-t border-[#1f2233]">
                <p className="text-sm text-slate-400 mb-2">Linked Order</p>
                <button
                  onClick={() => navigate(`/admin/orders/${build.order?._id}`)}
                  className="w-full flex items-center justify-between p-3 bg-[#0a0c13] border border-[#1f2233] rounded-lg hover:border-gray-600 transition-colors"
                >
                  <span className="font-mono text-emerald-400">{build.order.orderNumber}</span>
                  <span className="text-xs text-slate-500 uppercase">{build.order.status}</span>
                </button>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[#1f2233]">
              <p className="text-sm text-slate-400 mb-2">Shareable Link</p>
              <div className="flex">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/build/${build.buildId}`}
                  className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-l-lg text-xs text-slate-400 font-mono"
                />
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/build/${build.buildId}`);
                    setSuccess('Link copied!');
                    setTimeout(() => setSuccess(null), 2000);
                  }}
                  className="px-3 bg-gray-700 hover:bg-gray-600 text-white rounded-r-lg border border-l-0 border-[#1f2233]"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Pricing Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-400">
                <span>Parts Subtotal</span>
                <span>{formatCurrency(build.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Build & Labor Fee</span>
                <span>{formatCurrency(build.laborFee)}</span>
              </div>
              <div className="flex justify-between text-white font-medium text-lg pt-3 border-t border-[#1f2233] mt-3">
                <span>Total</span>
                <span className="text-emerald-400">{formatCurrency(build.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomBuildDetailsPage;
