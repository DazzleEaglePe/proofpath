import Foundation
import Observation

enum ExperienceFilter: String, CaseIterable, Identifiable {
    case all = "Todas"
    case review = "En revisión"
    case verified = "Verificadas"

    var id: Self { self }
}

@Observable
@MainActor
final class ExperiencesViewModel {
    private(set) var state: ViewState<[Experience]> = .idle
    var filter: ExperienceFilter = .all

    private let repository: any TalentRepositoryProtocol

    init(repository: (any TalentRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    var filteredExperiences: [Experience] {
        guard case let .loaded(experiences) = state else { return [] }

        switch filter {
        case .all:
            return experiences
        case .review:
            return experiences.filter { !$0.isVerified }
        case .verified:
            return experiences.filter(\.isVerified)
        }
    }

    var total: Int {
        guard case let .loaded(experiences) = state else { return 0 }
        return experiences.count
    }

    func load() async {
        state = .loading
        do {
            state = .loaded(try await repository.fetchExperiences())
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }
}
