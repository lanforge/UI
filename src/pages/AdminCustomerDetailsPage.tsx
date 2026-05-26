import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Address {
  type: string;
  firstName?: string;
  lastName?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  addresses: Address[];
  loyaltyPoints: number;
  loyaltyTier: string;
  totalSpent: number;
  totalOrders: number;
  tags: string[];
  notes?: string;
  isActive: boolean;
  marketingOptIn: boolean;
  birthday?: string;
  createdAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  trackingNumber?: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  gatewayTransactionId: string;
  status: string;
  createdAt: string;
}

const AdminCustomerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCustomerDetails();
    }
  }, [id]);

  const fetchCustomerDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/customers/${id}`);
      setCustomer(response.data.customer);
      setEditForm(response.data.customer);
      setOrders(response.data.orders || []);
      setPayments(response.data.payments || []);
    } catch (err: any) {
      console.error('Failed to fetch customer details:', err);
      setError('Failed to load customer details.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handleSaveCustomer = async () => {
    try {
      setIsSaving(true);
      setError('');
      const response = await api.put(`/customers/${id}`, editForm);
      setCustomer(response.data.customer);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update customer:', err);
      setError(err.response?.data?.message || 'Failed to update customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const addAddress = () => {
    setEditForm(prev => ({
      ...prev,
      addresses: [
        ...(prev.addresses || []),
        { type: 'shipping', street: '', city: '', state: '', zip: '', country: 'US' }
      ]
    }));
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    setEditForm(prev => {
      const newAddresses = [...(prev.addresses || [])];
      newAddresses[index] = { ...newAddresses[index], [field]: value };
      return { ...prev, addresses: newAddresses };
    });
  };

  const removeAddress = (index: number) => {
    setEditForm(prev => {
      const newAddresses = [...(prev.addresses || [])];
      newAddresses.splice(index, 1);
      return { ...prev, addresses: newAddresses };
    });
  };

  if (isLoading) {
    return <div className="p-6 text-white text-center">Loading customer details...</div>;
  }

  if (error && !customer) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
        <button onClick={() => navigate('/admin/customers')} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Back to Customers
        </button>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="space-y-6 pb-20 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/customers')}
            className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-3">
              {customer.firstName} {customer.lastName}
              {!customer.isActive && (
                <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                  Inactive
                </span>
              )}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Customer since {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div>
          {isEditing ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setIsEditing(false); setEditForm(customer); }}
                className="px-4 py-2 bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveCustomer}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Addresses */}
        <div className="space-y-6 lg:col-span-1">
          {/* Customer Overview */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Overview</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={editForm.firstName || ''} 
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#0a0c13] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={editForm.lastName || ''} 
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#0a0c13] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email || ''} 
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="admin-input w-full px-3 py-2 bg-[#0a0c13] border border-[#1f2233] rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={editForm.phone || ''} 
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="admin-input w-full px-3 py-2 bg-[#0a0c13] border border-[#1f2233] rounded-lg text-white text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email Address</p>
                  <div className="flex items-center gap-2 text-white">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customer.email}
                  </div>
                </div>

                {customer.phone && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Phone Number</p>
                    <div className="flex items-center gap-2 text-white">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {customer.phone}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-[#1f2233] grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                <p className="text-xl font-medium text-white">{formatCurrency(customer.totalSpent)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Orders</p>
                <p className="text-xl font-medium text-white">{customer.totalOrders}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1f2233] mt-4">
              <p className="text-sm text-slate-500 mb-1">Loyalty Tier & Points</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  customer.loyaltyTier === 'Platinum' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' :
                  customer.loyaltyTier === 'Gold' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50' :
                  customer.loyaltyTier === 'Silver' ? 'bg-gray-300/20 text-slate-300 border border-gray-400/50' :
                  'bg-amber-700/20 text-amber-600 border border-amber-700/50'
                }`}>
                  {customer.loyaltyTier}
                </span>
                <span className="text-white font-medium">{customer.loyaltyPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="admin-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">Saved Addresses</h2>
              {isEditing && (
                <button 
                  onClick={addAddress}
                  className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded transition-colors"
                >
                  + Add Address
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                {editForm.addresses && editForm.addresses.length > 0 ? (
                  editForm.addresses.map((address, idx) => (
                    <div key={idx} className="bg-[#0a0c13] p-4 rounded-lg border border-[#1f2233] space-y-3 relative">
                      <button 
                        onClick={() => removeAddress(idx)}
                        className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Type</label>
                        <select 
                          value={address.type}
                          onChange={(e) => updateAddress(idx, 'type', e.target.value)}
                          className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                        >
                          <option value="shipping">Shipping</option>
                          <option value="billing">Billing</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">First Name</label>
                          <input 
                            type="text" 
                            value={address.firstName || ''} 
                            onChange={(e) => updateAddress(idx, 'firstName', e.target.value)}
                            placeholder={editForm.firstName}
                            className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                          <input 
                            type="text" 
                            value={address.lastName || ''} 
                            onChange={(e) => updateAddress(idx, 'lastName', e.target.value)}
                            placeholder={editForm.lastName}
                            className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Street</label>
                        <input 
                          type="text" 
                          value={address.street || ''} 
                          onChange={(e) => updateAddress(idx, 'street', e.target.value)}
                          className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">City</label>
                          <input 
                            type="text" 
                            value={address.city || ''} 
                            onChange={(e) => updateAddress(idx, 'city', e.target.value)}
                            className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="w-1/2">
                            <label className="block text-xs text-slate-500 mb-1">State</label>
                            <input 
                              type="text" 
                              value={address.state || ''} 
                              onChange={(e) => updateAddress(idx, 'state', e.target.value)}
                              className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                            />
                          </div>
                          <div className="w-1/2">
                            <label className="block text-xs text-slate-500 mb-1">Zip</label>
                            <input 
                              type="text" 
                              value={address.zip || ''} 
                              onChange={(e) => updateAddress(idx, 'zip', e.target.value)}
                              className="admin-input w-full px-2 py-1.5 bg-[#11141d] border border-[#1f2233] rounded text-white text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">No saved addresses</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {customer.addresses && customer.addresses.length > 0 ? (
                  customer.addresses.map((address, idx) => (
                    <div key={idx} className="bg-[#0a0c13] p-4 rounded-lg border border-[#1f2233]">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {address.type}
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 space-y-1">
                        <p className="font-medium text-white">{address.firstName || customer.firstName} {address.lastName || customer.lastName}</p>
                        <p>{address.street}</p>
                        <p>{address.city}, {address.state} {address.zip}</p>
                        <p>{address.country}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic text-sm">No saved addresses</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Orders & Payments */}
        <div className="space-y-6 lg:col-span-2">

          {/* Orders History */}
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0a0c13]">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Order</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Payment</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2233]">
                  {orders.length > 0 ? (
                    orders.map(order => (
                      <tr key={order._id} className="hover:bg-[#1f2233]/30 cursor-pointer transition-colors" onClick={() => navigate(`/admin/orders/${order._id}`)}>
                        <td className="py-4 px-6">
                          <span className="text-emerald-400 hover:underline font-medium">{order.orderNumber}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-300">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs capitalize px-2 py-1 rounded-full bg-[#11141d] text-slate-300">
                            {(order.status || 'unknown').replace(/-/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`capitalize ${order.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-white font-medium text-right">
                          {formatCurrency(order.total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No orders found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="admin-card overflow-hidden">
            <div className="p-6 border-b border-[#1f2233]">
              <h2 className="text-lg font-medium text-white">Payment History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0a0c13]">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Transaction ID</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Method</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2233]">
                  {payments.length > 0 ? (
                    payments.map(payment => (
                      <tr key={payment._id} className="hover:bg-[#1f2233]/30 transition-colors">
                        <td className="py-4 px-6 text-sm font-mono text-slate-400">
                          {payment.gatewayTransactionId}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-300">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm capitalize text-slate-300">
                          {payment.paymentMethod}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`text-xs capitalize px-2 py-1 rounded-full ${
                            payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            payment.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-white font-medium text-right">
                          {formatCurrency(payment.amount)} {payment.currency.toUpperCase()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No payments found for this customer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCustomerDetailsPage;
