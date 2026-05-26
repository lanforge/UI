import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrochip, faGaugeHigh, faWrench } from '@fortawesome/free-solid-svg-icons';

const WhyLanforge: React.FC = () => {
  const reasons = [
    {
      title: 'No proprietary parts',
      icon: faMicrochip,
      description: 'Standardized components for easy upgrades and maintenance.'
    },
    {
      title: 'Pure performance builds',
      icon: faGaugeHigh,
      description: 'Designed specifically to eliminate bottlenecks and maximize raw power.'
    },
    {
      title: 'Hand-tuned for maximum FPS',
      icon: faWrench,
      description: 'Every system is meticulously optimized for peak gaming performance.'
    }
  ];

  return (
    <section className="py-12 relative overflow-hidden bg-gray-950 z-10">
      {/* Subtle grid pattern to match the rest of the site */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-8">
          Why LANForge
        </h2>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto bg-black/40 backdrop-blur-md border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50"
        >
          {/* Use block layout on small screens and table layout on md screens and up */}
          <div className="md:hidden block">
            {reasons.map((reason, index) => (
              <div key={index} className="border-b border-gray-800/80 last:border-0 hover:bg-white/5 transition-colors p-6 text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-white mx-auto mb-3">
                  <FontAwesomeIcon icon={reason.icon} className="text-base sm:text-lg" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">{reason.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400">{reason.description}</p>
              </div>
            ))}
          </div>

          <table className="hidden md:table w-full text-center border-collapse">
            <tbody>
              <tr className="hover:bg-white/5 transition-colors">
                {reasons.map((reason, index) => (
                  <td key={index} className="p-6 align-top border-r border-gray-800/80 last:border-0 w-1/3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                      <FontAwesomeIcon icon={reason.icon} className="text-lg" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{reason.title}</h3>
                    <p className="text-sm text-gray-400">{reason.description}</p>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyLanforge;
