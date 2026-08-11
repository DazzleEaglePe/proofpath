import SwiftUI

@main
struct ProofPathApp: App {
    /// La sesión vive en un observable y no en un `@State` leído una sola vez:
    /// así, cuando el backend rechaza el token, la app vuelve sola al onboarding
    /// en vez de quedar atrapada en una pantalla de error.
    @State private var sesion = SessionState.shared

    var body: some Scene {
        WindowGroup {
            if sesion.haySesion {
                AuthenticatedRootView()
            } else {
                OnboardingView { }
            }
        }
    }
}
