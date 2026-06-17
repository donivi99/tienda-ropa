import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();

const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripeCheckoutPaymentProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function StripeCheckoutPayment({
  clientSecret,
  orderId,
  onSuccess,
  onError,
}: StripeCheckoutPaymentProps) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-red-400">
        Pagos no configurados: falta VITE_STRIPE_PUBLISHABLE_KEY en el entorno.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#d4af37',
            colorBackground: '#1e1b18',
            colorText: '#f5e6c8',
            colorDanger: '#f87171',
            borderRadius: '8px',
          },
        },
        locale: 'es',
      }}
    >
      <StripePaymentForm orderId={orderId} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
