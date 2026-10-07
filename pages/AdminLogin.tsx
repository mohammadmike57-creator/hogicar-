import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Users from 'lucide-react/dist/esm/icons/users';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Globe from 'lucide-react/dist/esm/icons/globe';
import { setAdminToken } from '../lib/adminApi';
import { API_BASE_URL } from '../lib/config';
import AuthShell from '../components/auth/AuthShell';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [error, setError] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password) {
            setError('Enter your username and password.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const credentials = { username: username.trim(), password };
            const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.message || (response.status === 401 || response.status === 403 ? 'The username or password is incorrect.' : `Sign-in failed (status ${response.status}).`));
            }
            if (!data.token) {
                throw new Error('No sign-in token was received. Please try again.');
            }

            setAdminToken(data.token);
            setIsLoading(false);
            setIsSuccess(true);
            setTimeout(() => navigate('/admin'), 450);
        } catch (err: any) {
            const msg = err?.message || '';
            setError(/failed to fetch|network/i.test(msg) ? 'We could not reach the Hogicar server. Check your connection and try again.' : msg || 'Sign-in failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <AuthShell
            tone="amber"
            eyebrow="Hogicar admin"
            headline={<>Everything Hogicar, <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">under control.</span></>}
            intro="Bookings, suppliers, pricing and site content in one secure workspace for the Hogicar team."
            features={[
                { icon: Activity, title: 'Live bookings', text: 'Every reservation, voucher and payment status.' },
                { icon: Users, title: 'Suppliers', text: 'Partners, locations, commissions and add-ons.' },
                { icon: Globe, title: 'Website', text: 'Home page, SEO, blog and search content.' },
                { icon: BarChart3, title: 'Performance', text: 'Revenue and booking trends at a glance.' },
            ]}
            formTitle="Admin sign in"
            formSubtitle="Restricted to the Hogicar team. Activity is logged."
            identityLabel="Username"
            identityPlaceholder="Your admin username"
            identityType="text"
            identity={username}
            onIdentity={setUsername}
            password={password}
            onPassword={setPassword}
            onSubmit={handleLogin}
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
            submitLabel="Sign in to admin"
            forgotHelp="Admin passwords are reset by the primary Hogicar administrator. Ask them to issue you a new password."
            rememberKey="hogicar_admin_login_user"
        />
    );
};

export default AdminLogin;
