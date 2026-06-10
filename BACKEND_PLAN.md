# Backend Plan - tiendaRopa

## Credenciales Admin Inicial

- Configurar mediante `backend/.env` usando `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` y `ADMIN_SEED_NAME`.
- No versionar credenciales reales en el repositorio.

---

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Lenguaje:** TypeScript
- **Auth:** Firebase Auth + Firebase Admin SDK
- **DB:** Firestore (mantenemos Firebase)
- **Puerto local:** 3000

---

## Arquitectura

```
tienda-ropa/
├── src/                          # Frontend React (ya existe)
│   ├── App.tsx
│   ├── components/
│   │   ├── CartDrawer.tsx
│   │   ├── CollectionPage.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   └── ProtectedRoute.tsx
│   ├── config/
│   │   └── firebase.ts           # Firebase client SDK
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── domain/
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── ProductDetail.tsx
│   │   ├── Profile.tsx
│   │   ├── Seed.tsx
│   │   ├── Checkout.tsx
│   │   └── SobreNosotros.tsx
│   ├── prompts/
│   ├── providers/
│   ├── services/
│   └── types/
│       └── index.ts              # Product, CartItem, Order types
├── backend/                      # NUEVO - Backend Node.js
│   ├── src/
│   │   ├── index.ts              # Entry point Express
│   │   ├── config/
│   │   │   └── firebase.ts       # Firebase Admin SDK init
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Verificar token Firebase
│   │   │   ├── admin.ts          # Verificar rol admin
│   │   │   └── validate.ts       # Validación de body
│   │   ├── routes/
│   │   │   ├── auth.ts           # Login, register, profile
│   │   │   ├── products.ts       # CRUD productos
│   │   │   ├── orders.ts         # CRUD pedidos
│   │   │   └── admin.ts          # Panel admin
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── productService.ts
│   │   │   └── orderService.ts
│   │   ├── scripts/
│   │   │   └── seedAdmin.ts      # Crear admin inicial
│   │   └── types/
│   │       └── index.ts          # Tipos backend
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── .env
├── .env.example
├── package.json                  # Frontend dependencies
└── vite.config.ts
```

---

## Modelo de Datos Firestore

### Colección: `users`

```json
{
  "uid": "string",
  "email": "string",
  "nombre": "string",
  "role": "user | admin",
  "phone": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Colección: `products`

```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": "number",
  "category": "string",
  "genero": "mujer | hombre",
  "tipo": "corto | largo",
  "images": ["string"],
  "sizes": ["string"],
  "colors": ["string"],
  "stock": {
    "S": "number",
    "M": "number",
    "L": "number",
    "XL": "number"
  },
  "isActive": "boolean",
  "createdBy": "uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Colección: `orders`

```json
{
  "id": "string",
  "userId": "uid",
  "userEmail": "string",
  "userName": "string",
  "items": [
    {
      "productId": "string",
      "name": "string",
      "price": "number",
      "size": "string",
      "color": "string",
      "quantity": "number",
      "image": "string"
    }
  ],
  "total": "number",
  "status": "pending | processing | shipped | delivered | cancelled",
  "shippingAddress": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string",
    "country": "string"
  },
  "paymentMethod": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Colección: `auditLogs`

```json
{
  "id": "string",
  "action": "string",
  "performedBy": "uid",
  "targetType": "product | order | user",
  "targetId": "string",
  "details": "object",
  "createdAt": "timestamp"
}
```

---

## API Endpoints

### Auth

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/register` | Registrar usuario | No |
| POST | `/api/auth/login` | Login (retorna token) | No |
| GET | `/api/auth/me` | Obtener perfil actual | Sí |
| PUT | `/api/auth/me` | Actualizar perfil | Sí |
| POST | `/api/auth/reset-password` | Enviar email reset | No |

### Products

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/products` | Listar productos (público) | No |
| GET | `/api/products/:id` | Detalle producto | No |
| POST | `/api/products` | Crear producto | Admin |
| PUT | `/api/products/:id` | Actualizar producto | Admin |
| DELETE | `/api/products/:id` | Eliminar producto | Admin |
| GET | `/api/products/my-products` | Productos del usuario | Sí |

### Orders

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/orders` | Listar mis pedidos | Sí |
| POST | `/api/orders` | Crear pedido | Sí |
| GET | `/api/orders/:id` | Detalle pedido | Sí |
| PUT | `/api/orders/:id/cancel` | Cancelar pedido | Sí |

### Admin

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/admin/dashboard` | Estadísticas | Admin |
| GET | `/api/admin/users` | Listar usuarios | Admin |
| GET | `/api/admin/orders` | Todos los pedidos | Admin |
| PUT | `/api/admin/orders/:id` | Actualizar estado pedido | Admin |
| PUT | `/api/admin/products/:id/active` | Activar/desactivar producto | Admin |

---

## Middleware

### auth.ts
- Extraer token del header `Authorization: Bearer <token>`
- Verificar con Firebase Admin
- Adjuntar `req.user` con uid y email

### admin.ts
- Verificar que el usuario tiene `role: admin`
- Retornar 403 si no es admin

### validate.ts
- Validar body con schemas
- Retornar 400 con errores claros

---

## Admin Inicial

### Credenciales
- **Email:** admin@tiendaropa.com
- **Contraseña:** Admin123456
- **Rol:** admin

### Script de Seed
```bash
cd backend
npm run seed:admin
```

El script:
1. Crea el usuario en Firebase Auth
2. Asigna custom claims `{ role: 'admin' }`
3. Crea documento en Firestore `users/admin`

---

## Seguridad

1. **Tokens Firebase** - Todos los endpoints protegidos verifican el token
2. **Roles** - Solo admin puede crear/editar/eliminar productos
3. **Rate limiting** - Limitar requests por IP
4. **CORS** - Solo permitir frontend en producción
5. **Helmet** - Headers de seguridad
6. **Variables de entorno** - No hardcodear secrets

---

## Variables de Entorno Backend

```env
PORT=3000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_STORAGE_BUCKET=your-bucket
CORS_ORIGIN=http://localhost:3001
```

---

## Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.ts",
    "seed:admin": "tsx src/scripts/seedAdmin.ts"
  }
}
```

---

## Fases de Implementación

### Fase 1: Setup Backend ✅
- [x] Crear carpeta `backend/`
- [x] Inicializar package.json
- [x] Instalar dependencias
- [x] Configurar TypeScript
- [x] Configurar Firebase Admin SDK

### Fase 2: Auth y Roles ✅
- [x] Middleware de autenticación
- [x] Middleware de admin
- [x] Registro de usuario
- [x] Login
- [x] Perfil de usuario

### Fase 3: CRUD Productos ✅
- [x] Listar productos (público)
- [x] Detalle producto
- [x] Crear producto (admin)
- [x] Actualizar producto (admin)
- [x] Eliminar producto (admin)

### Fase 4: Pedidos ✅
- [x] Crear pedido
- [x] Listar mis pedidos
- [x] Detalle pedido
- [x] Cancelar pedido

### Fase 5: Panel Admin ✅
- [x] Dashboard con estadísticas
- [x] Gestión de usuarios
- [x] Gestión de pedidos
- [x] Activar/desactivar productos

### Fase 6: Frontend Integration
- [ ] Conectar Login con backend
- [ ] Conectar productos con backend
- [ ] Crear rutas admin en frontend
- [ ] Crear panel admin UI

### Fase 7: Seguridad y Deploy
- [x] Rate limiting
- [x] CORS
- [x] Helmet
- [ ] Variables de entorno
- [ ] Preparar para despliegue
