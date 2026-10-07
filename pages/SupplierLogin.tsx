import * as React from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Car from 'lucide-react/dist/esm/icons/car';
import { API_BASE_URL } from '../lib/config';
import AuthShell from '../components/auth/AuthShell';

const SupplierLogin: React.FC = () => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    React.useEffect(() => {
        if (searchParams.get('reason') === 'session_expired') {
            setError('Your session has expired. Please sign in again.');
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Enter your email and password.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const credentials = { email: email.trim(), password };
            const response = await fetch(`${API_BASE_URL}/api/supplier/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'The email or password is incorrect.');
            if (!data.token) throw new Error('Sign-in failed. Please try again.');

            localStorage.setItem('supplierToken', data.token);
            if (data.supplier?.id) localStorage.setItem('supplierId', data.supplier.id);
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => navigate('/supplier'), 450);
        } catch (err: any) {
            const msg = err?.message || '';
            setError(/failed to fetch|network/i.test(msg) ? 'We could not reach Hogicar. Check your connection and try again.' : msg || 'Sign-in failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            tone="blue"
            eyebrow="Partner portal"
            headline={<>Run your rental business <span className="bg-gradient-to-r from-sky-300 to-amber-300 bg-clip-text text-transparent">in one place.</span></>}
            intro="Confirm bookings, update rates and launch promotions for every location, from any device."
            features={[
                { icon: CalendarCheck, title: 'Bookings', text: 'Confirm reservations and open vouchers in a tap.' },
                { icon: TrendingUp, title: 'Pricing', text: 'Seasons, rental bands and daily rates per location.' },
                { icon: Megaphone, title: 'Promotions', text: 'Discounts and free add-ons that stand out in search.' },
                { icon: Car, title: 'Fleet', text: 'Cars, availability and stop sales at a glance.' },
            ]}
            stats={[{ value: '24/7', label: 'Portal access' }, { value: 'Instant', label: 'Booking emails' }]}
            formTitle="Sign in to your partner account"
            formSubtitle="Use the email Hogicar registered for your company."
            identityLabel="Email"
            identityPlaceholder="you@company.com"
            identityType="email"
            identity={email}
            onIdentity={setEmail}
            password={password}
            onPassword={setPassword}
            onSubmit={handleLogin}
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
            submitLabel="Sign in"
            forgotHelp="For your security, partner passwords are reset by Hogicar. Contact your Hogicar account manager and we'll send you a new one."
            rememberKey="hogicar_supplier_login_email"
            footer={
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <p className="font-semibold text-slate-900">Not a Hogicar partner yet?</p>
                    <p className="mt-0.5 text-slate-500">List your cars and reach travellers searching every day.</p>
                    <Link to="/become-supplier" className="mt-2 inline-flex items-center gap-1 font-semibold text-accent hover:text-accent-700">Become a supplier →</Link>
                </div>
            }
        />
    );
};

export default SupplierLogin;
