import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface OrderItem {
  _id?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  notes?: string;
}

interface Address {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface CustomerAddress {
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
  loyaltyPoints?: number;
  addresses?: CustomerAddress[];
}

interface Order {
  _id: string;
  orderNumber: string;
  isAdminCreated?: boolean;
  customer?: Customer;
  guestEmail?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  appliedDiscount?: {
    code: string;
    type: string;
    value: number;
  };
  donationAmount: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentId?: string;
  trackingNumber?: string;
  carrier?: string;
  carrierTrackingUrl?: string;
  trackingUrl?: string;
  labelUrl?: string;
  shippingRates?: any[];
  selectedShippingRate?: {
    objectId: string;
    title: string;
    estimatedDays: string;
    amount: number;
  };
  notes?: string;
  createdAt: string;
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

const AdminOrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [purchasedPCs, setPurchasedPCs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
  const [billingAddress, setBillingAddress] = useState<Address | null>(null);
  const [shipping, setShipping] = useState<number>(0);
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [status, setStatus] = useState<string>('pending');

  // Shipping Modal State
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [addInsurance, setAddInsurance] = useState(false);
  const [liveShippingRates, setLiveShippingRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/orders/admin/${id}`);
      const data = response.data.order;
      setOrder(data);
      setItems(data.items || []);

      if (data.isAdminCreated && data.customer?.addresses?.length) {
        // Find shipping and billing addresses
        const shipAddr = data.customer.addresses.find((a: any) => a.type === 'shipping') || data.customer.addresses[0];
        const billAddr = data.customer.addresses.find((a: any) => a.type === 'billing') || data.customer.addresses[0];

        setShippingAddress({
          firstName: shipAddr.firstName || data.customer.firstName,
          lastName: shipAddr.lastName || data.customer.lastName,
          email: data.customer.email,
          phone: data.customer.phone || data.shippingAddress?.phone || 'N/A',
          address: shipAddr.street,
          city: shipAddr.city,
          state: shipAddr.state,
          zip: shipAddr.zip,
          country: shipAddr.country || 'US',
        });
        setBillingAddress({
          firstName: billAddr.firstName || data.customer.firstName,
          lastName: billAddr.lastName || data.customer.lastName,
          email: data.customer.email,
          phone: data.customer.phone || data.billingAddress?.phone || 'N/A',
          address: billAddr.street,
          city: billAddr.city,
          state: billAddr.state,
          zip: billAddr.zip,
          country: billAddr.country || 'US',
        });
      } else {
        setShippingAddress(data.shippingAddress);
        setBillingAddress(data.billingAddress);
      }

      setShipping(data.shipping || 0);
      setDonationAmount(data.donationAmount || 0);
      setStatus(data.status || 'pending');
      
      // We will select a rate after fetching live rates

      try {
        const paymentsResponse = await api.get(`/payments?order=${id}`);
        setPayments(paymentsResponse.data);
      } catch (paymentErr) {
        console.error('Failed to fetch payments:', paymentErr);
      }

      try {
        const pcsResponse = await api.get(`/purchased-pcs/order/${id}`);
        setPurchasedPCs(pcsResponse.data.pcs || []);
      } catch (pcErr) {
        console.error('Failed to fetch purchased PCs:', pcErr);
      }

      try {
        const invoicesResponse = await api.get(`/invoices?relatedOrderId=${id}`);
        setInvoices(invoicesResponse.data || []);
      } catch (invErr) {
        console.error('Failed to fetch invoices:', invErr);
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      // 1. Update order details (items, addresses, amounts)
      const detailsResponse = await api.put(`/orders/${id}`, {
        items,
        shippingAddress,
        billingAddress,
        shipping,
        donationAmount
      });
      
      // 2. Update order status (handles loyalty points, inventory, etc. on backend)
      // Only call status update if it actually changed, or just call it to be safe
      const statusResponse = await api.put(`/orders/${id}/status`, {
        status
      });

      setOrder(statusResponse.data.order || detailsResponse.data.order);
      setItems(statusResponse.data.order?.items || detailsResponse.data.order?.items || items);
      setSuccess('Order updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to update order:', err);
      setError(err.response?.data?.message || 'Failed to update order.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        name: 'New Item',
        sku: 'NEW-SKU',
        price: 0,
        quantity: 1,
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    if (window.confirm('Are you sure you want to mark this invoice as paid manually?')) {
      try {
        await api.patch(`/invoices/${invoiceId}/mark-paid`);
        const invoicesResponse = await api.get(`/invoices?relatedOrderId=${id}`);
        setInvoices(invoicesResponse.data || []);
        
        // Refresh order details to update payment status
        const orderResponse = await api.get(`/orders/admin/${id}`);
        setOrder(orderResponse.data.order);
        
        setSuccess('Invoice marked as paid.');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        console.error('Failed to mark invoice as paid:', err);
        setError(err.response?.data?.message || 'Failed to mark invoice as paid.');
      }
    }
  };

  if (isLoading) {
    return <div className="p-6 text-white text-center">Loading order details...</div>;
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
        <button onClick={() => navigate('/admin/orders')} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Back to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/orders')}
            className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-4">
              Order {order.orderNumber}
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`text-sm px-3 py-1 font-medium bg-[#11141d] border border-[#1f2233] rounded-lg outline-none ${
                  status === 'delivered' ? 'text-emerald-400' :
                  status === 'shipped' || status === 'out-for-delivery' ? 'text-indigo-400' :
                  status === 'building' ? 'text-blue-400' :
                  status === 'benchmarking' ? 'text-purple-400' :
                  status === 'cancelled' || status === 'returned' ? 'text-red-400' :
                  'text-amber-400'
                }`}
              >
                <option value="order-confirmed" className="text-amber-400 bg-[#0a0c13]">Order Confirmed</option>
                <option value="building" className="text-blue-400 bg-[#0a0c13]">Building</option>
                <option value="benchmarking" className="text-purple-400 bg-[#0a0c13]">Benchmarking</option>
                <option value="shipped" className="text-indigo-400 bg-[#0a0c13]">Shipped</option>
                <option value="out-for-delivery" className="text-indigo-400 bg-[#0a0c13]">Out for Delivery</option>
                <option value="delivered" className="text-emerald-400 bg-[#0a0c13]">Delivered</option>
                <option value="returned" className="text-red-400 bg-[#0a0c13]">Returned</option>
                <option value="cancelled" className="text-red-400 bg-[#0a0c13]">Cancelled</option>
              </select>
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {success && <span className="text-emerald-500">{success}</span>}
          {error && <span className="text-red-500">{error}</span>}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items & Totals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="admin-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-white">Order Items</h2>
              <button 
                onClick={handleAddItem}
                className="text-sm px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
              >
                + Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-[#1f2233] rounded-lg bg-[#0a0c13]">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 mb-1">Name</label>
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                        />
                        {item.notes && <div className="text-xs text-emerald-400 mt-1">{item.notes}</div>}
                      </div>
                      <div className="w-1/3">
                        <label className="block text-xs text-slate-500 mb-1">SKU</label>
                        <input 
                          type="text" 
                          value={item.sku} 
                          onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                          className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-1/3">
                        <label className="block text-xs text-slate-500 mb-1">Price ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={item.price} 
                          onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                          className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                        />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-xs text-slate-500 mb-1">Quantity</label>
                        <input 
                          type="number" 
                          min="1"
                          value={item.quantity} 
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value))}
                          className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                        />
                      </div>
                      <div className="w-1/3 flex items-end">
                        <div className="w-full text-right py-2 text-white font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <button 
                      onClick={() => handleRemoveItem(idx)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-6 text-slate-500">No items in this order.</div>
              )}
            </div>
          </div>

          {/* Purchased PCs section */}
          {purchasedPCs.length > 0 && (
            <div className="admin-card p-6">
              <h2 className="text-lg font-medium text-white mb-4">Purchased PCs</h2>
              <div className="space-y-4">
                {purchasedPCs.map((pc: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 p-4 border border-[#1f2233] rounded-lg bg-[#0a0c13]">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-white">{pc.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        pc.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                        pc.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' :
                        pc.status === 'cancelled' || pc.status === 'returned' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {pc.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Serial Number:</span>
                      <button 
                        onClick={() => navigate(`/admin/purchased-pcs/${pc._id}`)}
                        className="text-blue-400 hover:text-blue-300 underline font-mono"
                      >
                        {pc.serialNumber}
                      </button>
                    </div>
                    {pc.color && (
                      <div className="flex justify-between items-center text-sm mt-1">
                        <span className="text-slate-400">Color:</span>
                        <span className="text-emerald-400">{pc.color}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Order Totals</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Shipping</span>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={shipping}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    className="admin-input w-24 px-2 py-1 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount {order.appliedDiscount ? `(${order.appliedDiscount.code})` : ''}</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-400 border-t border-[#1f2233] pt-3">
                <span>Donation Amount</span>
                <div className="flex items-center">
                  <span className="mr-2">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                    className="admin-input w-24 px-2 py-1 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between text-white font-medium text-lg pt-3 border-t border-[#1f2233] mt-3">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 text-center">
              Click "Save Changes" to recalculate tax and totals.
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Addresses, Payment */}
        <div className="space-y-6">
          {/* Customer Details */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Customer Details</h2>
            {order.customer ? (
              <div className="space-y-2">
                <p className="text-white font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                <p className="text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {order.customer.email}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Loyalty Points: <span className="text-emerald-400 font-medium">{order.customer.loyaltyPoints || 0}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-slate-400 italic">Guest Customer</p>
                <p className="text-slate-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {order.guestEmail || order.shippingAddress.email}
                </p>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Payment Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Method:</span>
                <span className="text-white capitalize font-medium">{order.paymentMethod || 'None'}</span>
              </div>
              {order.trackingNumber && (
                <>
                  <div className="flex justify-between text-sm mt-2 pt-2 border-t border-[#1f2233]">
                    <span className="text-slate-400">Tracking Number:</span>
                    <span className="text-white font-mono">{order.trackingNumber}</span>
                  </div>
                  {order.carrierTrackingUrl && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Carrier Track:</span>
                      <a href={order.carrierTrackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">
                        Track with {order.carrier || 'Carrier'}
                      </a>
                    </div>
                  )}
                  {order.trackingUrl && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Customer Track:</span>
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                        View Tracking Page
                      </a>
                    </div>
                  )}
                </>
              )}
              
              {(() => {
                const totalPaidFromPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
                const totalPaidFromInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
                const totalPaid = totalPaidFromPayments + totalPaidFromInvoices;
                const outstandingBalance = Math.max(0, order.total - totalPaid);
                const isFullyPaid = outstandingBalance <= 0;
                const computedPaymentStatus = isFullyPaid ? 'paid' : order.paymentStatus;
                
                return (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Status:</span>
                    <div className="flex items-center gap-3">
                      <span className={`capitalize font-medium ${
                        computedPaymentStatus === 'paid' ? 'text-emerald-400' :
                        computedPaymentStatus === 'pending' ? 'text-amber-400' :
                        computedPaymentStatus === 'failed' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {computedPaymentStatus}
                      </span>
                    </div>
                  </div>
                );
              })()}
              
