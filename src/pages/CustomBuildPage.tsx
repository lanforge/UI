import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Toast, { ToastType } from '../components/Toast';
import SEO from '../components/SEO';
import { trackEvent } from '../utils/analytics';
import { getShortPerformanceSummary } from '../utils/lanforgePerformanceEngine';
import WhyLanforge from '../components/WhyLanforge';

const CustomBuildPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [build, setBuild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toast, setToast] = useState<{message: string, type: ToastType, isVisible: boolean, duration?: number}>({ message: '', type: 'info', isVisible: false });
  const [selectedResolution, setSelectedResolution] = useState<"1080p" | "1440p" | "4k">("1080p");

  const showToast = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    setToast({ message, type, isVisible: true, duration });
  };

  useEffect(() => {
    const fetchBuild = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/custom-builds/${id}`);
        if (!response.ok) {
          throw new Error('Build not found');
        }
        const data = await response.json();
        setBuild(data.build);
      } catch (err: any) {
        setError(err.message || 'Failed to load build');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBuild();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!build) return;
    setAddingToCart(true);
    try {
      let sessionId = localStorage.getItem('cartSessionId');
      if (!sessionId) {
        sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('cartSessionId', sessionId);
      }

      const cartRes = await fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`);
      const cartData = await cartRes.json();
      const existingItems = cartData.cart?.items || [];
      const mappedItems = existingItems.map((i: any) => ({
        product: i.product?._id || i.product,
        pcPart: i.pcPart?._id || i.pcPart,
        accessory: i.accessory?._id || i.accessory,
        customBuild: i.customBuild?._id || i.customBuild,
        quantity: i.quantity
      }));

      mappedItems.push({
        customBuild: build._id,
        quantity: 1
      });
      trackEvent('add_to_cart', window.location.pathname + window.location.search, build._id.toString());

      await fetch(`${process.env.REACT_APP_API_URL}/carts/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: mappedItems })
      });

      showToast('Custom build added to cart!', 'success');
      setTimeout(() => window.location.href = '/cart', 1000);
    } catch (err) {
      console.error(err);
      showToast('Failed to add to cart.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCustomize = () => {
    navigate(`/configurator?buildId=${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cpuItem = build?.parts?.find((item: any) => item.partType?.toLowerCase() === 'cpu' || item.part?.type?.toLowerCase() === 'cpu');
  const gpuItem = build?.parts?.find((item: any) => {
    const type = (item.partType || item.part?.type || '').toLowerCase();
    return type === 'gpu' || type === 'graphics card' || type === 'graphics';
  });

  const cpuName = cpuItem?.part?.partModel || cpuItem?.part?.name || '';
  const gpuName = gpuItem?.part?.partModel || gpuItem?.part?.name || '';
  const performanceSummary = cpuName && gpuName ? getShortPerformanceSummary(cpuName, gpuName) : null;

  if (error || !build) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold text-white mb-4">Build Not Found</h1>
        <p className="text-gray-400 mb-8">{error || "We couldn't find the requested custom build."}</p>
        <button
          onClick={() => navigate('/configurator')}
          className="bg-emerald-500 text-black px-6 py-3 rounded-full font-bold hover:bg-emerald-400 transition-colors"
        >
          Start a New Build
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col">
      <SEO 
        title={`Custom Build ${build.buildId} | LANForge`}
        description={`Check out this custom PC build configured on LANForge. Featuring ${build.parts.length} components for high-performance gaming.`}
        url={`https://lanforge.co/build/${id}`}
      />
      <div className="py-16 px-4 flex items-start justify-center flex-grow">
        <div className="w-full max-w-xl">
          <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-white/10 gap-2">
            <div>
              <h1 className="text-xl font-bold text-white">{build.name || 'Custom Build'}</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">Build ID: {build.buildId}</p>
            </div>
            <button
              onClick={handleCustomize}
              className="text-xs bg-[#222] hover:bg-[#333] text-white font-bold px-4 py-2 rounded-full transition-colors border border-white/10 shrink-0 self-start sm:self-auto"
            >
              Edit in Configurator
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {performanceSummary && (
              <div className="mb-6 pb-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{performanceSummary.title}</h3>
                  <div className="flex gap-1 bg-[#222] rounded-md p-1 border border-white/5">
                    {(["1080p", "1440p", "4k"] as const).map(res => (
                      <button
                        key={res}
                        onClick={() => setSelectedResolution(res)}
                        className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
                          selectedResolution === res 
                            ? 'bg-emerald-500 text-black shadow' 
                            : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {res.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="bg-[#111] border border-emerald-500/20 rounded-xl relative overflow-hidden group flex flex-col md:flex-row shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none"></div>
                    
                    {/* Seamless Image */}
                    <div className="w-full md:w-5/12 shrink-0 relative min-h-[160px] md:min-h-[140px] z-20 overflow-hidden rounded-t-xl md:rounded-l-xl md:rounded-tr-none flex flex-col items-center justify-center p-6">
                      <img src="https://cdn.lanforge.co/fortnite.png" alt="Fortnite Competitive" className="w-4/5 md:w-3/4 h-[80px] object-contain object-center opacity-100" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 w-full p-4 relative z-10 flex flex-col justify-center space-y-3">
                      <div className="flex flex-wrap items-end justify-between border-b border-white/10 pb-3 gap-3">
                          <div>
                            <div className="text-2xl font-black text-white whitespace-nowrap">
                              {performanceSummary.highlights[selectedResolution].fortniteCompetitive.min}-{performanceSummary.highlights[selectedResolution].fortniteCompetitive.max} <span className="text-sm font-bold text-emerald-400">FPS</span>
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">
                              Estimated Range • {selectedResolution === '1080p' ? '1080p Competitive Settings (Performance Mode)' : selectedResolution}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold text-white">{performanceSummary.highlights[selectedResolution].fortniteCompetitive.average}</div>
                              <div className="text-[9px] text-gray-500 uppercase tracking-wider">AVG FPS</div>
                            </div>
                            <div className="text-right border-l border-white/10 pl-3">
                              <div className="text-lg font-bold text-white">{performanceSummary.highlights[selectedResolution].fortniteCompetitive.onePercentLow}</div>
                              <div className="text-[9px] text-gray-500 uppercase tracking-wider">1% LOWS</div>
                            </div>
                          </div>
                        </div>

                        <ul className="space-y-1.5 text-xs text-gray-300">
                          {performanceSummary.highlights[selectedResolution].fortniteCompetitive.average > 240 ? (
                            <>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Flawless endgame fights</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Zero FPS drops in stacked lobbies</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Ideal for 240Hz+ competitive</span></li>
                            </>
                          ) : performanceSummary.highlights[selectedResolution].fortniteCompetitive.average > 144 ? (
                            <>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Smooth endgame fights</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Minimal drops in stacked lobbies</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Ideal for 144Hz+ competitive</span></li>
                            </>
                          ) : (
                            <>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Solid mid-game performance</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Playable competitive experience</span></li>
                              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✔</span> <span>Best for casual ranked play</span></li>
                            </>
                          )}
                        </ul>
                      </div>
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 leading-tight mt-2">{performanceSummary.disclaimer}</p>
              </div>
            )}

            {build.parts.map((item: any, index: number) => {
              const part = item.part;
              if (!part) {
                return (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-400 w-1/3 truncate pr-4">{item.partType || 'Component'}</span>
                    <span className="font-medium text-gray-500 italic flex-1 truncate pr-4 text-right">
                      Not Selected
                    </span>
                    <span className="text-white font-medium shrink-0">
                      $0.00
                    </span>
                  </div>
                );
              }
              
              return (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 w-1/3 truncate pr-4">{item.partType || part.type || 'Component'}</span>
                  <span className="font-medium text-white flex-1 truncate pr-4 text-right">
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}
                    {part.name || `${part.brand || ''} ${part.partModel || ''}`}
                  </span>
                  <span className="text-white font-medium shrink-0">
                    ${((part.price || 0) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}

            <div className="flex justify-between items-center text-sm pt-4 border-t border-white/5">
              <span className="text-gray-400">Build Service</span>
              <span className="font-medium text-emerald-400">Included</span>
            </div>
            
            <div className="flex justify-between items-center text-lg pt-4 border-t border-white/10 font-bold">
              <span className="text-white">Total</span>
              <span className="text-emerald-400">${(build.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="p-6 bg-white/5 border-t border-white/10 rounded-b-3xl space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {addingToCart ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : null}
                {addingToCart ? 'Adding to Cart...' : 'Add to Cart'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      
      <WhyLanforge />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
        duration={toast.duration}
      />
    </div>
  );
};

export default CustomBuildPage;