import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import AdminAddPartnerModal from '../components/AdminAddPartnerModal';

interface Partner {
  _id: string;
  name: string;
  website: string;
  logo: string;
  isActive: boolean;
}

interface AffiliateApp {
  _id: string;
  name: string;
  email: string;
  socialLinks: string[];
  audienceSize: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const AdminPartnersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partners' | 'affiliates'>('partners');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);

  // Affiliates state
  const [affiliates, setAffiliates] = useState<AffiliateApp[]>([]);
  const [affiliateStatus, setAffiliateStatus] = useState('all');
  const [isLoadingAffiliates, setIsLoadingAffiliates] = useState(true);

  const fetchPartners = async () => {
    setIsLoadingPartners(true);
    try {
      const response = await api.get('/partners/admin/all');
      setPartners(response.data.partners || []);
    } catch (error) {
      console.error('Failed to fetch partners', error);
    } finally {
      setIsLoadingPartners(false);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === partners.length - 1)
    ) return;

    const newPartners = [...partners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    [newPartners[index], newPartners[targetIndex]] = [newPartners[targetIndex], newPartners[index]];
    
    setPartners(newPartners);

    try {
      const order = newPartners.map((p, i) => ({ id: p._id, sortOrder: i }));
      await api.post('/partners/reorder', { order });
    } catch (error) {
      console.error('Failed to reorder partners', error);
      fetchPartners(); // revert on fail
    }
  };

  const fetchAffiliates = async () => {
    setIsLoadingAffiliates(true);
    try {
      const response = await api.get('/affiliates/admin/all', {
        params: { status: affiliateStatus !== 'all' ? affiliateStatus : undefined }
      });
      setAffiliates(response.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch affiliates', error);
    } finally {
      setIsLoadingAffiliates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'partners') {
      fetchPartners();
    } else {
      fetchAffiliates();
    }
  }, [activeTab, affiliateStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/10 text-slate-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Partners & Affiliates</h1>
          <p className="text-slate-500 text-sm mt-1">Manage brand partners and affiliate applications</p>
        </div>
        {activeTab === 'partners' && (
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
            >
              + Add Partner
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#1f2233]">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('partners')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'partners'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-[#1f2233]'
            }`}
          >
            Partners
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'affiliates'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-[#1f2233]'
            }`}
          >
            Affiliate Applications
          </button>
        </nav>
      </div>

      {activeTab === 'partners' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Partners list */}
          <div className="admin-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2233] bg-[#0a0c13]">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Order</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Partner Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Type</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Website</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2233]">
                {isLoadingPartners ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading partners...</td></tr>
                ) : partners.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">No partners found</td></tr>
                ) : (
                  partners.map((p, index) => (
                    <tr key={p._id} className="hover:bg-[#1f2233]/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col space-y-1 w-6">
                          <button
                            onClick={() => handleReorder(index, 'up')}
                            disabled={index === 0}
                            className={`p-1 rounded flex items-center justify-center transition-colors ${index === 0 ? 'text-gray-700 cursor-not-allowed' : 'text-slate-400 hover:bg-[#1f2233] hover:text-white'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReorder(index, 'down')}
                            disabled={index === partners.length - 1}
                            className={`p-1 rounded flex items-center justify-center transition-colors ${index === partners.length - 1 ? 'text-gray-700 cursor-not-allowed' : 'text-slate-400 hover:bg-[#1f2233] hover:text-white'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white font-medium flex items-center space-x-3 mt-1.5">
                        {p.logo ? (
                          <img src={p.logo} alt={p.name} className="w-8 h-8 object-contain bg-white rounded p-1" />
                        ) : (
                          <div className="w-8 h-8 bg-[#11141d] rounded flex items-center justify-center text-xs font-medium text-slate-400">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <Link to={`/admin/partners/${p._id}`} className="hover:text-emerald-400 transition-colors">
                          {p.name}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-slate-300 text-sm capitalize">
                        {(p as any).partnerType || (p.isActive ? 'partner' : 'affiliate')}
                      </td>
                      <td className="py-4 px-6 text-emerald-400 text-sm">
                        {p.website ? (
                          <a href={p.website} target="_blank" rel="noreferrer" className="hover:underline">{p.website}</a>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${p.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-slate-400 border-gray-500/30'}`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link to={`/admin/partners/${p._id}`} className="p-1.5 text-slate-400 hover:text-white hover:bg-[#11141d] rounded-lg transition-colors inline-block" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'affiliates' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Filters */}
          <div className="admin-card p-4">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                  <select
                    value={affiliateStatus}
                    onChange={(e) => setAffiliateStatus(e.target.value)}
                    className="admin-input px-3 py-2 bg-[#0a0c13] border-[#1f2233] text-sm rounded-lg"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button 
                    onClick={fetchAffiliates}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg py-2 font-medium transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f2233] bg-[#0a0c13]">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Applicant</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Audience Size</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Socials</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2233]">
                {isLoadingAffiliates ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading applications...</td></tr>
                ) : affiliates.length === 0 ? (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">No applications found</td></tr>
                ) : (
                  affiliates.map(app => (
                    <tr key={app._id} className="hover:bg-[#1f2233]/30 transition-colors">
                      <td className="py-4 px-6">
                        <p className="text-white font-medium">{app.name}</p>
                        <p className="text-slate-400 text-sm">{app.email}</p>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{app.audienceSize}</td>
                      <td className="py-4 px-6 text-blue-400 text-sm">
                        {app.socialLinks.map((link, idx) => (
                          <a key={idx} href={link} target="_blank" rel="noreferrer" className="block hover:underline truncate max-w-[150px]">{link}</a>
                        ))}
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-sm">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="px-3 py-1.5 text-sm bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg transition-colors border border-[#1f2233]">
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminAddPartnerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchPartners}
      />
    </div>
  );
};

export default AdminPartnersPage;
