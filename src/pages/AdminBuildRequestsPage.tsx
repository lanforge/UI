import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface BuildRequest {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  budget?: string;
  details: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  usage?: string;
  preferredBrands?: string;
  timeline?: string;
  status: 'pending' | 'reviewed' | 'contacted' | 'completed' | 'unbuildable';
  createdAt: string;
}

const AdminBuildRequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/build-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching build requests', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      if (newStatus === 'unbuildable') {
        const reason = window.prompt('Please provide a reason for marking this as unbuildable (will be sent to customer):');
        if (reason === null) return; // user cancelled
        await api.put(`/build-requests/${id}`, { status: newStatus, rejectionReason: reason });
      } else {
        await api.put(`/build-requests/${id}`, { status: newStatus });
      }
      fetchRequests();
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        await api.delete(`/build-requests/${id}`);
        fetchRequests();
      } catch (error) {
        console.error('Error deleting request', error);
      }
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Loading build requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Build Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Manage incoming custom build requests</p>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-[#11141d] border-b border-[#1f2233]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name / Contact</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Budget / Use</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Details</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-6 text-center text-slate-500 text-sm">
                    No build requests found.
                  </td>
                </tr>
              ) : (
                requests.map(request => (
                  <tr key={request._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6 text-sm text-slate-400 whitespace-nowrap">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-white">{request.name}</div>
                      <div className="text-xs text-slate-400">{request.email}</div>
                      {request.phone && <div className="text-xs text-slate-400">{request.phone}</div>}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300 whitespace-nowrap">
                      <div>{request.budget || 'No budget'}</div>
                      <div className="text-xs text-slate-400 mt-1">{request.usage || 'Usage not specified'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-300 max-w-xs truncate" title={request.details}>
                        {request.details}
                      </div>
                      {(request.preferredBrands || request.timeline) && (
                        <div className="text-xs text-slate-400 mt-1 flex gap-2">
                          {request.preferredBrands && <span>Brands: {request.preferredBrands}</span>}
                          {request.timeline && <span>Timeline: {request.timeline}</span>}
                        </div>
                      )}
                      {request.address && request.address.city && (
                        <div className="text-xs text-slate-500 mt-1">
                          Loc: {request.address.city}, {request.address.state}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={request.status}
                        onChange={(e) => handleStatusChange(request._id, e.target.value)}
                        className={`text-xs font-medium rounded-full py-1 px-3 border outline-none cursor-pointer ${
                          request.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                          request.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          request.status === 'contacted' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          request.status === 'unbuildable' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        <option value="pending" className="bg-[#0a0c13] text-white">Pending</option>
                        <option value="reviewed" className="bg-[#0a0c13] text-white">Reviewed</option>
                        <option value="contacted" className="bg-[#0a0c13] text-white">Contacted</option>
                        <option value="completed" className="bg-[#0a0c13] text-white">Completed</option>
                        <option value="unbuildable" className="bg-[#0a0c13] text-white">Unbuildable</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/admin/build-requests/${request._id}`)}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors mr-3"
                        title="View Details & Quote"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(request._id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Request"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBuildRequestsPage;
