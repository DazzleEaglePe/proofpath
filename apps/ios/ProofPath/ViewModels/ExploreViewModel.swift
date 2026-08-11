import Foundation
import Observation

@Observable
@MainActor
final class ExploreViewModel {
    private(set) var state: ViewState<[Opportunity]> = .idle
    var searchText = ""
    var modality: OpportunityModality?

    private let repository: any TalentRepositoryProtocol

    init(repository: (any TalentRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    var filteredOpportunities: [Opportunity] {
        guard case let .loaded(opportunities) = state else { return [] }
        return opportunities.filter { opportunity in
            let matchesModality = modality == nil || opportunity.modality == modality
            let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines)
            let matchesSearch = query.isEmpty
                || opportunity.title.localizedCaseInsensitiveContains(query)
                || opportunity.organizationName.localizedCaseInsensitiveContains(query)
                || opportunity.cause?.localizedCaseInsensitiveContains(query) == true
                || opportunity.description.localizedCaseInsensitiveContains(query)
                || opportunity.requiredSkills.contains {
                    $0.localizedCaseInsensitiveContains(query)
                }
            return matchesModality && matchesSearch
        }
    }

    func load() async {
        state = .loading
        do {
            state = .loaded(try await repository.fetchRecommendedOpportunities())
        } catch {
            SessionState.revisar(error)
            state = .failed(AppError(from: error))
        }
    }
}
