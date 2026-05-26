import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  specs: string[];
}

const DignitasPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Fetch products and limit to 3 for the showcase
    fetch(`${process.env.REACT_APP_API_URL}/products?tag=dignitas&limit=3`)
      .then(res => res.json())
      .then(data => {
        if (data.products) {
          const sortedProducts = data.products.sort((a: any, b: any) => a.price - b.price);
          const mapped = sortedProducts.slice(0, 3).map((p: any) => ({
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
                ].filter(Boolean).map((part: any) => `${part.type.toUpperCase()}: ${part.partModel || part.name}`)
              : (p.specs ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).slice(0, 3) : [])
          }));
          setProducts(mapped);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 z-10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-[120px] mix-blend-screen" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/20 rounded-full blur-[120px] mix-blend-screen" />
          {/* Hexagon Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-10" />
        </div>

        <div className="container-narrow relative z-20 text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-4 mb-8 px-6 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 backdrop-blur-sm">
              <span className="text-yellow-500 text-sm font-bold tracking-widest uppercase">Official Partnership</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
              LANForge <span className="text-gray-500 mx-2">x</span> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-600 drop-shadow-lg">
                Dignitas
              </span>
            </h1>
            <p className="text-xl md:text-3xl text-gray-300 max-w-4xl mx-auto mb-12 font-light leading-relaxed">
              Forging the future of esports. Uncompromising performance for champions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a href="#showcase" className="px-8 py-4 bg-yellow-500 text-gray-950 font-black text-lg uppercase tracking-wider rounded border border-yellow-400 hover:bg-yellow-400 hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all duration-300 skew-x-[-10deg]">
                <div className="skew-x-[10deg]">View The Builds</div>
              </a>
              <a href="#about" className="px-8 py-4 bg-transparent text-yellow-500 font-bold text-lg uppercase tracking-wider rounded border border-yellow-500/50 hover:bg-yellow-500/10 hover:border-yellow-400 transition-all duration-300 skew-x-[-10deg]">
                <div className="skew-x-[10deg]">Learn More</div>
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-yellow-500/30 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-3 bg-yellow-500 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Stats/Highlight Bar */}
      <section className="border-y border-yellow-500/10 bg-black/40 backdrop-blur-md relative z-20 shadow-lg">
        <div className="container-narrow py-6 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-4 text-center md:divide-x divide-yellow-500/10">
            {[
              { label: "Framerate Target", value: "360+ FPS" },
              { label: "Reliability", value: "24/7/365" },
              { label: "Cooling", value: "Liquid Cooled" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="px-4 py-2 flex flex-col items-center justify-center"
              >
                <div className="text-xl md:text-2xl font-black text-yellow-500 mb-1">{stat.value}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About The Partnership */}
      <section id="about" className="py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-yellow-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        
        <div className="container-narrow">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                Two Legends.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">One Goal.</span>
              </h2>
              <div className="space-y-6 text-lg text-gray-300">
                <p>
                  <strong className="text-white">Dignitas</strong> is one of the most storied and successful organizations in esports history. With decades of competitive dominance across multiple titles, they know exactly what it takes to reach the pinnacle of gaming.
                </p>
                <p>
                  <strong className="text-white">LANForge</strong> was born from a passion for flawless PC building and an obsession with maximizing performance. We don't just build computers; we forge weapons for digital athletes.
                </p>
                <p>
                  Together, we have partnered to create a lineup of professional-grade systems. Every PC in the Dignitas collection is engineered, stress-tested, and optimized to eliminate bottlenecks, minimize input lag, and deliver the blistering framerates that give Dignitas players their competitive edge.
                </p>
              </div>
              <div className="mt-10">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><FontAwesomeIcon icon={faCheck} /></div>
                    <span className="font-medium">Esports-grade Components</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><FontAwesomeIcon icon={faCheck} /></div>
                    <span className="font-medium">Zero Bloatware Windows OS</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><FontAwesomeIcon icon={faCheck} /></div>
                    <span className="font-medium">Extreme Stress Testing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500"><FontAwesomeIcon icon={faCheck} /></div>
                    <span className="font-medium">Plug & Play Ready</span>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-yellow-500/20 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                {/* Visual placeholder for an amazing team or PC shot */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 p-8 z-20">
                  <div className="text-3xl font-black text-white mb-2 tracking-wide">CHAMPIONSHIP MENTALITY</div>
                  <div className="w-20 h-1 bg-yellow-500" />
                </div>
              </div>
              
              {/* Floating element */}
              <div className="absolute -bottom-8 -left-8 bg-gray-900 border border-yellow-500/30 p-6 rounded-xl shadow-2xl backdrop-blur-xl z-30 max-w-xs">
                <div className="flex gap-4">
                  <div className="text-4xl text-yellow-500">"</div>
                  <p className="text-gray-300 text-sm font-medium italic">
                    "LANForge systems have completely changed how we train. The stability and raw power let us focus 100% on the game, never the hardware."
                  </p>
                </div>
                <div className="mt-4 text-right">
                  <strong className="text-yellow-500 text-sm">- Dignitas Pro Player</strong>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* PC Showcase Section */}
      <section id="showcase" className="py-24 bg-gray-900/40 relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
        
        <div className="container-narrow relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-sm font-bold tracking-widest uppercase text-yellow-500 mb-4">The Builds</h2>
              <h3 className="text-4xl md:text-5xl font-black mb-6">Official <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Dignitas</span> Builds</h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Play on the exact same hardware that powers the pros. Hand-crafted, meticulously tuned, and built to dominate.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="group relative"
              >
                {/* Glow effect behind card */}
                <div className="absolute -inset-0.5 bg-gradient-to-b from-yellow-500/0 via-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/20 group-hover:via-yellow-500/5 group-hover:to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                
                <div className="bg-gray-950 border border-gray-800 group-hover:border-yellow-500/50 rounded-2xl overflow-hidden relative z-10 flex flex-col h-full transition-all duration-500 shadow-2xl">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] p-8 flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-yellow-500/20 blur-[80px] rounded-full group-hover:bg-yellow-500/30 transition-all duration-500" />
                    
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-contain relative z-10 filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-700"
                      />
                    ) : (
                      <div className="text-gray-700 text-6xl font-black tracking-tighter relative z-10">LANForge</div>
                    )}
                    
                    {/* Badge */}
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded uppercase tracking-wider z-20">
                      Pro Pick
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-8 flex flex-col flex-grow relative">
                    <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gray-700 group-hover:via-yellow-500/50 to-transparent transition-colors duration-500" />
                    
                    <div className="flex justify-between items-start mb-4 mt-2">
                      <h4 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">{product.name}</h4>
                    </div>

                    <div className="space-y-3 mb-8 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      {product.specs.map((spec, i) => {
                        const [label, ...valueParts] = spec.split(':');
                        const value = valueParts.join(':');
                        return (
                          <div key={i} className="flex flex-col gap-1 text-sm">
                            <span className="text-gray-500 font-medium text-xs uppercase tracking-wider">{label}</span>
                            <span className="text-gray-200 font-semibold leading-snug">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-800">
                      <div className="text-2xl font-black text-white">{product.price}</div>
                      <Link to={`/products/${product.id}`}>
                        <button className="px-6 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-yellow-500 transition-colors duration-300 flex items-center gap-2">
                          Configure
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-500" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
        
        <div className="container-narrow relative z-10 text-center text-black">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter">Ready to Ascend?</h2>
            <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto mb-10 opacity-90">
              Join the ranks of elite players. Experience gaming without limits with a LANForge system.
            </p>
            <Link to="/configurator">
              <button className="px-10 py-5 bg-black text-yellow-500 font-black text-xl uppercase tracking-widest rounded shadow-2xl hover:bg-gray-900 hover:scale-105 transition-all duration-300">
                Build Your Own
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default DignitasPage;