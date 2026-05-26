import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', isVisible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-xl" />;
      case 'error':
        return <FontAwesomeIcon icon={faExclamationCircle} className="text-red-400 text-xl" />;
      case 'info':
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 text-xl" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-emerald-950/40';
      case 'error':
        return 'border-red-500/30 bg-red-950/40';
      case 'info':
      default:
        return 'border-blue-500/30 bg-blue-950/40';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-sm"
        >
          <div className={`backdrop-blur-md border ${getBgColor()} shadow-2xl shadow-black/50 rounded-2xl p-4 flex items-start gap-3`}>
            <div className="shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1 text-sm font-medium text-white whitespace-pre-wrap leading-relaxed">
              {message}
            </div>
            <button 
              onClick={onClose}
              className="shrink-0 text-gray-400 hover:text-white transition-colors p-1"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
