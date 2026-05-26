import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faSpinner, faCheck, faTimes, faCog, faFileAlt, faTools, faShippingFast } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import remarkBreaks from 'remark-breaks';
import api from '../utils/api';
import AdminUsersPage from './AdminUsersPage';

interface Page {
  slug: string;
  title: string;
  updatedAt: string;
}

const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'pages' | 'maintenance' | 'tax' | 'announcements'>('general');

  // --- Settings State ---
  const [settings, setSettings] = useState<Record<string, any>>({
    storeName: '',
    email: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'US' },
    taxRate: 8.0,
    taxEnabled: true,
    currency: 'USD',
    flatShippingRate: 29.99,
    freeShippingThreshold: 500,
    buildFeePercentage: 10,
    socialLinks: { facebook: '', twitter: '', instagram: '', youtube: '' }
  });

  const [pageStatuses, setPageStatuses] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any>({ enabled: false });
  const [announcementBar, setAnnouncementBar] = useState<any>({ announcements: [], rotationSpeed: 5, isVisible: true });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Pages Content State ---
  const [pagesList, setPagesList] = useState<Page[]>([]);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);
  const [pageFormData, setPageFormData] = useState({ title: '', content: '' });
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [isPageSaving, setIsPageSaving] = useState(false);
  const [pageMessage, setPageMessage] = useState({ type: '', text: '' });
  const [isPreview, setIsPreview] = useState(false);

  const predefinedPages = [
    { slug: 'warranty', label: 'Warranty Policy' },
    { slug: 'tos', label: 'Terms of Service' },
    { slug: 'privacy-policy', label: 'Privacy Policy' },
    { slug: 'cookie-policy', label: 'Cookie Policy' },
    { slug: 'shipping-returns', label: 'Shipping & Returns' }
  ];

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [businessRes, pageRes, announcementRes] = await Promise.all([
        api.get('/business'),
        api.get('/page-status'),
        api.get('/announcement-bar')
      ]);

      if (businessRes.data.businessInfo) {
        const bizInfo = businessRes.data.businessInfo;
        setSettings(prev => ({
          ...prev,
          ...bizInfo,
          taxEnabled: bizInfo.taxEnabled === true
        }));
      }

      if (pageRes.data.pages) {
        const pages = pageRes.data.pages;
        const maint = pages.find((p: any) => p.path === 'maintenance_mode');
        if (maint) {
          setMaintenance(maint);
        }
        setPageStatuses(pages.filter((p: any) => p.path !== 'maintenance_mode'));
      }

      if (announcementRes.data.announcementBar) {
        setAnnouncementBar(announcementRes.data.announcementBar);
      }
    } catch (error) {
      console.error('Failed to fetch info', error);
      setMessage({ type: 'error', text: 'Failed to load information.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPages = async () => {
    try {
      setIsPagesLoading(true);
      const response = await api.get('/pages');
      if (response.data.pages) {
        setPagesList(response.data.pages);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setIsPagesLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchPages();
  }, []);

  const handleChange = (key: string, value: any) => {
    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setSettings(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setSettings(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      const payload: Record<string, any> = {
        ...settings,
        taxEnabled: settings.taxEnabled === true
      };
      
      await api.put('/business', payload);
      
      // Save maintenance mode
      await api.put('/page-status/maintenance_mode', {
        enabled: maintenance.enabled,
        reopenAt: maintenance.reopenAt
      });

      // Save page statuses
      for (const p of pageStatuses) {
        await api.put(`/page-status/${encodeURIComponent(p.path)}`, {
          enabled: p.enabled
        });
      }

      // Save announcement bar
      await api.put('/announcement-bar', announcementBar);

      await fetchSettings();
      
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const loadPageContent = async (slug: string) => {
    try {
      const response = await api.get(`/pages/${slug}`);
      if (response.data.page) {
        setPageFormData({ title: response.data.page.title, content: response.data.page.content || '' });
        setSelectedPageSlug(slug);
        setIsPreview(false);
        setPageMessage({ type: '', text: '' });
      }
    } catch (error) {
      console.error('Error fetching page content:', error);
    }
  };

  const handleCreateNewOrSelectPage = (slug: string, label: string) => {
    const existing = pagesList.find(p => p.slug === slug);
    if (existing) {
      loadPageContent(slug);
    } else {
      setPageFormData({ title: label, content: '' });
      setSelectedPageSlug(slug);
      setIsPreview(false);
      setPageMessage({ type: '', text: '' });
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPageSlug) return;

    try {
      setIsPageSaving(true);
      setPageMessage({ type: '', text: '' });
      const response = await api.put(`/pages/${selectedPageSlug}`, pageFormData);

      if (response.data.page) {
        setPageMessage({ type: 'success', text: 'Page updated successfully!' });
        fetchPages(); // Refresh the list to get updated dates
      }
    } catch (error: any) {
      console.error('Error saving page:', error);
      setPageMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update page' });
    } finally {
      setIsPageSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Loading settings...</div>;
  }

  const renderTabs = () => (
    <div className="flex space-x-1 bg-[#0a0c13] p-1 rounded-xl mb-6 overflow-x-auto border border-[#1f2233]">
      <button
        onClick={() => setActiveTab('general')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'general' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <FontAwesomeIcon icon={faCog} className="mr-2" /> General
      </button>
      <button
        onClick={() => setActiveTab('users')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'users' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a5.5 5.5 0 01-5.5 5.5" />
        </svg>
        Users
      </button>
      <button
        onClick={() => setActiveTab('pages')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'pages' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <FontAwesomeIcon icon={faFileAlt} className="mr-2" /> Pages Content
      </button>
      <button
        onClick={() => setActiveTab('announcements')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'announcements' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <FontAwesomeIcon icon={faFileAlt} className="mr-2" /> Announcements
      </button>
      <button
        onClick={() => setActiveTab('maintenance')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'maintenance' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <FontAwesomeIcon icon={faTools} className="mr-2" /> Maintenance & Availability
      </button>
      <button
        onClick={() => setActiveTab('tax')}
        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
          activeTab === 'tax' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white hover:bg-[#11141d]'
        }`}
      >
        <FontAwesomeIcon icon={faShippingFast} className="mr-2" /> Tax & Shipping
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Settings</h1>
          <p className="text-slate-500 text-sm mt-1">Manage global business details, pages content, and store modes</p>
        </div>
        {activeTab !== 'pages' && (
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving...</span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Save Changes</span>
              </>
            )}
          </button>
        )}
      </div>

      {message && activeTab !== 'pages' && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
          {message.text}
        </div>
      )}

      {renderTabs()}

      <div className="flex-1 overflow-y-auto">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <AdminUsersPage />
        )}

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>General Information</span>
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Store Name</label>
                  <input
                    type="text"
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={settings.storeName || ''}
                    onChange={e => handleChange('storeName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Support Email</label>
                  <input
                    type="email"
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={settings.email || ''}
                    onChange={e => handleChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={settings.phone || ''}
                    onChange={e => handleChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                  <select
                    className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                    value={settings.currency || 'USD'}
                    onChange={e => handleChange('currency', e.target.value)}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (£)</option>
                  </select>
                </div>
                
                {/* Address fields */}
                <div className="md:col-span-2 pt-4 border-t border-[#1f2233]">
                  <h3 className="text-md font-medium text-white mb-4">Physical Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-400 mb-1">Street Address</label>
                      <input type="text" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-lg" value={settings.address?.street || ''} onChange={e => handleChange('address.street', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                      <input type="text" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-lg" value={settings.address?.city || ''} onChange={e => handleChange('address.city', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">State/Province</label>
                      <input type="text" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-lg" value={settings.address?.state || ''} onChange={e => handleChange('address.state', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Zip/Postal Code</label>
                      <input type="text" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-lg" value={settings.address?.zipCode || ''} onChange={e => handleChange('address.zipCode', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Country</label>
                      <input type="text" className="admin-input w-full bg-[#0a0c13] border-[#1f2233] rounded-lg" value={settings.address?.country || 'US'} onChange={e => handleChange('address.country', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAGES TAB */}
        {activeTab === 'pages' && (
          <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Sidebar for selecting pages */}
            <div className="w-full md:w-64 shrink-0">
              <div className="bg-[#11141d] rounded-lg p-4 border border-[#1f2233] h-full">
                <h2 className="text-lg font-medium mb-4 text-white">Pages</h2>
                
                {isPagesLoading ? (
                  <div className="flex justify-center p-4">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-emerald-500 text-xl" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {predefinedPages.map(page => {
                      const exists = pagesList.find(p => p.slug === page.slug);
                      return (
                        <li key={page.slug}>
                          <button
                            onClick={() => handleCreateNewOrSelectPage(page.slug, page.label)}
                            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex justify-between items-center ${
                              selectedPageSlug === page.slug
                                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                                : 'hover:bg-[#1f2233] text-slate-300'
                            }`}
                          >
                            <span>{page.label}</span>
                            {exists ? (
                              <FontAwesomeIcon icon={faCheck} className="text-emerald-500 text-xs" />
                            ) : (
                              <FontAwesomeIcon icon={faTimes} className="text-slate-500 text-xs" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                
                <div className="mt-4 pt-4 border-t border-[#1f2233]">
                  <p className="text-xs text-slate-400 mb-2">
                    <FontAwesomeIcon icon={faCheck} className="text-emerald-500 mr-1" /> = Has content
                  </p>
                  <p className="text-xs text-slate-400">
                    <FontAwesomeIcon icon={faTimes} className="text-slate-500 mr-1" /> = Empty/Default
                  </p>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-grow">
              {selectedPageSlug ? (
                <div className="bg-[#11141d] rounded-lg p-6 border border-[#1f2233] h-full flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-medium text-white">Edit Content</h2>
                    <div className="flex bg-[#0a0c13] rounded-md p-1 border border-[#1f2233]">
                      <button
                        onClick={() => setIsPreview(false)}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                          !isPreview ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Write
                      </button>
                      <button
                        onClick={() => setIsPreview(true)}
                        className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                          isPreview ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Preview
                      </button>
                    </div>
                  </div>

                  {pageMessage.text && (
                    <div className={`p-4 mb-6 rounded-md ${
                      pageMessage.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'
                    }`}>
                      {pageMessage.text}
                    </div>
                  )}

                  <form onSubmit={handleSavePage} className="flex flex-col flex-grow">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-400 mb-1">Page Title</label>
                      <input
                        type="text"
                        value={pageFormData.title}
                        onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                        className="w-full bg-[#0a0c13] border border-[#1f2233] rounded-md px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="mb-6 flex-grow flex flex-col">
                      <label className="block text-sm font-medium text-slate-400 mb-1">
                        Content <span className="text-xs text-slate-500 font-normal">(Markdown supported)</span>
                      </label>
                      
                      {isPreview ? (
                        <div className="w-full flex-grow min-h-[400px] bg-[#0a0c13] border border-[#1f2233] rounded-md p-6 overflow-y-auto prose prose-invert max-w-4xl mx-auto text-left text-slate-300 prose-headings:text-white prose-h1:text-4xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-emerald-400 hover:prose-a:text-emerald-300 prose-strong:text-white prose-ul:list-disc prose-ol:list-decimal prose-li:my-1">
                          {pageFormData.content ? (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm, remarkBreaks]} 
                              rehypePlugins={[rehypeRaw]}
                            >
                              {pageFormData.content}
                            </ReactMarkdown>
                          ) : (
                            <p className="text-slate-500 italic">Nothing to preview</p>
                          )}
                        </div>
                      ) : (
                        <textarea
                          value={pageFormData.content}
                          onChange={(e) => setPageFormData({ ...pageFormData, content: e.target.value })}
                          className="w-full flex-grow min-h-[400px] bg-[#0a0c13] border border-[#1f2233] rounded-md px-4 py-4 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
                          placeholder="# Heading&#10;&#10;Write your content here using Markdown..."
                          required
                        />
                      )}
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        disabled={isPageSaving}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
                      >
                        {isPageSaving ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faSave} />
                        )}
                        <span>{isPageSaving ? 'Saving...' : 'Save Page Content'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-[#11141d] rounded-lg p-10 border border-[#1f2233] text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <FontAwesomeIcon icon={faFileAlt} size="xl" />
                  </div>
                  <h2 className="text-xl font-medium mb-2 text-white">Select a Page to Edit</h2>
                  <p className="text-slate-400 max-w-md">
                    Choose a page from the sidebar to edit its content. You can write content using Markdown format and preview it before saving.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Maintenance & Availability</span>
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-[#0a0c13] p-6 rounded-xl border border-[#1f2233]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Maintenance Mode</h3>
                    <p className="text-sm text-slate-400">When enabled, the site will be inaccessible to non-admin users.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={maintenance?.enabled || false}
                      onChange={(e) => {
                        setMaintenance((prev: any) => ({ ...prev, enabled: e.target.checked }));
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                  </label>
                </div>
                
                {maintenance?.enabled && (
                  <div className="mt-4 pt-4 border-t border-[#1f2233]">
                    <label className="block text-sm font-medium text-slate-400 mb-2">Auto-Reopen Time (EST)</label>
                    <input
                      type="datetime-local"
                      className="admin-input bg-[#0a0c13] border-[#1f2233] focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl text-white"
                      value={maintenance?.reopenAt ? (() => {
                        try {
                          const estString = new Date(maintenance.reopenAt).toLocaleString("sv-SE", { timeZone: "America/New_York" });
                          return estString.replace(' ', 'T').slice(0, 16);
                        } catch (e) {
                          return '';
                        }
                      })() : ''}
                      onChange={(e) => {
                        const estDateTimeLocalStr = e.target.value;
                        if (!estDateTimeLocalStr) {
                          setMaintenance((prev: any) => ({ ...prev, reopenAt: undefined }));
                          return;
                        }
                        
                        const d4 = new Date(estDateTimeLocalStr + "-04:00");
                        const d5 = new Date(estDateTimeLocalStr + "-05:00");
                        const fmt = (d: Date) => d.toLocaleString("sv-SE", { timeZone: "America/New_York" }).replace(' ', 'T').slice(0, 16);
                        
                        let finalIso = d5.toISOString();
                        if (fmt(d4) === estDateTimeLocalStr) {
                          finalIso = d4.toISOString();
                        } else if (fmt(d5) === estDateTimeLocalStr) {
                          finalIso = d5.toISOString();
                        }

                        setMaintenance((prev: any) => ({ ...prev, reopenAt: finalIso }));
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-2">Enter the exact time in EST (Eastern Standard/Daylight Time). Leave blank to require manual reopening.</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Page Toggles</h3>
                <p className="text-sm text-slate-400 mb-4">Toggle switches to disable specific pages. Disabled pages will show a maintenance or 404 message.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pageStatuses.map((page: any) => {
                    return (
                      <div key={page.path} className="flex items-center justify-between p-3 bg-[#0a0c13] rounded-lg border border-[#1f2233]">
                        <div>
                          <span className="text-sm font-medium text-white">{page.name}</span>
                          <span className="block text-xs text-slate-500">{page.path}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={page.enabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setPageStatuses(prev => 
                                prev.map(p => p.path === page.path ? { ...p, enabled: isEnabled } : p)
                              );
                            }}
                          />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ANNOUNCEMENTS TAB */}
        {activeTab === 'announcements' && (
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233] flex justify-between items-center">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <FontAwesomeIcon icon={faFileAlt} className="text-purple-400" />
                <span>Announcement Bar</span>
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={announcementBar?.isVisible ?? true}
                  onChange={(e) => {
                    setAnnouncementBar((prev: any) => ({ ...prev, isVisible: e.target.checked }));
                  }}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                <span className="ml-3 text-sm font-medium text-slate-300">Visible</span>
              </label>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Rotation Speed (seconds)</label>
                <input
                  type="number"
                  min="1"
                  className="admin-input w-full bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl"
                  value={announcementBar?.rotationSpeed || 5}
                  onChange={(e) => setAnnouncementBar((prev: any) => ({ ...prev, rotationSpeed: parseInt(e.target.value) || 5 }))}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium text-white">Announcements</h3>
                  <button
                    onClick={() => {
                      setAnnouncementBar((prev: any) => ({
                        ...prev,
                        announcements: [...(prev.announcements || []), { text: '', link: '', isActive: true }]
                      }));
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-sm transition-colors"
                  >
                    + Add Announcement
                  </button>
                </div>

                <div className="space-y-4">
                  {(!announcementBar.announcements || announcementBar.announcements.length === 0) ? (
                    <div className="text-center p-6 bg-[#0a0c13] rounded-xl border border-[#1f2233] text-slate-500">
                      No announcements added yet.
                    </div>
                  ) : (
                    announcementBar.announcements.map((ann: any, index: number) => (
                      <div key={index} className="p-4 bg-[#0a0c13] rounded-xl border border-[#1f2233] space-y-4 relative group">
                        <button
                          onClick={() => {
                            setAnnouncementBar((prev: any) => ({
                              ...prev,
                              announcements: prev.announcements.filter((_: any, i: number) => i !== index)
                            }));
                          }}
                          className="absolute top-4 right-4 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Text</label>
                          <input
                            type="text"
                            className="admin-input w-full bg-[#11141d] border-[#1f2233] focus:border-emerald-500 rounded-lg"
                            value={ann.text}
                            onChange={(e) => {
                              const newAnn = [...announcementBar.announcements];
                              newAnn[index].text = e.target.value;
                              setAnnouncementBar({ ...announcementBar, announcements: newAnn });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Link (optional)</label>
                            <input
                              type="text"
                              className="admin-input w-full bg-[#11141d] border-[#1f2233] focus:border-emerald-500 rounded-lg"
                              value={ann.link || ''}
                              onChange={(e) => {
                                const newAnn = [...announcementBar.announcements];
                                newAnn[index].link = e.target.value;
                                setAnnouncementBar({ ...announcementBar, announcements: newAnn });
                              }}
                            />
                          </div>
                          <div className="flex items-end pb-2">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ann.isActive}
                                onChange={(e) => {
                                  const newAnn = [...announcementBar.announcements];
                                  newAnn[index].isActive = e.target.checked;
                                  setAnnouncementBar({ ...announcementBar, announcements: newAnn });
                                }}
                                className="rounded bg-[#11141d] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20"
                              />
                              <span className="text-sm text-slate-300">Active</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAX & SHIPPING TAB */}
        {activeTab === 'tax' && (
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Tax & Shipping</span>
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Flat Shipping Rate</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="number"
                      className="admin-input w-full pl-8 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white"
                      value={settings.flatShippingRate || 0}
                      onChange={e => handleChange('flatShippingRate', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Free Shipping Threshold</label>
                  <div className="relative">
                    <span className="absolute left-4 top-2.5 text-slate-500">$</span>
                    <input
                      type="number"
                      className="admin-input w-full pl-8 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white"
                      value={settings.freeShippingThreshold || 0}
                      onChange={e => handleChange('freeShippingThreshold', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">System Integration & Validation (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="admin-input w-full pr-8 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white"
                      value={settings.buildFeePercentage || 0}
                      onChange={e => handleChange('buildFeePercentage', parseFloat(e.target.value))}
                    />
                    <span className="absolute right-4 top-2.5 text-slate-500">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Base Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      className="admin-input w-full pr-8 bg-[#0a0c13] border-[#1f2233] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-white"
                      value={settings.taxRate || 0}
                      onChange={e => handleChange('taxRate', parseFloat(e.target.value))}
                    />
                    <span className="absolute right-4 top-2.5 text-slate-500">%</span>
                  </div>
                </div>
                <div className="flex items-center mt-8 md:col-span-2">
                  <label className="flex items-center space-x-3 cursor-pointer text-slate-300 hover:text-white transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded bg-[#0a0c13] border-[#1f2233] text-emerald-500 focus:ring-emerald-500/20" 
                      checked={settings.taxEnabled || false}
                      onChange={e => handleChange('taxEnabled', e.target.checked)}
                    />
                    <span>Enable automated tax calculation</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsPage;