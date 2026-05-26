import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faShieldHalved, faTrophy } from '@fortawesome/free-solid-svg-icons';

const Hero: React.FC = () => {
  return (
    <>
    <section className="relative min-h-[70vh] sm:min-h-[75vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden bg-gray-950 pb-20 sm:pb-24 pt-10 sm:pt-12">
      {/* Solid background */}
      <div className="absolute inset-0 bg-gray-950" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="container-narrow relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-cyan-500/50 mb-3 sm:mb-4 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Premium Gaming PCs</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight text-white">
                Built for 240Hz+
                <span className="block text-gradient-neon pt-1 pb-1 leading-[1.2]">Competitive Gaming</span>
              </h1>
              
              <div className="space-y-4">
                <p className="text-xl sm:text-2xl text-emerald-400 font-bold">
                  300–400+ FPS in Fortnite Competitive
                </p>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl font-medium">
                  Max FPS. Zero bottlenecks. Engineered for serious players.
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div 
              className="flex flex-wrap gap-3 sm:gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link to="/configurator">
                <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                  <button className="skew-x-[10deg] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Build Your PC
                  </button>
                </div>
              </Link>
              <Link to="/pcs?game=fortnite">
                <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                  <button className="skew-x-[10deg] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                    Shop Fortnite Builds
                  </button>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Image Display */}
          <motion.div 
            className="relative mt-8 lg:mt-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
              <div className="relative">
                <img 
                  src="/Tradeify-Picture.png" 
                  alt="LANForge Gaming PC" 
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
              </div>
            </div>
            
            {/* Badge */}
            <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-black/40 backdrop-blur-xl border border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">RTX 5090 READY</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 hidden sm:flex z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="flex flex-col items-center gap-1 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-wider">SCROLL</span>
          <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-gray-700 rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-2 sm:h-3 bg-gradient-to-b from-emerald-400 to-blue-500 rounded-full mt-1.5 sm:mt-2"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </div>
      </motion.div>
    </section>

    </>
  );
};

export default Hero;