# TiendaRopa — Agentes del proyecto

E-commerce full-stack: React 19 + Vite + Tailwind 4 + Express + Firebase.

## Subagentes (roles)

Usa el rol adecuado según la tarea:

| Rol | Cuándo usarlo | Ámbito |
|-----|---------------|--------|
| **Frontend Designer** | UI, componentes, estilos, a11y, SEO | `frontend/src/**/*.tsx` |
| **Cart State** | Carrito, contextos, hooks, tipos | `frontend/src/context/`, `frontend/src/hooks/`, `frontend/src/types/` |
| **Backend Integration** | API, Firebase, servicios | `backend/src/**` |
| **Security Audit** | Revisión de seguridad (solo lectura) | Todo el repo |

## Comandos del proyecto

- `npm install` — instala dependencias de frontend y backend (npm workspaces)
- `npm run dev` — frontend (3001) + backend (3000)
- `npm run build` — build producción (frontend + backend)
- `npm run seed:admin` — crear admin
- `npm run seed:products` — sembrar catálogo (backend, Admin SDK)

## Seguridad

- El JWT de sesión se guarda en `localStorage` (riesgo XSS). Mitigar con CSP estricta y sin `dangerouslySetInnerHTML` con datos de usuario.
- Desplegar reglas Firestore: `firebase deploy --only firestore:rules`

## Reglas críticas

- Nunca commitear `.env`, `frontend/.env` ni `backend/.env`
- Variables frontend: `import.meta.env.VITE_*`
- Paleta: negro `#0a0a0a`, dorado `#d4af37`, crema `#f5e6c8`
- Tipografía: Fraunces (headings y body)
