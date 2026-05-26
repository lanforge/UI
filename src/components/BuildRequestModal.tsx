import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

interface BuildRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuildRequestModal: React.FC<BuildRequestModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    details: '',
    usage: '',
    preferredBrands: '',
    timeline: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.post('/build-requests', formData);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({
          name: '', email: '', phone: '', budget: '', details: '',
          usage: '', preferredBrands: '', timeline: '',
          address: { street: '', city: '', state: '', zip: '', country: '' }
        });
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-10 custom-scrollbar"
          >
            <div className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-white/5 bg-[#111]/95 backdrop-blur-md">
              <h2 className="text-xl font-bold text-white tracking-tight">Request a Custom Build</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              {isSuccess ? (
                <div className="py-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 bg-emerald-500/10 rounded-full">
                    <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Request Submitted</h3>
                  <p className="text-gray-400 max-w-sm mx-auto">Our build experts have received your request and will contact you via email shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                      {error}
                    </div>
                  )}

                  {/* Personal Details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Personal Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Name *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Email *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full bg-[#1a1a24] border border-gray-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder-gray-500"
                          placeholder="Phone number"
                        />
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Target Budget</label>
                        <input
                          type="text"
                          name="budget"
                          value={formData.budget}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="e.g., $1500 - $2000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Build Requirements */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Build Requirements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Primary Usage</label>
                        <select
                          name="usage"
                          value={formData.usage}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                        >
                          <option value="">Select primary use...</option>
                          <option value="Gaming (1080p)">Gaming (1080p)</option>
                          <option value="Gaming (1440p)">Gaming (1440p)</option>
                          <option value="Gaming (4K)">Gaming (4K)</option>
                          <option value="Streaming & Content Creation">Streaming & Content Creation</option>
                          <option value="Video Editing / 3D Rendering">Video Editing / 3D Rendering</option>
                          <option value="Office / Productivity">Office / Productivity</option>
                          <option value="Other">Other (specify below)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1.5 text-sm font-medium text-gray-300">Target Timeline</label>
                        <select
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors appearance-none"
                        >
                          <option value="">Select timeframe...</option>
                          <option value="ASAP">As soon as possible</option>
                          <option value="Within 2 weeks">Within 2 weeks</option>
                          <option value="Within a month">Within a month</option>
                          <option value="Just exploring options">Just exploring options</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-300">Preferred Brands / Aesthetics</label>
                      <input
                        type="text"
                        name="preferredBrands"
                        value={formData.preferredBrands}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="e.g., All White build, Minimal RGB, AMD processor"
                      />
                    </div>
                  </div>

                  {/* Shipping Information */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Shipping Information</h4>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                        placeholder="Street Address"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                          placeholder="City"
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="State"
                          />
                          <input
                            type="text"
                            name="address.zip"
                            value={formData.address.zip}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors"
                            placeholder="ZIP Code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Additional Information</h4>
                    <div>
                      <textarea
                        name="details"
                        required
                        value={formData.details}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 bg-[#1a1a1a] border border-white/5 rounded-xl text-white focus:outline-none focus:border-white/20 transition-colors resize-none"
                        placeholder="Tell us exactly what you need. Are there specific games you play? Specific software you run?"
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-4 mt-8 border-t border-white/5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-white text-black hover:bg-gray-200 py-4 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BuildRequestModal;
