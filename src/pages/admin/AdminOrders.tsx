import { useEffect, useState } from 'react';
import { api } from '../../services/api';

interface AdminOrder {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: {
    name: string;
    price: number;
    size: string;
    color: string;
    quantity: number;
  }[];
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await api.get<AdminOrder[]>('/api/admin/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.put(`/api/admin/orders/${orderId}`, { status });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2a2520] border-t-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#f5e6c8]" style={{ fontFamily: '"Bodoni Moda", serif' }}>
          Pedidos
        </h1>
        <p className="mt-1 text-sm text-[#a89a82]">{orders.length} pedidos</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#2a2520]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2520] bg-[#141210]">
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Pedido</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Cliente</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Productos</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Total</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Estado</th>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-[#a89a82]">Fecha</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-[#a89a82]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2520]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#141210]/50">
                <td className="px-4 py-3 text-[#f5e6c8] font-mono text-xs">{order.id.slice(0, 8)}...</td>
                <td className="px-4 py-3">
                  <p className="text-[#f5e6c8]">{order.userName || 'Sin nombre'}</p>
                  <p className="text-xs text-[#a89a82]">{order.userEmail}</p>
                </td>
                <td className="px-4 py-3 text-[#a89a82]">{order.items?.length || 0} productos</td>
                <td className="px-4 py-3 text-[#d4af37] font-semibold">${order.total?.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
                      order.status === 'pagado' ? 'border-[#d4af37]/30 bg-[#d4af37]/10 text-[#d4af37]' :
                      order.status === 'enviado' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
                      order.status === 'entregado' ? 'border-green-500/30 bg-green-500/10 text-green-400' :
                      'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}
                  >
                    <option value="pagado">Pagado</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[#a89a82]">
                  {new Date(order.createdAt).toLocaleDateString('es-ES')}
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded-lg px-3 py-1.5 text-xs text-[#a89a82] hover:bg-[#2a2520] hover:text-[#f5e6c8] transition-colors">
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
