import Foundation

/// Error listo para mostrar. Ningun error crudo llega a la UI: en una demo
/// proyectada, un stack trace se ve fatal (05-IOS-ARCHITECTURE.md §6).
struct AppError: Error, Equatable {
    let title: String
    let message: String
    let isRetryable: Bool

    /// La sesión dejó de servir. La pantalla ofrece volver al onboarding en vez
    /// de un "Reintentar" que fallaría siempre igual.
    var requiereNuevaSesion = false
}

extension AppError {
    init(from error: Error) {
        switch error {
        case APIError.unauthorized:
            self.init(
                title: Strings.errorSesionTitulo,
                message: Strings.errorSesionMensaje,
                isRetryable: false,
                requiereNuevaSesion: true
            )
        case let urlError as URLError where urlError.code == .timedOut:
            self.init(
                title: Strings.errorTiempoAgotadoTitulo,
                message: Strings.errorTiempoAgotadoMensaje,
                isRetryable: true
            )
        case is URLError:
            self.init(
                title: Strings.errorConexionTitulo,
                message: Strings.errorConexionMensaje,
                isRetryable: true
            )
        case let APIError.server(status) where status >= 500:
            self.init(
                title: Strings.errorServidorTitulo,
                message: Strings.errorServidorMensaje,
                isRetryable: true
            )
        case let APIError.client(status, _):
            // La respuesta del servidor puede contener rutas, nombres de tablas o
            // detalles pensados para logs. La UI decide el copy solo por categoría;
            // nunca presenta el body crudo al usuario.
            if status == 404 {
                self.init(
                    title: Strings.errorNoDisponibleTitulo,
                    message: Strings.errorNoDisponibleMensaje,
                    isRetryable: true
                )
            } else {
                self.init(
                    title: Strings.errorSolicitudTitulo,
                    message: Strings.errorSolicitudMensaje,
                    isRetryable: true
                )
            }
        default:
            self.init(
                title: Strings.errorGenericoTitulo,
                message: Strings.errorGenericoMensaje,
                isRetryable: true
            )
        }
    }
}
