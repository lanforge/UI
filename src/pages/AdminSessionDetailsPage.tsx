import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faShoppingCart, faUser, faTag, faClock } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';

const AdminSessionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/analytics/session/${id}`);
        setSession(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load session details');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400">{error || 'Session not found'}</p>
        <button onClick={() => navigate('/admin/analytics')} className="mt-4 text-emerald-400 hover:text-emerald-300">
          Return to Analytics
        </button>
      </div>
    );
  }

  const formatDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#1f2233] pb-4">
        <button 
          onClick={() => navigate('/admin/analytics')}
          className="w-10 h-10 rounded-full bg-[#0a0c13] hover:bg-[#11141d] flex items-center justify-center text-slate-400 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <div>
          <h1 className="text-xl font-medium text-white">Session Details</h1>
          <p className="text-sm text-slate-500">ID: {session.sessionId}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Context / User / Cart */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Card */}
          <div className="bg-[#111111] p-6 rounded-xl border border-[#1f2233]">
            <h3 className="text-lg font-medium text-white mb-4">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <FontAwesomeIcon icon={faClock} className="text-slate-400 mt-1 w-4" />
                <div>
                  <div className="text-slate-400">Duration</div>
                  <div className="text-white">{formatDuration(session.startTime, session.endTime)}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <div className="w-4 flex justify-center text-slate-400 mt-1">#</div>
                <div>
                  <div className="text-slate-400">Total Events</div>
                  <div className="text-white">{session.events.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* User Card */}
          {session.user && (
            <div className="bg-[#111111] p-6 rounded-xl border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FontAwesomeIcon icon={faUser} className="text-5xl text-emerald-500" />
              </div>
              <h3 className="text-lg font-medium text-emerald-400 mb-4 relative z-10">Known User</h3>
              <div className="relative z-10 space-y-2">
                <p className="text-white font-medium">{session.user.firstName} {session.user.lastName}</p>
                <p className="text-slate-400 text-sm">{session.user.email}</p>
              </div>
            </div>
          )}

          {/* Discount Code */}
          {session.discountCodes && session.discountCodes.length > 0 && (
            <div className="bg-[#111111] p-6 rounded-xl border border-yellow-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FontAwesomeIcon icon={faTag} className="text-5xl text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-yellow-400 mb-4 relative z-10">Active Discounts</h3>
              <div className="relative z-10 flex flex-wrap gap-2">
                {session.discountCodes.map((code: string, idx: number) => (
                  <span key={idx} className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium border border-yellow-500/30">
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Cart Card */}
          {session.cart && (
            <div className="bg-[#111111] p-6 rounded-xl border border-blue-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FontAwesomeIcon icon={faShoppingCart} className="text-5xl text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-blue-400 mb-4 relative z-10">Shopping Cart</h3>
              
              <div className="relative z-10">
                {session.cart.items && session.cart.items.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {session.cart.items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-black/40 p-3 rounded border border-[#1f2233] text-sm">
                        <div className="flex justify-between font-medium">
                          <span className="text-slate-200 line-clamp-1">
                            {item.product?.name || item.pcPart?.name || item.accessory?.name || item.customBuild?.name || 'Unknown Item'}
                          </span>
                          <span className="text-blue-400 ml-2">x{item.quantity}</span>
                        </div>
                        {item.notes && <div className="text-xs text-slate-500 mt-1">{item.notes}</div>}
                      </div>
                    ))}
                    
                    <div className="pt-3 mt-3 border-t border-[#1f2233] flex justify-between font-medium">
                      <span className="text-white">Cart Total</span>
                      <span className="text-blue-400">
                        ${(session.cart.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Cart is currently empty.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Path / Event Timeline */}
        <div className="lg:col-span-2 bg-[#111111] p-6 rounded-xl border border-[#1f2233]">
          <h3 className="text-lg font-medium text-white mb-6">User Journey Map</h3>
          
          <div className="relative pl-6 space-y-6">
            {/* Timeline line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#11141d]"></div>
            
            {session.events.map((event: any, index: number) => {
              const isAddToCart = event.eventType === 'add_to_cart';
              
              return (
                <div key={index} className="relative">
                  {/* Timeline dot */}
                  <div className={`absolute -left-[27px] mt-1.5 w-3 h-3 rounded-full border-2 border-[#111111] ${
                    isAddToCart ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}></div>
                  
                  <div className={`p-4 rounded-lg border transition-colors ${
                    isAddToCart 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : 'bg-black/30 border-[#1f2233] hover:border-[#1f2233]'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded uppercase tracking-wider ${
                          isAddToCart ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {event.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-slate-300 font-medium break-all">{event.pageUrl}</span>
                      </div>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {event.productId && (
                      <div className="text-sm text-emerald-400 mt-2 bg-emerald-500/10 px-3 py-2 rounded inline-block">
                        Added Product ID: <span className="font-mono">{event.productId}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSessionDetailsPage;
