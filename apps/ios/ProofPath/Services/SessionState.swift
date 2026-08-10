import Foundation
import Observation

/// Estado de sesión observable.
///
/// Antes la app leía el Keychain una sola vez al arrancar, así que un token que
/// dejaba de ser válido la dejaba atrapada: el backend respondía que la sesión
/// no existe, la pantalla mostraba "Algo salió mal" y no había forma de volver
/// al onboarding sin borrar la app.
///
/// Pasa de verdad: alcanza con resembrar la base entre dos ensayos de la demo.
@Observable
@MainActor
final class SessionState {
    static let shared = SessionState()

    private(set) var haySesion: Bool

    private init() {
        haySesion = KeychainStore.shared.haySesion
    }

    func iniciar(token: String) {
        KeychainStore.shared.token = token
        haySesion = true
    }

    /// Limpia la sesión y devuelve al onboarding. La llama cualquier ViewModel
    /// que reciba un 401.
    func cerrar() {
        KeychainStore.shared.token = nil
        haySesion = false
    }

    /// Cierra la sesión si el error es de autorización, y deja pasar el resto.
    ///
    /// Se llama desde el `catch` de cada ViewModel: un solo lugar decide qué
    /// error invalida la sesión, en vez de repetir la comprobación en cuatro.
    static func revisar(_ error: Error) {
        if case APIError.unauthorized = error {
            shared.cerrar()
        }
    }
}
