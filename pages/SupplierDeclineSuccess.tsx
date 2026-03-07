import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

const SupplierDeclineSuccess: React.FC = () => {
  const location = useLocation();
  const { bookingRef } = location.state || { bookingRef: 'your booking' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" variant="light" />
            <h1 className="text-2xl font-bold">Booking Declined</h1>
          </div>
        </div>
        <div className="p-8 text-center">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking declined</h2>
          <p className="text-gray-600 mb-6">
            Booking <span className="font-bold">{bookingRef}</span> has been declined.
            The customer has been notified with the reason you provided.
          </p>
          <Link
            to="/supplier-dashboard"
            className="inline-block bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SupplierDeclineSuccess;
