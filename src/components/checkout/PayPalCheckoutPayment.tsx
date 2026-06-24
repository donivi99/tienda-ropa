import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import { api } from '../../services/api';

const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID?.trim();

interface PayPalCheckoutPaymentProps {
  orderId: string;
  paypalOrderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function PayPalCheckoutPayment({
  orderId,
  paypalOrderId,
  onSuccess,
  onError,
}: PayPalCheckoutPaymentProps) {
  if (!paypalClientId) {
    return (
      <p className="text-sm text-red-400">
        Pagos con PayPal no configurados: falta VITE_PAYPAL_CLIENT_ID en el entorno.
      </p>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: paypalClientId,
        currency: 'EUR',
        intent: 'capture',
      }}
    >
      <PayPalButtons
        style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' }}
        createOrder={() => Promise.resolve(paypalOrderId)}
        onApprove={async (data) => {
          const approvedOrderId = data.orderID;
          if (!approvedOrderId) {
            onError('No se recibió la orden de PayPal');
            return;
          }

          try {
            await api.post('/api/payments/paypal/capture', {
              orderId,
              paypalOrderId: approvedOrderId,
            });
            onSuccess();
          } catch (err) {
            onError(err instanceof Error ? err.message : 'Error al confirmar el pago con PayPal');
          }
        }}
        onError={(err) => {
          const message =
            err instanceof Error ? err.message : 'Error en el flujo de pago de PayPal';
          onError(message);
        }}
      />
    </PayPalScriptProvider>
  );
}
