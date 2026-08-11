import Foundation

/// Todos los textos de la UI en un solo lugar — 05-IOS-ARCHITECTURE.md §9.
///
/// Centralizarlos permite revisar de una pasada que no se coló ningún lenguaje
/// de scoring: ni "nivel", ni "puntaje", ni "%".
enum Strings {
    // Onboarding
    static let onboardingTitulo = "Tu experiencia, reconocida"
    static let onboardingSubtitulo =
        "Las cosas que ya hiciste cuentan. Creá tu TalentPass en dos pasos."
    static let campoNombre = "Nombre completo"
    static let campoCorreo = "Correo"
    static let botonCrear = "Crear mi TalentPass"
    static let creandoPass = "Creando tu TalentPass…"

    // TalentPass
    static let misExperiencias = "MIS EXPERIENCIAS"
    static let competencias = "COMPETENCIAS"
    static let sinExperiencias = "Todavía no registraste ninguna experiencia."
    static let lemaCierre = "No calificamos personas. Verificamos experiencias."
    static let verificada = "Verificada"
    static let enRevision = "En revisión"

    static func demostradaEn(_ cantidad: Int) -> String {
        cantidad == 1 ? "Demostrada en 1 experiencia" : "Demostrada en \(cantidad) experiencias"
    }

    // Detalle
    static let contribuciones = "Contribuciones"
    static let evidencias = "Evidencias"
    static let competenciasTecnicas = "Competencias técnicas"
    static let competenciasHumanas = "Competencias humanas"
    static let verEnArbiscan = "Ver en Arbiscan"

    // Nueva experiencia
    static let nuevaExperiencia = "Registrar experiencia"
    static let campoRol = "Tu rol"
    static let campoContribuciones = "¿Qué hiciste?"
    static let ayudaContribuciones =
        "Contá con detalle qué construiste, con quién y qué resolviste."
    static let campoEvidencia = "Link de evidencia"
    static let botonEnviar = "Enviar para validación"

    static func enviadaA(_ organizacion: String) -> String {
        "Enviada a \(organizacion) para validación"
    }

    // Badge
    static let verificadoEnArbitrum = "Verificado en Arbitrum"
    static let sinVerificar = "Sin verificar"

    // Errores
    // Una sesión vencida vuelve al acceso; nunca se crea otro TalentPass.
    static let errorSesionTitulo = "Tu sesión ya no es válida"
    static let errorSesionMensaje = "Inicia sesión nuevamente para continuar."
    static let volverAEmpezar = "Volver al acceso"
    static let errorConexionTitulo = "Sin conexión"
    static let errorConexionMensaje = "Revisá tu conexión e intentá de nuevo."
    static let errorServidorTitulo = "El servicio no responde"
    static let errorServidorMensaje = "Estamos teniendo problemas. Probá en unos segundos."
    static let errorGenericoTitulo = "Algo salió mal"
    static let errorGenericoMensaje = "Intentá nuevamente en unos segundos."
    static let reintentar = "Reintentar"
}
