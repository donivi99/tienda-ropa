# TiendaRopa - E-Commerce Full-Stack

Tienda online de ropa: React (Vite) + Express + Firebase Auth + Firestore.

Monorepo con **npm workspaces**: `frontend/` y `backend/` en la raíz.

## Quick Start

### 1. Instalar dependencias

Desde la raíz del proyecto (instala frontend y backend):

```bash
npm install
```

### 2. Configurar variables de entorno

**Frontend** — copia `.env.example` de la raíz a `.env` (recomendado en local) o usa `frontend/.env.example` → `frontend/.env`:

```bash
# frontend/.env  (o .env en la raíz)
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=http://localhost:3000

# Stripe — Clave publicable (modo test: dashboard.stripe.com/test/apikeys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal — Client ID público Sandbox (developer.paypal.com → Apps & Credentials)
# VITE_PAYPAL_CLIENT_ID=
```

**Backend** — ver [backend/README.md](./backend/README.md#configuración) para `backend/.env` (Firebase Admin + seeds).

Resumen del backend:

```bash
# backend/.env
PORT=3000
CORS_ORIGIN=http://localhost:3001
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ADMIN_SEED_EMAIL=admin@tiendaropa.com
ADMIN_SEED_PASSWORD=pon_una_contraseña_segura
ADMIN_SEED_NAME=Administrador

# Stripe (backend) — ver backend/README.md#stripe-pagos-con-tarjeta
STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...   # opcional en local; obligatorio en producción

# PayPal (backend) — ver backend/README.md#paypal-checkout-orders-api-v2
# PAYPAL_CLIENT_ID=
# PAYPAL_CLIENT_SECRET=
# PAYPAL_WEBHOOK_ID=              # opcional en local; obligatorio en producción
PAYPAL_MODE=sandbox
```

> No subas `.env`, `frontend/.env` ni `backend/.env` al repositorio.

### 3. Habilitar Email/Password en Firebase

Firebase Console → Authentication → Método de acceso → Correo electrónico → Habilitar.

### 4. Arrancar el proyecto

```bash
npm run dev
```

- Frontend: **http://localhost:3001**
- Backend API: **http://localhost:3000**

### 5. Datos iniciales (opcional)

```bash
npm run seed:admin      # usuario administrador
npm run seed:products   # catálogo (~280 productos)
```

### 6. Reglas Firestore

```bash
firebase deploy --only firestore:rules
```

Las reglas están en `firestore.rules` (lectura pública de productos; escrituras solo backend).

### 7. Probar pagos (Stripe y PayPal)

#### Tarjeta (Stripe)

No hace falta instalar nada extra. Con `pk_test_` y `sk_test_` en tus `.env` basta.

1. Activa el **entorno de prueba** en [dashboard.stripe.com](https://dashboard.stripe.com) (banner azul arriba).
2. Copia las claves en **Desarrolladores → Claves de API**:
   - **Clave publicable** (`pk_test_...`) → `VITE_STRIPE_PUBLISHABLE_KEY` en `frontend/.env` (o `.env` raíz)
   - **Clave secreta** (`sk_test_...`) → `STRIPE_SECRET_KEY` en `backend/.env`
   - No uses la **clave restringida** (`rk_test_...`).
3. `npm run dev` → inicia sesión → añade producto al carrito → **Finalizar compra**.
4. Completa dirección → **Continuar al pago** → elige **Tarjeta** → paga con tarjeta de prueba:

| Escenario | Número | Fecha | CVC |
|-----------|--------|-------|-----|
| Pago simple | `4242 4242 4242 4242` | Futura (ej. `12/34`) | `123` |
| 3DS (redirect) | `4000 0025 0000 3155` | Futura | `123` |

5. Comprueba que el pedido queda **pagado** en Mi cuenta → Pedidos y que el pago aparece en [Stripe → Payments (test)](https://dashboard.stripe.com/test/payments).

#### PayPal (Sandbox)

1. Crea una app en [developer.paypal.com](https://developer.paypal.com) → **Apps & Credentials** → **Sandbox**.
2. Copia **Client ID** y **Secret**:
   - `VITE_PAYPAL_CLIENT_ID` en `frontend/.env` (o `.env` raíz)
   - `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` en `backend/.env`
3. Reinicia `npm run dev` tras cambiar variables `VITE_*`.
4. En checkout elige **PayPal** e inicia sesión con una [cuenta comprador Sandbox](https://developer.paypal.com/tools/sandbox/accounts/) (no tu email real de PayPal).

Sin webhook en local el pedido puede quedar **pagado** tras la captura o desde la página de confirmación (`/pedido-confirmado`). En producción configura también `PAYPAL_WEBHOOK_ID`.

#### Reanudar pago pendiente

En **Mi cuenta → Pedidos**, un pedido `pendiente_pago` muestra **Realizar pago**. Abre el checkout en modo completar pago (`/checkout?orderId=...`), sincroniza stock en servidor y permite elegir **Tarjeta** o **PayPal**.

En producción, configura webhooks de Stripe y PayPal (el backend no arranca sin ellos si los pagos están activos). Ver checklist completo en [backend/README.md](./backend/README.md).

Detalle de claves, webhooks y flujo de seguridad: **[backend/README.md — Pagos](./backend/README.md#stripe-pagos-con-tarjeta)**.

## Comandos

Todos se ejecutan desde la **raíz** del monorepo:

| Comando | Qué hace |
|---------|----------|
| `npm install` | Instala dependencias de `frontend/` y `backend/` (workspaces) |
| `npm run dev` | Frontend (3001) + backend (3000) |
| `npm run build` | Build producción de frontend y backend |
| `npm start` | Servidor producción (API + static desde `frontend/dist`) |
| `npm test` | Tests frontend + backend |
| `npm run seed:admin` | Crear admin |
| `npm run seed:products` | Sembrar catálogo |
| `npm run migrate:categories` | Normalizar categorías legacy en Firestore |
| `npm run retry:refunds` | Reintentar reembolsos pendientes (Stripe y PayPal) |
| `npm run lint` | ESLint (frontend) |

Scripts adicionales del backend: [backend/README.md](./backend/README.md#scripts-cli).

## Producción

### Despliegue monolítico (un solo servicio)

```bash
npm run build
npm start
```

Express sirve la API y el build de Vite (`frontend/dist`) en un solo puerto (3000 por defecto).

### Despliegue separado (recomendado)

| Servicio | Directorio raíz | Build | Start / Output |
|----------|-----------------|-------|----------------|
| **Frontend** | `frontend/` | `npm run build` | Output: `frontend/dist` (static site) |
| **Backend** | `backend/` | `npm run build` | `npm start` → `node dist/index.js` |

En la raíz del monorepo también puedes usar `npm run build` y `npm start` para orquestar ambos.

Variables de entorno en producción:
- Frontend: todas las `VITE_*` en la plataforma de hosting estática.
- Backend: `backend/.env` o variables del proveedor (secretos, Firebase Admin, Stripe, PayPal).

## Stack

| Parte | Tecnología |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind 4, Vite, React Router |
| Pagos | Stripe (tarjeta) + PayPal Checkout (Orders API v2) |
| Backend | Node.js, Express, TypeScript — [detalle](./backend/README.md) |
| Auth | Firebase Auth |
| Datos | Firestore (catálogo también leído desde cliente con reglas estrictas) |

## Estructura

```
tienda-ropa/
├── frontend/            # Cliente React (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/       # Home, Checkout, OrderConfirmation, Profile, admin/
│   │   ├── components/checkout/  # StripeCheckoutPayment, PayPalCheckoutPayment
│   │   ├── context/     # Auth, Cart
│   │   ├── types/       # Tipos del cliente
│   │   └── services/    # api.ts
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── .env.example     # Variables VITE_*
├── backend/             # API Express → ver backend/README.md
│   ├── src/
│   │   └── types/       # Tipos del servidor
│   ├── package.json
│   └── .env.example
├── package.json         # Orquestador (workspaces + scripts)
├── .env.example         # Variables VITE_* (raíz; Vite las lee en desarrollo)
├── firebase.json
├── firestore.rules
├── README.md
└── AGENTS.md
```

Los tipos TypeScript viven en cada paquete: `frontend/src/types/` (cliente) y `backend/src/types/` (servidor).

## API (resumen)

| Prefijo | Uso |
|---------|-----|
| `/api/auth` | Login, registro, perfil |
| `/api/products` | Catálogo (público activos; CRUD admin) |
| `/api/orders` | Pedidos del usuario (crear, cancelar, preparar pago pendiente) |
| `/api/payments` | Stripe y PayPal: crear sesión, confirmar/capturar, webhooks |
| `/api/admin` | Dashboard, usuarios, pedidos, productos |
| `/api/contact` | Mensajes de contacto |

Documentación completa de endpoints, modelo de datos y middleware: **[backend/README.md](./backend/README.md)**.

## Roles

| Acción | Usuario | Admin |
|--------|---------|-------|
| Ver y comprar | ✅ | ✅ |
| CRUD productos | ❌ | ✅ |
| Gestionar pedidos / usuarios | ❌ | ✅ |

## Diseño

- **Paleta:** negro `#0a0a0a`, dorado `#d4af37`, crema `#f5e6c8`
- **Tipografía:** Fraunces

## Documentación adicional

- [backend/README.md](./backend/README.md) — API, Firestore, scripts, seguridad
- [AGENTS.md](./AGENTS.md) — guía para agentes de IA en este repo
