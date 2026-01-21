import * as React from 'react';
import { Booking, Car, Extra } from '../types';
import { calculatePrice, calculateBookingFinancials } from '../services/mockData';
import { useCurrency } from '../contexts/CurrencyContext';
import { X, Calendar, Clock, Phone, Plane, PlusCircle, Check, Save, ArrowRight, RefreshCw, CreditCard } from 'lucide-react';

interface ModifyBookingModalProps {
  booking: Booking;
  car: Car;
  isOpen: boolean;
  onClose: () => void;
  onSave: (modifications: Partial<Booking>) => void;
}

const ModifyBookingModal: React.FC<ModifyBookingModalProps> = ({ booking, car, isOpen, onClose, onSave }) => {
  // Form state
  const [startDate, setStartDate] = React.useState(booking.startDate);
  const [endDate, setEndDate] = React.useState(booking.endDate);
  const [startTime, setStartTime] = React.useState(booking.startTime || '10:00');
  const [endTime, setEndTime] = React.useState(booking.endTime || '10:00');
  const [phone, setPhone] = React.useState(booking.customerPhone || '');
  const [flightNumber, setFlightNumber] = React.useState(booking.flightNumber || '');
  const [selectedExtras, setSelectedExtras] = React.useState<Extra[]>(booking.selectedExtras || []);
  const [isSaving, setIsSaving] = React.useState(false);

  const { convertPrice, getCurrencySymbol } = useCurrency();

  // Price recalculation
  const priceDetails = React.useMemo(() => {
    const startD = new Date(startDate);
    const endD = new Date(endDate);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    if (days < 1) return { newTotal: booking.totalPrice, newPayNow: booking.amountPaidOnline, newPayAtDesk: booking.amountToPayAtDesk, priceDifference: 0, paymentDifference: 0 };

    const { total: newGrossTotal, netTotal: newNetTotal } = calculatePrice(car, days, startDate);

    const extrasTotal = selectedExtras.reduce((acc, extra) => {
        return acc + (extra.type === 'per_day' ? extra.price * days : extra.price);
    }, 0);

    const finalTotal = newGrossTotal + extrasTotal;
    const { payNow, payAtDesk } = calculateBookingFinancials(newGrossTotal, newNetTotal, extrasTotal, car.supplier);
    
    const priceDifference = finalTotal - booking.totalPrice;
    const paymentDifference = payNow - booking.amountPaidOnline;

    return {
      newTotal: finalTotal,
      newPayNow: payNow,
      newPayAtDesk: payAtDesk,
      priceDifference,
      paymentDifference
    };
  }, [startDate, endDate, selectedExtras, car, booking]);

  const toggleExtra = (extra: Extra) => {
    setSelectedExtras(prev => {
        const isSelected = prev.some(e => e.id === extra.id);
        if (isSelected) {
            return prev.filter(e => e.id !== extra.id);
        } else {
            return [...prev, extra];
        }
    });
  };

  const handleSave = () => {
    setIsSaving(true);
    const modifications: Partial<Booking> = {
      startDate,
      endDate,
      startTime,
      endTime,
      customerPhone: phone,
      flightNumber,
      selectedExtras,
      totalPrice: priceDetails.newTotal,
      amountPaidOnline: priceDetails.newPayNow,
      amountToPayAtDesk: priceDetails.newPayAtDesk,
    };

    const paymentAction = () => {
      // In a real app, this would trigger a payment flow.
      onSave(modifications);
      setIsSaving(false);
    };

    if (priceDetails.paymentDifference > 0) {
        // Simulate payment redirection/modal
        alert(`Redirecting to payment page for additional amount: ${getCurrencySymbol()}${convertPrice(priceDetails.paymentDifference).toFixed(2)}`);
        // Simulate payment success after a delay
        setTimeout(paymentAction, 1000);
    } else {
        if(priceDetails.paymentDifference < 0) {
            alert(`A refund of ${getCurrencySymbol()}${convertPrice(Math.abs(priceDetails.paymentDifference)).toFixed(2)} will be processed.`);
        }
        setTimeout(paymentAction, 500);
    }
  };

  if (!isOpen) return null;

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = (i % 2) * 30 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col font-sans">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
                <h3 className="font-bold text-lg text-slate-800">Modify Your Booking</h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X className="w-5 h-5"/></button>
            </div>

            {/* Content */}
            <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                {/* Dates & Times */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-600"/> Rental Period</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pickup */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500">Pick-up</label>
                            <div className="flex gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-2/3 border-slate-300 rounded-md p-2 text-base focus:ring-blue-500 focus:border-blue-500"/>
                                <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-1/3 border-slate-300 rounded-md p-2 text-base bg-white focus:ring-blue-500 focus:border-blue-500">
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        {/* Dropoff */}
                        <div>
                            <label className="text-xs font-semibold text-slate-500">Drop-off</label>
                             <div className="flex gap-2">
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-2/3 border-slate-300 rounded-md p-2 text-base focus:ring-blue-500 focus:border-blue-500"/>
                                <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-1/3 border-slate-300 rounded-md p-2 text-base bg-white focus:ring-blue-500 focus:border-blue-500">
                                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Flight */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600"/> Contact & Flight</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-slate-300 rounded-md p-2 text-base focus:ring-blue-500 focus:border-blue-500"/>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500">Flight Number (Optional)</label>
                            <input type="text" value={flightNumber} onChange={e => setFlightNumber(e.target.value)} className="w-full border-slate-300 rounded-md p-2 text-base focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., BA2490"/>
                        </div>
                    </div>
                </div>

                {/* Extras */}
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><PlusCircle className="w-4 h-4 text-blue-600"/> Optional Extras</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {car.extras.map(extra => {
                            const isSelected = selectedExtras.some(e => e.id === extra.id);
                            return (
                                <div key={extra.id} onClick={() => toggleExtra(extra)} className={`border p-3 rounded-lg cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300' : 'bg-white hover:bg-slate-50'}`}>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">{extra.name}</p>
                                        <p className="text-xs text-slate-500">{getCurrencySymbol()}{convertPrice(extra.price).toFixed(2)} / {extra.type === 'per_day' ? 'day' : 'rental'}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                        {isSelected && <Check className="w-3 h-3 text-white"/>}
                                    </div>
                                </div>
                            );
                        })}
                        {car.extras.length === 0 && <p className="text-sm text-slate-400 italic md:col-span-2">No extras available for this car.</p>}
                    </div>
                </div>
            </div>
            
            {/* Footer / Price Summary & Actions */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 rounded-b-xl space-y-3">
                 <h4 className="text-xs font-bold text-slate-500 uppercase">Updated Price Summary</h4>
                 <div className="grid grid-cols-3 gap-4 text-center">
                     <div>
                        <p className="text-xs text-slate-500">Original Total</p>
                        <p className="font-bold text-slate-600 line-through">{getCurrencySymbol()}{convertPrice(booking.totalPrice).toFixed(2)}</p>
                     </div>
                     <div>
                        <p className="text-xs text-slate-500">New Total</p>
                        <p className="font-bold text-lg text-blue-600">{getCurrencySymbol()}{convertPrice(priceDetails.newTotal).toFixed(2)}</p>
                     </div>
                     <div>
                        {priceDetails.priceDifference !== 0 && (
                            <>
                                <p className={`text-xs font-bold ${priceDetails.priceDifference > 0 ? 'text-orange-500' : 'text-green-600'}`}>Difference</p>
                                <p className={`font-bold text-lg ${priceDetails.priceDifference > 0 ? 'text-orange-600' : 'text-green-700'}`}>
                                    {priceDetails.priceDifference > 0 ? '+' : '-'}{getCurrencySymbol()}{convertPrice(Math.abs(priceDetails.priceDifference)).toFixed(2)}
                                </p>
                            </>
                        )}
                     </div>
                 </div>
                 
                 {priceDetails.paymentDifference > 0 && (
                     <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-sm font-semibold rounded-lg text-center">
                         Additional Amount Due Online: {getCurrencySymbol()}{convertPrice(priceDetails.paymentDifference).toFixed(2)}
                     </div>
                 )}
                 {priceDetails.paymentDifference < 0 && (
                     <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-lg text-center">
                         Refund Amount: {getCurrencySymbol()}{convertPrice(Math.abs(priceDetails.paymentDifference)).toFixed(2)}
                     </div>
                 )}
                 
                 <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`w-full font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-wait ${priceDetails.paymentDifference > 0 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2"/> : (priceDetails.paymentDifference > 0 ? <CreditCard className="w-4 h-4 mr-2"/> : <Save className="w-4 h-4 mr-2"/>)}
                    {isSaving ? 'Processing...' : (priceDetails.paymentDifference > 0 ? `Pay & Confirm Changes` : 'Confirm Changes')}
                </button>
            </div>
        </div>
    </div>
  );
};

export default ModifyBookingModal;