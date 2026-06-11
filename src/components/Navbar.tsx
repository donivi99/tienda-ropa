import { useState } from 'react';
import { Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';

const CATEGORIES = [
  { label: 'Inicio', path: '/' },
  { label: 'Mujer', path: '/categoria-mujer' },
  { label: 'Hombre', path: '/categoria-hombre' },
  { label: 'Destacados', path: '/categoria-destacados' },
  { label: 'Sobre Nosotros', path: '/sobre-nosotros' },
];

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, isAdmin } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0a0a0a] border-b border-[#2a2520]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-xl font-bold text-[#d4af37] tracking-widest uppercase" style={{ fontFamily: '"Bodoni Moda", serif' }}>
              tiendaRopa
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.path}
                  to={cat.path}
                  className="text-sm text-[#a89a82] hover:text-[#f5e6c8] transition-colors uppercase tracking-wider"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <Link to="/cargar-productos" className="text-xs text-[#a89a82] hover:text-[#d4af37] transition-colors" title="Cargar productos de prueba">
                Seed
              </Link>
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/administrador" className="text-xs text-[#d4af37] hover:text-[#f5e6c8] transition-colors uppercase tracking-wider border border-[#d4af37]/30 px-3 py-1.5 rounded-lg">
                      Admin
                    </Link>
                  )}
                  {!isAdmin && (
                    <Link to="/mi-cuenta" className="text-sm text-[#a89a82] hover:text-[#f5e6c8] transition-colors">
                      Mi Cuenta
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link to="/iniciar-sesion" className="text-sm text-[#a89a82] hover:text-[#f5e6c8] transition-colors">
                  Iniciar Sesión
                </Link>
              )}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-[#a89a82] hover:text-[#d4af37] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#d4af37] text-[#0a0a0a] text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
