import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<Record<string, any[]>>({});
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    amount: '',
    description: '',
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (error) {
      console.error('Error fetching invoices', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPayments = async (invoiceId: string) => {
    if (payments[invoiceId]) {
      // Already fetched
      return;
    }
    try {
      const res = await api.get(`/payments?invoice=${invoiceId}`);
      setPayments(prev => ({
        ...prev,
        [invoiceId]: res.data
      }));
    } catch (error) {
      console.error('Error fetching payments for invoice', error);
    }
  };

  const toggleInvoiceExpand = (invoiceId: string) => {
    if (expandedInvoiceId === invoiceId) {
      setExpandedInvoiceId(null);
    } else {
      setExpandedInvoiceId(invoiceId);
      fetchPayments(invoiceId);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowAddModal(false);
      setFormData({ customerName: '', customerEmail: '', amount: '', description: '' });
      fetchInvoices();
    } catch (error) {
      console.error('Error creating invoice', error);
      alert('Failed to create invoice');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        fetchInvoices();
      } catch (error) {
        console.error('Error deleting invoice', error);
      }
    }
  };

  const handleMarkPaid = async (id: string) => {
    if (window.confirm('Are you sure you want to mark this invoice as paid manually?')) {
      try {
        await api.patch(`/invoices/${id}/mark-paid`);
        fetchInvoices();
      } catch (error: any) {
        console.error('Error marking invoice as paid', error);
        alert(error.response?.data?.message || 'Failed to mark invoice as paid');
      }
    }
  };

  const copyLink = (id: string) => {
    const link = `${window.location.origin}/invoice?id=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div className="text-white">Loading invoices...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-medium text-white">Invoices</h1>
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-small">
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Create Invoice
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-[#11141d] border-b border-[#1f2233]">
            <tr>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Invoice #</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Customer</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Description</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Amount</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-left">Status</th>
              <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2233]">
            {invoices.length > 0 ? invoices.map((invoice) => (
              <React.Fragment key={invoice._id}>
                <tr 
                  className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${expandedInvoiceId === invoice._id ? 'bg-[#1f2233]/30' : ''}`}
                  onClick={() => toggleInvoiceExpand(invoice._id)}
                >
                  <td className="py-4 px-6 font-medium text-white">{invoice.invoiceNumber}</td>
                  <td className="py-4 px-6">
                    <div className="text-white">{invoice.customerName}</div>
                    <div className="text-xs">{invoice.customerEmail}</div>
                  </td>
                  <td className="py-4 px-6 whitespace-pre-wrap">{invoice.description}</td>
                  <td className="py-4 px-6 text-emerald-400 font-medium">${invoice.amount.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 
                      invoice.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {invoice.status !== 'paid' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice._id); }} 
                        className="text-blue-400 hover:text-blue-300 mr-4"
                        title="Mark as Paid"
                      >
                        <FontAwesomeIcon icon={faCheck} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyLink(invoice._id); }} 
                      className="text-emerald-400 hover:text-emerald-300 mr-4"
                      title="Copy Payment Link"
                    >
                      <FontAwesomeIcon icon={copiedId === invoice._id ? faCheck : faCopy} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(invoice._id); }} className="text-red-400 hover:text-red-300">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
                {expandedInvoiceId === invoice._id && (
                  <tr className="bg-black/20 border-b border-[#1f2233]">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="bg-[#0a0c13] rounded-lg p-4 border border-[#1f2233]">
                        <h4 className="text-sm font-medium text-white mb-3">Payment History</h4>
                        {payments[invoice._id] && payments[invoice._id].length > 0 ? (
                          <div className="space-y-2">
                            {payments[invoice._id].map(payment => (
                              <div key={payment._id} className="flex justify-between items-center bg-[#0a0c13] p-3 rounded border border-[#1f2233]">
                                <div>
                                  <div className="text-emerald-400 font-medium mb-1">${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}</div>
                                  <div className="text-xs text-slate-400">
                                    <span className="capitalize">{payment.paymentMethod}</span> &bull; {new Date(payment.createdAt).toLocaleString()}
                                  </div>
                                  <div className="text-xs text-slate-500 font-mono mt-1">
                                    {payment.gatewayTransactionId}
                                  </div>
                                </div>
                                <div>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                    'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {payment.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500">No payments recorded for this invoice.</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No invoices found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="admin-card p-6 max-w-md w-full">
            <h2 className="text-lg font-medium text-white mb-4">Create Manual Invoice</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Customer Name</label>
                <input
                  type="text"
                  required
                  className="admin-input"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Customer Email</label>
                <input
                  type="email"
                  required
                  className="admin-input"
                  value={formData.customerEmail}
                  onChange={e => setFormData({...formData, customerEmail: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Description / Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Order #1234 Overage"
                  className="admin-input"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  className="admin-input"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 text-sm rounded-md text-slate-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-white text-black hover:bg-gray-200 rounded-md font-medium transition-colors">Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInvoicesPage;
