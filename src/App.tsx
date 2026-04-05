import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import SupplierDashboard from '../pages/SupplierDashboard';
import SupplierLogin from '../pages/SupplierLogin';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/supplier" element={<SupplierDashboard />} />
          <Route path="/supplier-login" element={<SupplierLogin />} />
          {/* Add other routes here */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
