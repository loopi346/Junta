# Demo Validacion Preventiva

PoC para validar preventivamente un onboarding bancario. Integra un backend Express que revisa completitud de documentos y consulta Gemini para un analisis preliminar, y un frontend React (Vite) que captura datos y muestra el resultado en tiempo real.

## Demo en linea
- Si no quieres levantarlo local, prueba en https://junta-2.onrender.com/.
- El flujo es el mismo: completa el formulario, adjunta los archivos y revisa el resultado que retorna el backend.

## De que trata el proyecto
- Simular la recepcion de datos + archivos (RUT, cedula, extractos) de un postulante.
- Validar que la informacion este completa antes de seguir un flujo bancario.
- Pedir a Gemini un analisis resumido (riesgo preliminar, incoherencias y recomendacion) para apoyar la decision.
- Mostrar en frontend el estado de validacion y el detalle devuelto por el backend.

## Requisitos
- Node.js 18+
- npm

## Estructura
- backend/: API Express con endpoint POST /validar
- frontend/: app Vite/React que envia multipart/form-data al backend y muestra la respuesta

## Puesta en marcha rapida
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
1) En el frontend, completa el formulario y adjunta RUT, cedula y extractos.
2) Pulsa **Validar**. Se envia multipart/form-data a http://localhost:3001/validar.
3) El backend revisa campos y archivos; si todo esta presente, consulta Gemini y responde con algo similar a:
```json
{
  "campos_faltantes": [],
  "incoherencias": [],
  "riesgo_preliminar": "Bajo",
  "decision": "ContinuarFlujoTradicional"
}
```
4) El frontend muestra estado, faltantes (si hay) y el analisis de IA.

## Scripts utiles
- Backend: npm start
- Frontend: npm run dev

## Notas
- Ejecuta backend y frontend en paralelo; el frontend espera el backend en http://localhost:3001/validar.
- Usa tu clave de Gemini en GEMINI_API_KEY antes de probar.
