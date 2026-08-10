import Foundation

/// Error listo para mostrar. Ningun error crudo llega a la UI: en una demo
/// proyectada, un stack trace se ve fatal (05-IOS-ARCHITECTURE.md §6).
struct AppError: Error, Equatable {
    let title: String
    let message: String
    let isRetryable: Bool
}

extension AppError {
    init(from error: Error) {
        switch error {
        case APIError.unauthorized:
            self.init(
                title: Strings.errorSesionTitulo,
                message: Strings.errorSesionMensaje,
                isRetryable: false
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
        default:
            self.init(
                title: Strings.errorGenericoTitulo,
                message: Strings.errorGenericoMensaje,
                isRetryable: true
            )
        }
    }
}
