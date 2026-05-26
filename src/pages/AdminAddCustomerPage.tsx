import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AdminAddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    loyaltyTier: 'Bronze',
    isActive: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/customers', formData);
      navigate('/admin/customers');
    } catch (err: any) {
      console.error('Failed to add customer', err);
      if (err.response?.data?.errors) {
        const errorMsgs = err.response.data.errors.map((e: any) => `${e.param || e.path}: ${e.msg}`).join(', ');
        setError(`Validation failed: ${errorMsgs}`);
      } else {
        setError(err.response?.data?.message || 'Failed to add customer. Check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/admin/customers')}
            className="text-slate-400 hover:text-white flex items-center space-x-2 text-sm mb-2 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Customers</span>
          </button>
          <h1 className="text-xl font-medium text-white">Add New Customer</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="admin-card p-6 space-y-6">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-4">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">First Name *</label>
              <input
                type="text"
                name="firstName"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Last Name *</label>
              <input
                type="text"
                name="lastName"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Loyalty Tier</label>
              <select
                name="loyaltyTier"
                className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                value={formData.loyaltyTier}
                onChange={handleChange}
              >
                <option value="Bronze">Bronze</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Platinum">Platinum</option>
              </select>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-[#1f2233]">
              <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  name="isActive"
                  className="w-5 h-5 rounded bg-[#0a0c13] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20" 
                  checked={formData.isActive}
                  onChange={handleChange}
                />
                <span className="font-medium">Customer Account is Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin/customers')}
            className="px-6 py-2.5 bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Add Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAddCustomerPage;
