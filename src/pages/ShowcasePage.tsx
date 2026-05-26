import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import api from '../utils/api';
import Toast, { ToastType } from '../components/Toast';
import SEO from '../components/SEO';

const ShowcasePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [showcases, setShowcases] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [activeImageIndices, setActiveImageIndices] = useState<Record<string, number>>({});
  const [toastConfig, setToastConfig] = useState<{message: string; type: ToastType; isVisible: boolean}>({
    message: '', type: 'info', isVisible: false
  });
  const navigate = useNavigate();

  const showToast = (message: string, type: ToastType = 'info') => {
    setToastConfig({ message, type, isVisible: true });
  };

  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const res = await api.get(`/showcases/${code}`);
        setShowcases(res.data.showcases);
        setPartner(res.data.partner);
        
        if (code) {
          localStorage.setItem('creatorCode', code.toUpperCase());
        }
      } catch (error) {
        console.error('Failed to load showcases', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShowcases();
  }, [code]);

  const handleAddToCart = async (showcase: any) => {
    setAddingToCart(showcase._id);
    try {
      const buildPayload = {
        name: showcase.name,
        parts: showcase.parts.map((p: any) => ({
          part: p.part._id,
          quantity: p.quantity,
          partType: p.partType
        })),
        frontendSubtotal: showcase.subtotal,
        frontendLaborFee: showcase.laborFee,
        frontendTotal: showcase.total,
        status: 'saved'
      };
      
      const buildRes = await api.post(`/custom-builds`, buildPayload);
      const customBuildId = buildRes.data.customBuild._id;

      let sessionId = localStorage.getItem('cartSessionId');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('cartSessionId', sessionId);
      }

      // Fetch existing cart
      const cartRes = await api.get(`/carts/${sessionId}`);
      const existingItems = cartRes.data.cart?.items || [];
      const mappedItems = existingItems.map((i: any) => ({
        product: i.product?._id || i.product,
        pcPart: i.pcPart?._id || i.pcPart,
        accessory: i.accessory?._id || i.accessory,
        customBuild: i.customBuild?._id || i.customBuild,
        quantity: i.quantity
      }));
      
      mappedItems.push({
        customBuild: customBuildId,
        quantity: 1,
      });

      // Update cart and explicitly apply creator code
      await api.put(`/carts/${sessionId}`, { 
        items: mappedItems,
        creatorCode: code ? code.toUpperCase() : undefined
      });

      showToast(`${showcase.name} added to cart!`, 'success');
      window.dispatchEvent(new Event('cart-updated'));
      setTimeout(() => navigate('/cart'), 1500);
    } catch (error) {
      showToast('Failed to add to cart', 'error');
    } finally {
      setAddingToCart(null);
    }
  };

  const setImageIndex = (showcaseId: string, index: number) => {
    setActiveImageIndices(prev => ({ ...prev, [showcaseId]: index }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const displayName = partner?.name || (showcases.length > 0 ? showcases[0].creatorName : code);
  
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-emerald-500/30 pt-24 pb-20">
      <SEO 
        title={`${displayName}'s Official PC Showcases | LANForge`}
        description={partner?.description || `Check out the official PC builds used by ${displayName}.`}
        url={`https://lanforge.co/partner/${code}`}
      />
      
      <Toast 
        message={toastConfig.message}
        type={toastConfig.type}
        isVisible={toastConfig.isVisible}
        onClose={() => setToastConfig(prev => ({ ...prev, isVisible: false }))}
      />

      <div className="container-narrow px-6 max-w-6xl mx-auto">
        
        {/* Streamer Profile Section */}
        <motion.div 
          className="flex flex-col items-center justify-center text-center mb-16 pb-12 border-b border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {partner?.logo ? (
            <img src={partner.logo} alt={displayName} className="w-32 h-32 rounded-full object-cover shadow-2xl mb-6 border-2 border-emerald-500/20" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-900 flex items-center justify-center text-5xl font-bold text-gray-500 shadow-2xl mb-6 border-2 border-gray-800">
              {displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wider uppercase mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Official Partner
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            {displayName}'s <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">Showcase</span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed mb-6">
            {partner?.description || `Explore the exact gaming rigs used and recommended by ${displayName}. Performance crafted perfectly for their everyday stream.`}
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            {partner?.twitch && <a href={partner.twitch} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium">Twitch</a>}
            {partner?.youtube && <a href={partner.youtube} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-400 transition-colors text-sm font-medium">YouTube</a>}
            {partner?.twitter && <a href={partner.twitter} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-blue-400 transition-colors text-sm font-medium">Twitter</a>}
          </div>
        </motion.div>

        {/* Builds Section */}
        {showcases.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-300 mb-2">No builds available</h2>
            <p className="text-gray-500 text-lg">It looks like {displayName} hasn't configured any PC builds yet.</p>
          </div>
        ) : (
          <div className="space-y-32">
            {showcases.map((showcase, index) => {
              const activeIndex = activeImageIndices[showcase._id] || 0;
              const hasImages = showcase.images && showcase.images.length > 0;
              const mainImage = hasImages ? showcase.images[activeIndex] : '';

              return (
                <div key={showcase._id} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                  
                  {/* Left Column: Images */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                    className="lg:sticky lg:top-24"
                  >
                    {hasImages ? (
                      <div className="relative aspect-square md:aspect-[4/3] w-full bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl shadow-emerald-500/10 group flex items-center justify-center">
                        {/* Background blurred image for depth */}
                        <img src={mainImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110 pointer-events-none" />
                        {/* Main focused image */}
                        <img 
                          src={mainImage} 
                          alt={showcase.name} 
                          className="relative z-10 w-full h-full object-contain p-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      </div>
                    ) : (
                      <div className="relative aspect-[4/3] w-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-xl flex items-center justify-center">
                        <div className="text-8xl opacity-20"><FontAwesomeIcon icon={faDesktop} /></div>
                      </div>
                    )}
                    
                    {hasImages && showcase.images.length > 1 && (
                      <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                        {showcase.images.map((img: string, idx: number) => (
                          <button 
                            key={idx}
                            onClick={() => setImageIndex(showcase._id, idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-gray-900 ${
                              idx === activeIndex ? 'border-emerald-500' : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={`${showcase.name} view ${idx + 1}`} className="w-full h-full object-contain p-1" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Right Column: Details & Actions */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + (index * 0.1) }}
                    className="flex flex-col"
                  >
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                      {showcase.name}
                    </h2>
                    
                    {showcase.description && (
                      <p className="text-gray-400 text-lg mb-6 leading-relaxed">
                        {showcase.description}
                      </p>
                    )}

                    <div className="flex items-end gap-4 mb-8">
                      <span className="text-4xl font-bold text-emerald-400">
                        ${showcase.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-10 border-b border-gray-800 pb-10">
                      <button 
                        onClick={() => handleAddToCart(showcase)}
                        disabled={addingToCart === showcase._id}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                      >
                        {addingToCart === showcase._id ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Adding to Cart...
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add To Cart
                          </>
                        )}
                      </button>
                    </div>

                    {/* Specs List */}
                    <div>
                      <h3 className="text-xl font-bold mb-4">Inside This Build</h3>
                      <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden text-sm">
                        {showcase.parts.map((p: any, idx: number) => {
                          if (!p.part) return null;
                          const modelStr = p.part.partModel || (p.part.name ? p.part.name.replace(new RegExp(`^${p.part.brand}\\s*`, 'i'), '') : '');
                          const displayName = `${p.part.brand} ${modelStr}`.trim();

                          return (
                            <div key={idx} className="flex border-b border-gray-800 last:border-0 p-4 hover:bg-gray-800/50 transition-colors">
                              <span className="w-1/3 text-gray-400 font-medium uppercase tracking-wider text-xs flex items-center pr-4">
                                {p.partType}
                              </span>
                              <span className="w-2/3 text-white font-medium">
                                {displayName} {p.quantity > 1 && <span className="text-emerald-400 text-xs ml-2">x{p.quantity}</span>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowcasePage;
