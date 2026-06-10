# TiendaRopa - E-Commerce Full-Stack

Tienda online de ropa con frontend React, backend Node.js/Express y Firebase.

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

**Backend** — descargar credenciales de Firebase Admin:

1. Ir a Firebase Console → tu proyecto → **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Guardar el JSON descargado como `backend/serviceAccountKey.json`

El archivo `.env` del backend solo necesita:

```bash
PORT=3000
CORS_ORIGIN=http://localhost:3001
ADMIN_SEED_EMAIL=admin@tiendaropa.com
ADMIN_SEED_PASSWORD=pon_una_contraseña_segura
ADMIN_SEED_NAME=Administrador
```

> No subas `.env`, `backend/.env` ni `backend/serviceAccountKey.json` al repositorio.

### 3. Habilitar Email/Password en Firebase

1. Ir a Firebase Console → tu proyecto → **Authentication**
2. Click en pestaña **"Método de acceso"**
3. Click **"Agregar método de acceso"**
4. Selecciona **"Correo electrónico"**
5. Activa la casilla **"Habilitar"**
6. Click **Guardar**

### 4. Arrancar el proyecto

Desde la carpeta raíz del proyecto (`tienda-ropa/`):

```bash
npm run dev
```

Esto arranca frontend y backend a la vez. Abre **http://localhost:3001** en el navegador.

### 5. Crear usuario admin (opcional)

Desde la carpeta raíz del proyecto (`tienda-ropa/`):

```bash
npm run seed:admin
```

- Usa las variables `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` y `ADMIN_SEED_NAME` del `backend/.env`.

## Comandos

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Arranca frontend + backend |
| `npm run build` | Build de producción |
| `npm start` | Arranca en producción (1 puerto) |
| `npm run seed:admin` | Crea usuario administrador |
| `npm run lint` | Verifica el código |

## Producción

```bash
npm run build
npm start
```

Todo corre en **http://localhost:3000** — Express sirve la API y el frontend.

## Seguridad

- No commits secretos ni claves de Firebase.
- Mantén `serviceAccountKey.json` solo en local.
- Cambia los datos del admin antes de publicar si el proyecto será público.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **Auth:** Firebase Auth
- **Base de datos:** Firestore

## Estructura

```
tienda-ropa/
├── src/                    # Frontend React
│   ├── components/         # Navbar, Footer, ProductCard, etc.
│   ├── pages/              # Home, Login, Checkout, Profile
│   │   └── admin/          # Panel admin (Dashboard, Products, Orders, Users)
│   ├── context/            # CartContext, AuthContext
│   └── services/           # api.ts (cliente HTTP)
├── backend/                # Backend Express
│   └── src/
│       ├── routes/         # auth, products, orders, admin
│       ├── services/       # lógica de negocio
│       ├── middleware/      # auth, admin, validate
│       └── scripts/        # seedAdmin.ts
├── package.json
└── README.md
```

## API Endpoints

| Ruta | Métodos | Descripción |
|------|---------|-------------|
| `/api/auth` | POST, GET, PUT | Registro, perfil, roles |
| `/api/products` | GET, POST, PUT, DELETE | CRUD productos |
| `/api/orders` | GET, POST, PATCH | Pedidos |
| `/api/admin` | GET, PATCH | Dashboard, gestión admin |

## Roles

| Acción | Usuario | Admin |
|--------|---------|-------|
| Ver productos | ✅ | ✅ |
| Comprar | ✅ | ✅ |
| CRUD productos | ❌ | ✅ |
| Gestionar pedidos | ❌ | ✅ |
| Gestionar usuarios | ❌ | ✅ |

## Diseño

- **Paleta:** Negro (#0a0a0a), dorado (#d4af37), crema (#f5e6c8), beige (#a89a82)
- **Tipografía:** Bodoni Moda (headings), Merriweather (body)
