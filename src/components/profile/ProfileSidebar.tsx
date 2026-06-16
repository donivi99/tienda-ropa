import { Link, NavLink, useLocation } from 'react-router-dom';
import { PROFILE_ROUTES } from '../../constants/profileRoutes';

export type ProfileTab = 'overview' | 'orders' | 'data' | 'contact';

const TABS: { id: ProfileTab; to: string; end?: boolean; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    to: PROFILE_ROUTES.overview,
    end: true,
    label: 'Resumen',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'orders',
    to: PROFILE_ROUTES.orders,
    label: 'Mis Pedidos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  },
  {
    id: 'data',
    to: PROFILE_ROUTES.data,
    label: 'Mis Datos',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'contact',
    to: PROFILE_ROUTES.contact,
    label: 'Contactar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

function resolveActiveTab(pathname: string): ProfileTab {
  if (pathname.startsWith(PROFILE_ROUTES.orders)) return 'orders';
  if (pathname.startsWith(PROFILE_ROUTES.data)) return 'data';
  if (pathname.startsWith(PROFILE_ROUTES.contact)) return 'contact';
  return 'overview';
}

interface ProfileSidebarProps {
  nombre?: string;
  email?: string;
  isAdmin: boolean;
  loading: boolean;
  onLogout: () => void;
}

export default function ProfileSidebar({
  nombre,
  email,
  isAdmin,
  loading,
  onLogout,
}: ProfileSidebarProps) {
  const { pathname } = useLocation();
  const activeTab = resolveActiveTab(pathname);

  return (
    <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6 text-center sticky top-24">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#1e1b18] border-2 border-[#d4af37] flex items-center justify-center">
        <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h2 className="text-lg font-bold text-[#f5e6c8] tracking-wide" style={{ fontFamily: '"Bodoni Moda", serif' }}>
        {loading ? '…' : nombre || 'Mi Cuenta'}
      </h2>
      <p className="text-xs text-[#a89a82] mt-1 truncate px-2">{email}</p>

      <nav className="mt-6 space-y-1" role="tablist" aria-label="Secciones de mi cuenta">
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={t.to}
            end={t.end}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={activeTab === t.id}
            aria-controls={`panel-${t.id}`}
            className={({ isActive }) =>
              `block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#d4af37] text-[#0a0a0a]'
                  : 'text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#f5e6c8]'
              }`
            }
          >
            <span className="flex items-center gap-3">
              {t.icon}
              {t.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {isAdmin && (
        <div className="mt-4">
          <Link
            to="/administrador"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider text-[#d4af37] border border-[#d4af37]/30 hover:bg-[#d4af37]/10 transition-colors"
          >
            Panel administrador
          </Link>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-[#2a2520]">
        <button
          type="button"
          onClick={onLogout}
          className="w-full px-4 py-3 rounded-lg text-sm font-medium text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#d4af37] transition-all flex items-center gap-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
