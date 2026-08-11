import Foundation
import Observation

@Observable
@MainActor
final class AccountViewModel {
    struct Data {
        let pass: TalentPassData
        let profile: DiscoveryProfile
    }

    private(set) var state: ViewState<Data> = .idle
    private let repository: any TalentRepositoryProtocol

    init(repository: (any TalentRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    func load() async {
        state = .loading
        do {
            async let pass = repository.fetchTalentPass()
            async let profile = repository.fetchDiscoveryProfile()
            state = .loaded(Data(pass: try await pass, profile: try await profile))
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }

    func replaceProfile(_ profile: DiscoveryProfile) {
        guard case let .loaded(current) = state else { return }
        state = .loaded(Data(pass: current.pass, profile: profile))
    }
}