              {(() => {
                const totalPaidFromPayments = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
                const totalPaidFromInvoices = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
                const totalPaid = totalPaidFromPayments + totalPaidFromInvoices;
                const outstandingBalance = Math.max(0, order.total - totalPaid);
                const hasPendingInvoice = invoices.some(inv => inv.status === 'pending' && Math.abs(inv.amount - outstandingBalance) < 0.01);
                
                if (outstandingBalance > 0) {
                  return (
                    <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-[#1f2233]">
                      <span className="text-slate-400">Outstanding Balance:</span>
                      <div className="flex items-center gap-3">
                        <span className="text-amber-400 font-medium">{formatCurrency(outstandingBalance)}</span>
                        <button
                          onClick={async () => {
                            try {
                              setIsSaving(true);
                              
                              const itemDescriptions = order.items.map(item => `${item.name} (${item.quantity}x) - ${formatCurrency(item.price * item.quantity)}`).join('\n');
                              const description = totalPaid === 0 
                                ? `Order ${order.orderNumber} Items:\n${itemDescriptions}`
                                : `Remaining balance for order ${order.orderNumber}`;

                              const response = await api.post('/invoices', {
                                customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.billingAddress?.firstName || 'Guest'),
                                customerEmail: order.customer?.email || order.guestEmail || order.billingAddress?.email || '',
                                amount: outstandingBalance,
                                description: description,
                                relatedOrderId: order._id
                              });
                              
                              // Add newly created invoice to local state to immediately disable button
                              setInvoices([...invoices, response.data]);
                              
                              setSuccess(`Invoice ${response.data.invoiceNumber} created successfully!`);
                              setTimeout(() => setSuccess(''), 3000);
                            } catch (err: any) {
                              console.error('Failed to create invoice:', err);
                              setError(err.response?.data?.message || 'Failed to create invoice.');
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          disabled={isSaving || hasPendingInvoice}
                          title={hasPendingInvoice ? 'A pending invoice already exists for this amount' : ''}
                          className={`px-3 py-1 text-white text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                            hasPendingInvoice ? 'bg-gray-700 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600'
                          }`}
                        >
                          {hasPendingInvoice ? 'Invoice Pending' : 'Create Invoice'}
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {order.paymentId && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-slate-300 text-xs font-mono">{order.paymentId}</span>
                </div>
              )}
            </div>
            
            {payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1f2233]">
                <h3 className="text-sm font-medium text-white mb-3">Payment History</h3>
                <div className="space-y-3">
                  {payments.map(payment => (
                    <div key={payment._id} className="bg-[#11141d] p-3 rounded-lg border border-[#1f2233]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium text-sm">{formatCurrency(payment.amount)} {payment.currency.toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                          payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span className="capitalize">{payment.paymentMethod}</span>
                        <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-slate-500 font-mono break-all">
                          {payment.gatewayTransactionId}
                        </div>
                        <button
                          onClick={() => navigate(`/admin/payments/${payment._id}`)}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline ml-2 whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoices.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1f2233]">
                <h3 className="text-sm font-medium text-white mb-3">Invoices</h3>
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <div key={invoice._id} className="bg-[#11141d] p-3 rounded-lg border border-[#1f2233]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium text-sm">{invoice.invoiceNumber} - {formatCurrency(invoice.amount)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                          invoice.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkInvoicePaid(invoice._id)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            Mark as Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shipping Labels / Purchase Label */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Shipping Actions</h2>
            
            {order.status !== 'shipped' && order.status !== 'out-for-delivery' && order.status !== 'delivered' && (
              <div className="space-y-4 border border-[#1f2233] rounded-lg p-4 bg-[#0a0c13]">
                <h3 className="text-sm font-medium text-white">Purchase Shipping Label</h3>
                <div>
                  {order.selectedShippingRate ? (
                    <p className="text-sm text-slate-400 mb-3">
                      Customer selected: <span className="text-white font-medium">{order.selectedShippingRate.title}</span> ({formatCurrency(order.selectedShippingRate.amount)})
                    </p>
                  ) : order.shipping > 0 ? (
                    <p className="text-sm text-slate-400 mb-3">
                      Customer paid: <span className="text-white font-medium">{formatCurrency(order.shipping)}</span> for shipping.
                    </p>
                  ) : (
                    <p className="text-sm text-amber-400 mb-3">No shipping rates were calculated during checkout. You can still generate and purchase a label below.</p>
                  )}
                  <button 
                    onClick={async () => {
                      setShowShippingModal(true);
                      setIsLoadingRates(true);
                      setLiveShippingRates([]);
                      try {
                        const response = await api.get(`/shipping/order/${order._id}/rates`);
                        const rates = response.data.rates || [];
                        setLiveShippingRates(rates);
                        if (rates.length > 0) {
                          setSelectedRateId(rates[0].objectId);
                        }
                      } catch (err) {
                        console.error('Failed to fetch live rates:', err);
                      } finally {
                        setIsLoadingRates(false);
                      }
                    }}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm transition-colors w-full flex justify-center items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Review & Purchase Label
                  </button>
                </div>
              </div>
            )}
            
            {(order.status === 'shipped' || order.status === 'out-for-delivery' || order.status === 'delivered') && order.trackingNumber && (
              <div className="space-y-4 border border-[#1f2233] rounded-lg p-4 bg-[#0a0c13]">
                <div className="flex items-center gap-3 text-emerald-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Label has been purchased.</span>
                </div>
                {order.trackingNumber && (
                  <div className="text-sm mt-2">
                    Tracking: <span className="text-white font-mono">{order.trackingNumber}</span>
                  </div>
                )}
                {order.labelUrl && (
                  <div className="mt-3 flex flex-col gap-2">
                    <a 
                      href={order.labelUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-center block w-full px-3 py-2 bg-[#11141d] hover:bg-[#1f2233] text-white rounded border border-[#1f2233] transition-colors"
                    >
                      Download Shipping Label (PDF)
                    </a>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to void and refund this shipping label? This cannot be undone.')) {
                          try {
                            setIsSaving(true);
                            await api.post('/shipping/refund', { orderId: order._id });
                            const orderResponse = await api.get(`/orders/admin/${id}`);
                            setOrder(orderResponse.data.order);
                            setSuccess('Shipping label voided and refunded successfully.');
                            setTimeout(() => setSuccess(''), 3000);
                          } catch (err: any) {
                            console.error('Failed to void label:', err);
                            setError(err.response?.data?.message || 'Failed to void shipping label.');
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }}
                      disabled={isSaving}
                      className="text-sm text-center block w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded border border-red-500/30 transition-colors"
                    >
                      Void / Refund Label
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Shipping Address</h2>
            {shippingAddress && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.firstName} 
                      onChange={(e) => setShippingAddress({...shippingAddress, firstName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={shippingAddress.lastName} 
                      onChange={(e) => setShippingAddress({...shippingAddress, lastName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={shippingAddress.address} 
                    onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                    className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">City</label>
                    <input 
                      type="text" 
                      value={shippingAddress.city} 
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">State / Zip</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={shippingAddress.state} 
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="admin-input w-1/2 px-2 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                      />
                      <input 
                        type="text" 
                        value={shippingAddress.zip} 
                        onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                        className="admin-input w-1/2 px-2 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="admin-card p-6">
            <h2 className="text-lg font-medium text-white mb-4">Billing Address</h2>
            {billingAddress && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">First Name</label>
                    <input 
                      type="text" 
                      value={billingAddress.firstName} 
                      onChange={(e) => setBillingAddress({...billingAddress, firstName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Last Name</label>
                    <input 
                      type="text" 
                      value={billingAddress.lastName} 
                      onChange={(e) => setBillingAddress({...billingAddress, lastName: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Street Address</label>
                  <input 
                    type="text" 
                    value={billingAddress.address} 
                    onChange={(e) => setBillingAddress({...billingAddress, address: e.target.value})}
                    className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">City</label>
                    <input 
                      type="text" 
                      value={billingAddress.city} 
                      onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                      className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">State / Zip</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={billingAddress.state} 
                        onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                        className="admin-input w-1/2 px-2 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                      />
                      <input 
                        type="text" 
                        value={billingAddress.zip} 
                        onChange={(e) => setBillingAddress({...billingAddress, zip: e.target.value})}
                        className="admin-input w-1/2 px-2 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Purchase Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 max-w-xl w-full">
            <h2 className="text-2xl font-medium text-white mb-4">Purchase Shipping Label</h2>
            <p className="text-slate-400 mb-6">Select a shipping rate and options to generate a label via Shippo.</p>
            
            <div className="space-y-4 mb-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Available Rates</h3>
              {isLoadingRates ? (
                <div className="p-8 text-center text-slate-400 border border-[#1f2233] border-dashed rounded-lg">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  Generating fresh shipping rates...
                </div>
              ) : liveShippingRates.length > 0 ? (
                <div className="space-y-3">
                  {liveShippingRates.map((rate: any) => (
                    <div 
                      key={rate.objectId}
                      onClick={() => setSelectedRateId(rate.objectId)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedRateId === rate.objectId 
                          ? 'border-indigo-500 bg-indigo-500/10' 
                          : 'border-[#1f2233] bg-[#11141d] hover:bg-[#11141d]'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-white flex items-center gap-2">
                          {rate.title}
                        </span>
                        <span className="font-medium text-emerald-400">{formatCurrency(parseFloat(rate.amount))}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Estimated Delivery: {rate.estimatedDays} days
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm text-center">
                  No shipping rates could be generated. Please verify the shipping address is valid.
                </div>
              )}
            </div>

            {(order.shipping > 0 || order.selectedShippingRate) && (
              <div className="mb-6 p-4 bg-[#11141d] rounded-lg border border-[#1f2233]">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Original Checkout Selection</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white font-medium">
                    {order.selectedShippingRate?.title || 'Shipping Charge'}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(order.selectedShippingRate?.amount || order.shipping)}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Additional Options</h3>
              <label className="flex items-center gap-3 p-4 rounded-lg border border-[#1f2233] bg-[#11141d] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={addInsurance}
                  onChange={(e) => setAddInsurance(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-700"
                />
                <div>
                  <div className="font-medium text-white">Add Shipping Insurance</div>
                  <div className="text-sm text-slate-400">Protect the full value of this order ({formatCurrency(order.total)}) against loss or damage in transit.</div>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#1f2233]">
              <button 
                onClick={() => setShowShippingModal(false)}
                className="px-4 py-2 bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    setIsSaving(true);
                    const response = await api.post('/shipping/purchase', {
                      rateObjectId: selectedRateId,
                      orderId: order._id,
                      insurance: addInsurance
                    });
                    setOrder(response.data.order);
                    setShowShippingModal(false);
                    setSuccess('Label purchased successfully!');
                    setTimeout(() => setSuccess(''), 3000);
                  } catch (err: any) {
                    console.error('Failed to purchase label:', err);
                    setError(err.response?.data?.message || 'Failed to purchase label.');
                    setShowShippingModal(false);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={!selectedRateId || isSaving}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>Processing...</>
                ) : (
                  <>
                    Purchase Label
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailsPage;
