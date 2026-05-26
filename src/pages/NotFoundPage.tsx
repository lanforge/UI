import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center pt-20 pb-16 px-6">
      <motion.div 
        className="text-center max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-emerald-500 font-mono font-bold text-lg mb-2">404 ERROR</div>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
          Page not found
        </h1>
        <p className="text-xl text-gray-400 mb-10 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            to="/" 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            Go back home
          </Link>
          <Link 
            to="/contact" 
            className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3.5 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 border border-gray-700"
          >
            Contact support
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
