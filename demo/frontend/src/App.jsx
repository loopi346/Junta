import React, { useState } from "react";
import "./App.css";

function App() {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [pep, setPep] = useState("");
  const [monedaExtranjera, setMonedaExtranjera] = useState("");

  const pasos = [
    "📄 Cargando documentos…",
    "🔍 Ejecutando OCR sobre RUT…",
    "🔍 Ejecutando OCR sobre Cédula…",
    "📑 Analizando extractos…",
    "🧠 Comparando OCR vs. formulario…",
    "🤖 Evaluando coherencia con IA…",
    "📊 Generando informe final…",
  ];

  const validarFormulario = (data) => {
    const errs = {};
    if (!data.get("nombreCompleto")) errs.nombreCompleto = "Este campo es obligatorio.";
    if (!data.get("tipoIdentificacion")) errs.tipoIdentificacion = "Seleccione un tipo.";
    if (!data.get("numeroIdentificacion")) errs.numeroIdentificacion = "Numero requerido.";
    if (!data.get("actividadEconomica")) errs.actividadEconomica = "Ingrese actividad.";
    if (!data.get("ingresosMensuales")) errs.ingresosMensuales = "Ingrese ingresos.";
    if (data.get("esPEP") === "" || data.get("esPEP") === null) errs.esPEP = "Selecciona si eres PEP.";
    if (data.get("manejaMonedaExtranjera") === "" || data.get("manejaMonedaExtranjera") === null) errs.manejaMonedaExtranjera = "Selecciona si manejas moneda extranjera.";
    return errs;
  };

  const simularPasos = () => {
    let i = 0;
    setLoadingStep(i);
    const interval = setInterval(() => {
      i++;
      if (i >= pasos.length) {
        clearInterval(interval);
      } else {
        setLoadingStep(i);
      }
    }, 650);
  };

  const enviar = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    formData.set("esPEP", pep);
    formData.set("manejaMonedaExtranjera", monedaExtranjera);
    const errs = validarFormulario(formData);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setResultado(null);
    setLoading(true);
    simularPasos();

    const res = await fetch(import.meta.env.VITE_BACKEND_URL + "/validar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);
    setResultado(data);
  };

  const getBadgeColor = (riesgo) => {
    if (!riesgo) return "";
    if (riesgo.toLowerCase().includes("alto")) return "badge-red";
    if (riesgo.toLowerCase().includes("medio")) return "badge-yellow";
    return "badge-green";
  };

  const renderListValue = (value) => {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      return value.map((item) => renderListValue(item)).join(" | ");
    }
    if (typeof value === "object") {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(" | ");
    }
    return String(value);
  };

  const generarMensajesUsuario = (resultadoActual) => {
    const mensajes = [];

    if (
      resultadoActual.recomendacionesBackend?.some((r) =>
        r.toLowerCase().includes("rut")
      )
    ) {
      mensajes.push(
        "📄 No pudimos leer tu RUT. Por favor subelo nuevamente con buena resolucion."
      );
    }

    if (
      resultadoActual.recomendacionesBackend?.some((r) =>
        r.toLowerCase().includes("cedula")
      )
    ) {
      mensajes.push("🪪 Tu documento de identidad no es legible. Sube una foto mas clara.");
    }

    if (
      resultadoActual.recomendacionesBackend?.some((r) =>
        r.toLowerCase().includes("extracto")
      )
    ) {
      mensajes.push(
        "🧾 Tus extractos no se pudieron validar. Sube un archivo donde se vean bien los datos."
      );
    }

    if (
      resultadoActual.analisis?.inconsistenciasDetectadas?.some((i) =>
        renderListValue(i).toLowerCase().includes("pep")
      )
    ) {
      mensajes.push("❓ Debes indicar si eres o no una Persona Expuesta Politicamente (PEP).");
    }

    if (
      resultadoActual.analisis?.inconsistenciasDetectadas?.some((i) =>
        renderListValue(i).toLowerCase().includes("moneda")
      )
    ) {
      mensajes.push("💱 Falta seleccionar si manejas o no moneda extrajera.");
    }

    if (mensajes.length === 0) {
      mensajes.push("🎉 Todo esta correcto. Puedes continuar con tu proceso.");
    }

    return mensajes;
  };

  return (
    <div className={darkMode ? "dark page" : "page"}>
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🏦</span> Banco Andino
        </div>
        <p>Validación Preventiva Asistida por IA (Gemini + OCR)</p>
        <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️ Modo Claro" : "🌙 Modo Oscuro"}
        </button>
      </header>

      <div className="form-card animate-card">
        <h2>Formulario de Validación</h2>
        <form onSubmit={enviar}>
          <label>Nombre completo</label>
          <input name="nombreCompleto" />
          {errors.nombreCompleto && <p className="error">{errors.nombreCompleto}</p>}

          <label>Tipo identificación</label>
          <select name="tipoIdentificacion">
            <option value="">Seleccione</option>
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
          </select>
          {errors.tipoIdentificacion && <p className="error">{errors.tipoIdentificacion}</p>}

          <label>Número de identificación</label>
          <input name="numeroIdentificacion" />
          {errors.numeroIdentificacion && (
            <p className="error">{errors.numeroIdentificacion}</p>
          )}

          <label>Actividad económica</label>
          <input name="actividadEconomica" />
          {errors.actividadEconomica && (
            <p className="error">{errors.actividadEconomica}</p>
          )}

          <label>Ingresos mensuales</label>
          <input type="number" name="ingresosMensuales" />
          {errors.ingresosMensuales && <p className="error">{errors.ingresosMensuales}</p>}

          <label>¿Eres Persona Expuesta Políticamente (PEP)?</label>
          <select
            name="esPEP"
            value={pep}
            onChange={(event) => setPep(event.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          {errors.esPEP && <p className="error">{errors.esPEP}</p>}

          <label>¿Manejas moneda extranjera?</label>
          <select
            name="manejaMonedaExtranjera"
            value={monedaExtranjera}
            onChange={(event) => setMonedaExtranjera(event.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
          {errors.manejaMonedaExtranjera && (
            <p className="error">{errors.manejaMonedaExtranjera}</p>
          )}

          <label>RUT</label>
          <input type="file" name="rut" />

          <label>Cédula</label>
          <input type="file" name="cedula" />

          <label>Extractos</label>
          <input type="file" name="extractos" />

          <button className="btn">Validar Solicitud</button>
        </form>
      </div>

      {loading && (
        <div className="loading-box">
          <h3>Procesando solicitud</h3>
          <div className="progress-container">
            {pasos.map((p, i) => (
              <div key={p} className={i <= loadingStep ? "step done" : "step"}>
                {i < loadingStep ? "✓ " : ""}
                {p}
              </div>
            ))}
          </div>
          <div className="spinner"></div>
        </div>
      )}

      {resultado && (
        <div className="cliente-panel animate-card">
          <h2>Estado de tu Solicitud</h2>
          <ul className="cliente-lista">
            {generarMensajesUsuario(resultado).map((mensaje, index) => (
              <li key={`mensaje-${index}`}>{mensaje}</li>
            ))}
          </ul>
        </div>
      )}

      {resultado && (
        <div className="resultado-panel animate-card">
          <div className="executive-summary">
            <h2>Resumen Ejecutivo</h2>
            <div className="executive-grid">
              <div className="exec-card">
                <h3>Coherencia</h3>
                <p>{resultado.analisis?.coherencia}</p>
              </div>
              <div className={`exec-card ${getBadgeColor(resultado.analisis?.riesgo)}`}>
                <h3>Riesgo</h3>
                <p>{resultado.analisis?.riesgo}</p>
              </div>
              <div className="exec-card">
                <h3>Inconsistencias</h3>
                <p>{resultado.analisis?.inconsistenciasDetectadas?.length || 0}</p>
              </div>
            </div>
          </div>

          {resultado.recomendacionesBackend?.length > 0 && (
            <div className="alert-box">
              <h3>⚠️ Recomendaciones inmediatas</h3>
              <ul>
                {resultado.recomendacionesBackend.map((r, idx) => (
                  <li key={`backend-${idx}`}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {resultado.analisis?.recomendaciones?.length > 0 && (
            <div className="alert-box">
              <h3>📄 Recomendaciones IA</h3>
              <ul>
                {resultado.analisis.recomendaciones.map((r, idx) => (
                  <li key={`ia-${idx}`}>{r}</li>
                ))}
              </ul>
            </div>
          )}

              {resultado.analisis?.inconsistenciasDetectadas?.length > 0 && (
                <div className="inconsistencias-box">
                  <h3>❗ Inconsistencias Detectadas</h3>
                  <ul>
                    {resultado.analisis.inconsistenciasDetectadas.map((item, idx) => (
                      <li key={`inc-${idx}`}>{renderListValue(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

          <details className="ocr-box">
            <summary>📄 Ver texto OCR detectado</summary>
            <pre>{JSON.stringify(resultado.ocr, null, 2)}</pre>
          </details>

          <details className="json-box">
            <summary>🧠 Ver Análisis IA (JSON)</summary>
            <pre>{JSON.stringify(resultado.analisis, null, 2)}</pre>
          </details>
        </div>
      )}

      <footer className="footer">© 2025 Banco Andino · Motor IA · Demo Interna</footer>
    </div>
  );
}

export default App;
