import * as React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Printer from 'lucide-react/dist/esm/icons/printer';
import User from 'lucide-react/dist/esm/icons/user';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CarIcon from 'lucide-react/dist/esm/icons/car';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import LoaderCircle from 'lucide-react/dist/esm/icons/loader-circle';
import Award from 'lucide-react/dist/esm/icons/award';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Info from 'lucide-react/dist/esm/icons/info';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Map from 'lucide-react/dist/esm/icons/map';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Download from 'lucide-react/dist/esm/icons/download';
import Zap from 'lucide-react/dist/esm/icons/zap';
import SEOMetadata from '../components/SEOMetadata';
import { useCurrency } from '../contexts/CurrencyContext';
import { api } from '../api';

const Voucher: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getCurrencySymbol } = useCurrency();

  const [booking, setBooking] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState('');

  React.useEffect(() => {
    const bookingRef = searchParams.get('bookingRef');
    if (!bookingRef) {
      navigate('/');
      return;
    }

    const loadVoucher = async () => {
      try {
        const data = await api.getBookingByRef(bookingRef);
        setBooking(data);
      } catch (err: any) {
        console.error('Voucher load error:', err);
        setError('Voucher not found. Please verify your booking reference.');
      } finally {
        setLoading(false);
      }
    };

    loadVoucher();
  }, [searchParams, navigate]);

  React.useEffect(() => {
    if (!booking || !booking.pickupDate) return;

    const targetDate = new Date(
      `${booking.pickupDate}T${booking.startTime || '10:00'}:00`
    ).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setCountdown('Picked Up / Ready');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec]">
        <LoaderCircle className="h-10 w-10 animate-spin text-[#e88b4a]" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f3ec] p-4 text-center">
        <AlertCircle className="mb-4 h-16 w-16 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-800">
          {error || 'Booking Not Found'}
        </h1>
        <Link
          to="/"
          className="mt-6 rounded-lg bg-[#e88b4a] px-6 py-2 font-bold text-white hover:bg-[#d97a35]"
        >
          Return Home
        </Link>
      </div>
    );
  }

  const renderPrice = (amount: number) => {
    const safeAmount = amount || 0;
    return `${booking.currency} ${safeAmount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f3ec] pb-20 text-[#1a1a1a] transition-colors duration-300 dark:bg-[#0f0e0d] dark:text-[#e8e0d8]">
      <SEOMetadata
        title={`Travel Credential - ${booking.bookingRef}`}
        description="Official HogiCar premium travel credential"
        noIndex
      />

      <style>{`
        /* ---------- TRAVEL CREDENTIAL STYLES ---------- */
        .credential {
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }

        .chapter {
          background: #ffffff;
          border-radius: 2rem;
          padding: 1.75rem 2rem 2rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(0, 0, 0, 0.02);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
          transition: background 0.4s ease, border-color 0.4s ease;
        }

        .dark .chapter {
          background: #1c1816;
          border-color: #2c2622;
        }

        .index {
          font-size: 0.55rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #b8a99a;
          margin-bottom: 0.75rem;
        }

        .dark .index {
          color: #6b5f55;
        }

        /* Opening */
        .opening {
          background: linear-gradient(145deg, #1a1a1a 0%, #2d2a26 100%);
          border-radius: 2rem;
          padding: 2.5rem 2.5rem 2rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .dark .opening {
          background: linear-gradient(145deg, #0f0e0d 0%, #1c1816 100%);
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-weight: 800;
          font-size: 1.3rem;
          color: #fff;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .brand-lockup b {
          color: #e88b4a;
        }

        .brand-mark {
          display: inline-block;
          width: 30px;
          height: 30px;
          background: #e88b4a;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
        }

        .brand-mark::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 14px;
          height: 7px;
          background: #fff;
          border-radius: 3px 3px 0 0;
          box-shadow: 0 5px 0 #fff;
        }

        .opening .status {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #7ccf9e;
          background: rgba(124, 207, 158, 0.12);
          display: inline-block;
          padding: 0.2rem 0.8rem;
          border-radius: 100px;
          border: 1px solid rgba(124, 207, 158, 0.15);
        }

        .opening .reference {
          font-size: 2.8rem;
          font-weight: 900;
          color: #e88b4a;
          letter-spacing: -0.02em;
          margin-top: 0.25rem;
          font-family: 'Inter', sans-serif;
        }

        .hero-car {
          width: 100%;
          max-width: 380px;
          height: auto;
          display: block;
          margin: 0.5rem auto 0;
          filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.4));
          transition: transform 0.6s ease;
        }

        .hero-car:hover {
          transform: scale(1.02);
        }

        /* Vehicle name */
        .vehicle-name {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .vehicle-name h1 {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #1a1a1a;
        }

        .dark .vehicle-name h1 {
          color: #f0e8e0;
        }

        .vehicle-name span {
          font-size: 0.8rem;
          font-weight: 500;
          color: #b8a99a;
          font-style: italic;
        }

        .quiet-specs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .quiet-specs div {
          display: flex;
          flex-direction: column;
        }

        .quiet-specs dt {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #b8a99a;
        }

        .quiet-specs dd {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .dark .quiet-specs dd {
          color: #e8e0d8;
        }

        @media (max-width: 480px) {
          .quiet-specs {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Gate panel */
        .gate-panel {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1rem 1.5rem;
        }

        .gate-panel div {
          display: flex;
          flex-direction: column;
        }

        .gate-panel .label {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #b8a99a;
        }

        .gate-panel strong {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .dark .gate-panel strong {
          color: #e8e0d8;
        }

        @media (max-width: 560px) {
          .gate-panel {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Supplier */
        .supplier-lockup {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .supplier-lockup img {
          height: 32px;
          width: auto;
          filter: brightness(0);
        }

        .dark .supplier-lockup img {
          filter: brightness(0) invert(1) opacity(0.8);
        }

        .supplier-lockup h2 {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a1a1a;
        }

        .dark .supplier-lockup h2 {
          color: #e8e0d8;
        }

        .supplier-lines {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
        }

        .supplier-lines p {
          color: #4a4440;
          font-weight: 500;
        }

        .dark .supplier-lines p {
          color: #b0a89e;
        }

        .supplier-lines a {
          color: #e88b4a;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }

        .supplier-lines a:hover {
          color: #d97a35;
        }

        .supplier-lines span {
          color: #b8a99a;
          font-weight: 500;
        }

        /* Member card */
        .member-card {
          background: #f7f3ec;
          border-radius: 1.5rem;
          padding: 1.25rem 1.5rem;
        }

        .dark .member-card {
          background: #2c2622;
        }

        .member-card > span {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #b8a99a;
        }

        .member-card strong {
          display: block;
          font-size: 1.4rem;
          font-weight: 800;
          color: #1a1a1a;
          margin-bottom: 0.75rem;
        }

        .dark .member-card strong {
          color: #f0e8e0;
        }

        .member-card dl {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem 1rem;
        }

        .member-card dl div {
          display: flex;
          flex-direction: column;
        }

        .member-card dl dt {
          font-size: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #b8a99a;
        }

        .member-card dl dd {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a1a;
        }

        .dark .member-card dl dd {
          color: #e8e0d8;
        }

        @media (max-width: 480px) {
          .member-card dl {
            grid-template-columns: 1fr;
          }
        }

        /* Line ledger */
        .line-ledger {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1.5rem;
        }

        .line-ledger div {
          display: flex;
          flex-direction: column;
        }

        .line-ledger span {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #b8a99a;
        }

        .line-ledger strong {
          font-size: 0.9rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .dark .line-ledger strong {
          color: #e8e0d8;
        }

        @media (max-width: 480px) {
          .line-ledger {
            grid-template-columns: 1fr;
          }
        }

        .insurance {
          margin-top: -0.75rem;
        }

        /* QR Check In */
        .checkin-section {
          text-align: center;
          background: linear-gradient(145deg, #1a1a1a 0%, #2d2a26 100%);
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .dark .checkin-section {
          background: linear-gradient(145deg, #0f0e0d 0%, #1c1816 100%);
        }

        .checkin-section .index {
          color: #6b5f55;
        }

        .checkin-section h2 {
          color: #fff;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-top: 0.5rem;
        }

        .qr-credential {
          display: inline-block;
          padding: 1rem;
          background: #fff;
          border-radius: 1.5rem;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }

        .qr-credential:hover {
          transform: scale(1.03);
        }

        .qr-credential svg {
          display: block;
          width: 120px;
          height: 120px;
          color: #1a1a1a;
        }

        /* Wallet World */
        .wallet-world {
          background: #ffffff;
          border-radius: 2rem;
          padding: 1.75rem 2rem 2rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(0, 0, 0, 0.02);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.02);
        }

        .dark .wallet-world {
          background: #1c1816;
          border-color: #2c2622;
        }

        .wallet-intro h2 {
          font-size: 1.6rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1a1a1a;
        }

        .dark .wallet-intro h2 {
          color: #f0e8e0;
        }

        .wallet-intro p {
          color: #8a8078;
          font-size: 0.9rem;
          max-width: 500px;
          margin-bottom: 1.5rem;
        }

        .dark .wallet-intro p {
          color: #9a9088;
        }

        .phones {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .phone {
          border-radius: 2.5rem;
          padding: 1rem 0.75rem 1.25rem;
          background: #0f0e0d;
          border: 1px solid rgba(255, 255, 255, 0.04);
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease;
        }

        .phone:hover {
          transform: translateY(-4px);
        }

        .iphone {
          background: #000;
        }

        .island {
          width: 90px;
          height: 24px;
          background: #000;
          border-radius: 0 0 14px 14px;
          margin: 0 auto 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-top: none;
        }

        .notification {
          background: rgba(255, 255, 255, 0.04);
          border-radius: 100px;
          padding: 0.3rem 0.8rem;
          font-size: 0.55rem;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          margin-bottom: 0.6rem;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .apple-pass {
          background: #fff;
          border-radius: 1.5rem;
          padding: 1rem;
          position: relative;
          overflow: hidden;
        }

        .pass-glow {
          position: absolute;
          top: -30%;
          right: -20%;
          width: 80px;
          height: 80px;
          background: radial-gradient(
            circle,
            rgba(232, 139, 74, 0.15),
            transparent
          );
          border-radius: 50%;
          pointer-events: none;
        }

        .pass-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 700;
          color: #e88b4a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pass-head strong {
          color: #7ccf9e;
          font-weight: 700;
        }

        .apple-pass img {
          width: 100%;
          max-height: 70px;
          object-fit: contain;
          margin: 0.25rem 0;
        }

        .wallet-ref {
          font-size: 0.8rem;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.01em;
        }

        .wallet-route {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .wallet-route span:first-child {
          color: #e88b4a;
        }

        .wallet-route i {
          flex: 1;
          height: 2px;
          background: repeating-linear-gradient(
            90deg,
            #d0c8c0 0px,
            #d0c8c0 4px,
            transparent 4px,
            transparent 8px
          );
        }

        .wallet-meta {
          font-size: 0.6rem;
          color: #8a8078;
          font-weight: 500;
        }

        .wallet-qr {
          height: 32px;
          background: repeating-linear-gradient(
            90deg,
            #1a1a1a 0px,
            #1a1a1a 4px,
            transparent 4px,
            transparent 8px
          );
          border-radius: 4px;
          margin-top: 0.4rem;
          opacity: 0.6;
        }

        .wallet-back {
          background: #f7f3ec;
          border-radius: 1rem;
          padding: 0.6rem 1rem;
          margin-top: 0.6rem;
          border: 1px dashed #d0c8c0;
        }

        .wallet-back strong {
          display: block;
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #8a8078;
        }

        .wallet-back span {
          display: inline-block;
          font-size: 0.6rem;
          color: #4a4440;
          background: #fff;
          padding: 0.1rem 0.6rem;
          border-radius: 100px;
          margin: 0.15rem 0.2rem 0 0;
          font-weight: 500;
        }

        .android {
          background: #1c1816;
        }

        .android-camera {
          height: 4px;
          width: 50px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin: 0 auto 0.5rem;
        }

        .material-notification {
          font-size: 0.5rem;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          margin-bottom: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.2rem;
          border-radius: 100px;
        }

        .google-pass {
          background: #fff;
          border-radius: 1.5rem;
          padding: 1rem;
          border-left: 4px solid #4285f4;
          position: relative;
        }

        .google-ribbon {
          position: absolute;
          top: 0;
          right: 0;
          width: 40px;
          height: 40px;
          background: #4285f4;
          border-radius: 0 1.5rem 0 0;
          opacity: 0.08;
        }

        .google-pass > span {
          font-size: 0.55rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4285f4;
          background: #e8f0fe;
          display: inline-block;
          padding: 0.05rem 0.6rem;
          border-radius: 100px;
        }

        .google-pass img {
          width: 100%;
          max-height: 60px;
          object-fit: contain;
          margin: 0.25rem 0;
        }

        .google-pass strong {
          display: block;
          font-size: 0.9rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .google-pass em {
          font-size: 0.7rem;
          font-style: normal;
          color: #8a8078;
          font-weight: 500;
        }

        .material-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.7rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-top: 0.25rem;
        }

        .google-qr {
          width: 40px;
          height: 32px;
          background: repeating-linear-gradient(
            45deg,
            #1a1a1a 0px,
            #1a1a1a 4px,
            transparent 4px,
            transparent 8px
          );
          border-radius: 4px;
          margin-top: 0.4rem;
          opacity: 0.5;
        }

        .material-details {
          display: flex;
          justify-content: space-around;
          margin-top: 0.6rem;
          font-size: 0.5rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: rgba(255, 255, 255, 0.2);
        }

        @media (max-width: 680px) {
          .phones {
            grid-template-columns: 1fr;
            max-width: 380px;
            margin: 0 auto;
          }
          .opening {
            padding: 1.75rem 1.5rem 1.5rem;
          }
          .opening .reference {
            font-size: 2.2rem;
          }
          .hero-car {
            max-width: 280px;
          }
          .chapter {
            padding: 1.25rem 1.25rem 1.5rem;
          }
          .wallet-world {
            padding: 1.25rem 1.25rem 1.5rem;
          }
          .gate-panel {
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem 1rem;
          }
        }

        @media (max-width: 420px) {
          .gate-panel {
            grid-template-columns: 1fr;
          }
          .quiet-specs {
            grid-template-columns: 1fr 1fr;
          }
          .vehicle-name h1 {
            font-size: 1.5rem;
          }
        }

        /* Actions */
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          margin-top: 0.25rem;
        }

        .actions button {
          padding: 0.6rem 1.2rem;
          border-radius: 100px;
          border: 1px solid #e0d8d0;
          background: #ffffff;
          color: #1a1a1a;
          font-weight: 600;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }

        .dark .actions button {
          background: #2c2622;
          color: #e8e0d8;
          border-color: #4a4440;
        }

        .actions button:hover {
          transform: scale(0.94);
          background: #f0ece6;
        }

        .dark .actions button:hover {
          background: #3a3430;
        }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 2rem;
          left: 50%;
          transform: translateX(-50%) translateY(80px);
          background: #1a1a1a;
          color: #f0e8e0;
          padding: 0.6rem 1.5rem;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 500;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
          opacity: 0;
          transition: all 0.4s ease;
          z-index: 1000;
          border: 1px solid rgba(255, 255, 255, 0.04);
          pointer-events: none;
          white-space: nowrap;
          font-family: 'Inter', sans-serif;
        }

        .toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @media (max-width: 480px) {
          .toast {
            white-space: normal;
            max-width: 90%;
            text-align: center;
            bottom: 1rem;
            font-size: 0.7rem;
          }
        }

        /* Print */
        @media print {
          body {
            background: #fff !important;
            padding: 0.5in !important;
          }
          .no-print {
            display: none !important;
          }
          .chapter,
          .opening,
          .wallet-world {
            box-shadow: none !important;
            border: 1px solid #e0d8d0 !important;
            break-inside: avoid;
          }
          .opening {
            background: #f7f3ec !important;
          }
          .opening .reference {
            color: #1a1a1a !important;
          }
          .opening .status {
            color: #1a1a1a !important;
            border-color: #1a1a1a !important;
            background: transparent !important;
          }
          .brand-lockup {
            color: #1a1a1a !important;
          }
          .hero-car {
            filter: none !important;
          }
          .qr-credential svg {
            color: #1a1a1a !important;
          }
          .checkin-section {
            background: #f7f3ec !important;
          }
          .checkin-section h2 {
            color: #1a1a1a !important;
          }
          .checkin-section .index {
            color: #b8a99a !important;
          }
          .supplier-lockup img {
            filter: brightness(0) !important;
          }
          .phone {
            background: #f7f3ec !important;
            border: 1px solid #d0c8c0 !important;
          }
          .iphone,
          .android {
            background: #f7f3ec !important;
          }
          .apple-pass,
          .google-pass {
            background: #fff !important;
          }
          .island,
          .android-camera {
            display: none !important;
          }
          .notification,
          .material-notification,
          .wallet-back,
          .material-details {
            display: none !important;
          }
          .pass-glow {
            display: none !important;
          }
          .wallet-qr,
          .google-qr {
            opacity: 0.3 !important;
          }
          .wallet-back {
            display: none !important;
          }
          .dark .chapter {
            background: #fff !important;
            border-color: #e0d8d0 !important;
          }
          .dark .wallet-world {
            background: #fff !important;
          }
          .dark .member-card {
            background: #f7f3ec !important;
          }
          .dark .member-card strong,
          .dark .member-card dl dd {
            color: #1a1a1a !important;
          }
          .dark .vehicle-name h1,
          .dark .gate-panel strong,
          .dark .line-ledger strong,
          .dark .supplier-lockup h2,
          .dark .wallet-intro h2,
          .dark .supplier-lines p {
            color: #1a1a1a !important;
          }
          .dark .supplier-lockup img {
            filter: brightness(0) !important;
          }
        }
      `}</style>

      <div className="credential">
        {/* ===== OPENING ===== */}
        <section className="opening" aria-label="Reservation summary">
          <div className="brand-lockup">
            <span className="brand-mark"></span>
            <span>
              HOGI<b>CAR</b>
            </span>
          </div>
          <div className="status">Confirmed</div>
          <div className="reference">{booking.bookingRef}</div>
          <img
            className="hero-car"
            src={
              booking.carImageUrl ||
              'https://platform.cstatic-images.com/xxlarge/in/v2/stock_photos/71e0a363-bc0a-42ff-9f20-efa039bce8ca/13138638-3b68-4598-9585-d24866066be2.png'
            }
            alt={`${booking.carMake} ${booking.carModel} or similar`}
          />
        </section>

        {/* ===== VEHICLE ===== */}
        <section className="vehicle chapter" aria-label="Vehicle">
          <p className="index">01 / Vehicle</p>
          <div className="vehicle-name">
            <h1>
              {booking.carMake} {booking.carModel}
            </h1>
            <span>or Similar</span>
          </div>
          <dl className="quiet-specs">
            <div>
              <dt>Class</dt>
              <dd>{booking.carCategory || 'Economy Elite'}</dd>
            </div>
            <div>
              <dt>Transmission</dt>
              <dd>{booking.carTransmission || 'Automatic'}</dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>{booking.carPassengers || 5}</dd>
            </div>
            <div>
              <dt>Bags</dt>
              <dd>{booking.carBags || 2}</dd>
            </div>
          </dl>
        </section>

        {/* ===== PICKUP ===== */}
        <section className="pickup chapter" aria-label="Pickup experience">
          <p className="index">02 / Pickup</p>
          <div className="gate-panel">
            <div>
              <span className="label">Airport</span>
              <strong>{booking.pickupLocationName || 'Queen Alia International Airport'}</strong>
            </div>
            <div>
              <span className="label">Terminal</span>
              <strong>{booking.pickupTerminal || '1'}</strong>
            </div>
            <div>
              <span className="label">Counter</span>
              <strong>{booking.counter || 'B22'}</strong>
            </div>
            <div>
              <span className="label">Meet & Greet</span>
              <strong>Representative Waiting</strong>
            </div>
            <div>
              <span className="label">Pickup Time</span>
              <strong id="pickup-display">
                {formatDate(booking.pickupDate)} · {formatTime(booking.startTime || '10:30')}
              </strong>
            </div>
            <div>
              <span className="label">Walking Time</span>
              <strong>4 min</strong>
            </div>
            <div>
              <span className="label">Office Hours</span>
              <strong>24 hours</strong>
            </div>
          </div>
        </section>

        {/* ===== SUPPLIER ===== */}
        <section className="supplier chapter" aria-label="Supplier">
          <p className="index">03 / Supplier</p>
          <div className="supplier-lockup">
            {booking.supplierLogoUrl ? (
              <img src={booking.supplierLogoUrl} alt={`${booking.supplierName} logo`} />
            ) : (
              <img
                src="https://logos-world.net/wp-content/uploads/2021/08/Hertz-Logo.png"
                alt="Hertz logo"
              />
            )}
            <h2>{booking.supplierName || 'Hertz Rent A Car'}</h2>
          </div>
          <div className="supplier-lines">
            <p>
              {booking.pickupAddress ||
                `${booking.pickupLocationName || 'Queen Alia International Airport'}, Terminal ${booking.pickupTerminal || '1'}, Arrival Level, Counter ${booking.counter || 'B22'}`}
            </p>
            <a href={`tel:${booking.supplierPhone || '+96264711771'}`}>
              {booking.supplierPhone || '+962 6 471 1771'}
            </a>
            <a
              href={`https://wa.me/${(booking.supplierPhone || '+96264711771').replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
            <a
              href={`mailto:${booking.supplierEmail || 'CustomerRelationsMEA@hertz.com'}?subject=HogiCar%20Booking%20${booking.bookingRef}`}
            >
              {booking.supplierEmail || 'CustomerRelationsMEA@hertz.com'}
            </a>
            <span>Business Hours · 24 hours</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.pickupLocationName || 'Hertz Queen Alia International Airport')}`}
              target="_blank"
              rel="noreferrer"
            >
              Open Map
            </a>
          </div>
        </section>

        {/* ===== CUSTOMER ===== */}
        <section className="customer chapter" aria-label="Customer">
          <p className="index">04 / Customer</p>
          <div className="member-card">
            <span>Primary Driver</span>
            <strong>
              {booking.firstName} {booking.lastName}
            </strong>
            <dl>
              <div>
                <dt>Nationality</dt>
                <dd>{booking.country || 'United Kingdom'}</dd>
              </div>
              <div>
                <dt>License Country</dt>
                <dd>{booking.licenseCountry || 'United Kingdom'}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{booking.phone || '+44 7700 900123'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* ===== PAYMENT ===== */}
        <section className="financial chapter" aria-label="Payment and insurance">
          <p className="index">05 / Payment</p>
          <div className="line-ledger">
            <div>
              <span>Payment</span>
              <strong>Prepaid rental</strong>
            </div>
            <div>
              <span>Deposit</span>
              <strong>{renderPrice(booking.depositRequired || 500)} pre-authorization</strong>
            </div>
            <div>
              <span>Fuel</span>
              <strong>{booking.carFuelPolicy || 'Full to Full'}</strong>
            </div>
            <div>
              <span>Mileage</span>
              <strong>
                {booking.unlimitedMileage ? 'Unlimited within Jordan' : booking.mileage || 'Unlimited'}
              </strong>
            </div>
          </div>
        </section>

        {/* ===== INSURANCE ===== */}
        <section className="financial chapter insurance" aria-label="Insurance">
          <p className="index">06 / Insurance</p>
          <div className="line-ledger">
            <div>
              <span>Included</span>
              <strong>CDW + Theft Protection</strong>
            </div>
            <div>
              <span>Documents</span>
              <strong>License · Passport · Credit Card</strong>
            </div>
            <div>
              <span>Age</span>
              <strong>Minimum {booking.minimumDriverAge || 21}</strong>
            </div>
            <div>
              <span>Border Crossing</span>
              <strong>Supplier approval required</strong>
            </div>
          </div>
        </section>

        {/* ===== QR CHECK IN ===== */}
        <section className="checkin-section chapter" aria-label="QR check in">
          <p className="index">07 / Check In</p>
          <a
            className="qr-credential"
            href={`https://hogicar.com/voucher/${booking.bookingRef}`}
            target="_blank"
            rel="noreferrer"
            aria-label="Open live booking"
          >
            <svg viewBox="0 0 128 128" aria-hidden="true">
              <path
                d="M10 10h34v34H10zM84 10h34v34H84zM10 84h34v34H10z"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
              />
              <path
                d="M20 20h14v14H20zM94 20h14v14H94zM20 94h14v14H20zM56 10h10v10H56zM72 10h8v8H72zM54 30h14v12H54zM76 30h8v8H76zM52 52h24v24H52zM84 52h10v10H84zM104 52h14v8h-14zM52 86h8v32h-8zM68 84h16v10H68zM92 82h26v10H92zM72 102h12v16H72zM94 102h8v8h-8zM110 110h8v8h-8z"
                fill="currentColor"
              />
            </svg>
          </a>
          <h2>Scan to Check In</h2>
        </section>

        {/* ===== WALLET EXPERIENCE ===== */}
        <section className="wallet-world" aria-label="Digital wallet experience">
          <p className="index">08 / Wallet Experience</p>
          <div className="wallet-intro">
            <h2>Designed to live in Wallet.</h2>
            <p>
              Lock screen, opened pass, expanded details and QR screen are part of
              the same premium travel credential.
            </p>
          </div>

          <div className="phones">
            {/* Apple Wallet */}
            <article className="phone iphone" aria-label="Apple Wallet preview">
              <div className="island"></div>
              <div className="notification">
                HogiCar · Pickup at {booking.pickupCode || 'AMM'} in 4 min
              </div>
              <div className="apple-pass">
                <div className="pass-glow"></div>
                <div className="pass-head">
                  <span>HogiCar</span>
                  <strong>Confirmed</strong>
                </div>
                <img
                  src={
                    booking.carImageUrl ||
                    'https://platform.cstatic-images.com/xxlarge/in/v2/stock_photos/71e0a363-bc0a-42ff-9f20-efa039bce8ca/13138638-3b68-4598-9585-d24866066be2.png'
                  }
                  alt=""
                />
                <div className="wallet-ref">{booking.bookingRef}</div>
                <div className="wallet-route">
                  <span>{booking.pickupCode || 'AMM'}</span>
                  <i></i>
                  <span>{formatTime(booking.startTime || '10:30')}</span>
                </div>
                <div className="wallet-meta">
                  {booking.supplierName || 'Hertz'} · Terminal {booking.pickupTerminal || '1'} · Counter{' '}
                  {booking.counter || 'B22'}
                </div>
                <div className="wallet-qr"></div>
              </div>
              <div className="wallet-back">
                <strong>Details</strong>
                <span>
                  Customer · {booking.firstName} {booking.lastName}
                </span>
                <span>
                  Vehicle · {booking.carMake} {booking.carModel}
                </span>
                <span>Pickup · Representative Waiting</span>
              </div>
            </article>

            {/* Google Wallet */}
            <article className="phone android" aria-label="Google Wallet preview">
              <div className="android-camera"></div>
              <div className="material-notification">
                Google Wallet · {booking.supplierName || 'Hertz'} counter nearby
              </div>
              <div className="google-pass">
                <div className="google-ribbon"></div>
                <span>HogiCar Rental Pass</span>
                <img
                  src={
                    booking.carImageUrl ||
                    'https://platform.cstatic-images.com/xxlarge/in/v2/stock_photos/71e0a363-bc0a-42ff-9f20-efa039bce8ca/13138638-3b68-4598-9585-d24866066be2.png'
                  }
                  alt=""
                />
                <strong>
                  {booking.firstName} {booking.lastName}
                </strong>
                <em>{booking.bookingRef}</em>
                <div className="material-row">
                  <span>{booking.pickupCode || 'AMM'}</span>
                  <span>
                    {formatDate(booking.pickupDate)} · {formatTime(booking.startTime || '10:30')}
                  </span>
                </div>
                <div className="google-qr"></div>
              </div>
              <div className="material-details">
                <span>Expanded pass</span>
                <span>QR screen</span>
                <span>Pickup reminder</span>
              </div>
            </article>
          </div>
        </section>

        {/* ===== ACTIONS ===== */}
        <nav className="actions no-print" aria-label="Actions">
          <button type="button" data-action="apple">
            Apple Wallet
          </button>
          <button type="button" data-action="google">
            Google Wallet
          </button>
          <button type="button" data-action="calendar">
            Calendar
          </button>
          <button type="button" data-action="share">
            Share
          </button>
          <button type="button" data-action="pdf">
            PDF
          </button>
          <button type="button" data-action="dark">
            Dark
          </button>
        </nav>
      </div>

      {/* ===== TOAST ===== */}
      <div id="toast" className="toast" role="status" aria-live="polite"></div>

      {/* ===== SCRIPT ===== */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              'use strict';

              const toastEl = document.getElementById('toast');
              let toastTimeout;

              function showToast(message) {
                if (!toastEl) return;
                toastEl.textContent = message;
                toastEl.classList.add('show');
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => {
                  toastEl.classList.remove('show');
                }, 2800);
              }

              function addToCalendar() {
                const start = new Date(2026, 7, 15, 10, 30);
                const end = new Date(2026, 7, 18, 9, 30);
                const ics = [
                  'BEGIN:VCALENDAR',
                  'VERSION:2.0',
                  'BEGIN:VEVENT',
                  'SUMMARY:HogiCar Rental - Toyota Corolla Hybrid (HC-8KD93XQ)',
                  'LOCATION:Queen Alia International Airport, Terminal 1, Counter B22, Amman, Jordan',
                  'DESCRIPTION:Pickup your rental vehicle. Booking ref: HC-8KD93XQ. Supplier: Hertz.',
                  'DTSTART:' + start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                  'DTEND:' + end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
                  'END:VEVENT',
                  'END:VCALENDAR'
                ].join('\\n');
                const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'HogiCar_pickup.ics';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                showToast('📅 Calendar event downloaded (.ics)');
              }

              function shareVoucher() {
                const text = 'My HogiCar rental voucher HC-8KD93XQ for Toyota Corolla Hybrid pickup Aug 15 at Amman Airport.';
                if (navigator.share) {
                  navigator.share({
                    title: 'HogiCar Rental Voucher',
                    text: text,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text + ' ' + window.location.href).then(() => {
                    showToast('📋 Voucher details copied to clipboard!');
                  }).catch(() => {
                    showToast('📋 Please copy manually: ' + text);
                  });
                }
              }

              function downloadPDF() {
                showToast('📄 PDF ready – use Print > Save as PDF');
                window.print();
              }

              function walletAction(type) {
                if (type === 'apple') {
                  showToast('🧾 Apple Wallet pass generated (simulated)');
                } else if (type === 'google') {
                  showToast('📱 Google Wallet pass generated (simulated)');
                }
              }

              function toggleDarkMode() {
                document.body.classList.toggle('dark');
                document.body.classList.toggle('dark-mode');
                const isDark = document.body.classList.contains('dark') || document.body.classList.contains('dark-mode');
                showToast(isDark ? '🌙 Dark mode enabled' : '☀️ Light mode enabled');
              }

              document.addEventListener('click', function(e) {
                const button = e.target.closest('[data-action]');
                if (!button) return;
                const action = button.getAttribute('data-action');
                switch (action) {
                  case 'apple': walletAction('apple'); break;
                  case 'google': walletAction('google'); break;
                  case 'calendar': addToCalendar(); break;
                  case 'share': shareVoucher(); break;
                  case 'pdf': downloadPDF(); break;
                  case 'dark': toggleDarkMode(); break;
                  default: showToast('Action: ' + action);
                }
              });

              document.querySelectorAll('a[href="#"]').forEach(el => {
                el.addEventListener('click', function(e) { e.preventDefault(); });
              });

              document.addEventListener('keydown', function(e) {
                if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
                  toggleDarkMode();
                }
              });

              console.log('✅ HogiCar Travel Credential ready.');
            })();
          `,
        }}
      />
    </div>
  );
};

export default Voucher;
