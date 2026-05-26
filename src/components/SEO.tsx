import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  image?: string;
  url?: string;
  schema?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
  title = 'LANForge | Custom Gaming PC Builder',
  description = 'Build your dream gaming PC with our interactive configurator. High‑performance custom builds for gamers and creators.',
  type = 'website',
  name = 'LANForge',
  image = 'https://lanforge.co/logo512.png',
  url = 'https://lanforge.co',
  schema
}) => {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical Link */}
      {url && <link rel="canonical" href={url} />}
      
      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content="@LANForge" />
      <meta name="twitter:site" content="@LANForge" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data / JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
