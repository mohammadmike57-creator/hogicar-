import * as React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Logo } from '../components/Logo';

const SupplierConfirmSuccess: React.FC = () => {
  const location = useLocation();
  const { bookingRef } = location.state || { bookingRef: 'your booking' };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" variant="light" />
            <h1 className="text-2xl font-bold">Booking Confirmed</h1>
          </div>
        </div>
        <div className="p-8 text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-6">
            Booking <span className="font-bold">{bookingRef}</span> has been successfully confirmed.
            The customer has been notified and a voucher has been sent.
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

export default SupplierConfirmSuccess;
