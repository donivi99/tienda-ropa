import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PROFILE_ROUTES } from '../constants/profileRoutes';
import CartDrawer from './CartDrawer';

const CATEGORIES = [
  { label: 'Inicio', path: '/' },
  { label: 'Mujer', path: '/categoria-mujer' },
  { label: 'Hombre', path: '/categoria-hombre' },
  { label: 'Niños', path: '/categoria-ninos' },
  { label: 'Destacados', path: '/categoria-destacados' },
  { label: 'Sobre Nosotros', path: '/sobre-nosotros' },
];

const navLinkClass =
  'text-sm text-[#a89a82] hover:text-[#f5e6c8] transition-colors uppercase tracking-wider';

function UserIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function LogoutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

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
            <Link to="/" className="font-heading text-xl font-bold text-[#d4af37] tracking-widest uppercase">
              tiendaRopa
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {CATEGORIES.map((cat) => (
                <Link key={cat.path} to={cat.path} className={navLinkClass}>
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
                    <Link
                      to="/administrador"
                      className="text-xs text-[#d4af37] hover:text-[#f5e6c8] transition-colors uppercase tracking-wider border border-[#d4af37]/30 px-3 py-1.5 rounded-lg"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="flex items-center gap-3">
                    <NavLink
                      to={PROFILE_ROUTES.overview}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-1.5 text-sm uppercase tracking-wider transition-colors ${
                          isActive ? 'text-[#d4af37]' : 'text-[#a89a82] hover:text-[#f5e6c8]'
                        }`
                      }
                    >
                      <UserIcon />
                      Mi Cuenta
                    </NavLink>
                    <span className="h-4 w-px bg-[#2a2520]" aria-hidden />
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="inline-flex items-center gap-1.5 text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors uppercase tracking-wider"
                    >
                      <LogoutIcon />
                      Salir
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/iniciar-sesion" className={`inline-flex items-center gap-1.5 ${navLinkClass}`}>
                  <UserIcon />
                  Iniciar Sesión
                </Link>
              )}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-[#a89a82] hover:text-[#d4af37] transition-colors"
                aria-label="Abrir carrito"
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
