import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router-dom';
import api from '../utils/api';
import '../App.css';

const InvoiceCheckoutForm: React.FC<{ amount: number, invoiceId: string, email?: string, name?: string }> = ({ amount, invoiceId, email, name }) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await api.post(`/payments/paypal/capture-order`, {
        paypalOrderId: data.orderID,
        invoiceId,
      });

      if (res.data.success) {
        window.location.href = '/invoice?success=true';
      } else {
        throw new Error(res.data.message || 'Payment capture failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Payment failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {isProcessing && <div className="text-emerald-500 text-sm mb-4">Processing payment... Please wait.</div>}
      
      <PayPalScriptProvider options={{ "clientId": process.env.REACT_APP_PAYPAL_CLIENT_ID || "", "currency": "USD" }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
             const payer: any = {};
             if (email) payer.email_address = email;
             if (name) {
               const parts = name.trim().split(' ');
               payer.name = {};
               if (parts[0]) payer.name.given_name = parts[0];
               if (parts.length > 1) payer.name.surname = parts.slice(1).join(' ');
             }

             return actions.order.create({
                intent: 'CAPTURE',
                payer: Object.keys(payer).length > 0 ? payer : undefined,
                purchase_units: [
                  {
                    amount: {
                      currency_code: 'USD',
                      value: amount.toFixed(2),
                    },
                    description: `Invoice ${invoiceId}`,
                  },
                ],
                application_context: {
                  shipping_preference: 'NO_SHIPPING'
                }
              });
          }}
          onApprove={handleApprove}
        />
      </PayPalScriptProvider>
      
      <div className="security-info mt-6 text-sm text-gray-400 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faLock} className="text-emerald-500" />
          <span>Payments are processed securely via PayPal</span>
        </div>
      </div>
    </div>
  );
};

const InvoicePage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const isSuccess = queryParams.get('success') === 'true';
  const invoiceId = queryParams.get('id');

  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceId) {
      const fetchInvoice = async () => {
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL}/invoices/${invoiceId}`);
          const data = await res.json();
          if (res.ok && data) {
            setInvoice(data);
            if (data.status === 'paid') {
              setErrorMsg('This invoice has already been paid.');
            }
            
            try {
              const paymentsRes = await fetch(`${process.env.REACT_APP_API_URL}/payments?invoice=${invoiceId}`);
              const paymentsData = await paymentsRes.json();
              if (paymentsRes.ok && Array.isArray(paymentsData)) {
                setPayments(paymentsData);
              }
            } catch (paymentErr) {
              console.error('Failed to load payments:', paymentErr);
            }
          } else {
            setErrorMsg(data.message || 'Invoice not found');
          }
        } catch (err) {
          setErrorMsg('Failed to load invoice details.');
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    } else {
      setErrorMsg('Invalid invoice link. Please contact support.');
      setLoading(false);
    }
  }, [invoiceId]);

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 pt-8 md:pt-12 pb-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faShieldHalved} className="text-4xl text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful</h1>
          <p className="text-gray-400 mb-8">Thank you for your payment. A receipt has been sent to your email address.</p>
          <a href="/" className="btn btn-primary">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-4 md:pt-8 pb-20 px-4">
      {errorMsg && !invoice && !loading && (
        <div className="max-w-2xl mx-auto p-4 mb-8 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-center font-medium">
          {errorMsg}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading invoice securely...</p>
        </div>
      ) : invoice ? (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Invoice Details */}
          <motion.div 
            className="lg:col-span-7 xl:col-span-8 bg-gray-900 border border-gray-800 p-5 sm:p-8 rounded-xl shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-800">
              <div>
                <img src="/logo-2.png" alt="LANForge" className="h-8 mb-4" />
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">INVOICE</h1>
                <p className="text-gray-400 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-gray-400 font-medium">LANForge</p>
                <p className="text-gray-500 text-sm mt-1">support@lanforge.co</p>
              </div>
            </div>

            <div className="space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Bill To</p>
                  <p className="text-white font-medium text-base sm:text-lg">{invoice.customerName}</p>
                  <p className="text-gray-400 text-sm sm:text-base break-all">{invoice.customerEmail}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">Date Issued</p>
                  <p className="text-white text-sm sm:text-base">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[300px]">
                  <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Description</th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-right whitespace-nowrap">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    <tr className="text-white">
                      <td className="px-4 sm:px-6 py-4 sm:py-5 whitespace-pre-wrap">{invoice.description}</td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-medium">${invoice.amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-800/80 text-white font-bold text-base sm:text-lg">
                    <tr>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">Total Due</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right text-emerald-400">${invoice.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {payments.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-800">
                  <h3 className="text-lg font-bold text-white mb-4">Payment History</h3>
                  <div className="space-y-3">
                    {payments.map(payment => (
                      <div key={payment._id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-white font-medium">${payment.amount.toFixed(2)} {payment.currency.toUpperCase()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            payment.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {payment.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                          <span className="capitalize">{payment.paymentMethod}</span>
                          <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Column: Payment Options */}
          <motion.div 
            className="lg:col-span-5 xl:col-span-4 bg-gray-900 border border-gray-800 p-5 sm:p-8 rounded-xl shadow-2xl lg:sticky lg:top-32"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-bold text-white mb-6">Payment Options</h2>
            
            {errorMsg && (
              <div className="p-4 mb-6 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm font-medium">
                {errorMsg}
              </div>
            )}

            {invoice.status === 'paid' ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faShieldHalved} className="text-2xl text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400 mb-2">Invoice Paid</h3>
                <p className="text-emerald-500/80">Thank you for your business. This invoice has been successfully settled.</p>
              </div>
            ) : (
              <div>
                <InvoiceCheckoutForm amount={invoice.amount} invoiceId={invoice._id} email={invoice.customerEmail} name={invoice.customerName} />
              </div>
            )}
          </motion.div>
        </div>
      ) : null}
    </div>
  );
};

export default InvoicePage;
