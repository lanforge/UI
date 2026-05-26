import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface PCPart {
  _id: string;
  type: string;
  brand: string;
  partModel: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  stock: number;
  isActive: boolean;
  productUrl?: string;
}

const STORAGE_KEY = 'adminPartsPageState';

const getSavedState = () => {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};

const AdminPartsPage: React.FC = () => {
  const navigate = useNavigate();
  const saved = useRef(getSavedState()).current;

  const [searchTerm, setSearchTerm] = useState<string>(saved?.searchTerm ?? '');
  const [typeFilter, setTypeFilter] = useState<string>(saved?.typeFilter ?? 'all');
  const [statusFilter, setStatusFilter] = useState<string>(saved?.statusFilter ?? 'all');
  const [sortBy, setSortBy] = useState<string>(saved?.sortBy ?? '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(saved?.sortDir ?? 'desc');
  const [parts, setParts] = useState<PCPart[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState<number>(saved?.page ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalParts, setTotalParts] = useState(0);

  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkCategory, setBulkCategory] = useState('cpu');
  const [bulkTags, setBulkTags] = useState('');
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });

  const [editingPart, setEditingPart] = useState<PCPart | null>(null);
  const [editJson, setEditJson] = useState('');

  // Persist state so navigating back from edit restores position
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchTerm, typeFilter, statusFilter, sortBy, sortDir, page }));
    } catch {}
  }, [searchTerm, typeFilter, statusFilter, sortBy, sortDir, page]);

  const fetchParts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/pc-parts/admin/all', {
        params: {
          search: searchTerm || undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy: sortBy || undefined,
          order: sortDir,
          page,
          limit: 20,
        }
      });
      setParts(response.data.parts || []);
      setTotalPages(response.data.pages || 1);
      setTotalParts(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch PC parts', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, [page, typeFilter, statusFilter, sortBy, sortDir]);

  // Client-side filter as fallback in case server hasn't picked up the status param yet
  const displayParts = useMemo(() => {
    if (statusFilter === 'all') return parts;
    return parts.filter(p => statusFilter === 'active' ? p.isActive : !p.isActive);
  }, [parts, statusFilter]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    fetchParts();
  };

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1 text-emerald-400">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const handleSelectPart = (partId: string) => {
    setSelectedParts(prev =>
      prev.includes(partId)
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const handleSelectAll = () => {
    if (selectedParts.length === displayParts.length) {
      setSelectedParts([]);
    } else {
      setSelectedParts(displayParts.map(part => part._id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this part?')) return;
    try {
      await api.delete(`/pc-parts/${id}`);
      fetchParts();
    } catch (error) {
      console.error('Failed to delete part', error);
      alert('Failed to delete part');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedParts.length} parts?`)) return;
    try {
      await api.post('/pc-parts/bulk/delete', { ids: selectedParts });
      setSelectedParts([]);
      fetchParts();
    } catch (error) {
      console.error('Failed to delete parts', error);
      alert('Failed to delete parts');
    }
  };

  const handleBulkActivate = async () => {
    try {
      await api.post('/pc-parts/bulk/update', { ids: selectedParts, update: { isActive: true } });
      setSelectedParts([]);
      fetchParts();
    } catch (error) {
      console.error('Failed to activate parts', error);
      alert('Failed to activate parts');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { text: 'Out of Stock', color: 'bg-red-500/10 text-red-400 border-red-500/30' };
    if (stock <= 5) return { text: 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { text: 'In Stock', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const handleBulkImport = async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u);
    if (urls.length === 0) {
      alert('Please enter at least one valid URL');
      return;
    }

    setIsBulkImporting(true);
    setBulkProgress({ current: 0, total: urls.length, successes: 0, failures: 0 });

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < urls.length; i++) {
      setBulkProgress(prev => ({ ...prev, current: i + 1 }));
      try {
        const scrapeRes = await api.post('/pc-parts/scrape-link', { url: urls[i] });
        const details = scrapeRes.data.details;
        
        if (details && details.name) {
          const payload = {
            type: bulkCategory,
            brand: details.brand || 'Unknown',
            model: details.model || details.name,
            sku: `PART-${Math.floor(100000 + Math.random() * 900000)}`,
            price: details.price || 0,
            cost: details.cost || 0,
            stock: 10, // Default stock for mass import
            specs: { _empty: true },
            tags: bulkTags.split(',').map(t => t.trim()).filter(t => t),
            isActive: true,
            productUrl: urls[i]
          };
          
          await api.post('/pc-parts', payload);
          successes++;
        } else {
          failures++;
        }
      } catch (err) {
        console.error(`Failed to import ${urls[i]}`, err);
        failures++;
      }
    }

    setBulkProgress(prev => ({ ...prev, successes, failures }));
    setIsBulkImporting(false);
    fetchParts();
    
    if (failures === 0) {
      setTimeout(() => setShowBulkImport(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">PC Parts Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage individual components and hardware parts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={async () => {
              if (!window.confirm('Are you sure you want to trigger a rescrape for all parts with URLs? This will run in the background.')) return;
              try {
                const res = await api.post('/pc-parts/scrape-all');
                alert(res.data.message);
              } catch (e: any) {
                alert('Failed to start bulk scrape: ' + (e.response?.data?.message || e.message));
              }
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Re-scrape All
          </button>
          <button 
            onClick={() => setShowBulkImport(!showBulkImport)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Bulk Auto-Import
          </button>
          <button 
            onClick={() => navigate('/admin/parts/add')}
            className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
          >
            + Add Part
          </button>
        </div>
      </div>

      {/* Bulk Import Section */}
      {showBulkImport && (
        <div className="admin-card p-6 bg-[#11141d] border border-blue-500/30">
          <h2 className="text-lg font-medium text-white mb-2">Bulk Auto-Import Parts</h2>
          <p className="text-slate-500 mb-6 text-xs">Paste product URLs from Amazon or Newegg (one per line). The system will scrape the name, brand, model, and price, then automatically create the parts in your inventory.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Product URLs (one per line)</label>
              <textarea 
                className="admin-input h-32" 
                placeholder="https://amazon.com/dp/...\nhttps://newegg.com/p/..."
                value={bulkUrls}
                onChange={(e) => setBulkUrls(e.target.value)}
                disabled={isBulkImporting}
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Assign Category</label>
              <select
                className="admin-input mb-4"
                value={bulkCategory}
                onChange={(e) => setBulkCategory(e.target.value)}
                disabled={isBulkImporting}
              >
                <option value="cpu">CPU</option>
                <option value="gpu">GPU</option>
                <option value="motherboard">Motherboard</option>
                <option value="ram">RAM</option>
                <option value="storage">Storage</option>
                <option value="psu">Power Supply</option>
                <option value="case">Case</option>
                <option value="cpu-cooler">CPU Cooler</option>
                <option value="fan">Case Fan</option>
                <option value="os">Operating System</option>
              </select>

              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Assign Tags / Colors</label>
              <input
                type="text"
                className="admin-input mb-2"
                placeholder={['motherboard', 'case', 'cpu-cooler', 'fan'].includes(bulkCategory) ? "e.g. White, RGB" : "e.g. Low-Profile"}
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                disabled={isBulkImporting}
              />
              {['motherboard', 'case', 'cpu-cooler', 'fan'].includes(bulkCategory) && (
                <p className="text-[10px] text-emerald-500 mb-4">Hint: Use tags to set the color.</p>
              )}
              
              <button 
                onClick={handleBulkImport}
                disabled={isBulkImporting || !bulkUrls.trim()}
                className="w-full mt-2 py-2 bg-white text-black hover:bg-gray-200 disabled:bg-[#11141d] disabled:text-slate-500 rounded-md transition-colors text-sm font-medium"
              >
                {isBulkImporting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </div>
          
          {isBulkImporting && (
            <div className="mt-4 p-4 bg-[#1f2233]/50 rounded-md border border-[#1f2233]">
              <div className="flex justify-between text-xs text-slate-400 mb-2">
                <span>Processing item {bulkProgress.current} of {bulkProgress.total}...</span>
                <span>{Math.round((bulkProgress.current / bulkProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-[#07090e] rounded-full h-1.5 border border-[#1f2233]">
                <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
              </div>
            </div>
          )}
          
          {!isBulkImporting && bulkProgress.total > 0 && (
            <div className={`mt-4 p-4 rounded-md text-xs ${bulkProgress.failures > 0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
              Import complete! Successfully added {bulkProgress.successes} parts. {bulkProgress.failures > 0 && `${bulkProgress.failures} failed to import.`}
            </div>
          )}
        </div>
      )}

      {/* Search and filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="flex-1 flex items-center bg-[#07090e] border border-[#1f2233] rounded-md focus-within:border-white/20 transition-all">
              <svg className="w-4 h-4 text-slate-500 ml-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search parts by name/sku..."
                className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={fetchParts} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="admin-input"
            >
              <option value="all">All Types</option>
              <option value="cpu">CPU</option>
              <option value="gpu">GPU</option>
              <option value="motherboard">Motherboard</option>
              <option value="ram">RAM</option>
              <option value="storage">Storage</option>
              <option value="psu">Power Supply</option>
              <option value="case">Case</option>
              <option value="cpu-cooler">CPU Cooler</option>
              <option value="fan">Case Fan</option>
              <option value="os">Operating System</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="admin-input"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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

      {/* Parts Table */}
      <div className="admin-card overflow-hidden">
        <div className="p-3 border-b border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
              checked={selectedParts.length === displayParts.length && displayParts.length > 0}
              onChange={handleSelectAll}
            />
            <span className="text-slate-500 text-xs">
              {selectedParts.length > 0 ? `${selectedParts.length} selected` : `${displayParts.length} parts (this page)`}
            </span>
          </div>
          {selectedParts.length > 0 && (
            <div className="flex items-center space-x-2">
              <button onClick={handleBulkActivate} className="px-2.5 py-1 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-md transition-colors">
                Activate
              </button>
              <button onClick={handleBulkDelete} className="px-2.5 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-md transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Part Name</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Type & Brand</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Cost</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Stock</th>
                <th
                  className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center cursor-pointer hover:text-white select-none transition-colors"
                  onClick={() => toggleSort('isActive')}
                  title="Sort by status"
                >
                  Status<SortIndicator field="isActive" />
                </th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">Loading parts...</td></tr>
              ) : displayParts.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No parts found.</td></tr>
              ) : displayParts.map(part => {
                const status = getStockStatus(part.stock);

                return (
                  <tr key={part._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3 mb-1">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
                          checked={selectedParts.includes(part._id)}
                          onChange={() => handleSelectPart(part._id)}
                        />
                        <p className="text-slate-200 font-medium">{`${part.brand} ${part.partModel}`}</p>
                      </div>
                      <p className="text-slate-500 text-xs font-mono mt-1">{part.sku}</p>
                      {(part as any).productUrl && (
                        <div className="flex items-center gap-3 mt-2">
                          <a 
                            href={(part as any).productUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-500 text-[10px] hover:underline inline-flex items-center gap-1"
                          >
                            View Link
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.post(`/pc-parts/${part._id}/scrape`);
                                alert(`Scraped successfully: Cost $${res.data.part.cost}, Price $${res.data.part.price}`);
                                fetchParts();
                              } catch (e: any) {
                                alert(`Failed to scrape: ${e.response?.data?.message || e.message}`);
                              }
                            }}
                            className="px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-sm hover:bg-blue-500/20 transition-colors"
                          >
                            Scrape Pricing
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-200">{part.type}</p>
                      <p className="text-slate-500 text-xs">{part.brand}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-slate-200 font-medium">${part.price?.toFixed(2)}</span>
                        {part.compareAtPrice && (
                          <span className="text-slate-500 line-through text-xs">${part.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-emerald-500 font-medium">
                      {typeof part.cost === 'number' ? `$${part.cost.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-right text-slate-200 font-medium">
                      {part.stock}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge ${part.isActive ? status.color : 'bg-gray-500/10 text-slate-400 border-gray-500/20'}`}>
                        {part.isActive ? status.text : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/admin/parts/edit/${part._id}`)}
                          className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(part._id)} 
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1f2233] rounded-md transition-colors" 
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
            Showing {parts.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalParts)} of {totalParts} parts
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

export default AdminPartsPage;