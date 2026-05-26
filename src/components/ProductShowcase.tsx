import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDesktop } from '@fortawesome/free-solid-svg-icons';
import { trackEvent } from '../utils/analytics';
import { getShortPerformanceSummary, LANFORGE_FPS_DISCLAIMER } from '../utils/lanforgePerformanceEngine';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  priceValue?: number;
  compareAtPrice?: string;
  image?: string;
  specs: string[];
  imageColor: string;
  series: string;
  tags: string[];
  fortniteFPS?: number;
  cpuName?: string;
  gpuName?: string;
}

const ProductShowcase: React.FC = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [selectedColors, setSelectedColors] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/products?limit=100`)
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          const mapped = data.products.map((p: any) => {
            const cpuPart = p.parts?.find((part: any) => part.type?.toLowerCase() === 'cpu');
            const gpuPart = p.parts?.find((part: any) => part.type?.toLowerCase() === 'gpu' || part.type?.toLowerCase() === 'graphics card' || part.type?.toLowerCase() === 'graphics');
            
            const cpuName = cpuPart?.partModel || cpuPart?.model || cpuPart?.name || '';
            const gpuName = gpuPart?.partModel || gpuPart?.model || gpuPart?.name || '';
            
            const perf = cpuName && gpuName ? getShortPerformanceSummary(cpuName, gpuName) : null;
            const fortniteFPS = perf ? perf.highlights["1080p"].fortniteCompetitive.average : undefined;

            return {
              id: p._id,
              name: p.name,
              description: p.shortDescription || p.description,
              priceValue: p.price, // Store numeric price for sorting
              price: `$${p.price.toFixed(2)}`,
              compareAtPrice: p.compareAtPrice ? `$${p.compareAtPrice.toFixed(2)}` : undefined,
              image: p.images?.[0] || null, // Primary photo
              cpuName: cpuName,
              gpuName: gpuName,
              specs: p.parts && p.parts.length > 0 
                ? [
                    p.parts.find((part: any) => part.type === 'cpu'),
                    p.parts.find((part: any) => part.type === 'gpu'),
                    p.parts.find((part: any) => part.type === 'ram')
                  ].filter(Boolean).map((part: any) => {
                    const modelStr = part.partModel || part.model || (part.name ? part.name.replace(new RegExp(`^${part.brand}\\s*`, 'i'), '') : '');
                    return `${part.type.toUpperCase()}: ${part.brand} ${modelStr}`.trim();
                  })
                : (p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).slice(0, 3) : []),
              imageColor: '#3a86ff',
              series: p.subcategory || p.category || 'LANForge Series',
              tags: p.tags || [],
              fortniteFPS
            };
          });
          // Sort products by price (least expensive to most expensive)
          mapped.sort((a: any, b: any) => a.priceValue - b.priceValue);
          setProducts(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const seriesOrder = [
    { label: 'LANForge Series', tag: 'lanforge series' },
    { label: 'LANForge Mini Series', tag: 'mini series' },
    { label: 'Pre Configured', tag: 'preconfig' }
  ];

  // Group products by tags matching the seriesOrder
  const seriesGroups = products.reduce((groups, product) => {
    const productTagsLower = product.tags?.map(t => t.toLowerCase()) || [];
    const productSeriesLower = product.series?.toLowerCase() || '';

    seriesOrder.forEach(target => {
      const isMatch = productTagsLower.includes(target.tag) || productSeriesLower === target.tag || productTagsLower.includes(target.label.toLowerCase()) || productSeriesLower === target.label.toLowerCase();
      if (isMatch) {
        if (!groups[target.label]) {
          groups[target.label] = [];
        }
        groups[target.label].push(product);
      }
    });
    
    return groups;
  }, {} as Record<string, Product[]>);

  return (
    <section className="section py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-gray-950" id="products">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>
      
      <div className="container-narrow relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/50 mb-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Premium Builds</span>
          </div>
          
          <h2 className="heading-2 mb-4">
            Featured <span className="text-gradient-neon">Builds</span>
          </h2>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-6 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className="text-xs sm:text-sm font-bold text-emerald-400">All systems built & shipped in 3–5 days</span>
          </div>
          
          <p className="body-large max-w-3xl mx-auto">
            Choose from our curated selection of premium gaming PCs or customize every component to create your perfect system.
          </p>
        </motion.div>
        
        {seriesOrder.map((seriesObj, seriesIndex) => {
          const series = seriesObj.label;
          let seriesProducts = seriesGroups[series];
          if (!seriesProducts) return null;
          
          const isPreconfigured = series === 'Pre Configured';
          if (isPreconfigured) {
            seriesProducts = seriesProducts.slice(0, 3);
          }
          
          return (
            <motion.div 
              key={series}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: seriesIndex * 0.2 }}
              className="mb-12 sm:mb-16 lg:mb-20 last:mb-0"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">{series === 'Pre Configured' ? 'Preconfigured PCs' : series}</h3>
                  <p className="text-sm sm:text-base text-gray-400">
                    {series === 'LANForge Series' && 'Flagship performance for serious gamers'}
                    {series === 'LANForge Mini Series' && 'Compact powerhouses for space-conscious setups'}
                    {series === 'Pre Configured' && 'Pre-configured systems ready for immediate delivery'}
                  </p>
                </div>
                <div className="hidden md:block">
                  <span className="text-sm text-gray-500">{seriesProducts.length} models</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {seriesProducts.map((product, productIndex) => (
                  <div
                    key={product.id}
                    className={`bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 group transition-all duration-300 flex flex-col h-full ${
                      series === 'LANForge Series' && productIndex === 1 
                        ? 'lg:scale-[1.03] relative z-10 shadow-[0_0_60px_rgba(6,182,212,0.4)]' 
                        : 'scale-100'
                    }`}
                  >
                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4 min-h-[32px]">
                        <div className="flex flex-col">
                          {/* Most Popular Badge (Moved up here) */}
                          {series === 'LANForge Series' && productIndex === 1 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 w-fit shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                              <svg className="w-3.5 h-3.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>
                              <span className="text-[10px] sm:text-xs font-bold text-orange-400 uppercase tracking-wide">Most Popular</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product image */}
                      <div className="relative mb-4 sm:mb-6">
                        <div 
                          className="w-full h-40 sm:h-44 lg:h-48 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                          style={{ backgroundColor: `${product.imageColor}20` }}
                        >
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-contain p-2 relative z-10"
                            />
                          ) : (
                            <div className="text-6xl opacity-30 relative z-10"><FontAwesomeIcon icon={faDesktop} /></div>
                          )}
                          <div 
                            className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-xl"
                            style={{ backgroundColor: product.imageColor }}
                          />
                        </div>
                        
                        {/* Fortnite Badge inside image block removed */}
                      </div>
                      
                      {/* Product info */}
                      <div className="space-y-3 sm:space-y-4 flex flex-col flex-grow">
                        <div className="flex flex-col gap-1">
                          {/* New Prominent FPS Display - Back below the image! */}
                          {product.fortniteFPS && (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight leading-none drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]">{product.fortniteFPS}+ FPS</h3>
                              </div>
                              <div className="mb-1 flex flex-col gap-1.5">
                                <div>
                                  <span className="text-[10px] sm:text-xs font-bold text-emerald-300 uppercase tracking-widest border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 rounded shadow-[0_0_15px_rgba(52,211,153,0.2)] leading-none inline-block">Competitive &bull; 1080p</span>
                                </div>
                                <div className="text-emerald-400/70">
                                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider drop-shadow-[0_0_3px_rgba(52,211,153,0.1)] leading-none">
                                    {product.fortniteFPS >= 300 ? '360Hz+' : product.fortniteFPS >= 200 ? '240–360Hz' : '144–240Hz'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                          
                          <h4 className="text-xl sm:text-2xl font-bold text-white leading-tight mt-1">{product.name}</h4>
                        </div>
                        
                        {/* Power Info */}
                        <div className="pt-2 mb-4">
                          <div className="text-xs sm:text-sm font-medium text-gray-400 mb-3">
                            {product.cpuName && product.gpuName ? (
                              <>
                                <span className="text-white">{product.cpuName}</span> &bull; <span className="text-white">{product.gpuName}</span>
                              </>
                            ) : 'Premium Components'}
                          </div>
                          <div className="flex flex-col border-t border-gray-800/50 pt-3">
                            <div className="flex items-end gap-2 mb-0.5">
                              <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                                {product.price}
                              </div>
                              {product.compareAtPrice && (
                                <div className="text-xs sm:text-sm text-gray-500 line-through mb-1">
                                  {product.compareAtPrice}
                                </div>
                              )}
                            </div>
                            {product.priceValue && product.priceValue > 0 && (
                              <div className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1">
                                Starting at <span className="text-blue-400 font-medium">${Math.ceil((product.priceValue * 1.0999) / 24)}/mo</span> with <img src="https://cdn-assets.affirm.com/images/white_logo-transparent_bg.png" alt="Affirm" className="h-3.5 inline-block -mt-0.5" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Spacer to push actions to the bottom */}
                        <div className="flex-grow"></div>
                        
                        {/* Actions */}
                        <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-800/50 flex items-center justify-center">
                          <Link to={`/products/${product.id}`} className="w-full">
                            <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 w-full text-center">
                              <button className="skew-x-[10deg] px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 w-full">
                                View Build
                              </button>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {isPreconfigured && (
                <div className="mt-8 flex justify-center">
                  <Link to="/pcs">
                    <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                      <button className="skew-x-[10deg] px-8 py-3 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300">
                        View All
                      </button>
                    </div>
                  </Link>
                </div>
              )}
            </motion.div>
          );
        })}
        
        {/* Performance Disclaimer */}
        <div className="mt-4 sm:mt-8 text-center px-4">
          <p className="text-[10px] text-gray-500 max-w-4xl mx-auto leading-relaxed">
            {LANFORGE_FPS_DISCLAIMER}
          </p>
        </div>
        
        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 sm:mt-16 lg:mt-20 text-center"
        >
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Don't see what you're looking for?</h3>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-gray-300">
              Build your perfect PC from scratch with our configurator. Choose every component and create a system tailored to your exact needs.
            </p>
            <Link to="/configurator" className="inline-block w-full sm:w-auto">
              <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                <button className="skew-x-[10deg] px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 w-full sm:w-auto">
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start Custom Build
                </button>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductShowcase;
