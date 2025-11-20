## Demo Validacion Preventiva

PoC sencilla para validar preventivamente un onboarding bancario. Incluye backend Express y frontend React con Vite.

### Requisitos

- Node.js 18+
- npm

### Instalacion

```bash
cd demo/backend
npm install

cd ../frontend
npm install
```

### Configurar y ejecutar el backend

1. Crear el archivo `.env` en `demo/backend`:
   ```
   GEMINI_API_KEY=TU_API_KEY_AQUI
   PORT=3001
   ```
2. Ejecutar:
   ```bash
   cd demo/backend
   npm start
   ```

El servidor queda en `http://localhost:3001` con el endpoint `POST /validar`.

### Ejecutar el frontend

```bash
cd demo/frontend
npm run dev
```

Vite mostrara la URL (por defecto `http://localhost:5173`). El formulario envia los datos y archivos al backend en `http://localhost:3001/validar`.

### Flujo

1. Llenar el formulario y adjuntar RUT, cedula y extractos.
2. Presionar **Validar** para enviar `multipart/form-data`.
3. El backend valida completitud y, si todo esta completo, consulta Gemini para obtener el analisis:

```json
{
  "campos_faltantes": [],
  "incoherencias": [],
  "riesgo_preliminar": "Bajo",
  "decision": "ContinuarFlujoTradicional"
}
```

4. El frontend muestra la respuesta en pantalla (estado, mensaje, faltantes y analisis IA).
