import * as React from 'react';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import User from 'lucide-react/dist/esm/icons/user';
import { Link } from 'react-router-dom';
import { fetchRelatedBlogs, fetchHomepageFeaturedBlogs } from '../api';
import { BlogArticle } from '../types';
import { API_BASE_URL } from '../lib/config';

interface LatestTravelGuidesProps {
  route?: string;
  country?: string;
  airport?: string;
  destination?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
  variant?: 'DEFAULT' | 'HOMEPAGE';
}

const LatestTravelGuides: React.FC<LatestTravelGuidesProps> = ({
  route = '/',
  country,
  airport,
  destination,
  limit = 6,
  title,
  subtitle,
  variant
}) => {
  const isHomepage = variant === 'HOMEPAGE' || route === '/';
  const [articles, setArticles] = React.useState<BlogArticle[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Default text based on context
  const defaultTitle = route === '/' 
    ? "Latest Travel Guides & Tips" 
    : "Latest Travel Guides & Tips";
    
  const defaultSubtitle = route === '/'
    ? "Discover travel advice, destination guides, airport information, driving tips, and expert recommendations from around the world."
    : "Discover travel advice, destination guides, airport information, driving tips, and expert recommendations related to this destination.";

  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;

  React.useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true);
      try {
        let data: BlogArticle[] = [];
        if (route === '/') {
          data = await fetchHomepageFeaturedBlogs();
        } else {
          data = await fetchRelatedBlogs(destination || route, country, airport, limit);
        }
        setArticles(data);
      } catch (error) {
        console.error('Error loading travel guides:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, [route, country, airport, limit]);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest mb-6"
            >
              Travel Insights
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight"
            >
              {displayTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed"
            >
              {displaySubtitle}
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link
              to="/blog"
              className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all group"
            >
              View All Articles
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].slice(0, isHomepage ? 6 : 3).map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 aspect-[4/3] rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <BlogCard 
                key={article.id || index} 
                article={article} 
                index={index} 
                largeImage={isHomepage}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const BlogCard: React.FC<{ article: BlogArticle; index: number; largeImage?: boolean }> = ({ article, index, largeImage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/blog/${article.slug}`} className="block">
        <div className={`relative ${largeImage ? 'aspect-[16/10]' : 'aspect-[4/3]'} rounded-[2.5rem] overflow-hidden mb-8 shadow-xl shadow-slate-200/50`}>
          <img
            src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {article.category && (
            <div className="absolute top-6 left-6">
              <span className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-700 shadow-lg">
                {article.category.name}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-emerald-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        <div className="space-y-4 px-2">
          <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-emerald-500" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-emerald-500" />
              {article.readingTime || '5 min'}
            </span>
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight tracking-tight">
            {article.title}
          </h3>
          
          <p className="text-slate-500 font-medium line-clamp-2 text-sm leading-relaxed">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between pt-4">
             <div className="flex items-center text-emerald-600 font-black text-[10px] uppercase tracking-widest">
                Explore More
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ArrowRight className="w-5 h-5" />
             </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LatestTravelGuides;
