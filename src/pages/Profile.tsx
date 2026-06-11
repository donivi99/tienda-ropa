import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CreatorContact from '../components/CreatorContact';

type Tab = 'overview' | 'orders' | 'data' | 'contact';

interface UserData {
  uid: string;
  email: string;
  nombre: string;
  role: string;
  phone?: string;
  address?: {
    calle?: string;
    ciudad?: string;
    provincia?: string;
    codigoPostal?: string;
    referencias?: string;
  };
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [userData, setUserData] = useState<UserData | null>(null);

  const [phone, setPhone] = useState('');
  const [calle, setCalle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [provincia, setProvincia] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [referencias, setReferencias] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<UserData>('/api/auth/me')
      .then(setUserData)
      .catch(() => setUserData(null));
  }, [user]);

  useEffect(() => {
    if (!userData) return;
    setPhone(userData.phone || '');
    setCalle(userData.address?.calle || '');
    setCiudad(userData.address?.ciudad || '');
    setProvincia(userData.address?.provincia || '');
    setCodigoPostal(userData.address?.codigoPostal || '');
    setReferencias(userData.address?.referencias || '');
  }, [userData]);

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    navigate('/');
  };

  const handleSaveData = async () => {
    if (!phone.trim() || phone.trim().length < 6) {
      setSaveMsg({ type: 'err', text: 'Teléfono inválido (mínimo 6 caracteres)' });
      return;
    }
    if (!calle.trim() || calle.trim().length < 3) {
      setSaveMsg({ type: 'err', text: 'Calle inválida (mínimo 3 caracteres)' });
      return;
    }
    if (!ciudad.trim() || ciudad.trim().length < 2) {
      setSaveMsg({ type: 'err', text: 'Ciudad inválida (mínimo 2 caracteres)' });
      return;
    }
    if (!provincia.trim() || provincia.trim().length < 2) {
      setSaveMsg({ type: 'err', text: 'Provincia inválida (mínimo 2 caracteres)' });
      return;
    }
    if (!/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(codigoPostal.trim())) {
      setSaveMsg({ type: 'err', text: 'Código postal inválido' });
      return;
    }

    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await api.put<UserData>('/api/auth/me', {
        phone: phone.trim(),
        address: {
          calle: calle.trim(),
          ciudad: ciudad.trim(),
          provincia: provincia.trim(),
          codigoPostal: codigoPostal.trim(),
          referencias: referencias.trim() || undefined,
        },
      });
      setUserData(updated);
      setSaveMsg({ type: 'ok', text: 'Datos guardados correctamente' });
    } catch {
      setSaveMsg({ type: 'err', text: 'Error al guardar los datos' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6 text-center sticky top-24">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#1e1b18] border-2 border-[#d4af37] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#f5e6c8] tracking-wide" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                {userData?.nombre || 'Mi Cuenta'}
              </h2>
              <p className="text-xs text-[#a89a82] mt-1 truncate px-2">{user?.email}</p>

              <div className="mt-6 space-y-1">
                <button
                  onClick={() => setTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    tab === 'overview'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#f5e6c8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Resumen
                  </span>
                </button>
                <button
                  onClick={() => setTab('orders')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    tab === 'orders'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#f5e6c8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Mis Pedidos
                  </span>
                </button>
                <button
                  onClick={() => { setTab('data'); setSaveMsg(null); }}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    tab === 'data'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#f5e6c8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Mis Datos
                  </span>
                </button>
                <button
                  onClick={() => setTab('contact')}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    tab === 'contact'
                      ? 'bg-[#d4af37] text-[#0a0a0a]'
                      : 'text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#f5e6c8]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Contactar
                  </span>
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-[#2a2520]">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-lg text-sm font-medium text-[#a89a82] hover:bg-[#1e1b18] hover:text-[#d4af37] transition-all flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {tab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Resumen
                  </h1>
                  <p className="text-[#a89a82] text-sm mt-1">Bienvenido de nuevo{userData?.nombre ? `, ${userData.nombre}` : ''}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#a89a82] uppercase tracking-wider">Pedidos</span>
                    </div>
                    <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>0</p>
                  </div>

                  <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#a89a82] uppercase tracking-wider">Favoritos</span>
                    </div>
                    <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>0</p>
                  </div>

                  <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-5 hover:border-[#d4af37]/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#d4af37]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#a89a82] uppercase tracking-wider">Gastado</span>
                    </div>
                    <p className="text-3xl font-bold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>$0</p>
                  </div>
                </div>

                {/* Datos personales */}
                {userData && (
                  <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-[#d4af37] uppercase tracking-wider mb-4" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                      Datos Personales
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-[#a89a82] uppercase tracking-wider">Nombre</p>
                        <p className="text-sm text-[#f5e6c8] mt-1">{userData.nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#a89a82] uppercase tracking-wider">Email</p>
                        <p className="text-sm text-[#f5e6c8] mt-1">{userData.email}</p>
                      </div>
                      {userData.phone && (
                        <div>
                          <p className="text-xs text-[#a89a82] uppercase tracking-wider">Teléfono</p>
                          <p className="text-sm text-[#f5e6c8] mt-1">{userData.phone}</p>
                        </div>
                      )}
                      {userData.address?.calle && (
                        <div>
                          <p className="text-xs text-[#a89a82] uppercase tracking-wider">Dirección</p>
                          <p className="text-sm text-[#f5e6c8] mt-1">
                            {userData.address.calle}{userData.address.ciudad ? `, ${userData.address.ciudad}` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1b18] flex items-center justify-center">
                    <svg className="w-8 h-8 text-[#a89a82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-[#f5e6c8] mb-2" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Aún no hay pedidos
                  </h3>
                  <p className="text-sm text-[#a89a82] max-w-sm mx-auto">
                    Explora nuestra colección y encuentra algo que te encante. Tus pedidos aparecerán aquí.
                  </p>
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Mis Pedidos
                  </h1>
                  <p className="text-[#a89a82] text-sm mt-1">Historial de tus compras</p>
                </div>

                <div className="bg-[#141210] border border-[#2a2520] rounded-xl overflow-hidden">
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1e1b18] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[#a89a82]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[#f5e6c8] mb-2" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                      Sin pedidos aún
                    </h3>
                    <p className="text-sm text-[#a89a82] max-w-sm mx-auto">
                      Realiza tu primera compra y tus pedidos aparecerán aquí.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {tab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Mis Datos
                  </h1>
                  <p className="text-[#a89a82] text-sm mt-1">Información para tus envíos a domicilio</p>
                </div>

                <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6 space-y-6">
                  <div>
                    <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Nombre</label>
                    <div className="w-full bg-[#1e1b18]/60 border border-[#2a2520]/60 rounded-lg px-4 py-3 text-[#f5e6c8] text-sm">
                      {userData?.nombre || '—'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Teléfono *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="612345678"
                      className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Calle *</label>
                    <input
                      type="text"
                      required
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      placeholder="Calle Mayor 15"
                      className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Ciudad *</label>
                      <input
                        type="text"
                        required
                        value={ciudad}
                        onChange={(e) => setCiudad(e.target.value)}
                        placeholder="Madrid"
                        className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Provincia *</label>
                      <input
                        type="text"
                        required
                        value={provincia}
                        onChange={(e) => setProvincia(e.target.value)}
                        placeholder="Madrid"
                        className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Código Postal *</label>
                    <input
                      type="text"
                      required
                      value={codigoPostal}
                      onChange={(e) => setCodigoPostal(e.target.value)}
                      placeholder="28001"
                      maxLength={5}
                      className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Referencias</label>
                    <textarea
                      value={referencias}
                      onChange={(e) => setReferencias(e.target.value)}
                      placeholder="Piso 2B, timbre izquierdo..."
                      rows={2}
                      className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] focus:outline-none transition-all resize-none"
                    />
                  </div>

                  {saveMsg && (
                    <div className={`px-4 py-3 rounded-lg text-sm ${
                      saveMsg.type === 'ok'
                        ? 'bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37]'
                        : 'bg-red-900/20 border border-red-800/50 text-red-300'
                    }`}>
                      {saveMsg.text}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveData}
                      disabled={saving}
                      className="bg-[#d4af37] text-[#0a0a0a] px-8 py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider text-sm"
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                          Guardando...
                        </span>
                      ) : 'Guardar Datos'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Contactar al Creador
                  </h1>
                  <p className="text-[#a89a82] text-sm mt-1">¿Tienes una idea personalizada? Escríbenos</p>
                </div>

                <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6">
                  <CreatorContact />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
