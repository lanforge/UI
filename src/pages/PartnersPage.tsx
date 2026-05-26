import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandshake, faNewspaper } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { motion } from 'framer-motion';

interface OrganizationPartner {
  id: number;
  name: string;
  description: string;
  logoColor: string;
  logo?: string;
  category: string;
  partnershipType: string;
  since: string;
  website: string;
  social?: {
    twitter?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
  };
}

interface IndividualPartner {
  id: number;
  name: string;
  role: string;
  description: string;
  avatarColor: string;
  logo?: string;
  social: {
    twitter?: string;
    twitch?: string;
    youtube?: string;
    instagram?: string;
  };
}

const PartnersPage: React.FC = () => {
  const [organizationPartners, setOrganizationPartners] = React.useState<OrganizationPartner[]>([]);
  const [individualPartners, setIndividualPartners] = React.useState<IndividualPartner[]>([]);

  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/partners`)
      .then(res => res.json())
      .then(data => {
        if (data.partners) {
          const orgs = data.partners
            .filter((p: any) => p.partnerType === 'brand')
            .map((p: any) => ({
              id: p._id,
              name: p.name,
              description: p.description || '',
              logoColor: '#ff6b35',
              logo: p.logo,
              category: 'Partner',
              partnershipType: 'Brand Partner',
              since: new Date(p.createdAt).getFullYear().toString(),
              website: p.website || '#',
              social: {
                twitter: p.twitter,
                twitch: p.twitch,
                youtube: p.youtube,
                instagram: p.instagram
              }
            }));
            
          const inds = data.partners
            .filter((p: any) => p.partnerType === 'individual' || (!p.partnerType && p.isPartner)) // Fallback for existing partners if not migrated
            .map((p: any) => ({
              id: p._id,
              name: p.name,
              role: 'Partner',
              description: p.description || '',
              avatarColor: '#3a86ff',
              logo: p.logo,
              social: {
                twitter: p.twitter,
                twitch: p.twitch,
                youtube: p.youtube,
                instagram: p.instagram
              }
            }));
            
          setOrganizationPartners(orgs);
          setIndividualPartners(inds);
        }
      })
      .catch(err => console.error(err));
  }, []);
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 md:pt-16 pb-8">
        <div className="absolute inset-0 bg-gradient-radial from-emerald-400/10 via-transparent to-transparent" />
        <div className="container-narrow relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="heading-1 mb-4">
              Our Partners
            </h1>
            <p className="body-large max-w-3xl mx-auto">
              Collaborating with industry leaders and experts to deliver exceptional PC building experiences
            </p>
          </motion.div>
        </div>
      </section>

      {/* Organization Partners */}
      <section className="pt-4 pb-10">
        <div className="container-narrow">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16"
          >
            <div className="mb-8 border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold text-white">Brand Partners</h2>
              <p className="text-gray-400 mt-1">
                Collaborating with industry leaders to bring you the best technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {organizationPartners.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.05 }}
                  className="card-glow p-6 flex flex-col"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {partner.logo ? (
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        className="w-16 h-16 rounded-xl object-contain bg-gray-900 flex-shrink-0" 
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: partner.logoColor }}
                      >
                        {partner.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{partner.name}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                          {partner.category}
                        </span>
                        <span className="px-3 py-1 bg-emerald-500/20 rounded-full text-sm text-emerald-400">
                          {partner.partnershipType}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">Partner since {partner.since}</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-300 mb-6 flex-grow">{partner.description}</p>
                  
                  <div className="flex items-center gap-3 mb-6">
                    {partner.social?.twitter && (
                      <a href={partner.social.twitter.startsWith('http') ? partner.social.twitter : `https://twitter.com/${partner.social.twitter}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        𝕏
                      </a>
                    )}
                    {partner.social?.twitch && (
                      <a href={partner.social.twitch.startsWith('http') ? partner.social.twitch : `https://twitch.tv/${partner.social.twitch}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faTwitch} className="text-purple-400" />
                      </a>
                    )}
                    {partner.social?.youtube && (
                      <a href={partner.social.youtube.startsWith('http') ? partner.social.youtube : `https://youtube.com/@${partner.social.youtube}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faYoutube} className="text-red-400" />
                      </a>
                    )}
                    {partner.social?.instagram && (
                      <a href={partner.social.instagram.startsWith('http') ? partner.social.instagram : `https://instagram.com/${partner.social.instagram}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faInstagram} className="text-pink-400" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                    {partner.website && partner.website !== '#' ? (
                      <a 
                        href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gradient-neon font-medium hover:underline text-sm"
                      >
                        Visit Website →
                      </a>
                    ) : (
                      <span className="text-gray-500 text-sm">No website available</span>
                    )}
                    <div className="text-sm text-gray-400">
                      Brand Partner
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Individual Partners */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="mb-8 border-b border-gray-800 pb-4 mt-16">
              <h2 className="text-2xl font-bold text-white">Individual Partners</h2>
              <p className="text-gray-400 mt-1">
                Working with creators and experts to share unique perspectives.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {individualPartners.map((partner, idx) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.05 }}
                  className="card-glow p-6 flex flex-col"
                >
                  <div className="text-center mb-6">
                    {partner.logo ? (
                      <img 
                        src={partner.logo} 
                        alt={partner.name} 
                        className="w-24 h-24 rounded-lg object-cover mx-auto mb-4 bg-gray-900 border-2 border-gray-800"
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-lg mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white border-2 border-gray-800"
                        style={{ backgroundColor: partner.avatarColor }}
                      >
                        {partner.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-white mb-1">{partner.name}</h3>
                    <div className="text-gradient-neon font-medium mb-2">{partner.role}</div>
                    <div className="text-sm text-gray-400">LANForge Partner</div>
                  </div>
                  
                  <p className="text-gray-300 mb-6 flex-grow text-center">{partner.description}</p>
                  
                  <div className="flex items-center justify-center gap-4 mt-auto">
                    {partner.social.twitter && (
                      <a 
                        href={partner.social.twitter.startsWith('http') ? partner.social.twitter : `https://twitter.com/${partner.social.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        𝕏
                      </a>
                    )}
                    {partner.social.twitch && (
                      <a 
                        href={partner.social.twitch.startsWith('http') ? partner.social.twitch : `https://twitch.tv/${partner.social.twitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faTwitch} className="text-purple-400" />
                      </a>
                    )}
                    {partner.social.youtube && (
                      <a 
                        href={partner.social.youtube.startsWith('http') ? partner.social.youtube : `https://youtube.com/@${partner.social.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faYoutube} className="text-red-400" />
                      </a>
                    )}
                    {partner.social.instagram && (
                      <a 
                        href={partner.social.instagram.startsWith('http') ? partner.social.instagram : `https://instagram.com/${partner.social.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                      >
                        <FontAwesomeIcon icon={faInstagram} className="text-pink-400" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default PartnersPage;
                   