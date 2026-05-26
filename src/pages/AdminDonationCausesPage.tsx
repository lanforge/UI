import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface DonationCause {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  lanforgeContributionPerPC: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const AdminDonationCausesPage: React.FC = () => {
  const [causes, setCauses] = useState<DonationCause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCause, setEditingCause] = useState<DonationCause | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
    lanforgeContributionPerPC: 0,
    startDate: '',
    endDate: ''
  });

  const fetchCauses = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/donation-causes');
      setCauses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCauses();
  }, []);

  const openCreateModal = () => {
    setEditingCause(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      isActive: true,
      lanforgeContributionPerPC: 0,
      startDate: '',
      endDate: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cause: DonationCause) => {
    setEditingCause(cause);
    setFormData({
      name: cause.name,
      description: cause.description || '',
      imageUrl: cause.imageUrl || '',
      isActive: cause.isActive,
      lanforgeContributionPerPC: cause.lanforgeContributionPerPC,
      startDate: cause.startDate ? cause.startDate.substring(0, 10) : '',
      endDate: cause.endDate ? cause.endDate.substring(0, 10) : ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      if (!payload.startDate) delete payload.startDate;
      if (!payload.endDate) delete payload.endDate;

      if (editingCause) {
        await api.put(`/donation-causes/${editingCause._id}`, payload);
      } else {
        await api.post('/donation-causes', payload);
      }
      setIsModalOpen(false);
      fetchCauses();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error saving donation cause');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this donation cause?')) {
      try {
        await api.delete(`/donation-causes/${id}`);
        fetchCauses();
      } catch (e: any) {
        alert(e.response?.data?.message || 'Error deleting donation cause');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Donation Causes</h1>
          <p className="text-slate-500 text-sm mt-1">Manage charitable causes and contributions</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
        >
          + Add Cause
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1f2233] bg-[#07090e]">
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Name</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Contribution / PC</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Start Date</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">End Date</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2233]">
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500 text-sm">Loading causes...</td></tr>
            ) : causes.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-slate-500 text-sm">No donation causes found</td></tr>
            ) : (
              causes.map(cause => (
                <tr key={cause._id} className="hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      {cause.imageUrl ? (
                        <img src={cause.imageUrl} alt={cause.name} className="w-8 h-8 rounded-full object-cover border border-gray-800" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1f2233] flex items-center justify-center border border-gray-800">
                          <span className="text-xs text-emerald-500">{cause.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-slate-200 font-medium">{cause.name}</p>
                        {cause.description && <p className="text-xs text-slate-500 max-w-xs truncate">{cause.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-emerald-500 font-medium">
                    ${cause.lanforgeContributionPerPC.toFixed(2)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`admin-badge ${cause.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-slate-400 border-gray-500/20'}`}>
                      {cause.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {cause.startDate ? new Date(cause.startDate).toLocaleDateString() : 'Immediate'}
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {cause.endDate ? new Date(cause.endDate).toLocaleDateString() : 'No End Date'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => openEditModal(cause)}
                        className="text-slate-400 hover:text-white transition-colors p-1"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(cause._id)}
                        className="text-red-400/70 hover:text-red-400 transition-colors p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#11141d] border border-[#1f2233] rounded-md w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[#1f2233] flex justify-between items-center bg-[#07090e] sticky top-0 z-10">
              <h2 className="text-sm font-medium text-white">{editingCause ? 'Edit Cause' : 'Add Cause'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="admin-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="admin-input min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Image URL</label>
                <input 
                  type="text" 
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="admin-input"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Contribution Per PC ($)</label>
                <input 
                  type="number" 
                  value={formData.lanforgeContributionPerPC}
                  onChange={(e) => setFormData({...formData, lanforgeContributionPerPC: parseFloat(e.target.value) || 0})}
                  className="admin-input"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Start Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">End Date (Optional)</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="admin-input"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-gray-700 bg-[#1f2233] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">Active</label>
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 px-4 border border-[#1f2233] rounded-md text-slate-400 hover:bg-[#1f2233]/50 transition-colors text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 px-4 bg-white hover:bg-gray-200 text-black rounded-md transition-colors text-sm font-medium">
                  {editingCause ? 'Save Changes' : 'Create Cause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonationCausesPage;
