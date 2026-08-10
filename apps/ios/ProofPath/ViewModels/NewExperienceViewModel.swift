import Foundation
import Observation

@Observable
@MainActor
final class NewExperienceViewModel {
    var programId = ""
    var role = ""
    var contributions = ""
    var evidenceURL = ""
    var evidenceLabel = ""
    var startDate = Date()

    private(set) var state: ViewState<CreatedExperience> = .idle

    private let repository: any TalentRepositoryProtocol

    init(repository: (any TalentRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    var puedeEnviar: Bool {
        !programId.isEmpty
            && role.count >= 2
            // El backend exige 20 caracteres: es el insumo de la IA y con menos
            // no hay nada que extraer. Se valida acá también para no gastar un
            // viaje de red en un error evitable.
            && contributions.trimmingCharacters(in: .whitespaces).count >= 20
    }

    func enviar() async {
        guard puedeEnviar else { return }
        state = .loading

        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

        var evidencias: [EvidenceDraft] = []
        if !evidenceURL.isEmpty {
            evidencias.append(
                EvidenceDraft(
                    type: "LINK",
                    url: evidenceURL,
                    label: evidenceLabel.isEmpty ? "Evidencia" : evidenceLabel
                )
            )
        }

        do {
            let creada = try await repository.createExperience(
                ExperienceDraft(
                    programId: programId,
                    role: role,
                    contributions: contributions,
                    hoursCommitted: nil,
                    startDate: formatter.string(from: startDate),
                    endDate: nil,
                    evidences: evidencias
                )
            )
            state = .loaded(creada)
        } catch {
            state = .failed(AppError(from: error))
        }
    }
}
