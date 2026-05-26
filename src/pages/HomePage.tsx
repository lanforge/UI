import React from 'react';
import Hero from '../components/Hero';
import ProductShowcase from '../components/ProductShowcase';
import Reviews from '../components/Reviews';
import FAQ from '../components/FAQ';
import Warranty from '../components/Warranty';
import SEO from '../components/SEO';
import WhyLanforge from '../components/WhyLanforge';

const HomePage: React.FC = () => {
  return (
    <>
      <SEO 
        title="LANForge | Custom Gaming PC Builder"
        description="Build your dream gaming PC with our interactive configurator. High‑performance custom builds for gamers and creators."
        url="https://lanforge.co/"
        schema={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "LANForge",
          "url": "https://lanforge.co",
          "logo": "https://lanforge.co/logo512.png",
          "description": "Premium custom gaming PC builder. Design your ultimate gaming rig with cutting-edge components.",
          "sameAs": [
            "https://twitter.com/LANForge",
            "https://instagram.com/LANForge"
          ]
        }}
      />
      <Hero />
      <ProductShowcase />
      <WhyLanforge />
      <Reviews />
      <FAQ />
      <Warranty />
    </>
  );
};

export default HomePage;
