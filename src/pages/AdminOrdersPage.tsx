import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const AdminOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/orders/admin/all', {
        params: {
          search: searchTerm,
          status: statusFilter,
          page
        }
      });
      setOrders(response.data.orders || []);
      setTotalPages(response.data.pages || 1);
      setTotalOrders(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'order-confirmed': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'building': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'benchmarking': return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'shipped': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'out-for-delivery': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'returned': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/10 text-slate-400 border border-gray-500/30';
    }
  };

  const getPaymentColor = (payment: string) => {
    switch (payment) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
      case 'pending': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'failed': return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'refunded': return 'bg-gray-500/10 text-slate-400 border border-gray-500/30';
      default: return 'bg-gray-500/10 text-slate-400 border border-gray-500/30';
    }
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
          <h1 className="text-xl font-medium text-white">Orders Management</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage customer orders</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/orders/add')}
            className="px-3 py-1.5 bg-white text-black hover:bg-gray-200 text-sm rounded-md transition-colors font-medium"
          >
            + Create Order
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-medium text-white mt-1">{totalOrders}</p>
            </div>
            <div className="w-8 h-8 bg-[#1f2233]/50 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
                placeholder="Search orders..."
                className="w-full pl-2 pr-4 py-2 bg-transparent text-sm text-slate-200 placeholder-gray-600 focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={fetchOrders} className="p-2 bg-[#1f2233]/50 hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-md transition-colors" title="Refresh">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="admin-input"
            >
              <option value="all">All Statuses</option>
              <option value="order-confirmed">Order Confirmed</option>
              <option value="building">Building</option>
              <option value="benchmarking">Benchmarking</option>
              <option value="shipped">Shipped</option>
              <option value="out-for-delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
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

      {/* Orders table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f2233] bg-[#07090e]">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Order Number</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Payment</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Total</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2233]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-sm">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-[#1f2233]/30 transition-colors">
                  <td className="py-4 px-6 text-slate-300">
                    <span className="font-medium">{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-slate-300">{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : 'Guest'}</p>
                      <p className="text-slate-500 text-xs">{order.customer?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider font-medium border ${getStatusColor(order.status)}`}>
                      {(order.status || 'unknown').replace(/-/g, ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider font-medium border ${getPaymentColor(order.paymentStatus)}`}>
                      {(order.paymentStatus || 'unknown')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-medium">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => navigate(`/admin/orders/${order._id}`)}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-[#1f2233] rounded-md transition-colors" 
                      title="View Details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-3 border-t border-[#1f2233] flex items-center justify-between bg-[#07090e]">
          <div className="text-slate-500 text-xs">
            Showing {orders.length > 0 ? (page - 1) * 20 + 1 : 0} to {Math.min(page * 20, totalOrders)} of {totalOrders} orders
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

export default AdminOrdersPage;
