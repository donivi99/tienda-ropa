import { useState } from 'react';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { api } from '../../services/api';

interface StripePaymentFormProps {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function StripePaymentForm({ orderId, onSuccess, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    onError('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/pedido-confirmado?orderId=${encodeURIComponent(orderId)}`,
        },
      });

      if (error) {
        onError(error.message ?? 'Error al procesar el pago');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        await api.post('/api/payments/stripe/confirm', { orderId });
        onSuccess();
        return;
      }

      onError('El pago no se completó. Inténtalo de nuevo.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#d4af37] text-[#0a0a0a] py-3 rounded-lg font-bold hover:bg-[#b8962e] disabled:opacity-50 transition-colors uppercase tracking-wider"
      >
        {processing ? 'Procesando pago...' : 'Pagar ahora'}
      </button>
      <p className="text-xs text-[#a89a82] text-center">
        Pago seguro procesado por Stripe. Modo prueba: usa la tarjeta 4242 4242 4242 4242.
      </p>
    </form>
  );
}
