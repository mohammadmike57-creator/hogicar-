import * as React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getAdminToken } from '../../lib/adminApi';

const AdminProtectedRoute: React.FC = () => {
    const token = getAdminToken();

    if (!token) {
        return <Navigate to="/admin-login" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
