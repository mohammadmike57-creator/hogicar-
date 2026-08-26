import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Apple, CreditCard } from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppleWallet: () => void;
  onGoogleWallet: () => void;
  walletStatus?: { appleWallet: boolean; googleWallet: boolean };
}

const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  onAppleWallet, 
  onGoogleWallet,
  walletStatus = { appleWallet: false, googleWallet: false }
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-8 shadow-2xl dark:bg-[#1c1816]"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#123C69]/10 text-[#123C69] dark:bg-[#F57C00]/10 dark:text-[#F57C00]">
                <Smartphone className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#123C69] dark:text-white">Add to Your Wallet</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Keep your rental details accessible directly from your phone, even offline.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={onAppleWallet}
                className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                  walletStatus.appleWallet 
                    ? 'border-slate-100 bg-slate-50 hover:border-[#123C69] hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-[#F57C00]' 
                    : 'border-slate-100 bg-slate-50 opacity-80'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black text-white">
                  <Apple className="h-6 w-6" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Apple Wallet</div>
                  <div className="text-xs text-slate-500">
                    {walletStatus.appleWallet ? 'Add to Apple Wallet' : 'Config Required (Admin)'}
                  </div>
                </div>
                {!walletStatus.appleWallet && (
                  <div className="rounded-full bg-slate-200 px-2 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                    Setup
                  </div>
                )}
              </button>
              
              <button
                onClick={onGoogleWallet}
                className={`group flex w-full items-center gap-4 rounded-2xl border-2 p-4 transition-all ${
                  walletStatus.googleWallet 
                    ? 'border-slate-100 bg-slate-50 hover:border-[#123C69] hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-[#F57C00]' 
                    : 'border-slate-100 bg-slate-50 opacity-80'
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-6 w-6">
                    <path d="M22.5 12c0-.83-.07-1.63-.2-2.4H12v4.56h5.89c-.25 1.37-1.02 2.53-2.18 3.3v2.74h3.53c2.06-1.9 3.26-4.7 3.26-8.2z" fill="#4285F4"/>
                    <path d="M12 22.7c2.89 0 5.31-.96 7.08-2.6l-3.53-2.74c-.98.66-2.23 1.05-3.55 1.05-2.72 0-5.02-1.84-5.84-4.31H2.52v2.8C4.3 20.43 7.9 22.7 12 22.7z" fill="#34A853"/>
                    <path d="M6.16 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.1H2.52c-.77 1.54-1.21 3.27-1.21 5.1s.44 3.56 1.21 5.1l3.64-2.8z" fill="#FBBC05"/>
                    <path d="M12 5.58c1.57 0 2.98.54 4.09 1.6l3.07-3.07C17.3 2.37 14.89 1.3 12 1.3 7.9 1.3 4.3 3.57 2.52 7.1l3.64 2.8c.82-2.47 3.12-4.32 5.84-4.32z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Google Wallet</div>
                  <div className="text-xs text-slate-500">
                    {walletStatus.googleWallet ? 'Save to Google Wallet' : 'Config Required (Admin)'}
                  </div>
                </div>
                {!walletStatus.googleWallet && (
                  <div className="rounded-full bg-slate-200 px-2 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                    Setup
                  </div>
                )}
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="mt-6 w-full py-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WalletModal;
