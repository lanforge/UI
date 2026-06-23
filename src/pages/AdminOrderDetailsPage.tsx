import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const STATUS_OPTIONS: { value: string; label: string; tone: string }[] = [
  { value: 'order-confirmed', label: 'Order Confirmed', tone: 'amber' },
  { value: 'building', label: 'Building', tone: 'blue' },
  { value: 'benchmarking', label: 'Benchmarking', tone: 'purple' },
  { value: 'shipped', label: 'Shipped', tone: 'indigo' },
  { value: 'out-for-delivery', label: 'Out for Delivery', tone: 'indigo' },
  { value: 'delivered', label: 'Delivered', tone: 'emerald' },
  { value: 'returned', label: 'Returned', tone: 'red' },
  { value: 'cancelled', label: 'Cancelled', tone: 'red' },
];

const toneClass = (tone: string) => {
  switch (tone) {
    case 'emerald': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    case 'indigo':  return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    case 'blue':    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    case 'purple':  return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'red':     return 'text-red-400 bg-red-500/10 border-red-500/30';
    default:        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  }
};

const statusToneFor = (status: string) =>
  STATUS_OPTIONS.find((o) => o.value === status)?.tone ?? 'amber';

const blankAddress: Address = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', state: '', zip: '', country: 'US',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

// ---------- Reusable building blocks ----------

const Section: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ title, right, children }) => (
  <section className="admin-card p-5">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {right}
    </div>
    {children}
  </section>
);

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className }) => (
  <label className={`block ${className || ''}`}>
    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</span>
    {children}
  </label>
);

