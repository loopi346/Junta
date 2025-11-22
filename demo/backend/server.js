import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import vision from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// === CONFIGURACIÓN PARA RENDER ===
// Render monta los secret files en /etc/secrets/
// Aquí obligamos al SDK a usar ese archivo para autenticarse
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/etc/secrets/gen-lang-client-0775635895-8e47a6e92ef4.json";

// OCR - Google Vision
const visionClient = new vision.ImageAnnotatorClient();

// IA - Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Multer para recibir archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Función OCR
async function ejecutarOCR(buffer) {
  const [resultado] = await visionClient.textDetection(buffer);
  const texto = resultado.fullTextAnnotation?.text || "Sin texto detectado";
  return texto;
}

app.post(
  "/validar",
  upload.fields([
    { name: "rut" },
    { name: "cedula" },
    { name: "extractos" },
  ]),
  async (req, res) => {
    try {
      const {
        nombreCompleto,
        tipoIdentificacion,
        numeroIdentificacion,
        actividadEconomica,
        ingresosMensuales,
        esPEP,
        manejaMonedaExtranjera,
      } = req.body;

      // Validación base
      const camposFaltantes = [];
      if (!nombreCompleto) camposFaltantes.push("nombreCompleto");
      if (!tipoIdentificacion) camposFaltantes.push("tipoIdentificacion");
      if (!numeroIdentificacion) camposFaltantes.push("numeroIdentificacion");
      if (!actividadEconomica) camposFaltantes.push("actividadEconomica");
      if (!ingresosMensuales) camposFaltantes.push("ingresosMensuales");
      if (!esPEP || esPEP === "") camposFaltantes.push("esPEP");
      if (!manejaMonedaExtranjera || manejaMonedaExtranjera === "") camposFaltantes.push("manejaMonedaExtranjera");

      const documentosFaltantes = [];
      if (!req.files?.rut) documentosFaltantes.push("RUT");
      if (!req.files?.cedula) documentosFaltantes.push("Cedula");
      if (!req.files?.extractos) documentosFaltantes.push("Extractos");

      if (camposFaltantes.length > 0 || documentosFaltantes.length > 0) {
        return res.json({
          estado: "Solicitud incompleta",
          mensaje: "Faltan datos o documentos necesarios.",
          camposFaltantes,
          documentosFaltantes,
        });
      }

      // OCR real
      const rutBuffer = req.files.rut?.[0].buffer;
      const cedulaBuffer = req.files.cedula?.[0].buffer;
      const extractosBuffer = req.files.extractos?.[0].buffer;

      const ocrRut = rutBuffer ? await ejecutarOCR(rutBuffer) : "No cargado";
      const ocrCedula = cedulaBuffer ? await ejecutarOCR(cedulaBuffer) : "No cargado";
      const ocrExtractos = extractosBuffer ? await ejecutarOCR(extractosBuffer) : "No cargado";

      // Recomendaciones inmediatas (backend)
      const recomendacionesBackend = [];
      if (!ocrRut || ocrRut.trim().length < 20) {
        recomendacionesBackend.push("Por favor vuelva a subir el RUT. No se detectó información legible.");
      }
      if (!ocrCedula || ocrCedula.trim().length < 20) {
        recomendacionesBackend.push("La cédula no se pudo leer correctamente. Suba una imagen más clara.");
      }
      if (!ocrExtractos || ocrExtractos.trim().length < 20) {
        recomendacionesBackend.push("El extracto bancario no es correcto. Asegúrese de subir un archivo legible.");
      }

      // Prompt IA
      const prompt = `
Eres un analista experto en onboarding bancario.
Evalúa coherencia entre lo declarado en el formulario y lo detectado por OCR en los documentos.

REGLAS IMPORTANTES:
1. SOLO reporta inconsistencias cuando HAY CONTRADICCIÓN entre el documento OCR y lo declarado.
2. NO reportes como inconsistencia: "el documento no menciona PEP" o "el documento no menciona moneda extranjera". Eso es NORMAL.
3. Una inconsistencia real es cuando:
   - El nombre en el documento NO coincide con el nombre declarado
   - El ID en el documento NO coincide con el ID declarado
   - La información en el documento contradice claramente lo declarado

FORMULARIO DECLARADO:
Nombre: ${nombreCompleto}
Tipo ID: ${tipoIdentificacion}
Numero ID: ${numeroIdentificacion}
Actividad económica: ${actividadEconomica}
Ingresos declarados: ${ingresosMensuales}
¿Es PEP?: ${esPEP}
¿Maneja moneda extranjera?: ${manejaMonedaExtranjera}

DOCUMENTOS (OCR):

--- RUT ---
${ocrRut}

--- CEDULA ---
${ocrCedula}

--- EXTRACTOS ---
${ocrExtractos}

Responde SOLO con JSON en este formato:
{
 "coherencia": "Alta/Media/Baja",
 "riesgo": "Bajo/Medio/Alto",
 "comentario": "Análisis breve",
 "inconsistenciasDetectadas": ["lista vacía si no hay contradicciones reales"],
 "recomendaciones": ["acciones para el banco"]
}
`;

      const result = await model.generateContent(prompt);
      let texto = result.response.text();
      texto = texto.replace(/```json/g, "").replace(/```/g, "");
      const match = texto.match(/\{[\s\S]*\}/);

      let analisis;
      try {
        analisis = JSON.parse(match ? match[0] : texto);
      } catch {
        analisis = {
          coherencia: "Media",
          riesgo: "Medio",
          comentario: texto,
          inconsistenciasDetectadas: [],
          recomendaciones: [],
        };
      }

      return res.json({
        estado: "Solicitud analizada",
        mensaje: "Validación completada por IA con OCR real.",
        recomendacionesBackend,
        ocr: {
          rut: ocrRut.substring(0, 500),
          cedula: ocrCedula.substring(0, 500),
          extractos: ocrExtractos.substring(0, 500),
        },
        analisis,
      });

    } catch (error) {
      console.error("❌ ERROR EN SERVIDOR:", error);
      res.status(500).json({ error: "Error en servidor" });
    }
  }
);

// === PUERTO PARA RENDER ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`🚀 Backend OCR + Gemini ejecutándose en puerto ${PORT}`)
);
