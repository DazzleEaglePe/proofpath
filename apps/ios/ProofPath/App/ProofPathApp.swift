import SwiftUI

@main
struct ProofPathApp: App {
    /// Hay sesión si el Keychain tiene un token. `NavigationStack` alcanza para
    /// cuatro pantallas: meter un Coordinator acá sería sobreingeniería
    /// (05-IOS-ARCHITECTURE.md §1).
    @State private var haySesion = KeychainStore.shared.haySesion

    var body: some Scene {
        WindowGroup {
            if haySesion {
                TalentPassView()
            } else {
                OnboardingView { haySesion = true }
            }
        }
    }
}
