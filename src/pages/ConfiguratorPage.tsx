import * as React from 'react';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faArrowRight, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Configurator from '../components/Configurator';
import BuildRequestModal from '../components/BuildRequestModal';
import SEO from '../components/SEO';

interface CaseOption {
  id: number;
  name: string;
  description: string;
  brand: string;
  partModel: string;
  price: number;
  image: string;
  images: string[];
  formFactor: string;
  color: string;
  specs?: any;
}

const ConfiguratorPage: React.FC = () => {
  const [caseOptions, setCaseOptions] = useState<CaseOption[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseOption | null>(null);
  const [showConfigurator, setShowConfigurator] = useState(false);
  const [isBuildRequestModalOpen, setIsBuildRequestModalOpen] = useState(false);
  const [initialSelectedParts, setInitialSelectedParts] = useState<Record<string, any>>({});
  
  const location = useLocation();

  React.useEffect(() => {
    // Check for base product ID
    const params = new URLSearchParams(location.search);
    const baseProductId = params.get('base');
    const caseIdFromUrl = params.get('case');
    const buildIdFromUrl = params.get('buildId');

    const fetchConfigData = async () => {
      try {
        // Fetch cases
        const caseRes = await fetch(`${process.env.REACT_APP_API_URL}/pc-parts?type=case&limit=50`);
        const caseData = await caseRes.json();
        
        let mappedCases: CaseOption[] = [];
        if (caseData.parts) {
          mappedCases = caseData.parts.map((p: any) => {
            const images = p.images?.length > 0 ? p.images : ['https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&auto=format&fit=crop'];
            // Select a random image from the available images to show on load
            const randomImageIndex = Math.floor(Math.random() * images.length);
            
              return {
                id: p._id,
                name: `${p.brand || ''} ${p.partModel || ''}`.trim() || 'Unknown Case',
                description: `${p.brand || ''} ${p.partModel || ''}`.trim() || 'Unknown Case',
                brand: p.brand || 'Unknown',
                partModel: p.partModel || 'Unknown Model',
                price: p.price,
                image: images[randomImageIndex],
                images: images,
                formFactor: p.specs?.formFactor || 'Mid-Tower',
                color: p.specs?.availableColors ? p.specs.availableColors.join(' / ') : 'Black / White',
                specs: p.specs || {}
              };
          });
          mappedCases.sort((a: any, b: any) => a.price - b.price);
          setCaseOptions(mappedCases);
        }

        // If buildId exists, fetch the saved build
        if (buildIdFromUrl) {
          const buildRes = await fetch(`${process.env.REACT_APP_API_URL}/custom-builds/${buildIdFromUrl}`);
          const buildData = await buildRes.json();
          
          if (buildData.build && buildData.build.parts) {
            const prefilledParts: Record<string, any> = {};
            let productCaseId: string | null = null;

            buildData.build.parts.forEach((partItem: any) => {
              const part = partItem.part;
              // Ignore 'component' generic partType, prioritize part.type from DB for configurator mapping
              let rawType = partItem.partType?.toLowerCase() === 'component' ? part?.type : (partItem.partType || part?.type);
              let typeKey = rawType ? rawType.toLowerCase() : '';
              
              if (['ssd', 'hdd', 'nvme', 'm.2'].includes(typeKey)) {
                typeKey = 'storage';
              }
              if (['cpu cooler', 'liquid cooler', 'air cooler', 'cpu-cooler'].includes(typeKey)) {
                typeKey = 'cooler';
              }
              if (['case fan', 'case fans', 'fan', 'fans'].includes(typeKey)) {
                typeKey = 'fans';
              }

              if (typeKey === 'case' || typeKey === 'chassis') {
                if (part) productCaseId = part._id || part.id;
              } else {
                if (!part) {
                  // Explicitly selected 'No Part' saved in DB
                  prefilledParts[typeKey] = {
                    id: `no-part-${typeKey}`,
                    name: `No ${typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}`,
                    description: `Skip selecting a ${typeKey}`,
                    price: 0
                  };
                  return;
                }
                const option = {
                  id: part._id || part.id,
                  name: part.partModel || part.name || 'Unknown Component',
                  description: part.brand || '',
                  price: part.price || 0
                };
                
                if (typeKey === 'fans') {
                  if (!prefilledParts['fans']) prefilledParts['fans'] = [];
                  for (let i = 0; i < (partItem.quantity || 1) && prefilledParts['fans'].length < 2; i++) {
                    prefilledParts['fans'].push(option);
                  }
                } else {
                  prefilledParts[typeKey] = option;
                }
              }
            });

            setInitialSelectedParts(prefilledParts);

            if (productCaseId) {
              const preselectedCase = mappedCases.find((c: any) => String(c.id) === String(productCaseId));
              if (preselectedCase) {
                setSelectedCase(preselectedCase);
                setShowConfigurator(true);
              }
            }
          }
        } else if (baseProductId) {
          const prodRes = await fetch(`${process.env.REACT_APP_API_URL}/products/${baseProductId}`);
          const prodData = await prodRes.json();
          
          if (prodData.product && prodData.product.parts) {
            const prefilledParts: Record<string, any> = {};
            let productCaseId: string | null = caseIdFromUrl;

            prodData.product.parts.forEach((part: any) => {
              // Normalize type to match configurator categories
              let typeKey = part.type ? part.type.toLowerCase() : '';
              if (['ssd', 'hdd', 'nvme', 'm.2'].includes(typeKey)) {
                typeKey = 'storage';
              }
              if (['cpu cooler', 'liquid cooler', 'air cooler', 'cpu-cooler'].includes(typeKey)) {
                typeKey = 'cooler';
              }
              if (['case fan', 'case fans', 'fan', 'fans'].includes(typeKey)) {
                typeKey = 'fans';
              }

              if (typeKey === 'case' || typeKey === 'chassis') {
                productCaseId = part.part?._id || part._id || part.id;
              } else {
                const partDoc = part.part || part; // Handle parts that might be populated or embedded
                const option = {
                  id: partDoc._id || partDoc.id,
                  name: partDoc.partModel || partDoc.name || 'Unknown Component',
                  description: partDoc.brand || '',
                  price: partDoc.price || 0
                };
                
                if (typeKey === 'fans') {
                  if (!prefilledParts['fans']) prefilledParts['fans'] = [];
                  for (let i = 0; i < (part.quantity || 1) && prefilledParts['fans'].length < 2; i++) {
                    prefilledParts['fans'].push(option);
                  }
                } else {
                  prefilledParts[typeKey] = option;
                }
              }
            });

            setInitialSelectedParts(prefilledParts);

            // Set the case if we found one
            if (productCaseId) {
              const preselectedCase = mappedCases.find((c: any) => String(c.id) === String(productCaseId));
              if (preselectedCase) {
                setSelectedCase(preselectedCase);
                setShowConfigurator(true);
              }
            }
          }
        } else if (caseIdFromUrl) {
          // Just a case preselected, no base product
                const preselectedCase = mappedCases.find((c: any) => String(c.id) === String(caseIdFromUrl));
          if (preselectedCase) {
            setSelectedCase(preselectedCase);
            setShowConfigurator(true);
          }
        }

      } catch (err) {
        console.error("Error loading configurator data:", err);
      }
    };

    fetchConfigData();
  }, [location.search]);

  const handleCaseSelect = (caseOption: CaseOption) => {
    setSelectedCase(caseOption);
    setShowConfigurator(true);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  const handleBackToCases = () => {
    setShowConfigurator(false);
    setTimeout(() => window.scrollTo(0, 0), 0);
  };

  if (showConfigurator && selectedCase) {
    return (
      <div className="min-h-screen bg-gray-950">
        <SEO 
          title={`Configure ${selectedCase.name} | LANForge Configurator`}
          description={`Customize your PC build using the ${selectedCase.name} case. Choose your CPU, GPU, memory, and more.`}
          url="https://lanforge.co/configurator"
        />
        {/* Minimalist Top Nav for Configurator */}
        <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-white/10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackToCases}
                className="text-gray-400 hover:text-white transition-colors flex items-center text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Cases
              </button>
              <div className="h-4 w-px bg-white/20"></div>
              <div className="text-sm">
                <span className="text-gray-400">Foundation: </span>
                <span className="text-white font-medium">{selectedCase.name}</span>
              </div>
            </div>
            <div className="text-sm font-medium text-emerald-400">
              Step 2 of 3
            </div>
          </div>
        </div>

        <div id="configurator-section" className="max-w-7xl mx-auto">
          <Configurator 
            selectedCase={selectedCase} 
            baseProductId={new URLSearchParams(location.search).get('base') || undefined} 
            initialSelectedParts={initialSelectedParts}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 selection:bg-emerald-500/30">
      <SEO 
        title="Custom PC Configurator | LANForge"
        description="Build your dream PC with our interactive configurator. Start by selecting a case and customize every component."
        url="https://lanforge.co/configurator"
      />
      {/* Clean Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6"
          >
            Configure Your Ultimate System
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Start by selecting a foundation. Our intelligent configurator will ensure every component you choose is fully compatible.
          </motion.p>
        </div>
      </section>

      {/* Subtle Promo Banner */}
      <section className="px-6 mb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-gray-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0 mt-1">
                <FontAwesomeIcon icon={faInfoCircle} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Not sure where to begin?</h3>
                <p className="text-gray-400 text-sm">
                  Skip the configurator. Tell our experts what you need, and we'll design a custom system tailored perfectly for you.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsBuildRequestModalOpen(true)}
              className="bg-white text-black hover:bg-gray-200 px-6 py-3 rounded-full text-sm font-bold transition-colors whitespace-nowrap"
            >
              Request Custom Build
            </button>
          </div>
        </div>
      </section>

      {/* Main Cases Grid */}
      <section className="px-6 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">Step 1: Choose a Case</h2>
            <span className="text-sm text-gray-500 font-medium">{caseOptions.length} available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {caseOptions.filter(caseOption => {
              // Filter cases based on pre-selected motherboard if any
              const mobo = initialSelectedParts.motherboard;
              if (mobo && mobo.specs?.formFactor) {
                const boardFf = mobo.specs.formFactor.toLowerCase();
                const caseFf = caseOption.formFactor.toLowerCase();
                
                if (boardFf.includes('atx') && !boardFf.includes('matx') && !boardFf.includes('micro')) {
                  // ATX board needs ATX case (or E-ATX)
                  if (caseFf.includes('itx') || caseFf.includes('matx') || caseFf.includes('micro') || caseFf === 'mini-itx') {
                    return false;
                  }
                } else if (boardFf.includes('matx') || boardFf.includes('micro')) {
                  // mATX board needs mATX or ATX case
                  if (caseFf.includes('itx') || caseFf === 'mini-itx') {
                    return false;
                  }
                } else if (boardFf.includes('itx') || boardFf === 'mini-itx') {
                  // ITX board -> only ITX cases (per feedback: no ITX in ATX builds)
                  const isCaseItx = caseFf.includes('itx');
                  const isCaseMatx = caseFf.includes('matx') || caseFf.includes('micro');
                  const isCaseAtx = caseFf.includes('atx') && !isCaseMatx;
                  const isCaseMidFull = caseFf.includes('tower');
                  
                  if (isCaseAtx || isCaseMatx || isCaseMidFull || !isCaseItx) {
                    return false;
                  }
                }
              }
              return true;
            }).map((caseOption, index) => (
              <motion.div
                key={caseOption.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col"
              >
                {/* Minimalist Image Area */}
                <div 
                  className="relative aspect-[4/3] w-full bg-gray-800 overflow-hidden p-6 flex items-center justify-center group/image cursor-pointer"
                  onClick={() => handleCaseSelect(caseOption)}
                  onMouseEnter={() => {
                    // Preload the other images if any
                    if (caseOption.images && caseOption.images.length > 0) {
                      caseOption.images.forEach(img => {
                        const imgEl = new Image();
                        imgEl.src = img;
                      });
                    }
                  }}
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-80 group-hover/image:opacity-100 transition-all duration-700"
                    style={{ backgroundImage: `url(${caseOption.image})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-60 pointer-events-none" />
                  
                  {caseOption.images && caseOption.images.length > 1 && (
                    <>
                      {/* Left Arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const parent = e.currentTarget.parentElement;
                          if (!parent) return;
                          const currentBg = parent.querySelector('.bg-cover') as HTMLDivElement;
                          if (!currentBg) return;
                          
                          const currentUrl = currentBg.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
                          let currentIndex = caseOption.images.findIndex(img => img === currentUrl);
                          if (currentIndex === -1) currentIndex = 0;
                          
                          // Go to prev image
                          const nextIndex = currentIndex === 0 ? caseOption.images.length - 1 : currentIndex - 1;
                          currentBg.style.backgroundImage = `url(${caseOption.images[nextIndex]})`;
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-all z-20"
                        aria-label="Previous image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>

                      {/* Right Arrow */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const parent = e.currentTarget.parentElement;
                          if (!parent) return;
                          const currentBg = parent.querySelector('.bg-cover') as HTMLDivElement;
                          if (!currentBg) return;
                          
                          const currentUrl = currentBg.style.backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/i, '$1');
                          let currentIndex = caseOption.images.findIndex(img => img === currentUrl);
                          if (currentIndex === -1) currentIndex = 0;
                          
                          // Go to next image
                          const nextIndex = (currentIndex + 1) % caseOption.images.length;
                          currentBg.style.backgroundImage = `url(${caseOption.images[nextIndex]})`;
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover/image:opacity-100 transition-all z-20"
                        aria-label="Next image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      
                      {/* Image Indicators */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover/image:opacity-100 transition-opacity z-10 pointer-events-none">
                        {caseOption.images.map((_, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Content Area */}
                <div 
                  className="p-6 relative cursor-pointer flex-1 flex flex-col"
                  onClick={() => handleCaseSelect(caseOption)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="text-lg font-bold text-white line-clamp-2">{caseOption.partModel}</h3>
                      <p className="text-sm text-gray-400 truncate mt-1">{caseOption.brand}</p>
                    </div>
                    <span className="text-white font-medium bg-white/10 px-3 py-1 rounded-full text-sm shrink-0">
                      ${caseOption.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-6 mt-auto pt-4">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1 bg-white/5 rounded">
                      {caseOption.formFactor}
                    </span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-1 bg-white/5 rounded">
                      {caseOption.color}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-400 text-sm font-semibold opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span>Select Case</span>
                    <FontAwesomeIcon icon={faArrowRight} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BuildRequestModal 
        isOpen={isBuildRequestModalOpen} 
        onClose={() => setIsBuildRequestModalOpen(false)} 
      />
    </div>
  );
};

export default ConfiguratorPage;
