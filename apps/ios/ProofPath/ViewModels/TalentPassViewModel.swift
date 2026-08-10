import Foundation
import Observation

/// `@Observable` de iOS 17, no `ObservableObject` + `@Published`, que es el
/// patrón de iOS 16 (05-IOS-ARCHITECTURE.md §1).
@Observable
@MainActor
final class TalentPassViewModel {
    struct Datos {
        let pass: TalentPassData
        let experiencias: [Experience]
    }

    /// `private(set)`: la View lee, no escribe.
    private(set) var state: ViewState<Datos> = .idle

    private let repository: any TalentRepositoryProtocol

    /// El contenedor se resuelve DENTRO del init, no como valor por defecto del
    /// parámetro: los valores por defecto se evalúan en el contexto de quien
    /// llama, que no está aislado al `MainActor`.
    init(repository: (any TalentRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    func load() async {
        state = .loading
        do {
            // Las dos llamadas en paralelo: la pantalla necesita ambas para
            // dibujarse, y encadenarlas duplicaría el tiempo de espera.
            async let pass = repository.fetchTalentPass()
            async let experiencias = repository.fetchExperiences()
            state = .loaded(Datos(pass: try await pass, experiencias: try await experiencias))
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }
}
