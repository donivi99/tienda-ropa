import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes, { paypalWebhookHandler, stripeWebhookHandler } from './routes/payments.js';
import { validatePayPalWebhookHeaders } from './middleware/validatePayment.js';
import { isPayPalConfigured } from './services/paypalService.js';
import { isStripeConfigured } from './services/paymentService.js';

if (
  process.env.NODE_ENV === 'production' &&
  isStripeConfigured() &&
  !process.env.STRIPE_WEBHOOK_SECRET?.trim()
) {
  throw new Error('STRIPE_WEBHOOK_SECRET es obligatorio en producción cuando Stripe está configurado');
}

if (
  process.env.NODE_ENV === 'production' &&
  isPayPalConfigured() &&
  !process.env.PAYPAL_WEBHOOK_ID?.trim()
) {
  throw new Error('PAYPAL_WEBHOOK_ID es obligatorio en producción cuando PayPal está configurado');
}

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stripeConnectSrc = [
  'https://api.stripe.com',
  'https://*.stripe.com',
];

const paypalConnectSrc = [
  'https://www.paypal.com',
  'https://www.sandbox.paypal.com',
  'https://api-m.paypal.com',
  'https://api-m.sandbox.paypal.com',
];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://js.stripe.com',
        'https://www.paypal.com',
        'https://www.sandbox.paypal.com',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'https:', 'data:'],
      frameSrc: [
        "'self'",
        'https://js.stripe.com',
        'https://hooks.stripe.com',
        'https://www.paypal.com',
        'https://www.sandbox.paypal.com',
      ],
      connectSrc: [
        "'self'",
        'https://*.googleapis.com',
        'https://*.firebaseio.com',
        'https://*.cloudfunctions.net',
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://api.cloudinary.com',
        'https://res.cloudinary.com',
        'https://images.unsplash.com',
        ...stripeConnectSrc,
        ...paypalConnectSrc,
      ],
    },
  },
}));
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: true }));

// Webhooks: cuerpo raw para verificar firma (antes de express.json)
app.post(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler,
);

app.post(
  '/api/payments/paypal/webhook',
  express.raw({ type: 'application/json' }),
  validatePayPalWebhookHeaders,
  paypalWebhookHandler,
);

app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
