import Foundation
import Observation

@Observable
@MainActor
final class OnboardingViewModel {
    var fullName = ""
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
        fullName.trimmingCharacters(in: .whitespaces).count >= 2 && email.contains("@")
    }

    /// Una sola llamada crea el perfil, la wallet y acuña el TalentPass.
    /// El usuario no se entera de nada de eso: solo ve "Creando tu TalentPass…".
    func crear() async {
        guard puedeEnviar else { return }
        state = .loading
        do {
            let respuesta = try await repository.onboard(
                fullName: fullName.trimmingCharacters(in: .whitespaces),
                email: email.trimmingCharacters(in: .whitespaces).lowercased()
            )
            state = .loaded(respuesta)
            alTerminar()
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }
}
