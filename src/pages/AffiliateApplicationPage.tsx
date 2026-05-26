import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AffiliateApplicationPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    socialMedia: '',
    audienceSize: '',
    audienceType: '',
    contentType: '',
    promotionMethods: '',
    experience: '',
    whyJoin: '',
    agreeTerms: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // In a real application, you would send this data to your backend
    alert('Thank you for your application! We will review it and get back to you soon.');
  };

  const audienceSizes = [
    { value: 'under-1k', label: 'Under 1,000 followers' },
    { value: '1k-10k', label: '1,000 - 10,000 followers' },
    { value: '10k-50k', label: '10,000 - 50,000 followers' },
    { value: '50k-100k', label: '50,000 - 100,000 followers' },
    { value: '100k-500k', label: '100,000 - 500,000 followers' },
    { value: '500k-1m', label: '500,000 - 1,000,000 followers' },
    { value: 'over-1m', label: 'Over 1,000,000 followers' }
  ];

  const audienceTypes = [
    { value: 'gaming', label: 'Gaming & Esports' },
    { value: 'tech', label: 'Technology & Hardware' },
    { value: 'pc-building', label: 'PC Building & Modding' },
    { value: 'streaming', label: 'Streaming & Content Creation' },
    { value: 'lifestyle', label: 'Lifestyle & General' },
    { value: 'education', label: 'Educational & Tutorial' },
    { value: 'other', label: 'Other' }
  ];

  const contentTypes = [
    { value: 'youtube', label: 'YouTube Videos' },
    { value: 'twitch', label: 'Twitch Streaming' },
    { value: 'instagram', label: 'Instagram Content' },
    { value: 'twitter', label: 'Twitter/X Posts' },
    { value: 'tiktok', label: 'TikTok Videos' },
    { value: 'blog', label: 'Blog Articles' },
    { value: 'podcast', label: 'Podcast' },
    { value: 'newsletter', label: 'Newsletter' }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-10 md:py-16">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-6">
              Affiliate Application
            </h1>
            <p className="body-large max-w-3xl mx-auto mb-10">
              Join the LANForge affiliate program and earn commissions by promoting premium PC builds and components
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">15%</div>
                <div className="text-gray-400">Commission Rate</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">30 Days</div>
                <div className="text-gray-400">Cookie Duration</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">$100+</div>
                <div className="text-gray-400">Average Order Value</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gradient-neon mb-2">Monthly</div>
                <div className="text-gray-400">Payouts</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16"
          >
            <div className="text-center mb-12">
              <h2 className="heading-2 mb-4">Why Join Our Affiliate Program?</h2>
              <p className="body-large max-w-3xl mx-auto">
                Partner with a premium PC brand and earn competitive commissions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card-glow p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">High Commissions</h3>
                <p className="text-gray-300">
                  Earn 15% commission on every sale. With average order values over $100, your earnings add up quickly.
                </p>
              </div>

              <div className="card-glow p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Premium Products</h3>
                <p className="text-gray-300">
                  Promote high-quality, custom-built PCs that your audience will love. Our products sell themselves.
                </p>
              </div>

              <div className="card-glow p-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Marketing Support</h3>
                <p className="text-gray-300">
                  Get access to banners, product images, discount codes, and dedicated affiliate support.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card-glow p-8 md:p-12"
          >
            <h2 className="heading-2 mb-8 text-center">Application Form</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="input-field"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Platform Information */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Platform Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Website/Blog URL
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Social Media Handles
                    </label>
                    <input
                      type="text"
                      name="socialMedia"
                      value={formData.socialMedia}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="@yourhandle (Twitter, Instagram, etc.)"
                    />
                  </div>
                </div>
              </div>

              {/* Audience Information */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Audience Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Audience Size *
                    </label>
                    <select
                      name="audienceSize"
                      value={formData.audienceSize}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select audience size</option>
                      {audienceSizes.map(size => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Audience Type *
                    </label>
                    <select
                      name="audienceType"
                      value={formData.audienceType}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select audience type</option>
                      {audienceTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Information */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Content Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Content Type *
                    </label>
                    <select
                      name="contentType"
                      value={formData.contentType}
                      onChange={handleChange}
                      required
                      className="input-field"
                    >
                      <option value="">Select content type</option>
                      {contentTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Promotion Methods
                    </label>
                    <input
                      type="text"
                      name="promotionMethods"
                      value={formData.promotionMethods}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Reviews, tutorials, unboxings, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Affiliate/Partnership Experience *
                </label>
                <textarea
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Describe your experience with affiliate programs or brand partnerships..."
                />
              </div>

              {/* Why Join */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Why do you want to join the LANForge affiliate program? *
                </label>
                <textarea
                  name="whyJoin"
                  value={formData.whyJoin}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="input-field"
                  placeholder="Tell us why you're interested in partnering with LANForge..."
                />
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-300">
                  I agree to the LANForge Affiliate Program Terms and Conditions. I understand that my application will be reviewed and I may be contacted for additional information.
                </label>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  className="btn btn-primary px-12"
                  disabled={!formData.agreeTerms}
                >
                  Submit Application
                </button>
              </div>
            </form>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="heading-2 mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-2">How much commission do affiliates earn?</h3>
                <p className="text-gray-300">
                  Affiliates earn 15% commission on all sales generated through their unique referral links. Commissions are paid monthly via PayPal or bank transfer.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-2">How long is the cookie duration?</h3>
                <p className="text-gray-300">
                  We use a 30-day cookie duration. If someone clicks your affiliate link and makes a purchase within 30 days, you'll earn commission on that sale.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-2">What marketing materials are provided?</h3>
                <p className="text-gray-300">
                  Affiliates receive access to banners, product images, discount codes, tracking links, and a dedicated affiliate dashboard to monitor performance.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-bold text-white mb-2">How long does application review take?</h3>
                <p className="text-gray-300">
                  Applications are typically reviewed within 3-5 business days. You'll receive an email notification once your application has been processed.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AffiliateApplicationPage;
