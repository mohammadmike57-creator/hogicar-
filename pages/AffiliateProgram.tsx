import * as React from 'react';
import SEOMetadata from '../components/SEOMetadata';
import { PieChart, Globe, DollarSign, ArrowRight, CheckCircle, BarChart2, MousePointer, Link2, LogOut, LayoutDashboard, Copy, TrendingUp, X } from 'lucide-react';
import { MOCK_AFFILIATES, registerAffiliate } from '../services/mockData';
import { Affiliate } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AffiliateProgram: React.FC = () => {
    const [view, setView] = React.useState<'landing' | 'dashboard'>('landing');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [currentUser, setCurrentUser] = React.useState<Affiliate | null>(null);
    
    // Registration Form State
    const [regName, setRegName] = React.useState('');
    const [regEmail, setRegEmail] = React.useState('');
    const [regWebsite, setRegWebsite] = React.useState('');
    const [regPassword, setRegPassword] = React.useState('');
    const [submitted, setSubmitted] = React.useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const affiliate = MOCK_AFFILIATES.find(a => a.email === email && a.password === password);
        if (affiliate) {
            setCurrentUser(affiliate);
            setView('dashboard');
        } else {
            alert('Affiliate not found or password incorrect. Try "partners@travelbloggers.com" with password "password123"');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simulate API delay
        setTimeout(() => {
            // Register and generate the affiliate ID
            const newAffiliate = registerAffiliate(regName, regEmail, regWebsite, regPassword);
            setCurrentUser(newAffiliate);
            setSubmitted(true);
            
            // Redirect to dashboard after showing success message briefly
            setTimeout(() => {
                setView('dashboard');
                // Scroll to top
                window.scrollTo(0, 0);
            }, 1500);
        }, 800);
    };

    const DashboardView = () => {
        const [activeStat, setActiveStat] = React.useState<'earnings' | 'clicks' | 'conversions' | null>(null);

        if (!currentUser) return null;
        const trackingLink = `https://www.hogicar.com/?ref=${currentUser.id}`;

        // Mock data for charts
        const chartData = [
            { name: 'Mon', value: 400 },
            { name: 'Tue', value: 300 },
            { name: 'Wed', value: 550 },
            { name: 'Thu', value: 480 },
            { name: 'Fri', value: 700 },
            { name: 'Sat', value: 650 },
            { name: 'Sun', value: 800 },
        ];

        return (
            <div className="bg-slate-50 min-h-screen">
                <div className="bg-[#003580] text-white py-8 px-4">
                    <div className="max-w-6xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <LayoutDashboard className="w-8 h-8 text-blue-300"/>
                            <div>
                                <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                                <p className="text-blue-200 text-sm">Affiliate Partner ID: <span className="font-mono bg-blue-700/50 px-2 py-0.5 rounded">{currentUser.id}</span></p>
                            </div>
                        </div>
                        <button onClick={() => { setView('landing'); setSubmitted(false); }} className="text-sm bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded flex items-center gap-2">
                            <LogOut className="w-4 h-4"/> Sign Out
                        </button>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Unique Link Section - Prominent for new users */}
                    <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-100 mb-8 transform transition-all hover:scale-[1.01]">
                        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Link2 className="w-6 h-6 text-blue-600"/> Your Unique Tracking Link
                        </h2>
                        <p className="text-sm text-slate-600 mb-6">
                            Start earning immediately! Copy the link below and share it on your website, blog, or social media. 
                            We automatically track any reservations made by users who click this link.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="relative flex-grow">
                                <input 
                                    type="text" 
                                    readOnly 
                                    value={trackingLink} 
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-700 px-4 py-4 rounded-lg font-mono text-base focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <button 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg text-sm flex items-center justify-center gap-2 shadow-md transition-colors" 
                                onClick={() => {
                                    navigator.clipboard.writeText(trackingLink);
                                    alert('Link copied to clipboard!');
                                }}
                            >
                                <Copy className="w-4 h-4"/> Copy Link
                            </button>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5"/>
                            <span>Tracking is active immediately upon account creation.</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div onClick={() => setActiveStat(activeStat === 'earnings' ? null : 'earnings')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${activeStat === 'earnings' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:-translate-y-1'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Earnings</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 mt-1">${currentUser.totalEarnings.toFixed(2)}</h3>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg text-green-600"><DollarSign className="w-6 h-6"/></div>
                            </div>
                            <p className="text-xs text-slate-500">Commission Rate: {(currentUser.commissionRate * 100)}%</p>
                        </div>
                        <div onClick={() => setActiveStat(activeStat === 'clicks' ? null : 'clicks')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${activeStat === 'clicks' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:-translate-y-1'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Link Clicks</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{currentUser.clicks}</h3>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><MousePointer className="w-6 h-6"/></div>
                            </div>
                            <p className="text-xs text-slate-500">Unique visitors from your link</p>
                        </div>
                        <div onClick={() => setActiveStat(activeStat === 'conversions' ? null : 'conversions')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer transition-all ${activeStat === 'conversions' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300 hover:-translate-y-1'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Conversions</p>
                                    <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{currentUser.conversions}</h3>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-lg text-purple-600"><CheckCircle className="w-6 h-6"/></div>
                            </div>
                            <p className="text-xs text-slate-500">Completed bookings</p>
                        </div>
                    </div>

                    {/* Detailed Report Expanded Section */}
                    {activeStat && (
                        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8 animate-fadeIn">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 capitalize">{activeStat} Report</h3>
                                    <p className="text-xs text-slate-500">Last 7 days performance</p>
                                </div>
                                <button onClick={() => setActiveStat(null)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'dashboard') return <DashboardView />;

    return (
        <div className="bg-white font-sans">
            <SEOMetadata
                title="Affiliate Program | Earn with Hogicar"
                description="Join the Hogicar affiliate program and earn commission on car rental bookings. High conversion rates and premium support."
            />

            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-[#2c135c] to-[#003580] pt-24 pb-32 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <Globe className="w-[800px] h-[800px] absolute -right-40 -top-40 text-white" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">Turn Traffic into <span className="text-[#FF9F1C]">Revenue</span></h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-10">
                        Join the world's fastest-growing car rental affiliate network. Earn up to 7% commission on every completed booking.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button 
                            onClick={() => { document.getElementById('join-form')?.scrollIntoView({ behavior: 'smooth' }); }} 
                            className="bg-[#FF9F1C] hover:bg-orange-400 text-slate-900 font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 text-lg"
                        >
                            Become a Partner
                        </button>
                        <button onClick={() => { document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-full border border-white/30 backdrop-blur-sm transition-colors text-lg">
                            Partner Login
                        </button>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900">Why Partner with Hogicar?</h2>
                        <p className="text-slate-500 mt-2">We provide the tools you need to succeed.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <DollarSign className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">High Commissions</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">Earn competitive rates starting at 5% and going up to 7% based on volume. Get paid monthly.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PieChart className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Real-Time Reporting</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">Track clicks, conversions, and earnings in real-time through our intuitive dashboard.</p>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform duration-300">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Globe className="w-8 h-8"/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Global Inventory</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">Access vehicles from 900+ suppliers in over 60,000 locations worldwide.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Registration & Login Section */}
            <div className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        
                        {/* Registration Form */}
                        <div id="join-form">
                            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">Join the Network</h2>
                                {submitted ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                            <CheckCircle className="w-8 h-8"/>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h3>
                                        <p className="text-slate-500 text-sm">Generating your unique tracking ID and redirecting to dashboard...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Company / Name</label>
                                            <input type="text" required className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Travel Bloggers LLC" value={regName} onChange={e => setRegName(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Website URL <span className="text-slate-400 font-normal text-xs">(Optional)</span></label>
                                            <input type="url" className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://www.example.com" value={regWebsite} onChange={e => setRegWebsite(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                            <input type="email" required className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" placeholder="partner@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                            <input 
                                                type="password" 
                                                required 
                                                className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" 
                                                placeholder="Create a secure password" 
                                                value={regPassword} 
                                                onChange={e => setRegPassword(e.target.value)} 
                                                minLength={8}
                                            />
                                        </div>
                                        <button type="submit" className="w-full bg-[#003580] hover:bg-blue-900 text-white font-bold py-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2">
                                            Apply Now <ArrowRight className="w-4 h-4"/>
                                        </button>
                                        <p className="text-xs text-slate-400 text-center mt-4">By applying, you agree to our Affiliate Terms & Conditions.</p>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Login Form */}
                        <div id="login-section" className="flex flex-col justify-center">
                            <div className="max-w-md mx-auto w-full">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Already a Partner?</h2>
                                <p className="text-slate-500 mb-6">Log in to view your dashboard and earnings.</p>
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            required 
                                            className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="Enter your registered email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                                        <input 
                                            type="password" 
                                            required 
                                            className="w-full border-slate-300 rounded-lg p-3 text-base focus:ring-2 focus:ring-blue-500 outline-none" 
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-lg transition-colors">
                                        Log In
                                    </button>
                                </form>
                                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-blue-800 font-medium"><strong>Tip for Demo:</strong> Use <span className="font-mono">partners@travelbloggers.com</span> and password <span className="font-mono">password123</span> to log in.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AffiliateProgram;