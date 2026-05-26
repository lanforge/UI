import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  gatewayTransactionId: string;
  status: string;
  metadata?: any;
  createdAt: string;
  order?: {
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
  };
  invoice?: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    status: string;
  };
  customer?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const AdminPaymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refund state
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [refundReason, setRefundReason] = useState<string>('requested_by_customer');
  const [forceLocal, setForceLocal] = useState<boolean>(false);
  const [refundError, setRefundError] = useState('');
  const [refundSuccess, setRefundSuccess] = useState('');
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPaymentDetails();
    }
  }, [id]);

  const fetchPaymentDetails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/payments/${id}`);
      setPayment(response.data);
      // Set default refund amount to the remaining unrefunded amount
      if (response.data) {
        const totalRefunded = response.data.metadata?.refunds?.reduce((acc: number, r: any) => acc + (r.amount || 0), 0) || 0;
        const remaining = Math.max(0, response.data.amount - totalRefunded);
        setRefundAmount(remaining);
      }
    } catch (err: any) {
      console.error('Failed to fetch payment details:', err);
      setError('Failed to load payment details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!payment) return;
    
    setIsRefunding(true);
    setRefundError('');
    setRefundSuccess('');
    
    try {
      const data: any = { reason: refundReason, forceLocal };
      if (refundAmount !== '' && Number(refundAmount) < payment.amount) {
        data.amount = Number(refundAmount);
      }
      
      await api.post(`/payments/${id}/refund`, data);
      
      setRefundSuccess('Refund processed successfully!');
      setShowRefundModal(false);
      fetchPaymentDetails(); // Refresh payment data
      setTimeout(() => setRefundSuccess(''), 3000);
    } catch (err: any) {
      console.error('Refund failed:', err);
      setRefundError(err.response?.data?.message || 'Failed to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (isLoading) {
    return <div className="p-6 text-white text-center">Loading payment details...</div>;
  }

  if (error && !payment) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
          {error}
        </div>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-500 hover:text-emerald-400">
          &larr; Back
        </button>
      </div>
    );
  }

  if (!payment) return null;

  const totalRefunded = payment.metadata?.refunds?.reduce((acc: number, r: any) => acc + (r.amount || 0), 0) || 0;
  const remainingBalance = payment.amount - totalRefunded;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-[#11141d] hover:bg-[#1f2233] text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-medium text-white flex items-center gap-4">
              Payment Details
              <span className={`text-sm px-3 py-1 rounded-full ${
                payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                payment.status === 'refunded' ? 'bg-amber-500/10 text-amber-400' :
                payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                'bg-gray-500/10 text-slate-400'
              }`}>
                {payment.status.toUpperCase()}
              </span>
            </h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">
              {payment._id}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {refundSuccess && <span className="text-emerald-500">{refundSuccess}</span>}
          {payment.status !== 'refunded' && payment.status === 'completed' && remainingBalance > 0 && payment.paymentMethod === 'paypal' && (
            <button 
              onClick={() => setShowRefundModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
            >
              Issue Refund
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Info */}
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2">Transaction Information</h2>
          
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">Amount</span>
            <span className="text-xl font-medium text-white">{formatCurrency(payment.amount)} {payment.currency.toUpperCase()}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-[#1f2233]/50">
            <span className="text-slate-400">Date</span>
            <span className="text-white">{new Date(payment.createdAt).toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-[#1f2233]/50">
            <span className="text-slate-400">Payment Method</span>
            <span className="text-white capitalize">{payment.paymentMethod}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-t border-[#1f2233]/50">
            <span className="text-slate-400">Gateway Transaction ID</span>
            <span className="text-slate-300 font-mono text-sm">{payment.gatewayTransactionId}</span>
          </div>

          {totalRefunded > 0 && (
            <div className="flex justify-between items-center py-2 border-t border-[#1f2233] bg-amber-500/5 p-3 rounded-lg mt-4">
              <span className="text-amber-400 font-medium">Total Refunded</span>
              <span className="text-amber-400 font-medium">{formatCurrency(totalRefunded)} {payment.currency.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Associated Entities */}
        <div className="admin-card p-6 space-y-4">
          <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2">Associated Records</h2>
          
          {payment.order && (
            <div className="py-2">
              <span className="block text-slate-400 text-sm mb-1">Order</span>
              <button 
                onClick={() => navigate(`/admin/orders/${payment.order?._id}`)}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                Order #{payment.order.orderNumber}
              </button>
              <span className="text-slate-500 text-sm ml-3">({formatCurrency(payment.order.total)})</span>
            </div>
          )}

          {payment.invoice && (
            <div className="py-2 border-t border-[#1f2233]/50">
              <span className="block text-slate-400 text-sm mb-1">Invoice</span>
              <button 
                onClick={() => navigate(`/admin/invoices`)}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
              >
                Invoice #{payment.invoice.invoiceNumber}
              </button>
            </div>
          )}

          {payment.customer ? (
            <div className="py-2 border-t border-[#1f2233]/50">
              <span className="block text-slate-400 text-sm mb-1">Customer</span>
              <button 
                onClick={() => navigate(`/admin/customers/${payment.customer?._id}`)}
                className="text-white hover:text-emerald-400 hover:underline transition-colors font-medium block"
              >
                {payment.customer.firstName} {payment.customer.lastName}
              </button>
              <a href={`mailto:${payment.customer.email}`} className="text-slate-400 text-sm hover:text-white transition-colors">
                {payment.customer.email}
              </a>
            </div>
          ) : (
            <div className="py-2 border-t border-[#1f2233]/50">
              <span className="block text-slate-400 text-sm mb-1">Customer</span>
              <span className="text-slate-500 italic">No customer record associated</span>
            </div>
          )}
        </div>

        {/* Refund History */}
        {payment.metadata?.refunds && payment.metadata.refunds.length > 0 && (
          <div className="admin-card p-6 lg:col-span-2">
            <h2 className="text-lg font-medium text-white border-b border-[#1f2233] pb-2 mb-4">Refund History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-[#1f2233]">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Amount</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Reason</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Refund ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2233]">
                  {payment.metadata.refunds.map((refund: any, idx: number) => (
                    <tr key={idx} className="text-slate-300">
                      <td className="py-3">{new Date(refund.createdAt).toLocaleString()}</td>
                      <td className="py-3 font-medium text-amber-400">{formatCurrency(refund.amount)}</td>
                      <td className="py-3 capitalize">{refund.reason?.replace(/_/g, ' ') || 'N/A'}</td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          refund.status === 'succeeded' ? 'bg-emerald-500/10 text-emerald-400' :
                          refund.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-gray-500/10 text-slate-400'
                        }`}>
                          {refund.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs">{refund.id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0c13] border border-[#1f2233] rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-medium text-white mb-4">Issue Refund</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount to Refund (Max: {formatCurrency(remainingBalance)})</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    max={remainingBalance}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                    className="admin-input w-full pl-8 pr-4 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                    placeholder={remainingBalance.toString()}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="admin-input w-full px-3 py-2 bg-[#11141d] border border-[#1f2233] rounded-lg text-white"
                >
                  <option value="requested_by_customer">Requested by Customer</option>
                  <option value="duplicate">Duplicate Charge</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="product_returned">Product Returned</option>
                  <option value="partial_refund">Partial Refund / Adjustment</option>
                </select>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="forceLocal" 
                  checked={forceLocal}
                  onChange={(e) => setForceLocal(e.target.checked)}
                  className="w-4 h-4 bg-[#11141d] border-[#1f2233] rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="forceLocal" className="text-sm text-slate-400">
                  Force local refund (Bypass PayPal, useful for testing)
                </label>
              </div>

              {refundError && (
                <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                  {refundError}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 bg-[#11141d] hover:bg-[#1f2233] text-white rounded-lg transition-colors"
                disabled={isRefunding}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={isRefunding || !refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > remainingBalance}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                {isRefunding ? 'Processing...' : `Refund ${refundAmount ? formatCurrency(Number(refundAmount)) : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDetailsPage;
