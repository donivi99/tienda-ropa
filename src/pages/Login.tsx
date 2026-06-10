import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register' | 'reset';

export default function Login() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const resetForm = () => {
    setEmail('');
    setEmailConfirm('');
    setPassword('');
    setPasswordConfirm('');
    setNombre('');
    setError('');
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'register') {
      if (email !== emailConfirm) {
        setError('Los correos electrónicos no coinciden');
        setLoading(false);
        return;
      }
      if (password !== passwordConfirm) {
        setError('Las contraseñas no coinciden');
        setLoading(false);
        return;
      }
    }

    try {
      const auth = getFirebaseAuth();

      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: nombre });

        const token = await cred.user.getIdToken();
        setToken(token);

        await api.post('/api/auth/register', { email, password, nombre });
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        setToken(token);
      }

      if (mode !== 'reset') navigate('/mi-cuenta');
    } catch (err) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code;
        if (code === 'auth/email-already-in-use') setError('Este email ya está registrado');
        else if (code === 'auth/invalid-credential') setError('Email o contraseña incorrectos');
        else if (code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres');
        else if (code === 'auth/invalid-email') setError('Email no válido');
        else if (code === 'auth/user-not-found') setError('No existe una cuenta con este email');
        else setError(err.message || 'Error al autenticar');
      } else {
        setError('Error al autenticar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-bold text-[#d4af37] tracking-widest uppercase" style={{ fontFamily: '"Bodoni Moda", serif' }}>
            tiendaRopa
          </Link>
        </div>

        <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-8">
          {mode !== 'reset' && (
            <div className="flex gap-1 mb-6 bg-[#0a0a0a] rounded-lg p-1">
              <button
                onClick={() => { setMode('login'); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login'
                    ? 'bg-[#d4af37] text-[#0a0a0a]'
                    : 'text-[#a89a82] hover:text-[#f5e6c8]'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { setMode('register'); resetForm(); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'register'
                    ? 'bg-[#d4af37] text-[#0a0a0a]'
                    : 'text-[#a89a82] hover:text-[#f5e6c8]'
                }`}
              >
                Registrarse
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Confirmar email</label>
                <input
                  type="email"
                  required
                  value={emailConfirm}
                  onChange={(e) => setEmailConfirm(e.target.value)}
                  placeholder="Repite tu email"
                  className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs text-[#a89a82] uppercase tracking-wider mb-1.5">Confirmar contraseña</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1e1b18] border border-[#2a2520] rounded-lg px-4 py-3 text-[#f5e6c8] placeholder-[#a89a82]/50 focus:ring-2 focus:ring-[#d4af37] focus:outline-none transition-all"
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); }}
                  className="text-xs text-[#d4af37] hover:text-[#f5e6c8] transition-colors"
                >
                  He olvidado la contraseña
                </button>
              </div>
            )}

            {mode === 'reset' && resetSent && (
              <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] px-4 py-3 rounded-lg text-sm">
                Se envió un email con las instrucciones para recuperar tu contraseña. Revisa tu bandeja de entrada.
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-800/50 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'reset' && resetSent)}
              className="w-full bg-[#d4af37] text-[#0a0a0a] py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : 'Enviar'}
            </button>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('login'); resetForm(); }}
                className="w-full text-sm text-[#a89a82] hover:text-[#d4af37] transition-colors"
              >
                Volver al inicio de sesión
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-[#a89a82] mt-6">
          <Link to="/" className="hover:text-[#d4af37] transition-colors">Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
