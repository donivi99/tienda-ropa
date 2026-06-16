# TiendaRopa - E-Commerce Full-Stack

Tienda online de ropa: React (Vite) + Express + Firebase Auth + Firestore.

## Quick Start

### 1. Instalar dependencias

```bash
npm install
cd backend && npm install && cd ..
```

### 2. Configurar variables de entorno

**Frontend** — crear `.env` en la raíz:

```bash
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_API_URL=http://localhost:3000
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
```

> No subas `.env` ni `backend/.env` al repositorio.

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

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Frontend (3001) + backend (3000) |
| `npm run build` | Build producción |
| `npm start` | Servidor producción (API + static) |
| `npm test` | Tests frontend + backend |
| `npm run seed:admin` | Crear admin |
| `npm run seed:products` | Sembrar catálogo |
| `npm run migrate:categories` | Normalizar categorías legacy en Firestore |
| `npm run lint` | ESLint |

Scripts adicionales del backend: [backend/README.md](./backend/README.md#scripts-cli).

## Producción

```bash
npm run build
npm start
```

Express sirve la API y el build de Vite en un solo puerto (3000 por defecto).

## Stack

| Parte | Tecnología |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind 4, Vite, React Router |
| Backend | Node.js, Express, TypeScript — [detalle](./backend/README.md) |
| Auth | Firebase Auth |
| Datos | Firestore (catálogo también leído desde cliente con reglas estrictas) |

## Estructura

```
tienda-ropa/
├── src/                 # Frontend React
│   ├── components/
│   ├── pages/           # Home, Checkout, Profile, admin/
│   ├── context/         # Auth, Cart
│   └── services/        # api.ts
├── backend/             # API Express → ver backend/README.md
├── shared/types/        # Tipos compartidos
├── firestore.rules
├── firebase.json
└── README.md
```

## API (resumen)

| Prefijo | Uso |
|---------|-----|
| `/api/auth` | Login, registro, perfil |
| `/api/products` | Catálogo (público activos; CRUD admin) |
| `/api/orders` | Pedidos del usuario |
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
