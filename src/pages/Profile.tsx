import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import CreatorContact from '../components/CreatorContact';
import ProfileSidebar, { type ProfileTab } from '../components/profile/ProfileSidebar';
import ProfileOverview from '../components/profile/ProfileOverview';
import ProfileOrdersTab, { type UserOrder } from '../components/profile/ProfileOrdersTab';
import ProfileDataForm from '../components/profile/ProfileDataForm';
import { computeUserOrderStats } from '../utils/orderStats';

const VALID_TABS: ProfileTab[] = ['overview', 'orders', 'data', 'contact'];

function parseTab(value: string | null): ProfileTab {
  if (value && VALID_TABS.includes(value as ProfileTab)) {
    return value as ProfileTab;
  }
  return 'overview';
}

export default function Profile() {
  const { user, profile, loading, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = parseTab(searchParams.get('tab'));
  const orderIdParam = searchParams.get('orderId');

  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const data = await api.get<UserOrder[]>('/api/orders');
      setOrders(data);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Error al cargar pedidos');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const stats = useMemo(() => computeUserOrderStats(orders), [orders]);

  const recentOrders = useMemo(
    () =>
      orders.slice(0, 3).map((o) => ({
        id: o.id,
        total: o.total,
        status: o.status,
        createdAt: o.createdAt,
      })),
    [orders]
  );

  const setTab = (next: ProfileTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    if (next !== 'orders') params.delete('orderId');
    setSearchParams(params, { replace: true });
  };

  const handleViewOrder = (orderId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'orders');
    params.set('orderId', orderId);
    setSearchParams(params, { replace: true });
  };

  const clearOrderIdParam = () => {
    if (!searchParams.get('orderId')) return;
    const params = new URLSearchParams(searchParams);
    params.delete('orderId');
    setSearchParams(params, { replace: true });
  };

  const handleLogout = async () => {
    await signOut(getFirebaseAuth());
    navigate('/');
  };

  const profileLoading = loading || (!!user && !profile);

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-red-300 mb-4">No se pudo cargar tu perfil.</p>
          <button
            type="button"
            onClick={() => void refreshProfile()}
            className="px-6 py-3 rounded-lg bg-[#d4af37] text-[#0a0a0a] font-bold uppercase tracking-wider text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <ProfileSidebar
              tab={tab}
              onTabChange={setTab}
              nombre={profile.nombre}
              email={user?.email ?? profile.email}
              isAdmin={isAdmin}
              loading={false}
              onLogout={() => void handleLogout()}
            />
          </div>

          <div className="lg:col-span-3">
            {tab === 'overview' && (
              <ProfileOverview
                profile={{
                  nombre: profile.nombre,
                  email: profile.email,
                  phone: profile.phone,
                  address: profile.address as { calle?: string; ciudad?: string } | undefined,
                }}
                stats={stats}
                recentOrders={recentOrders}
                ordersLoading={ordersLoading}
                onGoToOrders={() => setTab('orders')}
                onViewOrder={handleViewOrder}
              />
            )}

            {tab === 'orders' && (
              <ProfileOrdersTab
                orders={orders}
                ordersLoading={ordersLoading}
                ordersError={ordersError}
                initialOrderId={orderIdParam}
                onOrdersChange={setOrders}
                onClearOrderIdParam={clearOrderIdParam}
              />
            )}

            {tab === 'data' && (
              <ProfileDataForm
                profile={{
                  nombre: profile.nombre,
                  phone: profile.phone,
                  address: profile.address as {
                    calle?: string;
                    ciudad?: string;
                    provincia?: string;
                    codigoPostal?: string;
                    referencias?: string;
                  },
                }}
                onSaved={refreshProfile}
              />
            )}

            {tab === 'contact' && (
              <div className="space-y-6" role="tabpanel" id="panel-contact" aria-labelledby="tab-contact">
                <div>
                  <h1 className="text-2xl font-bold text-[#f5e6c8] uppercase tracking-wider" style={{ fontFamily: '"Bodoni Moda", serif' }}>
                    Contactar al Creador
                  </h1>
                  <p className="text-[#a89a82] text-sm mt-1">¿Tienes una idea personalizada? Escríbenos</p>
                </div>
                <div className="bg-[#141210] border border-[#2a2520] rounded-xl p-6">
                  <CreatorContact defaultName={profile.nombre} defaultEmail={profile.email} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
