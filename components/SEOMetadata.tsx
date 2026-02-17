
import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { MOCK_SEO_CONFIGS } from '../services/mockData';

interface SEOMetadataProps {
  title: string;
  description: string;
  noIndex?: boolean;
}

const SEOMetadata: React.FC<SEOMetadataProps> = ({ title: defaultTitle, description: defaultDescription, noIndex }) => {
  const location = useLocation();

  // Find override configuration in mock data based on current pathname
  // In a real app, this would be fetched from an API or context
  const overrideConfig = MOCK_SEO_CONFIGS.find(c => c.route === location.pathname);

  const title = overrideConfig?.title || defaultTitle;
  const description = overrideConfig?.description || defaultDescription;
  const keywords = overrideConfig?.keywords || 'car rental, cheap car hire, auto rental, travel';
  const ogImage = overrideConfig?.ogImage || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1200&auto=format&fit=crop';

  React.useEffect(() => {
    // 1. Set Page Title
    document.title = title;

    // Helper to update or create meta tags
    const setMetaTag = (name: string, content: string, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);

    // 3. Open Graph Tags (Facebook, LinkedIn, etc)
    setMetaTag('og:title', title, 'property');
    setMetaTag('og:description', description, 'property');
    setMetaTag('og:image', ogImage, 'property');
    setMetaTag('og:url', window.location.href, 'property');
    setMetaTag('og:type', 'website', 'property');

    // 4. Twitter Card Tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

    // 5. Handle Robots tag (noindex)
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      // Ensure robots tag allows indexing if it was previously set to noindex
      const robotsTag = document.querySelector('meta[name="robots"]');
      if (robotsTag) {
        robotsTag.setAttribute('content', 'index, follow');
      }
    }

    // Cleanup function
    return () => {
      // Optional: Reset title or remove tags on unmount
    };
  }, [title, description, keywords, ogImage, noIndex, location]);

  return null; // This component doesn't render visual UI
};

export default SEOMetadata;