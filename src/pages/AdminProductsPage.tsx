import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Product {
  _id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  cost: number;
  stock: number;
  reorderPoint?: number;
  isActive: boolean;
}

const AdminProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products/admin/all');
      const allProducts = response.data.products || [];
      setProducts(allProducts);
      
      // Extract unique categories
      const uniqueCategories = Array.from(new Set(allProducts.map((p: Product) => p.category))) as string[];
      setCategories(uniqueCategories.filter(Boolean));
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'active') matchesStatus = product.isActive;
    if (statusFilter === 'out-of-stock') matchesStatus = product.stock <= 0;
    if (statusFilter === 'draft') matchesStatus = !product.isActive;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(product => product._id));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product', error);
      alert('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;
    try {
      await api.post('/products/bulk/delete', { ids: selectedProducts });
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete products', error);
      alert('Failed to delete products');
    }
  };

  const handleBulkActivate = async () => {
    try {
      await api.post('/products/bulk/update', { ids: selectedProducts, update: { isActive: true } });
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Failed to activate products', error);
      alert('Failed to activate products');
    }
  };

  const getStatusInfo = (product: Product) => {
    if (!product.isActive) {
      return { text: 'Draft/Inactive', color: 'bg-gray-500/10 text-slate-400 border border-gray-500/30' };
    }
    if (product.stock <= 0) {
      return { text: 'Out of Stock', color: 'bg-red-500/10 text-red-400 border border-red-500/30' };
    }
    if (product.stock <= (product.reorderPoint || 5)) {
      return { text: 'Low Stock', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' };
    }
    return { text: 'Active', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Products Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your product catalog</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={async () => {
              const merchantId = window.prompt('Enter your Google Merchant Center ID to sync active products:', '10642610247');
              if (!merchantId) return;
              try {
                alert('Starting sync... This may take a few seconds.');
                const res = await api.post('/products/admin/sync-google-merchant', { merchantId });
                alert(`Successfully synced ${res.data.count} products to Google Merchant Center!`);
              } catch (e: any) {
                alert('Failed to sync: ' + (e.response?.data?.message || e.message) + '\n\nMake sure Content API is enabled in Google Cloud Console and the Service Account is linked.');
              }
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Sync</span>
          </button>
          <button 
            onClick={async () => {
              if (!window.confirm('Are you sure you want to recalculate all products? This will update cost based on parts and apply markup to price.')) return;
              try {
                const res = await api.post('/products/recalculate');
                alert(res.data.message);
                fetchProducts();
              } catch (e: any) {
                alert('Failed to recalculate products: ' + (e.response?.data?.message || e.message));
              }
            }}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md transition-colors text-sm font-medium"
          >
            Recalculate
          </button>
          <button 
            onClick={() => navigate('/admin/products/add')}
            className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 rounded-md transition-colors text-sm font-medium"
          >
            + Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Products</p>
              <p className="text-2xl font-medium text-white mt-1">{products.length}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Out of Stock</p>
              <p className="text-2xl font-medium text-white mt-1">{products.filter(p => p.stock <= 0).length}</p>
            </div>
            <div className="w-8 h-8 bg-red-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Low Stock</p>
              <p className="text-2xl font-medium text-white mt-1">{products.filter(p => p.stock > 0 && p.stock <= (p.reorderPoint || 5)).length}</p>
            </div>
            <div className="w-8 h-8 bg-amber-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Active Listings</p>
              <p className="text-2xl font-medium text-white mt-1">{products.filter(p => p.isActive).length}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

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
                placeholder="Search products..."
                className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={fetchProducts} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-input"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-input"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="out-of-stock">Out of Stock</option>
              <option value="draft">Draft/Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className="admin-card overflow-hidden">
        <div className="p-3 border-b border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onChange={handleSelectAll}
            />
            <span className="text-slate-500 text-xs">
              {selectedProducts.length > 0 ? `${selectedProducts.length} selected` : `${filteredProducts.length} products`}
            </span>
          </div>
          {selectedProducts.length > 0 && (
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Product</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Category</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Price</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Stock</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No products found.</td></tr>
              ) : filteredProducts.map((product) => {
                const statusInfo = getStatusInfo(product);
                return (
                <tr key={product._id} className="hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded bg-[#11141d] border-[#1f2233]"
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                      />
                      <div>
                        <p className="text-slate-200 font-medium">{product.name}</p>
                        <p className="text-slate-500 text-xs">SKU: {product.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400">{product.category}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-medium">{formatCurrency(product.price)}</span>
                        {product.compareAtPrice && (
                          <span className="text-slate-500 line-through text-xs">{formatCurrency(product.compareAtPrice)}</span>
                        )}
                      </div>
                      <span className={`text-xs ${product.price - (product.cost || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        PnL: {formatCurrency(product.price - (product.cost || 0))}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <span className={`text-xs font-medium ${product.stock > (product.reorderPoint || 5) ? 'text-emerald-500' : product.stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                        {product.stock} units
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`admin-badge ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors" 
                        title="Edit"
                        onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-[#1f2233] rounded-md transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProductsPage;
