import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faTruckFast, faWrench } from '@fortawesome/free-solid-svg-icons';

const warrantyFeatures = [
  {
    icon: faShieldHalved,
    title: '3‑Year Comprehensive Warranty',
    description: 'Covers all components against defects. Includes technical support and troubleshooting.'
  },
  {
    icon: faTruckFast,
    title: 'Free Shipping & Returns',
    description: 'Free shipping within the continental US. 14‑day return policy for any reason.'
  },
  {
    icon: faWrench,
    title: 'Lifetime Build Support',
    description: 'Our experts are available to help with upgrades, troubleshooting, and optimization for life.'
  }
];

const Warranty: React.FC = () => {
  return (
    <section className="section py-16 sm:py-24 lg:py-32 relative overflow-hidden bg-gray-950">
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
            <span className="text-sm font-medium text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">Warranty & Support</span>
          </div>
          
          <h2 className="heading-2 mb-6">
            Peace of Mind <span className="text-gradient-cyber">Guarantee</span>
          </h2>
          
          <p className="body-large max-w-3xl mx-auto">
            We stand behind every system we build with industry‑leading support and comprehensive protection.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {warrantyFeatures.map((feature, index) => (
            <div 
              key={index}
              className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl overflow-hidden text-center shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50 group"
            >
              <div className="p-4 sm:p-5 lg:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-3 sm:mb-4 transform group-hover:scale-110 transition-transform duration-300 text-white">
                  <FontAwesomeIcon icon={feature.icon} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 sm:mt-12 lg:mt-16 text-center"
        >
          <div className="bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl p-5 sm:p-6 lg:p-8 max-w-3xl mx-auto shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
            <p className="text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-5 sm:mb-6">
              <strong className="text-cyan-400">Note:</strong> Longer warranty plans available at checkout.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link to="/warranty" className="w-full sm:w-auto">
                <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                  <button className="skew-x-[10deg] w-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300">
                    View Full Warranty Terms
                  </button>
                </div>
              </Link>
              <Link to="/contact" className="w-full sm:w-auto">
                <div className="skew-x-[-10deg] bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50">
                  <button className="skew-x-[10deg] w-full px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 hover:from-cyan-300 hover:to-cyan-500 transition-all duration-300">
                    Contact Support
                  </button>
                </div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Warranty;
