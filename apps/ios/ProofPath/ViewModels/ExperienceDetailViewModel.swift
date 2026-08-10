import Foundation
import Observation

@Observable
@MainActor
final class ExperienceDetailViewModel {
    private(set) var state: ViewState<ExperienceDetail> = .idle

    private let experienceId: String
    private let repository: any TalentRepositoryProtocol

    init(
        experienceId: String,
        repository: (any TalentRepositoryProtocol)? = nil
    ) {
        self.experienceId = experienceId
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    func load() async {
        state = .loading
        do {
            state = .loaded(try await repository.fetchExperience(id: experienceId))
        } catch {
            state = .failed(AppError(from: error))
        }
    }
}
