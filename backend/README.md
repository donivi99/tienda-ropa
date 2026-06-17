# TiendaRopa — Backend

API REST en Express + TypeScript. Autenticación con Firebase Auth; persistencia en Firestore vía Firebase Admin SDK.

> Guía general del proyecto (instalación, frontend, despliegue): [README.md](../README.md)

## Stack

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js |
| Framework | Express 4 |
| Lenguaje | TypeScript |
| Auth | Firebase Auth + Admin SDK |
| Base de datos | Firestore |
| Puerto dev | 3000 |

## Estructura

```
backend/src/
├── index.ts              # Express app, Helmet, CORS, rate limit
├── config/firebase.ts    # Admin SDK (credenciales en .env)
├── middleware/
│   ├── auth.ts           # verifyIdToken (checkRevoked)
│   ├── admin.ts          # rol admin
│   └── validate.ts       # validadores de body
├── routes/
│   ├── auth.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── payments.ts       # Stripe
│   ├── admin.ts
│   └── contact.ts
├── services/             # Lógica de negocio + Firestore
├── scripts/              # Seeds y migraciones CLI
└── utils/                # validación, caché, productoId
```

## Configuración

### Credenciales Firebase Admin

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Copia `project_id`, `client_email` y `private_key` del JSON descargado a `backend/.env` (ver abajo)
3. En `private_key`, conserva los saltos de línea como `\n` dentro de comillas dobles. No guardes el JSON en el repo.

### Variables de entorno (`backend/.env`)

Copia `backend/.env.example` y rellena los valores:

```bash
PORT=3000
CORS_ORIGIN=http://localhost:3001

FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

ADMIN_SEED_EMAIL=admin@tiendaropa.com
ADMIN_SEED_PASSWORD=pon_una_contraseña_segura
ADMIN_SEED_NAME=Administrador

# Stripe (modo test) — ver sección «Stripe» más abajo
STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...   # opcional en local; obligatorio en producción
```

### Stripe (pagos con tarjeta)

Checkout con **Stripe Payment Element**. Los pedidos se crean en `pendiente_pago`; el stock se descuenta solo cuando el pago se confirma. Los precios se calculan en servidor (el cliente no puede manipular importes).

#### Qué clave va en cada variable

| En Stripe (Desarrolladores → Claves de API) | Prefijo | Variable | Archivo |
|---------------------------------------------|---------|----------|---------|
| **Clave publicable** | `pk_test_...` | `VITE_STRIPE_PUBLISHABLE_KEY` | `.env` (raíz) |
| **Clave secreta** | `sk_test_...` | `STRIPE_SECRET_KEY` | `backend/.env` |
| **Clave restringida** | `rk_test_...` | — | **No usar** |
| **Secreto de webhook** | `whsec_...` | `STRIPE_WEBHOOK_SECRET` | `backend/.env` |

