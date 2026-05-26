import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface CustomBuild {
  _id: string;
  buildId: string;
  customer?: { firstName: string; lastName: string; email: string };
  status: 'draft' | 'saved' | 'ordered' | 'completed';
  total: number;
  totalCost?: number;
  parts: any[];
  updatedAt: string;
}

const AdminCustomBuildsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [builds, setBuilds] = useState<CustomBuild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBuilds, setTotalBuilds] = useState(0);

  const fetchBuilds = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/custom-builds/admin/all', {
        params: { search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined, page, limit: 20 }
      });
      setBuilds(response.data.builds || []);
      setTotalPages(response.data.pages || 1);
      setTotalBuilds(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch custom builds', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchBuilds();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ordered': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'saved': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/10 text-slate-400 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Custom Builds</h1>
          <p className="text-slate-500 text-sm mt-1">Manage user-configured custom PCs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Custom Builds</p>
              <p className="text-2xl font-medium text-white mt-1">{totalBuilds}</p>
            </div>
            <div className="w-8 h-8 bg-purple-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center bg-[#07090e] border border-[#1f2233] rounded-md focus-within:border-white/20 transition-all">
              <svg className="w-4 h-4 text-slate-500 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search builds..."
                className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={fetchBuilds} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="admin-input"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button 
              onClick={handleSearch}
              className="bg-white/10 hover:bg-white/20 text-white text-sm rounded-md py-2 font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Build ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Margin</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Last Updated</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">Loading builds...</td></tr>
              ) : builds.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No custom builds found.</td></tr>
              ) : builds.map(build => {
                const margin = build.total - (build.totalCost || 0);
                const marginPct = build.total > 0 ? (margin / build.total) * 100 : 0;

                return (
                  <tr key={build._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-emerald-500 font-mono text-xs">{build.buildId}</span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-medium">{build.customer ? `${build.customer.firstName} ${build.customer.lastName}` : 'Guest'}</p>
                      {build.customer && <p className="text-slate-500 text-xs">{build.customer.email}</p>}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-200 font-medium">
                      {formatCurrency(build.total)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className={`font-medium text-xs ${margin > 0 ? 'text-emerald-500' : 'text-slate-500'}`}>{formatCurrency(margin)}</p>
                      <p className="text-[10px] text-slate-600">{marginPct.toFixed(1)}%</p>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(build.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge ${getStatusColor(build.status)}`}>
                        {build.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => navigate(`/admin/custom-builds/${build.buildId}`)}
                        className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {builds.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalBuilds)} of {totalBuilds} builds
          </div>
          <div className="flex items-center space-x-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-slate-500 text-xs px-2">Page {page} of {totalPages || 1}</span>
            <button 
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomBuildsPage;
