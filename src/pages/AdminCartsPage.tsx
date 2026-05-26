import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faScrewdriverWrench } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

interface Cart {
  _id: string;
  sessionId: string;
  user?: { firstName: string; lastName: string; email: string };
  status: 'active' | 'abandoned' | 'converted' | 'recovered';
  items: any[];
  totalQuantity?: number;
  subtotal?: number;
  total?: number;
  updatedAt: string;
  appliedDiscount?: { code: string; type: string; value: number };
  customDiscountAmount?: number;
  creatorCode?: string;
}

const AdminCartsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [carts, setCarts] = useState<Cart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCarts, setTotalCarts] = useState(0);

  const fetchCarts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/carts/admin/all', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined, page, limit: 20 }
      });
      setCarts(response.data.carts || []);
      setTotalPages(response.data.pages || 1);
      setTotalCarts(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch carts', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, [page, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'active': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'abandoned': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-slate-400 border-gray-500/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const calculateCartTotal = (cart: Cart) => {
    return cart.items.reduce((total, item) => {
      let itemPrice = 0;
      if (item.product?.price) itemPrice = item.product.price;
      else if (item.customBuild?.total) itemPrice = item.customBuild.total;
      return total + (itemPrice * (item.quantity || 1));
    }, 0);
  };

  const calculateCartItemsCount = (cart: Cart) => {
    return cart.items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [editDiscountCode, setEditDiscountCode] = useState('');
  const [editCustomDiscount, setEditCustomDiscount] = useState<number>(0);
  const [editCreatorCode, setEditCreatorCode] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'abandoned' | 'converted' | 'recovered'>('active');
  const [editItems, setEditItems] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (productSearch.length > 2) {
      const delay = setTimeout(() => {
        api.get(`/products/search?q=${productSearch}`)
          .then(res => setSearchResults(res.data.products || []))
          .catch(err => console.error(err));
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setSearchResults([]);
    }
  }, [productSearch]);

  const handleAddItem = (product: any) => {
    setEditItems([...editItems, {
      product: product,
      quantity: 1
    }]);
    setProductSearch('');
    setSearchResults([]);
  };

  const handleEditClick = (cart: Cart) => {
    setSelectedCart(cart);
    setEditDiscountCode(cart.appliedDiscount?.code || '');
    setEditCustomDiscount(cart.customDiscountAmount || 0);
    setEditCreatorCode(cart.creatorCode || '');
    setEditStatus(cart.status);
    setEditItems([...cart.items]);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...editItems];
    updated.splice(index, 1);
    setEditItems(updated);
  };

  const handleSaveCart = async () => {
    if (!selectedCart) return;
    try {
      const mappedItems = editItems.map(item => ({
        product: item.product?._id || item.product,
        pcPart: item.pcPart?._id || item.pcPart,
        accessory: item.accessory?._id || item.accessory,
        customBuild: item.customBuild?._id || item.customBuild,
        quantity: item.quantity || 1
      }));

      await api.put(`/carts/admin/${selectedCart._id}`, {
        discountCode: editDiscountCode,
        customDiscountAmount: editCustomDiscount,
        creatorCode: editCreatorCode,
        status: editStatus,
        items: mappedItems
      });
      setSelectedCart(null);
      fetchCarts();
    } catch (error) {
      console.error('Failed to update cart', error);
      alert('Failed to update cart');
    }
  };

  if (selectedCart) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedCart(null)}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-medium text-white">Edit Cart</h1>
              <p className="text-slate-500 text-xs mt-1">Session: {selectedCart.sessionId}</p>
            </div>
          </div>
          <button
            onClick={handleSaveCart}
            className="px-3 py-1.5 text-sm bg-white text-black hover:bg-gray-200 rounded-md font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="admin-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-white">Cart Items</h2>
                <div className="text-slate-500 text-xs">
                  {editItems.reduce((acc, i) => acc + (i.quantity || 1), 0)} items
                </div>
              </div>
              
              <div className="mb-6 relative">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-input"
                  placeholder="Search to add product..."
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[#11141d] border border-[#1f2233] rounded-md shadow-xl max-h-64 overflow-y-auto">
                    {searchResults.map(prod => (
                      <button
                        key={prod._id}
                        onClick={() => handleAddItem(prod)}
                        className="w-full text-left px-4 py-3 hover:bg-[#1f2233]/50 text-sm text-slate-300 flex justify-between items-center border-b border-[#1f2233] last:border-0"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-white">{prod.name}</span>
                          <span className="text-[10px] text-slate-500">{prod.brand} - {prod.category}</span>
                        </div>
                        <span className="text-emerald-500 font-medium">{formatCurrency(prod.price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {editItems.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[#1f2233] rounded-md">
                  <p className="text-slate-600 text-sm">Cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editItems.map((item, idx) => {
                    const itemName = item.product?.name || item.customBuild?.name || 'Unknown Item';
                    const itemPrice = item.product?.price || item.customBuild?.total || 0;
                    return (
                      <div key={idx} className="flex items-center justify-between bg-[#07090e] p-3 rounded-md border border-[#1f2233]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-[#11141d] rounded-md flex items-center justify-center text-slate-500">
                            {item.product ? <FontAwesomeIcon icon={faBox} /> : <FontAwesomeIcon icon={faScrewdriverWrench} />}
                          </div>
                          <div>
                            <div className="font-medium text-slate-200 text-sm">{itemName}</div>
                            <div className="text-xs text-slate-500 mt-0.5">Quantity: {item.quantity}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-slate-200">{formatCurrency(itemPrice)}</span>
                          <button 
                            onClick={() => handleRemoveItem(idx)}
                            className="w-6 h-6 rounded-md bg-[#1f2233]/50 text-slate-400 hover:text-red-400 hover:bg-[#1f2233] flex items-center justify-center transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="admin-card p-6">
              <h2 className="text-sm font-medium text-white mb-6">Cart Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="admin-input"
                  >
                    <option value="active">Active</option>
                    <option value="abandoned">Abandoned</option>
                    <option value="converted">Converted</option>
                    <option value="recovered">Recovered</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Discount Code</label>
                  <input
                    type="text"
                    value={editDiscountCode}
                    onChange={(e) => setEditDiscountCode(e.target.value)}
                    className="admin-input"
                    placeholder="e.g. SUMMER10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Custom Discount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editCustomDiscount}
                    onChange={(e) => setEditCustomDiscount(parseFloat(e.target.value) || 0)}
                    className="admin-input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Creator Code</label>
                  <input
                    type="text"
                    value={editCreatorCode}
                    onChange={(e) => setEditCreatorCode(e.target.value)}
                    className="admin-input"
                    placeholder="e.g. STREAMERXYZ"
                  />
                </div>
              </div>
            </div>

            <div className="admin-card p-6">
              <h2 className="text-sm font-medium text-white mb-4">Summary</h2>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-300">
                    {formatCurrency(editItems.reduce((total, item) => {
                      const price = item.product?.price || item.customBuild?.total || 0;
                      return total + (price * (item.quantity || 1));
                    }, 0))}
                  </span>
                </div>
                {editCustomDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Custom Discount</span>
                    <span className="text-emerald-500">-{formatCurrency(editCustomDiscount)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-[#1f2233]">
                <span className="text-slate-400 text-sm">Calculated Total</span>
                <span className="text-lg font-medium text-white">
                  {formatCurrency(Math.max(0, editItems.reduce((total, item) => {
                    const price = item.product?.price || item.customBuild?.total || 0;
                    return total + (price * (item.quantity || 1));
                  }, 0) - editCustomDiscount))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-white">Active & Abandoned Carts</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor shopping cart activity</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Tracked Carts</p>
              <p className="text-2xl font-medium text-white mt-1">{totalCarts}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Abandoned</p>
              <p className="text-2xl font-medium text-amber-500 mt-1">{carts.filter(c => c.status === 'abandoned').length}</p>
            </div>
            <div className="w-8 h-8 bg-amber-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Recovered</p>
              <p className="text-2xl font-medium text-emerald-500 mt-1">{carts.filter(c => c.status === 'recovered').length}</p>
            </div>
            <div className="w-8 h-8 bg-emerald-500/10 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="admin-input"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="abandoned">Abandoned</option>
                <option value="converted">Converted</option>
              </select>
            </div>
            <button onClick={fetchCarts} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Carts table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Session/User</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Items</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Value</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Last Active</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 text-sm">Loading carts...</td></tr>
              ) : carts.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500 text-sm">No carts found</td></tr>
              ) : (
                carts.map(cart => (
                  <tr key={cart._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-medium">{cart.user ? `${cart.user.firstName} ${cart.user.lastName}` : 'Guest'}</p>
                      <p className="text-slate-500 text-[10px] font-mono truncate max-w-[150px]">{cart.sessionId}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-400">{calculateCartItemsCount(cart)} items</td>
                    <td className="py-4 px-6 text-right font-medium text-slate-200">
                      {formatCurrency(calculateCartTotal(cart))}
                      {cart.appliedDiscount && (
                        <div className="text-[10px] text-emerald-500 mt-1">{cart.appliedDiscount.code}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {new Date(cart.updatedAt).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`admin-badge ${getStatusColor(cart.status)}`}>
                        {cart.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditClick(cart)}
                          className="px-2.5 py-1 text-xs bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-300 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                        {cart.status === 'abandoned' && cart.user && (
                          <button className="px-2.5 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-md transition-colors border border-blue-500/20">
                            Reminder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {carts.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalCarts)} of {totalCarts}
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

export default AdminCartsPage;