El `whsec_...` **no** está en la pantalla de Claves de API. Ver [¿Dónde está el webhook?](#secreto-de-webhook-whsec) más abajo.

#### Probar en local (sin instalar nada)

1. Modo **Entorno de prueba** activo en Stripe.
2. Rellena `pk_test_` y `sk_test_` en los `.env`.
3. `npm run dev` desde la raíz del monorepo.
4. Compra de prueba con tarjeta `4242 4242 4242 4242` (12/34, CVC `123`).
5. Verifica:
   - Pedido **pagado** en la web (Mi cuenta → Pedidos).
   - Pago en [dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments).

Sin `STRIPE_WEBHOOK_SECRET` el flujo sigue funcionando en local gracias a `POST /api/payments/stripe/confirm` tras el pago en el navegador y en la página de confirmación tras redirects 3DS.

**En producción** (`NODE_ENV=production`), si `STRIPE_SECRET_KEY` está configurada, el backend **no arranca** sin `STRIPE_WEBHOOK_SECRET`.

#### Secreto de webhook (`whsec_`)

Opcional en desarrollo; **obligatorio en producción** (el servidor falla al arrancar si falta).

| Entorno | Cómo obtenerlo |
|---------|----------------|
| **Local** | [Stripe CLI](https://stripe.com/docs/stripe-cli): `stripe listen --forward-to localhost:3000/api/payments/stripe/webhook` → copia el `whsec_...` que imprime |
| **Producción** | [Desarrolladores → Webhooks](https://dashboard.stripe.com/test/webhooks) → añadir endpoint `https://tudominio.com/api/payments/stripe/webhook` → **Signing secret** |

#### Flujo de pago

```
Checkout → POST /api/orders (pendiente_pago)
        → POST /api/payments/stripe/create-intent
        → Usuario paga (Stripe Elements)
        → POST /api/payments/stripe/confirm  y/o  webhook payment_intent.succeeded
        → pedido pagado + stock descontado
```

Tras autenticación 3DS, Stripe redirige a `/pedido-confirmado?orderId=...`. Esa página llama a `confirm` automáticamente (no confía en query params de Stripe).

#### Tarjetas de prueba

| Escenario | Número | Resultado esperado |
|-----------|--------|-------------------|
| Pago simple | `4242 4242 4242 4242` | Pedido `pagado`, stock descontado |
| 3DS | `4000 0025 0000 3155` | Redirect → confirm → `pagado` |
| Webhook | `stripe listen` + pago | Mismo resultado vía webhook |
| Stock agotado (dos compras simultáneas) | Dos sesiones, stock 1 | Una `pagado`; otra reembolso automático (`reembolsado`) |
| Cancelar pedido pendiente | Cancelar en Mi cuenta o admin | PI cancelado en Stripe; no se puede pagar con `clientSecret` antiguo |

#### Seguridad

- Importes calculados en servidor desde Firestore (`resolveOrderItems`).
- Confirmación de pago vía API de Stripe o webhook con firma verificada; misma validación (`assertPaymentIntentMatchesOrder`) en ambos caminos.
- `fulfillPaidOrder` es idempotente (no descuenta stock dos veces).
- Si el stock falla tras cobrar, se emite reembolso automático en Stripe y el pedido queda en `reembolsado`.
- Al cancelar un pedido (`pendiente_pago`, `pago_fallido` o `reembolsado`), el Payment Intent se invalida en Stripe (`cancel` o `refund` si ya se cobró).
- Si el cobro llega en carrera tras la cancelación (webhook o `confirm`), se reembolsa automáticamente y el pedido pasa a `reembolsado`.
- El admin **no puede** marcar `pagado` manualmente desde `pendiente_pago`; solo avanza logística (`enviado`, `entregado`) o cancela.
- Si falla un reembolso en Stripe, el pedido queda en `reembolso_pendiente`; reintentar con `npm run retry:refunds` (backend).

### Arrancar solo el backend

```bash
cd backend
npm run dev      # desarrollo (tsx watch)
npm run build && npm start   # producción
```

Desde la raíz del monorepo: `npm run dev:backend`.

## Modelo de datos (Firestore)

### `users/{uid}`

Perfil de usuario: `email`, `nombre`, `role` (`user` | `admin`), `phone`, `address` (dirección española estructurada), `createdAt`, `updatedAt`.

El rol admin también se refleja en custom claims de Firebase Auth.

### `products/{id}`

| Campo | Tipo | Notas |
|-------|------|-------|
| `productoId` | string | Ej. `TR-000042`, generado automáticamente |
| `name`, `description` | string | |
| `price` | number | |
| `discountPercent` | number? | 0–100 |
| `category` | string | `camisetas` \| `pantalones` |
| `genero` | string | `mujer` \| `hombre` \| `niños` |
| `tipo` | string | `corto` \| `largo` \| `tirantes` |
| `images`, `sizes`, `colors` | array | |
| `stock` | map | `{ "M": 10, "L": 5 }` |
| `isActive` | boolean | `false` = oculto en tienda |
| `createdBy`, `createdAt`, `updatedAt` | | |

### `orders/{id}`

Pedido con `userId`, `items[]`, `subtotal`, `shippingFee`, `total`, `shippingAddress`, `deliveryMethod`, `status` (`pendiente_pago` \| `pagado` \| `enviado` \| `entregado` \| `cancelado` \| `pago_fallido`), `paymentMethod`, `stripePaymentIntentId`, `paidAt`, timestamps.

Al crear un pedido se valida stock y precios en servidor; el stock se descuenta solo al confirmar el pago.

### `counters/products`

Contador atómico para `productoId`.

### `creator_messages/{id}`

Mensajes del formulario de contacto (solo escritura vía API).

## API

Todas las rutas protegidas esperan `Authorization: Bearer <firebase_id_token>`.

### Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/check-email` | No | Comprueba si el email existe (rate limit) |
| POST | `/login` | Sí | Sincroniza perfil en Firestore |
| POST | `/register` | Sí | Completa registro (nombre) |
| GET | `/me` | Sí | Perfil actual |
| PUT | `/me` | Sí | Actualizar perfil / dirección |
| GET | `/users` | Admin | Listar usuarios |
| PUT | `/users/:uid/role` | Admin | Cambiar rol |

### Productos — `/api/products`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Listado público (solo activos; query: `genero`, `tipo`, `category`) |
| GET | `/:id` | No | Detalle |
| GET | `/my-products` | Sí | Productos creados por el usuario |
| POST | `/` | Admin | Crear |
| PUT | `/:id` | Admin | Actualizar (validación parcial) |
| DELETE | `/:id` | Admin | Eliminar |
| PUT | `/:id/active` | Admin | Activar / desactivar |

Listado completo (incl. inactivos) para admin: `GET /api/admin/products`.

### Pedidos — `/api/orders`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | Sí | Crear pedido (`pendiente_pago`) |
| GET | `/` | Sí | Mis pedidos |
| GET | `/:id` | Sí | Detalle |
| PUT | `/:id/cancel` | Sí | Cancelar (restaura stock si ya estaba pagado; invalida PI en Stripe si pendiente) |

### Pagos — `/api/payments`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/stripe/create-intent` | Sí | Crea Payment Intent para un pedido propio |
| POST | `/stripe/confirm` | Sí | Confirma pago consultando Stripe (tras Elements) |
| POST | `/stripe/webhook` | No* | Eventos Stripe (`payment_intent.succeeded`, etc.) |

\* El webhook valida la firma `stripe-signature` con `STRIPE_WEBHOOK_SECRET`; no usa JWT.

### Admin — `/api/admin`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard` | Estadísticas (caché ~90s) |
| GET | `/users` | Usuarios con stats (`?limit=&cursor=`) |
| GET | `/users/:uid` | Detalle usuario |
| GET | `/products` | Todos los productos |
| GET | `/orders` | Pedidos (`?limit=&cursor=`) |
| GET | `/orders/:id` | Detalle pedido |
| PUT | `/orders/:id` | Cambiar estado |
| PUT | `/products/:id/active` | Toggle activo |

### Contacto — `/api/contact`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/` | Sí | Enviar mensaje (rate limit) |

### Health

`GET /api/health` → `{ status: "ok" }`

## Middleware

- **auth** — Verifica JWT de Firebase con `checkRevoked: true`
- **admin** — Exige `role: admin` en token o Firestore
- **validate** — Validadores: producto, pedido, perfil, contacto, etc.

## Scripts CLI

Ejecutar desde `backend/` o con `npm run <script>` desde la raíz del monorepo.

| Script | Comando | Descripción |
|--------|---------|-------------|
| Admin inicial | `npm run seed:admin` | Crea usuario admin + documento Firestore |
| Catálogo | `npm run seed:products` | ~280 productos vía Admin SDK |
| IDs legibles | `npm run migrate:producto-ids` | Asigna `productoId` a productos sin él |
| Categorías | `npm run migrate:categories` | `camisetas-cortas` → `camisetas`, etc. |
| Tests | `npm test` | Validadores en `src/utils/validation.test.ts` |

## Seguridad

- **Helmet** con CSP explícita
- **Rate limiting** global (100 req/15 min) + límites en `/check-email` y `/contact`
- **CORS** restringido a `CORS_ORIGIN`
- **Firestore rules** (`../firestore.rules`): lectura pública solo en `products`; escrituras al cliente denegadas
- El storefront lee `products` desde el cliente; usuarios, pedidos y writes sensibles solo vía esta API

Desplegar reglas:

```bash
firebase deploy --only firestore:rules
```

## Arquitectura con el frontend

```
Frontend (3001)                    Backend (3000)
     │                                  │
     ├─ Firestore client ──read──► products (reglas públicas)
     │
     └─ api.ts ──REST──► /api/auth, /orders, /admin, ...
                              │
                              └── Admin SDK ──► Firestore (read/write)
```

## Tests

```bash
npm test
```

Cubre `validateProduct`, `validateProductUpdate`, validación de direcciones en `middleware/validate.ts` y `utils/validation.ts`.
