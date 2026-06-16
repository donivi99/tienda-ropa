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
├── config/firebase.ts    # Admin SDK (serviceAccountKey.json)
├── middleware/
│   ├── auth.ts           # verifyIdToken (checkRevoked)
│   ├── admin.ts          # rol admin
│   └── validate.ts       # validadores de body
├── routes/
│   ├── auth.ts
│   ├── products.ts
│   ├── orders.ts
│   ├── admin.ts
│   └── contact.ts
├── services/             # Lógica de negocio + Firestore
├── scripts/              # Seeds y migraciones CLI
└── utils/                # validación, caché, productoId
```

## Configuración

### Credenciales

1. Firebase Console → Project Settings → Service Accounts → **Generate new private key**
2. Guardar como `backend/serviceAccountKey.json` (no versionar)

### Variables de entorno (`backend/.env`)

```bash
PORT=3000
CORS_ORIGIN=http://localhost:3001
ADMIN_SEED_EMAIL=admin@tiendaropa.com
ADMIN_SEED_PASSWORD=pon_una_contraseña_segura
ADMIN_SEED_NAME=Administrador
```

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

Pedido con `userId`, `items[]`, `subtotal`, `shippingFee`, `total`, `shippingAddress`, `deliveryMethod`, `status` (`pagado` \| `enviado` \| `entregado` \| `cancelado`), timestamps.

Al crear un pedido se valida y descuenta stock en transacción.

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
| POST | `/` | Sí | Crear pedido |
| GET | `/` | Sí | Mis pedidos |
| GET | `/:id` | Sí | Detalle |
| PUT | `/:id/cancel` | Sí | Cancelar (restaura stock) |

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
