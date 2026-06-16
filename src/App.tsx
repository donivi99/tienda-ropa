import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import CollectionPage from './components/CollectionPage';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SobreNosotros from './pages/SobreNosotros';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-[#0a0a0a]">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/categoria-mujer" element={<CollectionPage category="mujer" />} />
              <Route path="/categoria-hombre" element={<CollectionPage category="hombre" />} />
              <Route path="/categoria-ninos" element={<CollectionPage category="niños" />} />
              <Route path="/categoria-destacados" element={<Home />} />
              <Route path="/producto/:id" element={<ProductDetail />} />
              <Route path="/finalizar-compra" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/pedido-confirmado" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/iniciar-sesion" element={<Login />} />
              <Route path="/sobre-nosotros" element={<SobreNosotros />} />
              <Route path="/mi-cuenta/*" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/administrador" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/administrador/productos" element={<AdminRoute><AdminProducts /></AdminRoute>} />
              <Route path="/administrador/pedidos" element={<AdminRoute><AdminOrders /></AdminRoute>} />
              <Route path="/administrador/usuarios" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            </Routes>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
