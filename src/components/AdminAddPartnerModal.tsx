import React, { useState } from 'react';
import api from '../utils/api';

interface AdminAddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminAddPartnerModal: React.FC<AdminAddPartnerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    creatorCode: '',
    website: '',
    logo: '',
    commissionRate: 5,
    isPartner: true,
    partnerType: 'brand',
    customerDiscountType: '',
    customerDiscountValue: 0,
    twitter: '',
    twitch: '',
    instagram: '',
    youtube: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/partners', formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create partner');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[#1f2233]">
          <h2 className="text-xl font-medium text-white">Add Partner / Affiliate</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start space-x-3 text-red-400">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form id="add-partner-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input w-full bg-[#11141d]"
                placeholder="e.g. Tradeify"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input w-full bg-[#11141d]"
                placeholder="partner@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Creator Code *</label>
              <input
                type="text"
                name="creatorCode"
                required
                value={formData.creatorCode}
                onChange={handleChange}
                className="input w-full bg-[#11141d] uppercase"
                placeholder="e.g. LANFORGE10"
              />
              <p className="text-xs text-slate-500 mt-1">Customers use this code at checkout.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  name="commissionRate"
                  min="0"
                  max="100"
                  value={formData.commissionRate}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                <select
                  name="partnerType"
                  value={formData.partnerType}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    partnerType: e.target.value,
                    isPartner: e.target.value !== 'affiliate' 
                  }))}
                  className="input w-full bg-[#11141d]"
                >
                  <option value="brand">Brand Partner</option>
                  <option value="individual">Individual Partner</option>
                  <option value="affiliate">Affiliate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#1f2233] pt-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Customer Discount Type</label>
                <select
                  name="customerDiscountType"
                  value={formData.customerDiscountType || ''}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                >
                  <option value="">None</option>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>

              {formData.customerDiscountType && formData.customerDiscountType !== 'free_shipping' && (
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Discount Value</label>
                  <input
                    type="number"
                    name="customerDiscountValue"
                    min="0"
                    step="0.01"
                    value={formData.customerDiscountValue || 0}
                    onChange={handleChange}
                    className="input w-full bg-[#11141d]"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Website URL</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="input w-full bg-[#11141d]"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Logo / Profile Image URL</label>
              <input
                type="text"
                name="logo"
                value={formData.logo}
                onChange={handleChange}
                className="input w-full bg-[#11141d]"
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#1f2233] pt-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">X (Twitter) Username</label>
                <input
                  type="text"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Twitch Username</label>
                <input
                  type="text"
                  name="twitch"
                  value={formData.twitch}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Instagram Username</label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">YouTube Username</label>
                <input
                  type="text"
                  name="youtube"
                  value={formData.youtube}
                  onChange={handleChange}
                  className="input w-full bg-[#11141d]"
                  placeholder="username"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-[#1f2233] flex justify-end space-x-3 bg-[#11141d]/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-partner-form"
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Partner</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAddPartnerModal;