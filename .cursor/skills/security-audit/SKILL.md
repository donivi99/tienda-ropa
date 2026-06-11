---
name: security-audit
description: Audita seguridad del repo TiendaRopa (Firebase, XSS, credenciales). Usar cuando pidan revisión de seguridad, audit o vulnerabilidades. Solo lectura.
---

# Security Audit

1. Revisar `backend/src/middleware/` y rutas admin
2. Verificar que secretos no estén en código fuente
3. Comprobar validación de inputs en routes y frontend forms
4. Revisar AuthContext y flujos de roles
5. Entregar informe con severidad: Critical / Warning / Info
