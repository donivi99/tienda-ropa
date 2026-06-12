import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { api } from '../services/api';

interface UserProfile {
  uid: string;
  email: string;
  nombre: string;
  role: string;
  phone?: string;
  address?: Record<string, string>;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  setToken: (token: string) => void;
  waitForReady: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  setToken: () => {},
  waitForReady: () => Promise.resolve(),
  refreshProfile: () => Promise.resolve(),
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (token: string) => {
    localStorage.setItem('auth_token', token);
  };

  const loadingRef = useRef(loading);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const waitForReady = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (!loadingRef.current) {
        resolve();
      } else {
        const check = setInterval(() => {
          if (!loadingRef.current) {
            clearInterval(check);
            resolve();
          }
        }, 50);
      }
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const userProfile = await api.get<UserProfile>('/api/auth/me');
      setProfile(userProfile);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('auth_token', token);

          let userProfile: UserProfile | null = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              userProfile = await api.get<UserProfile>('/api/auth/me');
              break;
            } catch {
              if (attempt < 2) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
              }
            }
          }

          if (userProfile) {
            setProfile(userProfile);
          } else {
            setProfile(null);
            localStorage.removeItem('auth_token');
          }
        } catch {
          setProfile(null);
          localStorage.removeItem('auth_token');
        }
      } else {
        setProfile(null);
        localStorage.removeItem('auth_token');
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        setToken,
        waitForReady,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
