import React, { useState, useEffect } from 'react';
import api from '../utils/api';

import { Link } from 'react-router-dom';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/admin/dashboard');
        setStats(response.data.stats);
        setRecentOrders(response.data.recentOrders || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setError('Failed to load dashboard statistics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <div className="text-slate-400 p-8 text-center animate-pulse">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="text-red-400 p-8 text-center">{error}</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-slate-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-white">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 text-sm">Total Revenue</h3>
            <div className="w-8 h-8 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-medium text-white">{formatCurrency(stats.totalRevenue)}</span>
            <div className="flex items-center mt-1 text-xs">
              <span className={Number(stats.revenueGrowth) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {Number(stats.revenueGrowth) >= 0 ? '+' : ''}{stats.revenueGrowth}%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 text-sm">Total Orders</h3>
            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-medium text-white">{stats.totalOrders}</span>
            <div className="flex items-center mt-1 text-xs">
              <span className={Number(stats.orderGrowth) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {Number(stats.orderGrowth) >= 0 ? '+' : ''}{stats.orderGrowth}%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 text-sm">Total Customers</h3>
            <div className="w-8 h-8 rounded-md bg-purple-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-medium text-white">{stats.totalCustomers}</span>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-emerald-500">+{stats.newCustomers}</span>
              <span className="text-slate-500 ml-2">new this month</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-slate-400 text-sm">Inventory Alerts</h3>
            <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-medium text-white">{stats.lowStockProducts}</span>
            <div className="flex items-center mt-1 text-xs">
              <span className="text-amber-500">Items running low</span>
              <span className="text-slate-500 ml-2">out of {stats.totalProducts}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        {/* Recent Orders Table */}
        <div className="bg-[#11141d] rounded-md border border-[#1f2233] overflow-hidden">
          <div className="p-4 border-b border-[#1f2233] flex justify-between items-center bg-[#07090e]">
            <h2 className="text-sm font-medium text-white">Recent Orders</h2>
            <button className="text-xs text-slate-400 hover:text-white transition-colors">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2233] bg-[#11141d]">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Order</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2233]">
                {recentOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#1f2233]/30 transition-colors">
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {order.orderNumber || order._id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-400">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] uppercase tracking-wider font-medium rounded-sm border ${getStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      {formatCurrency(order.total)}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#11141d] rounded-md border border-[#1f2233] overflow-hidden">
          <div className="p-4 border-b border-[#1f2233] bg-[#07090e]">
            <h2 className="text-sm font-medium text-white">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link to="/admin/products/add" className="flex items-center space-x-3 px-3 py-2 bg-[#1f2233]/50 hover:bg-[#1f2233] rounded-md transition-colors text-sm">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-slate-300">Add Product</span>
            </Link>
            <Link to="/admin/parts/add" className="flex items-center space-x-3 px-3 py-2 bg-[#1f2233]/50 hover:bg-[#1f2233] rounded-md transition-colors text-sm">
              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-slate-300">Add Part</span>
            </Link>
            <Link to="/admin/orders/add" className="flex items-center space-x-3 px-3 py-2 bg-[#1f2233]/50 hover:bg-[#1f2233] rounded-md transition-colors text-sm">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-slate-300">Create Order</span>
            </Link>
            
            <div className="mt-4 flex flex-col items-center justify-center p-4 bg-amber-500/5 rounded-md border border-amber-500/10">
              <span className="text-xs text-amber-500/70 mb-1">Pending Orders</span>
              <span className="text-xl font-medium text-amber-500">{stats?.pendingOrders || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
