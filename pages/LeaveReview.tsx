
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_BOOKINGS, MOCK_CARS } from '../services/mockData';
import { Star, ArrowLeft, Send, CheckCircle, LoaderCircle, AlertCircle } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';
import { api } from '../api';

// A self-contained, reusable star rating input component with hover effects
const StarRatingInput = ({ rating, setRating, size = "w-8 h-8" }: { rating: number, setRating: (r: number) => void, size?: string }) => {
    const [hoverRating, setHoverRating] = React.useState(0);
    return (
        <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
            <button
                type="button"
                key={star}
                className={`transition-colors ${(hoverRating || rating) >= star ? "text-yellow-400" : "text-slate-300"}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
            >
            <Star className={`${size} fill-current transition-transform duration-150 ease-in-out transform hover:scale-125`} />
            </button>
        ))}
        </div>
    );
};

const LeaveReview: React.FC = () => {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    
    // We try to find booking/car from mock first for display purposes, 
    // in a real app you might need to fetch this data first if coming directly to this link.
    // For now, we assume user navigates here from MyBookings where data might be loaded, 
    // but the actual submission goes to API.
    const mockBooking = MOCK_BOOKINGS.find(b => b.id === bookingId);
    const mockCar = mockBooking ? MOCK_CARS.find(c => c.id === mockBooking.carId) : null;
    
    // Fallback for visual display if mock data is missing (since we are moving away from mocks)
    const displayCarName = mockCar ? `${mockCar.make} ${mockCar.model}` : "your rental vehicle";
    const displaySupplier = mockCar?.supplier.name || "the supplier";
    const displayImage = mockCar?.image || "https://placehold.co/600x400?text=Car+Image";

    const [cleanliness, setCleanliness] = React.useState(0);
    const [condition, setCondition] = React.useState(0);
    const [valueForMoney, setValueForMoney] = React.useState(0);
    const [pickupSpeed, setPickupSpeed] = React.useState(0);
    
    const [submitted, setSubmitted] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cleanliness || !condition || !valueForMoney || !pickupSpeed) {
            setError('Please provide a rating for all categories.');
            return;
        }
        if (!bookingId) {
            setError("Invalid booking ID");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.submitReview(bookingId, { 
                cleanliness, 
                condition, 
                valueForMoney, 
                pickupSpeed 
            });
            
            setSubmitted(true);
            setTimeout(() => {
                navigate('/my-bookings');
            }, 2500);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <SEOMetadata title="Leave a Review" description="Rate your car rental experience." noIndex={true} />
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Bookings
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    {submitted ? (
                        <div className="text-center p-16">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-slate-800">Thank you!</h2>
                            <p className="text-slate-600 mt-2">Your review has been submitted. We appreciate your feedback.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h1 className="text-2xl font-bold text-slate-800">Rate Your Experience</h1>
                                <p className="text-sm text-slate-500 mt-1">Your feedback helps other travelers and our partners.</p>
                            </div>
                            
                            <div className="p-8">
                                <div className="flex items-center gap-4 mb-8">
                                    <img src={displayImage} alt="Car" className="w-32 h-20 object-cover rounded-lg"/>
                                    <div>
                                        <p className="font-bold text-slate-800">{displayCarName}</p>
                                        <p className="text-xs text-slate-500">Rented from {displaySupplier}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {[{label: "Cleanliness of the car", rating: cleanliness, setRating: setCleanliness},
                                      {label: "Condition of the car", rating: condition, setRating: setCondition},
                                      {label: "Value for money", rating: valueForMoney, setRating: setValueForMoney},
                                      {label: "Speed of pick-up", rating: pickupSpeed, setRating: setPickupSpeed}
                                    ].map(cat => (
                                        <div key={cat.label} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                            <label className="font-semibold text-slate-700">{cat.label}</label>
                                            <StarRatingInput rating={cat.rating} setRating={cat.setRating} />
                                        </div>
                                    ))}
                                    
                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4"/> {error}
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-slate-200">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <LoaderCircle className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaveReview;
