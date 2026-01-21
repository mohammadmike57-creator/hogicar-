
import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_BOOKINGS, MOCK_CARS, submitReview } from '../services/mockData';
import { Star, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import SEOMetadata from '../components/SEOMetadata';

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
    
    const [booking, setBooking] = React.useState(MOCK_BOOKINGS.find(b => b.id === bookingId));
    const [car, setCar] = React.useState(booking ? MOCK_CARS.find(c => c.id === booking.carId) : null);
    
    const [cleanliness, setCleanliness] = React.useState(0);
    const [condition, setCondition] = React.useState(0);
    const [valueForMoney, setValueForMoney] = React.useState(0);
    const [pickupSpeed, setPickupSpeed] = React.useState(0);
    
    const [submitted, setSubmitted] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cleanliness || !condition || !valueForMoney || !pickupSpeed) {
            setError('Please provide a rating for all categories.');
            return;
        }
        if (bookingId) {
            submitReview(bookingId, { cleanliness, condition, valueForMoney, pickupSpeed });
            setSubmitted(true);
            setTimeout(() => {
                navigate('/my-bookings');
            }, 2500);
        }
    };

    if (!booking || !car) {
        return (
            <div className="flex items-center justify-center min-h-[calc(100vh-128px)] bg-slate-50">
                <h2 className="text-xl font-bold text-slate-800">Booking Not Found</h2>
            </div>
        );
    }
    
    const ratingCategories = [
        { label: "Cleanliness of the car", rating: cleanliness, setRating: setCleanliness },
        { label: "Condition of the car", rating: condition, setRating: setCondition },
        { label: "Value for money", rating: valueForMoney, setRating: setValueForMoney },
        { label: "Speed of pick-up", rating: pickupSpeed, setRating: setPickupSpeed },
    ];

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
                                    <img src={car.image} alt={car.model} className="w-32 h-20 object-cover rounded-lg"/>
                                    <div>
                                        <p className="font-bold text-slate-800">{car.make} {car.model}</p>
                                        <p className="text-xs text-slate-500">Rented from {car.supplier.name}</p>
                                        <p className="text-xs text-slate-500">{booking.startDate} to {booking.endDate}</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {ratingCategories.map(cat => (
                                        <div key={cat.label} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                            <label className="font-semibold text-slate-700">{cat.label}</label>
                                            <StarRatingInput rating={cat.rating} setRating={cat.setRating} />
                                        </div>
                                    ))}
                                    
                                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                                    <div className="pt-6 border-t border-slate-200">
                                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 text-base">
                                            <Send className="w-5 h-5"/> Submit Review
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
