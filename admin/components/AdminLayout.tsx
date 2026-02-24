import * as React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Building, LogOut, Shield, Menu, X, LoaderCircle } from 'lucide-react';
import { clearAdminToken, adminFetch } from '../../lib/adminApi';
import { Logo } from '../../components/Logo';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isValidating, setIsValidating] = React.useState(true);

    React.useEffect(() => {
        const validateToken = async () => {
            try {
                // adminFetch handles 401/403 and redirects automatically
                await adminFetch('/api/admin/dashboard/summary');
                setIsValidating(false);
            } catch (error) {
                console.error("Token validation failed:", error);
                // Redirect is handled by adminFetch
            }
        };
        validateToken();
    }, []);


    const handleLogout = () => {
        clearAdminToken();
        navigate('/admin-login');
    };
    
    const NavItem = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => (
        <NavLink
            to={to}
            end
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
                `flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`
            }
        >
            <Icon className="w-5 h-5 mr-3" />
            <span>{label}</span>
        </NavLink>
    );

    const sidebarContent = (
         <div className="p-4 h-full flex flex-col">
            <div className="hidden md:flex items-center gap-3 mb-8">
              <Logo className="h-10 w-auto" />
            </div>
            <nav className="space-y-1.5 flex-grow">
              <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/suppliers" icon={Building} label="Suppliers" />
            </nav>
            <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 mt-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
    );
    
    if (isValidating) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="md:hidden bg-white px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <Logo className="h-8 w-auto" />
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
                    {isSidebarOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
                </button>
            </div>
            
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex">
                {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
                
                <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:shadow-none md:bg-transparent md:w-60 flex-shrink-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                   {sidebarContent}
                </aside>

                <main className="flex-grow w-full md:pl-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;