import Foundation
import Observation

@Observable
@MainActor
final class OnboardingViewModel {
    var nombres = ""
    var apellidos = ""
    var email = ""

    private(set) var state: ViewState<OnboardingResponse> = .idle

    private let repository: any TalentRepositoryProtocol
    private let alTerminar: () -> Void

    init(
        repository: (any TalentRepositoryProtocol)? = nil,
        alTerminar: @escaping () -> Void
    ) {
        self.repository = repository ?? AppContainer.shared.talentRepository
        self.alTerminar = alTerminar
    }

    var puedeEnviar: Bool {
        nombresLimpios.count >= 2
            && apellidosLimpios.count >= 2
            && emailLimpio.contains("@")
    }

    /// Una sola llamada crea el perfil, la wallet y acuña el TalentPass.
    /// El usuario no se entera de nada de eso: solo ve "Creando tu TalentPass…".
    func crear() async {
        guard puedeEnviar else { return }
        state = .loading
        do {
            let respuesta = try await repository.onboard(
                fullName: "\(nombresLimpios) \(apellidosLimpios)",
                email: emailLimpio
            )
            state = .loaded(respuesta)
            alTerminar()
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }

    private var nombresLimpios: String {
        nombres.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var apellidosLimpios: String {
        apellidos.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var emailLimpio: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}
