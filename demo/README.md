# Demo Validación Preventiva

PoC para validar preventivamente un onboarding bancario. Integra un backend Express que revisa completitud de documentos y consulta Gemini para un análisis preliminar, y un frontend React (Vite) que captura datos y muestra el resultado en tiempo real.

## De qué trata el proyecto
- Simular la recepción de datos + archivos (RUT, cédula, extractos) de un postulante.
- Validar que la información esté completa antes de seguir un flujo bancario.
- Pedir a Gemini un análisis resumido (riesgo preliminar, incoherencias y recomendación) para apoyar la decisión.
- Mostrar en frontend el estado de validación y el detalle devuelto por el backend.

## Requisitos
- Node.js 18+
- npm

## Estructura
- backend/: API Express con endpoint POST /validar
- frontend/: app Vite/React que envía multipart/form-data al backend y muestra la respuesta

## Puesta en marcha rápida
```bash
# Backend
cd demo/backend
npm install
cp .env.example .env   # o crea .env (ver variables abajo)
npm start              # expone http://localhost:3001

# Frontend
cd ../frontend
npm install
npm run dev            # por defecto http://localhost:5173
```

## Variables de entorno (demo/backend/.env)
```
GEMINI_API_KEY=TU_API_KEY_AQUI
PORT=3001
```

## Uso y flujo
1) En el frontend, completa el formulario y adjunta RUT, cédula y extractos.
2) Pulsa **Validar**. Se envía multipart/form-data a http://localhost:3001/validar.
3) El backend revisa campos y archivos; si todo está presente, consulta Gemini y responde con algo similar a:
```json
{
  "campos_faltantes": [],
  "incoherencias": [],
  "riesgo_preliminar": "Bajo",
  "decision": "ContinuarFlujoTradicional"
}
```
4) El frontend muestra estado, faltantes (si hay) y el análisis de IA.

## Scripts útiles
- Backend: npm start
- Frontend: npm run dev

## Notas
- Ejecuta backend y frontend en paralelo; el frontend espera el backend en http://localhost:3001/validar.
- Usa tu clave de Gemini en GEMINI_API_KEY antes de probar.
