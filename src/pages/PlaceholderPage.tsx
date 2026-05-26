import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonDigging } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import '../App.css';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => {
  return (
    <div className="placeholder-page">
      <div className="container">
        <motion.div 
          className="placeholder-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>{title}</h1>
          {description && <p className="placeholder-description">{description}</p>}
        </motion.div>
        
        <motion.div 
          className="placeholder-content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="placeholder-card">
            <div className="placeholder-icon"><FontAwesomeIcon icon={faPersonDigging} /></div>
            <h2>Page Under Construction</h2>
            <p>This page is currently being developed. Please check back soon!</p>
            <div className="placeholder-actions">
              <a href="/" className="btn btn-primary">Return to Home</a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PlaceholderPage;