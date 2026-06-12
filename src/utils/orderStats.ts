export interface OrderStatsInput {
  total?: number;
  status?: string;
  createdAt?: string;
}

export interface UserOrderStats {
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  pendingOrders: number;
}

export function computeUserOrderStats(orders: OrderStatsInput[]): UserOrderStats {
  let orderCount = 0;
  let totalSpent = 0;
  let lastOrderAt: string | null = null;
  let pendingOrders = 0;

  for (const order of orders) {
    const isCancelled = order.status === 'cancelado';

    if (!isCancelled) {
      orderCount += 1;
      totalSpent += order.total ?? 0;
      if (order.createdAt) {
        if (!lastOrderAt || order.createdAt > lastOrderAt) {
          lastOrderAt = order.createdAt;
        }
      }
    }

    if (order.status === 'pagado' || order.status === 'enviado') {
      pendingOrders += 1;
    }
  }

  return { orderCount, totalSpent, lastOrderAt, pendingOrders };
}
