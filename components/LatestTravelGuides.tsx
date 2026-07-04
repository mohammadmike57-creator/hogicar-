import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Calendar, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchRelatedBlogs, fetchHomepageFeaturedBlogs } from '../api';
import { BlogArticle } from '../types';

interface LatestTravelGuidesProps {
  route?: string;
  country?: string;
  airport?: string;
  destination?: string;
  limit?: number;
  title?: string;
  subtitle?: string;
}

const LatestTravelGuides: React.FC<LatestTravelGuidesProps> = ({
  route = '/',
  country,
  airport,
  destination,
  limit = 6,
  title,
  subtitle
}) => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4"
            >
              Travel Insights
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold text-slate-900 mb-4"
            >
              {displayTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-600"
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
            {[1, 2, 3].map((i) => (
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
              <BlogCard key={article.id || index} article={article} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const BlogCard: React.FC<{ article: BlogArticle; index: number }> = ({ article, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <Link to={`/blog/${article.slug}`} className="block">
        <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 shadow-xl shadow-slate-200/50">
          <img
            src={article.featuredImage ? (article.featuredImage.startsWith('/') && !article.featuredImage.startsWith('http') ? `${API_BASE_URL}${article.featuredImage}` : article.featuredImage) : 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=800'}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {article.category && (
            <div className="absolute top-6 left-6">
              <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-sm font-bold text-slate-900 shadow-lg">
                {article.category.name}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        <div className="space-y-4 px-2">
          <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.readingTime || '5 min read'}
            </span>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight">
            {article.title}
          </h3>
          
          <p className="text-slate-600 line-clamp-2 text-sm leading-relaxed">
            {article.excerpt}
          </p>
          
          <div className="flex items-center text-emerald-600 font-bold text-sm pt-2">
            Read Full Article
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default LatestTravelGuides;
