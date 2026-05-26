import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  specs: string[];
}

const TradeifyPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    // Fetch products and limit to 4 for the showcase (3 regular + 1 spotlight)
    fetch(`${process.env.REACT_APP_API_URL}/products?tag=tradeify&limit=4`)
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          const sortedProducts = data.products.sort((a: any, b: any) => a.price - b.price);
          const mapped = sortedProducts.slice(0, 4).map((p: any) => ({
            id: p._id,
            name: p.name,
            description: p.shortDescription || p.description,
            price: `$${p.price.toFixed(2)}`,
            image: p.images?.[0] || null,
            specs: p.parts && p.parts.length > 0
              ? [
                  p.parts.find((part: any) => part.type === 'cpu'),
                  p.parts.find((part: any) => part.type === 'gpu'),
                  p.parts.find((part: any) => part.type === 'ram')
                ].filter(Boolean).map((part: any) => `${part.type.toUpperCase()}: ${part.brand ? part.brand + ' ' : ''}${part.partModel || part.name}`)
              : (p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).slice(0, 3) : [])
          }));
          setProducts(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 overflow-hidden">
      
      {/* 
        ========================================================================
        GLOBAL BACKGROUND EFFECTS
        ========================================================================
      */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] translate-x-[-50%] w-[80%] h-[30%] rounded-full bg-emerald-500/5 blur-[200px]" />
      </div>

      {/* 
        ========================================================================
        HERO SECTION
        ========================================================================
      */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-12 z-10 overflow-hidden">
        {/* Animated grid lines behind hero */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{
               backgroundImage: 'linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)',
               backgroundSize: '4rem 4rem',
               transformOrigin: 'center center',
               transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(-200px)'
             }}
        />
        
        <div className="container-narrow px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-6 flex flex-col items-center gap-6"
            >
              <div className="inline-flex items-center gap-6 px-8 py-4 rounded-full border border-cyan-500/50 bg-cyan-950/40 backdrop-blur-md shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <span className="text-cyan-300 uppercase tracking-[0.3em] text-sm font-black opacity-90">OFFICIAL PARTNER OF</span>
                  <img src="https://cdn.prod.website-files.com/679b064a680c614548672a06/679b233279e9e11c06af4d06_horizontal-logo.svg" alt="Tradeify" className="h-6 sm:h-8 object-contain drop-shadow-lg filter brightness-125" />
                </div>
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
              </div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tighter leading-tight py-2">
              TRADE BY DAY.<br />
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.4)] py-2">
                DOMINATE BY NIGHT.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-3xl font-light leading-relaxed mx-auto">
              Purpose-built workstations optimized for Futures & Crypto prop firm trading. Experience ultra-low latency execution to help you tackle evaluations, paired with flagship graphics for high-end gaming when the markets close. <strong className="text-cyan-400 font-bold">Includes a free Tradeify Select account with every PC.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center w-full sm:w-auto pb-4">
              <a href="#workstations" className="group relative px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-sm rounded-none overflow-hidden hover:scale-105 transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-500">Explore Trading Rigs</span>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Scroll to View</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-cyan-500 to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* 
        ========================================================================
        CORE ADVANTAGES - MINIMALIST STATS
        ========================================================================
      */}
      <section className="border-y border-gray-900 bg-black/50 backdrop-blur-sm relative z-10 py-16">
        <div className="container-narrow px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-y md:divide-y-0 md:divide-x divide-gray-900">
            {[
              { top: "Execution", bottom: "Ultra-Low Latency" },
              { top: "Displays", bottom: "Multi-Monitor Ready" },
              { top: "Performance", bottom: "Trading & Gaming" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col items-center text-center px-4 pt-8 md:pt-0 first:pt-0"
              >
                <span className="text-cyan-500 font-mono text-sm tracking-widest mb-2">{stat.top}</span>
                <span className="text-white font-bold text-xl md:text-2xl">{stat.bottom}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        WORKSTATION SHOWCASE - THE 3 PCs
        ========================================================================
      */}
      <section id="workstations" className="py-16 sm:py-24 lg:py-32 relative z-10">
        <div className="container-narrow px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-cyan-500 font-mono tracking-[0.3em] text-sm font-bold mb-4">THE ARSENAL</h2>
            <h3 className="text-5xl md:text-7xl font-black text-white tracking-tighter">Choose Your Trading Edge</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32 max-w-6xl mx-auto">
            {products.slice(0, 3).map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.2 }}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="relative group h-full"
              >
                {/* 
                  Card Background & Borders 
                  Using pure dark aesthetic with glowing borders on hover
                */}
                <div className="absolute inset-0 bg-[#0a0a0a] border border-gray-800 transition-colors duration-500 group-hover:border-cyan-500/50" />
                
                {/* Hover Glow Behind Card */}
                <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 blur-xl transition-all duration-500 pointer-events-none" />

                <div className="relative z-10 p-6 h-full flex flex-col">
                  
                  {/* Tier / Title Area */}
                  <div className="mb-6 text-center">
                    <div className="inline-block px-3 py-1 mb-3 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-400 text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                      <span className="text-white font-black">Free</span> {idx === 0 ? "25K Select" : idx === 1 ? "50K Select" : "150K Select"} Account
                    </div>
                    <div className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold mb-1">Tier {idx + 1}</div>
                    <h4 className="text-2xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-500 tracking-tight">
                      {product.name}
                    </h4>
                  </div>

                  {/* Image Area - Floating Effect */}
                  <div className="relative aspect-square max-w-[250px] mx-auto mb-8 flex items-center justify-center">
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-cyan-500/20 to-blue-600/20 blur-3xl rounded-full transition-opacity duration-700 ${hoveredIdx === idx ? 'opacity-100' : 'opacity-0'}`} />
                    
                    {product.image ? (
                      <motion.img 
                        animate={{ y: hoveredIdx === idx ? -15 : 0, scale: hoveredIdx === idx ? 1.08 : 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        src={product.image} 
                        alt={product.name}
                        className="w-[120%] h-[120%] max-w-none object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] relative z-10 scale-125"
                      />
                    ) : (
                      <div className="text-gray-800 text-6xl font-black tracking-tighter relative z-10">LF</div>
                    )}
                  </div>

                  {/* Specs List - Minimal & Clean */}
                  <div className="space-y-3 mb-6 flex-grow">
                    {product.specs.map((spec, i) => {
                      const [label, ...valueParts] = spec.split(':');
                      const value = valueParts.join(':');
                      return (
                        <div key={i} className="flex flex-col border-b border-gray-800 pb-2">
                          <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-1">{label}</span>
                          <span className="text-gray-200 text-sm font-medium">{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Price & Action */}
                  <div className="mt-auto pt-4 flex flex-col gap-4">
                    <div className="text-3xl font-black text-center text-white tracking-tighter">
                      {product.price}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('add-to-cart', {
                            detail: {
                              productId: product.id,
                              name: product.name,
                              price: parseFloat(product.price.replace('$', '')),
                              image: product.image,
                              type: 'product',
                              quantity: 1
                            }
                          });
                          window.dispatchEvent(event);
                        }}
                        className="w-full py-4 border border-cyan-500/50 bg-cyan-950/30 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:bg-cyan-500 hover:text-black transition-all duration-300 relative overflow-hidden group/btn"
                      >
                        <span className="relative z-10">Add to Cart</span>
                      </button>
                      <Link to={`/products/${product.id}`} className="block w-full">
                        <button className="w-full py-4 border border-gray-700 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white hover:text-black transition-all duration-300 relative overflow-hidden group/btn">
                          <span className="relative z-10">Details</span>
                        </button>
                      </Link>
                    </div>
                  </div>

                </div>
              </motion.div>
            ))}
          </div>

          {/* 
            ========================================================================
            THE SPOTLIGHT PC - AN ABSOLUTE SHOWSTOPPER
            ========================================================================
          */}
          {products.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1 }}
              className="relative w-full rounded-none border border-gray-800 bg-[#030303] group overflow-visible"
            >
              {/* Massive Outer Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-cyan-600/10 via-blue-600/10 to-emerald-600/10 blur-[100px] -z-10 group-hover:opacity-100 opacity-50 transition-opacity duration-1000 pointer-events-none" />

              {/* Decorative Tech Lines */}
              <div className="absolute top-0 left-0 w-32 h-[1px] bg-cyan-500" />
              <div className="absolute top-0 left-0 w-[1px] h-32 bg-cyan-500" />
              <div className="absolute bottom-0 right-0 w-32 h-[1px] bg-emerald-500" />
              <div className="absolute bottom-0 right-0 w-[1px] h-32 bg-emerald-500" />

              <div className="grid grid-cols-1 lg:grid-cols-2 relative z-10">
                
                {/* Spotlight Image Side */}
                <div className="relative p-12 lg:p-24 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-800 overflow-visible min-h-[600px]">
                  {/* Radial background specific to the image */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  
                  <div className="absolute top-12 left-12 flex items-center gap-4">
                    <div className="w-12 h-[1px] bg-cyan-500" />
                    <span className="text-cyan-500 uppercase tracking-[0.3em] text-xs font-black">Flagship Series</span>
                  </div>

                  {products[3].image ? (
                    <motion.img 
                      initial={{ scale: 0.9, rotateY: -15 }}
                      whileInView={{ scale: 1, rotateY: 0 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      src={products[3].image} 
                      alt={products[3].name}
                      className="w-full max-w-2xl h-auto object-contain filter drop-shadow-[0_0_50px_rgba(6,182,212,0.3)] group-hover:drop-shadow-[0_0_80px_rgba(6,182,212,0.6)] group-hover:scale-105 transition-all duration-1000 relative z-20"
                    />
                  ) : (
                    <div className="text-gray-800 text-9xl font-black tracking-tighter">LF MAX</div>
                  )}
                </div>

                {/* Spotlight Content Side */}
                <div className="p-12 lg:p-24 flex flex-col justify-center relative bg-gradient-to-l from-black/50 to-transparent">
                  {/* Subtle noise texture */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/grid-noise.png')] opacity-[0.03] mix-blend-screen pointer-events-none" />

                  <h3 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter leading-[0.9]">
                    {products[3].name}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
                    {products[3].specs.map((spec, i) => {
                      const [label, ...valueParts] = spec.split(':');
                      const value = valueParts.join(':');
                      return (
                        <div key={i} className="relative">
                          <div className="text-cyan-500 text-[10px] uppercase tracking-[0.2em] font-bold mb-2">{label}</div>
                          <div className="text-white text-lg font-bold tracking-tight">{value}</div>
                          <div className="absolute -left-4 top-1 bottom-1 w-[2px] bg-gray-800 group-hover:bg-gradient-to-b group-hover:from-cyan-500 group-hover:to-blue-600 transition-colors duration-700" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row items-center gap-8">
                    <div className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                      {products[3].price}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto ml-auto">
                      <button 
                        onClick={() => {
                          const event = new CustomEvent('add-to-cart', {
                            detail: {
                              productId: products[3].id,
                              name: products[3].name,
                              price: parseFloat(products[3].price.replace('$', '')),
                              image: products[3].image,
                              type: 'product',
                              quantity: 1
                            }
                          });
                          window.dispatchEvent(event);
                        }}
                        className="w-full sm:w-auto px-12 py-6 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] text-sm hover:bg-white transition-colors duration-300 shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform"
                      >
                        Add to Cart
                      </button>
                      <Link to={`/products/${products[3].id}`} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-12 py-6 border border-gray-700 bg-transparent text-white font-black uppercase tracking-[0.2em] text-sm hover:bg-white hover:text-black transition-colors duration-300 hover:scale-105 transition-transform">
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* 
        ========================================================================
        FINAL CTA
        ========================================================================
      */}
      <section className="py-16 sm:py-24 lg:py-32 relative z-10 border-t border-gray-900 bg-black">
        <div className="container-narrow px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 text-white tracking-tighter">Ready to Upgrade Your Setup?</h2>
            <p className="text-xl text-gray-400 mb-12 font-light">
              Stop letting hardware bottleneck your trading execution or gaming experience. Equip yourself with the performance you need for prop firm challenges and beyond.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/configurator">
                <button className="px-10 py-5 bg-cyan-500 text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors duration-300">
                  Custom Configure
                </button>
              </Link>
              <Link to="/contact">
                <button className="px-10 py-5 bg-transparent text-white border border-gray-700 hover:border-white font-bold uppercase tracking-widest text-sm transition-colors duration-300">
                  Contact Sales
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TradeifyPage;