const AddressForm: React.FC<{
  value: Address;
  onChange: (next: Address) => void;
}> = ({ value, onChange }) => {
  const update = (patch: Partial<Address>) => onChange({ ...value, ...patch });
  const input = 'w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-colors';

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="First name"><input className={input} value={value.firstName} onChange={(e) => update({ firstName: e.target.value })} /></Field>
      <Field label="Last name"><input className={input} value={value.lastName} onChange={(e) => update({ lastName: e.target.value })} /></Field>
      <Field label="Email" className="col-span-2"><input className={input} type="email" value={value.email} onChange={(e) => update({ email: e.target.value })} /></Field>
      <Field label="Phone" className="col-span-2"><input className={input} value={value.phone} onChange={(e) => update({ phone: e.target.value })} /></Field>
      <Field label="Street address" className="col-span-2"><input className={input} value={value.address} onChange={(e) => update({ address: e.target.value })} /></Field>
      <Field label="City"><input className={input} value={value.city} onChange={(e) => update({ city: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="State"><input className={input} value={value.state} onChange={(e) => update({ state: e.target.value })} /></Field>
        <Field label="Zip"><input className={input} value={value.zip} onChange={(e) => update({ zip: e.target.value })} /></Field>
      </div>
      <Field label="Country" className="col-span-2"><input className={input} value={value.country} onChange={(e) => update({ country: e.target.value })} /></Field>
    </div>
  );
};

// ---------- Main page ----------

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

  // Draft (editing) state
  const [items, setItems] = useState<OrderItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<Address>(blankAddress);
  const [billingAddress, setBillingAddress] = useState<Address>(blankAddress);
  const [shipping, setShipping] = useState(0);
  const [donationAmount, setDonationAmount] = useState(0);
  const [status, setStatus] = useState('pending');

  // Snapshot of saved server state, used to detect dirty fields
  const [snapshot, setSnapshot] = useState<{
    items: OrderItem[]; shippingAddress: Address; billingAddress: Address;
    shipping: number; donationAmount: number; status: string;
  } | null>(null);

  // Shipping label modal
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedRateId, setSelectedRateId] = useState('');
  const [addInsurance, setAddInsurance] = useState(false);
  const [liveShippingRates, setLiveShippingRates] = useState<any[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // ---------- Fetching ----------

  const fetchOrderDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/orders/admin/${id}`);
      const data: Order = response.data.order;
      setOrder(data);

      const ship: Address = data.isAdminCreated && data.customer?.addresses?.length
        ? (() => {
            const a = data.customer!.addresses!.find((x: any) => x.type === 'shipping') || data.customer!.addresses![0];
            return {
              firstName: a.firstName || data.customer!.firstName,
              lastName: a.lastName || data.customer!.lastName,
              email: data.customer!.email,
              phone: data.customer!.phone || data.shippingAddress?.phone || '',
              address: a.street, city: a.city, state: a.state, zip: a.zip,
              country: a.country || 'US',
            };
          })()
        : { ...blankAddress, ...data.shippingAddress };

      const bill: Address = data.isAdminCreated && data.customer?.addresses?.length
        ? (() => {
            const a = data.customer!.addresses!.find((x: any) => x.type === 'billing') || data.customer!.addresses![0];
            return {
              firstName: a.firstName || data.customer!.firstName,
              lastName: a.lastName || data.customer!.lastName,
              email: data.customer!.email,
              phone: data.customer!.phone || data.billingAddress?.phone || '',
              address: a.street, city: a.city, state: a.state, zip: a.zip,
              country: a.country || 'US',
            };
          })()
        : { ...blankAddress, ...data.billingAddress };

      const draftItems = data.items || [];
      setItems(draftItems);
      setShippingAddress(ship);
      setBillingAddress(bill);
      setShipping(data.shipping || 0);
      setDonationAmount(data.donationAmount || 0);
      setStatus(data.status || 'pending');
      setSnapshot({
        items: JSON.parse(JSON.stringify(draftItems)),
        shippingAddress: ship,
        billingAddress: bill,
        shipping: data.shipping || 0,
        donationAmount: data.donationAmount || 0,
        status: data.status || 'pending',
      });

      // Side data — fetched in parallel, failures here shouldn't tank the page
      const [paymentsRes, pcsRes, invoicesRes] = await Promise.allSettled([
        api.get(`/payments?order=${id}`),
        api.get(`/purchased-pcs/order/${id}`),
        api.get(`/invoices?relatedOrderId=${id}`),
      ]);
      if (paymentsRes.status === 'fulfilled') setPayments(paymentsRes.value.data || []);
      if (pcsRes.status === 'fulfilled') setPurchasedPCs(pcsRes.value.data.pcs || []);
      if (invoicesRes.status === 'fulfilled') setInvoices(invoicesRes.value.data || []);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchOrderDetails();
  }, [id, fetchOrderDetails]);

  // ---------- Derived values ----------

  const liveSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0),
    [items]
  );

  const liveTotal = useMemo(() => {
    if (!order) return 0;
    return liveSubtotal + (shipping || 0) + (order.tax || 0) - (order.discount || 0) + (donationAmount || 0);
  }, [liveSubtotal, shipping, donationAmount, order]);

  const paymentRollup = useMemo(() => {
    const paid =
      payments.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount, 0) +
      invoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + inv.amount, 0);
    const outstanding = order ? Math.max(0, order.total - paid) : 0;
    const isFullyPaid = outstanding <= 0;
    const hasPendingInvoice = invoices.some(
      (inv) => inv.status === 'pending' && Math.abs(inv.amount - outstanding) < 0.01
    );
    const computedStatus = isFullyPaid ? 'paid' : (order?.paymentStatus || 'pending');
    return { paid, outstanding, isFullyPaid, hasPendingInvoice, computedStatus };
  }, [payments, invoices, order]);

  const isDirty = useMemo(() => {
    if (!snapshot) return false;
    return (
      JSON.stringify(snapshot.items) !== JSON.stringify(items) ||
      JSON.stringify(snapshot.shippingAddress) !== JSON.stringify(shippingAddress) ||
      JSON.stringify(snapshot.billingAddress) !== JSON.stringify(billingAddress) ||
      snapshot.shipping !== shipping ||
      snapshot.donationAmount !== donationAmount ||
      snapshot.status !== status
    );
  }, [snapshot, items, shippingAddress, billingAddress, shipping, donationAmount, status]);

  // ---------- Mutations ----------

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleSave = async () => {
    if (!snapshot) return;
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      const detailsChanged =
        JSON.stringify(snapshot.items) !== JSON.stringify(items) ||
        JSON.stringify(snapshot.shippingAddress) !== JSON.stringify(shippingAddress) ||
        JSON.stringify(snapshot.billingAddress) !== JSON.stringify(billingAddress) ||
        snapshot.shipping !== shipping ||
        snapshot.donationAmount !== donationAmount;
      const statusChanged = snapshot.status !== status;

      let latest: Order | null = null;
      if (detailsChanged) {
        const r = await api.put(`/orders/${id}`, {
          items, shippingAddress, billingAddress, shipping, donationAmount,
        });
        latest = r.data.order || null;
      }
      if (statusChanged) {
        const r = await api.put(`/orders/${id}/status`, { status });
        latest = r.data.order || latest;
      }

      if (latest) {
        setOrder(latest);
        setItems(latest.items || []);
        setShipping(latest.shipping || 0);
        setDonationAmount(latest.donationAmount || 0);
        setStatus(latest.status || 'pending');
        setSnapshot({
          items: JSON.parse(JSON.stringify(latest.items || [])),
          shippingAddress, billingAddress,
          shipping: latest.shipping || 0,
          donationAmount: latest.donationAmount || 0,
          status: latest.status || 'pending',
        });
      }
      showToast(detailsChanged || statusChanged ? 'Order saved.' : 'No changes to save.');
    } catch (err: any) {
      console.error('Failed to update order:', err);
      showToast(err.response?.data?.message || 'Failed to update order.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!snapshot) return;
    setItems(JSON.parse(JSON.stringify(snapshot.items)));
    setShippingAddress(snapshot.shippingAddress);
    setBillingAddress(snapshot.billingAddress);
    setShipping(snapshot.shipping);
    setDonationAmount(snapshot.donationAmount);
    setStatus(snapshot.status);
  };

  const handleAddItem = () => {
    setItems([...items, { name: 'New Item', sku: 'NEW-SKU', price: 0, quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleMarkInvoicePaid = async (invoiceId: string) => {
    if (!window.confirm('Mark this invoice as paid manually?')) return;
    try {
      await api.patch(`/invoices/${invoiceId}/mark-paid`);
      const [invRes, orderRes] = await Promise.all([
        api.get(`/invoices?relatedOrderId=${id}`),
        api.get(`/orders/admin/${id}`),
      ]);
      setInvoices(invRes.data || []);
      setOrder(orderRes.data.order);
      showToast('Invoice marked as paid.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to mark invoice as paid.', true);
    }
  };

  const handleCreateInvoice = async () => {
    if (!order) return;
    try {
      setIsSaving(true);
      const itemDescriptions = order.items.map((i) => `${i.name} (${i.quantity}x) - ${formatCurrency(i.price * i.quantity)}`).join('\n');
      const description = paymentRollup.paid === 0
        ? `Order ${order.orderNumber} Items:\n${itemDescriptions}`
        : `Remaining balance for order ${order.orderNumber}`;
      const response = await api.post('/invoices', {
        customerName: order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : (order.billingAddress?.firstName || 'Guest'),
        customerEmail: order.customer?.email || order.guestEmail || order.billingAddress?.email || '',
        amount: paymentRollup.outstanding,
        description,
        relatedOrderId: order._id,
      });
      setInvoices([...invoices, response.data]);
      showToast(`Invoice ${response.data.invoiceNumber} created.`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create invoice.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoidLabel = async () => {
    if (!order) return;
    if (!window.confirm('Void and refund this shipping label? This cannot be undone.')) return;
    try {
      setIsSaving(true);
      await api.post('/shipping/refund', { orderId: order._id });
      const r = await api.get(`/orders/admin/${id}`);
      setOrder(r.data.order);
      showToast('Shipping label voided and refunded.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to void shipping label.', true);
    } finally {
      setIsSaving(false);
    }
  };

  const openShippingModal = async () => {
    if (!order) return;
    setShowShippingModal(true);
    setIsLoadingRates(true);
    setLiveShippingRates([]);
    try {
      const response = await api.get(`/shipping/order/${order._id}/rates`);
      const rates = response.data.rates || [];
      setLiveShippingRates(rates);
      if (rates.length > 0) setSelectedRateId(rates[0].objectId);
    } catch (err) {
      console.error('Failed to fetch live rates:', err);
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handlePurchaseLabel = async () => {
    if (!order) return;
    try {
      setIsSaving(true);
      const response = await api.post('/shipping/purchase', {
        rateObjectId: selectedRateId,
        orderId: order._id,
        insurance: addInsurance,
      });
      setOrder(response.data.order);
      setShowShippingModal(false);
      showToast('Label purchased successfully.');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to purchase label.', true);
      setShowShippingModal(false);
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Render ----------

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-[#11141d] rounded w-64" />
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-6">
            <div className="h-48 bg-[#11141d] rounded-xl" />
            <div className="h-64 bg-[#11141d] rounded-xl" />
          </div>
          <div className="h-96 bg-[#11141d] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">{error}</div>
        <button onClick={() => navigate('/admin/orders')} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Back to Orders
        </button>
      </div>
    );
  }

  if (!order) return null;

  const tone = statusToneFor(status);
  const customerName = order.customer
    ? `${order.customer.firstName} ${order.customer.lastName}`
    : (shippingAddress.firstName ? `${shippingAddress.firstName} ${shippingAddress.lastName}` : 'Guest customer');
  const customerEmail = order.customer?.email || order.guestEmail || shippingAddress.email || '';

  return (
    <div className="pb-24">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/orders')}
          className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Back to orders"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-white truncate">Order {order.orderNumber}</h1>
          <p className="text-slate-500 text-xs mt-0.5">Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider ${toneClass(tone)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${tone === 'emerald' ? 'bg-emerald-400' : tone === 'red' ? 'bg-red-400' : 'bg-current'}`} />
          {STATUS_OPTIONS.find((o) => o.value === status)?.label || status}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* MAIN COLUMN */}
        <div className="space-y-6 min-w-0">
          {/* Items */}
          <Section
            title={`Items (${items.length})`}
            right={
              <button
                onClick={handleAddItem}
                className="text-xs font-medium px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md transition-colors"
              >
                + Add item
              </button>
            }
          >
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No items in this order.</div>
            ) : (
              <div className="space-y-2">
                {/* Header row */}
                <div className="hidden md:grid grid-cols-[1fr_90px_110px_110px_36px] gap-3 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <div>Product / SKU</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Total</div>
                  <div />
                </div>
                {items.map((item, idx) => {
                  const total = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 md:grid-cols-[1fr_90px_110px_110px_36px] gap-3 px-3 py-2.5 bg-[#11141d] border border-[#1f2233] rounded-lg items-center"
                    >
                      <div className="min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          className="w-full bg-transparent text-white text-sm font-medium focus:outline-none focus:bg-[#0a0c13] focus:border-emerald-500/40 border border-transparent rounded px-1.5 py-0.5 transition-colors"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={item.sku}
                            onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                            placeholder="SKU"
                            className="bg-transparent text-slate-500 text-xs font-mono focus:outline-none focus:bg-[#0a0c13] focus:border-emerald-500/40 border border-transparent rounded px-1.5 py-0.5 transition-colors max-w-[200px]"
                          />
                          {item.notes && (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              {item.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0a0c13] border border-[#1f2233] rounded text-white text-sm text-right focus:outline-none focus:border-emerald-500/40"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0a0c13] border border-[#1f2233] rounded text-white text-sm text-right focus:outline-none focus:border-emerald-500/40"
                      />
                      <div className="text-right text-white text-sm font-medium tabular-nums">{formatCurrency(total)}</div>
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="justify-self-end p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Inline totals footer */}
            <div className="mt-4 pt-4 border-t border-[#1f2233] space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(liveSubtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Shipping</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={shipping}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-[#11141d] border border-[#1f2233] rounded text-white text-sm text-right tabular-nums focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax</span>
                <span className="tabular-nums">{formatCurrency(order.tax)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount{order.appliedDiscount ? ` (${order.appliedDiscount.code})` : ''}</span>
                  <span className="tabular-nums">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-400">
                <span>Donation</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-[#11141d] border border-[#1f2233] rounded text-white text-sm text-right tabular-nums focus:outline-none focus:border-emerald-500/40"
                  />
                </div>
              </div>
              <div className="flex justify-between text-white font-semibold text-base pt-2 mt-2 border-t border-[#1f2233]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(liveTotal)}</span>
              </div>
              {(liveSubtotal !== order.subtotal || liveTotal !== order.total) && (
                <p className="text-[11px] text-amber-400/80 text-right mt-1">
                  Estimated — tax & total are recalculated by the server on save.
                </p>
              )}
            </div>
          </Section>

          {/* Purchased PCs */}
          {purchasedPCs.length > 0 && (
            <Section title="Purchased PCs">
              <div className="space-y-2">
                {purchasedPCs.map((pc: any) => (
                  <div key={pc._id} className="flex items-center justify-between gap-3 px-4 py-3 bg-[#11141d] border border-[#1f2233] rounded-lg">
                    <div className="min-w-0">
                      <div className="text-white text-sm font-medium truncate">{pc.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="text-slate-500">SN</span>
                        <button
                          onClick={() => navigate(`/admin/purchased-pcs/${pc._id}`)}
                          className="text-blue-400 hover:text-blue-300 underline font-mono"
                        >
                          {pc.serialNumber}
                        </button>
                        {pc.color && <span className="text-emerald-400">· {pc.color}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${toneClass(
                      pc.status === 'delivered' ? 'emerald' : pc.status === 'shipped' ? 'indigo' : (pc.status === 'cancelled' || pc.status === 'returned') ? 'red' : 'amber'
                    )}`}>
                      {pc.status}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Addresses */}
          <Section title="Addresses">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Ship to</h3>
                <AddressForm value={shippingAddress} onChange={setShippingAddress} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bill to</h3>
                  <button
                    onClick={() => setBillingAddress(shippingAddress)}
                    className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 hover:text-emerald-300"
                  >
                    Same as shipping
                  </button>
                </div>
                <AddressForm value={billingAddress} onChange={setBillingAddress} />
              </div>
            </div>
          </Section>

          {/* Shipping label */}
          <Section title="Shipping label">
            {order.trackingNumber ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Label purchased.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-[#11141d] border border-[#1f2233] rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Tracking</div>
                    <div className="text-white font-mono break-all">{order.trackingNumber}</div>
                  </div>
                  <div className="bg-[#11141d] border border-[#1f2233] rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Carrier</div>
                    <div className="text-white">{order.carrier || '—'}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {order.carrierTrackingUrl && (
                    <a href={order.carrierTrackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-[#11141d] hover:bg-[#1f2233] border border-[#1f2233] text-white rounded-md transition-colors">
                      Track on {order.carrier || 'carrier'} ↗
                    </a>
                  )}
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-md transition-colors">
                      Customer tracking page ↗
                    </a>
                  )}
                  {order.labelUrl && (
                    <a href={order.labelUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-md transition-colors">
                      Download label (PDF) ↗
                    </a>
                  )}
                  <button
                    onClick={handleVoidLabel}
                    disabled={isSaving}
                    className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md transition-colors disabled:opacity-50"
                  >
                    Void / Refund label
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {order.selectedShippingRate ? (
                  <p className="text-sm text-slate-400">
                    Customer selected{' '}
                    <span className="text-white font-medium">{order.selectedShippingRate.title}</span>{' '}
                    ({formatCurrency(order.selectedShippingRate.amount)}).
                  </p>
                ) : order.shipping > 0 ? (
                  <p className="text-sm text-slate-400">
                    Customer paid <span className="text-white font-medium">{formatCurrency(order.shipping)}</span> for shipping.
                  </p>
                ) : (
                  <p className="text-sm text-amber-400">No shipping rates were calculated during checkout — you can still generate one below.</p>
                )}
                <button
                  onClick={openShippingModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Review &amp; purchase label
                </button>
              </div>
            )}
          </Section>

          {/* Payments */}
          <Section
            title="Payments"
            right={
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${toneClass(
                paymentRollup.computedStatus === 'paid' ? 'emerald'
                  : paymentRollup.computedStatus === 'failed' ? 'red'
                  : 'amber'
              )}`}>
                {paymentRollup.computedStatus}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-sm">
              <div className="bg-[#11141d] border border-[#1f2233] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Method</div>
                <div className="text-white capitalize">{order.paymentMethod || 'None'}</div>
              </div>
              <div className="bg-[#11141d] border border-[#1f2233] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Paid</div>
                <div className="text-emerald-400 tabular-nums">{formatCurrency(paymentRollup.paid)}</div>
              </div>
              <div className="bg-[#11141d] border border-[#1f2233] rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Outstanding</div>
                <div className={`tabular-nums ${paymentRollup.outstanding > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {formatCurrency(paymentRollup.outstanding)}
                </div>
              </div>
            </div>

            {paymentRollup.outstanding > 0 && (
              <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-amber-300">
                  {paymentRollup.hasPendingInvoice
                    ? 'A pending invoice already exists for this balance.'
                    : 'Create an invoice to collect the remaining balance.'}
                </p>
                <button
                  onClick={handleCreateInvoice}
                  disabled={isSaving || paymentRollup.hasPendingInvoice}
                  className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border transition-colors ${
                    paymentRollup.hasPendingInvoice
                      ? 'bg-[#11141d] border-[#1f2233] text-slate-500 cursor-not-allowed'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {paymentRollup.hasPendingInvoice ? 'Invoice pending' : 'Create invoice'}
                </button>
              </div>
            )}

            {(payments.length > 0 || invoices.length > 0) ? (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p._id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#11141d] border border-[#1f2233] rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm text-white tabular-nums">{formatCurrency(p.amount)} <span className="text-slate-500 text-xs uppercase ml-1">{p.currency}</span></div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        <span className="capitalize">{p.paymentMethod}</span>
                        {' · '}{new Date(p.createdAt).toLocaleDateString()}
                        {' · '}<span className="font-mono">{p.gatewayTransactionId}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${toneClass(
                        p.status === 'completed' ? 'emerald' : p.status === 'failed' ? 'red' : 'amber'
                      )}`}>{p.status}</span>
                      <button
                        onClick={() => navigate(`/admin/payments/${p._id}`)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#11141d] border border-[#1f2233] rounded-lg">
                    <div className="min-w-0">
                      <div className="text-sm text-white">
                        <span className="font-mono">{inv.invoiceNumber}</span>
                        <span className="text-slate-500 ml-2 tabular-nums">{formatCurrency(inv.amount)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{new Date(inv.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${toneClass(
                        inv.status === 'paid' ? 'emerald' : inv.status === 'pending' ? 'amber' : 'red'
                      )}`}>{inv.status}</span>
                      {inv.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkInvoicePaid(inv._id)}
                          className="text-xs text-emerald-400 hover:text-emerald-300"
                        >
                          Mark paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">No payments or invoices yet.</div>
            )}
          </Section>
        </div>

        {/* RIGHT RAIL — sticky summary */}
        <aside className="xl:sticky xl:top-6 space-y-4">
          {/* Customer */}
          <div className="admin-card p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Customer</div>
            <div className="text-white font-medium">{customerName}</div>
            {customerEmail && (
              <div className="text-sm text-slate-400 mt-1 truncate">{customerEmail}</div>
            )}
            {order.customer?.phone && (
              <div className="text-sm text-slate-400 mt-0.5">{order.customer.phone}</div>
            )}
            {order.customer && (
              <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
                <span>Loyalty pts</span>
                <span className="text-emerald-400 font-medium">{order.customer.loyaltyPoints || 0}</span>
              </div>
            )}
            {!order.customer && (
              <div className="text-[10px] uppercase tracking-wider text-amber-400 mt-2">Guest checkout</div>
            )}
          </div>

          {/* Status + key facts */}
          <div className="admin-card p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full text-sm font-semibold px-3 py-2 bg-[#11141d] border rounded-lg outline-none ${toneClass(tone)} cursor-pointer`}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0a0c13] text-white">{o.label}</option>
              ))}
            </select>

            <div className="mt-4 pt-4 border-t border-[#1f2233] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="text-white font-semibold tabular-nums">{formatCurrency(liveTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paid</span>
                <span className="text-emerald-400 tabular-nums">{formatCurrency(paymentRollup.paid)}</span>
              </div>
              {paymentRollup.outstanding > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding</span>
                  <span className="text-amber-400 font-semibold tabular-nums">{formatCurrency(paymentRollup.outstanding)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className={`capitalize ${
                  paymentRollup.computedStatus === 'paid' ? 'text-emerald-400'
                    : paymentRollup.computedStatus === 'failed' ? 'text-red-400'
                    : 'text-amber-400'
                }`}>{paymentRollup.computedStatus}</span>
              </div>
            </div>
          </div>

          {/* Ship-to summary */}
          <div className="admin-card p-5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Ship to</div>
            {(shippingAddress.firstName || shippingAddress.address) ? (
              <div className="text-sm text-slate-300 leading-relaxed">
                <div className="text-white">{shippingAddress.firstName} {shippingAddress.lastName}</div>
                <div>{shippingAddress.address}</div>
                <div>{[shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', ')}</div>
                <div>{shippingAddress.country}</div>
                {shippingAddress.phone && <div className="text-slate-500 mt-1">{shippingAddress.phone}</div>}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No shipping address.</div>
            )}
          </div>

          {/* Save bar */}
          <div className="admin-card p-4 sticky bottom-4">
            {success && <div className="mb-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded">{success}</div>}
            {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded">{error}</div>}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                disabled={!isDirty || isSaving}
                className="flex-1 px-3 py-2 text-sm bg-[#11141d] hover:bg-[#1f2233] text-slate-300 rounded-lg border border-[#1f2233] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 rounded-lg shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all"
              >
                {isSaving ? 'Saving…' : isDirty ? 'Save changes' : 'Saved'}
              </button>
            </div>
            {isDirty && !isSaving && (
              <p className="text-[11px] text-slate-500 text-center mt-2">Unsaved changes</p>
            )}
          </div>
        </aside>
      </div>

      {/* Shipping modal */}
      {showShippingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Purchase shipping label</h2>
                <p className="text-slate-400 text-sm mt-1">Pick a rate and we'll generate the label via Shippo.</p>
              </div>
              <button
                onClick={() => setShowShippingModal(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-[#11141d] rounded-md transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Available rates</h3>
            {isLoadingRates ? (
              <div className="p-8 text-center text-slate-400 border border-[#1f2233] border-dashed rounded-lg">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Fetching fresh rates…
              </div>
            ) : liveShippingRates.length > 0 ? (
              <div className="space-y-2 mb-6">
                {liveShippingRates.map((rate: any) => (
                  <button
                    key={rate.objectId}
                    type="button"
                    onClick={() => setSelectedRateId(rate.objectId)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRateId === rate.objectId
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-[#1f2233] bg-[#11141d] hover:border-[#2a2f42]'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-white font-medium text-sm">{rate.title}</div>
                      <div className="text-emerald-400 font-medium tabular-nums">{formatCurrency(parseFloat(rate.amount))}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">Estimated delivery: {rate.estimatedDays} days</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm mb-6">
                No shipping rates could be generated. Check the shipping address.
              </div>
            )}

            {(order.shipping > 0 || order.selectedShippingRate) && (
              <div className="mb-6 p-3 bg-[#11141d] border border-[#1f2233] rounded-lg text-sm">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Customer's checkout selection</div>
                <div className="flex justify-between items-center">
                  <span className="text-white">{order.selectedShippingRate?.title || 'Shipping charge'}</span>
                  <span className="text-emerald-400 tabular-nums">{formatCurrency(order.selectedShippingRate?.amount || order.shipping)}</span>
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 p-3 rounded-lg border border-[#1f2233] bg-[#11141d] cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={addInsurance}
                onChange={(e) => setAddInsurance(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-700"
              />
              <div>
                <div className="font-medium text-white text-sm">Add shipping insurance</div>
                <div className="text-xs text-slate-400">Protect the full value of this order ({formatCurrency(order.total)}) against loss or damage in transit.</div>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#1f2233]">
              <button
                onClick={() => setShowShippingModal(false)}
                disabled={isSaving}
                className="px-4 py-2 text-sm bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg border border-[#1f2233] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchaseLabel}
                disabled={!selectedRateId || isSaving}
                className="px-5 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Processing…' : 'Purchase label'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailsPage;
