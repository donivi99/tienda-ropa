export const PROFILE_ROUTES = {
  overview: '/mi-cuenta',
  orders: '/mi-cuenta/pedidos',
  orderDetail: (orderId: string) => `/mi-cuenta/pedidos/${orderId}`,
  data: '/mi-cuenta/datos',
  contact: '/mi-cuenta/contacto',
} as const;
