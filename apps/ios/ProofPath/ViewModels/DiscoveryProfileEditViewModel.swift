import Foundation
import Observation

@Observable
@MainActor
final class DiscoveryProfileEditViewModel {
    var headline: String
    var educationStatus: EducationStatus?
    var fieldOfStudy: String
    var institutionName: String
    var academicCycle: String
    var city: String
    var weeklyAvailabilityHours: String
    var preferredModalities: Set<OpportunityModality>
    var causeInterests: Set<String>
    var roleInterests: Set<String>

    private(set) var isSaving = false
    private(set) var error: AppError?

    let causeOptions = [
        "Educación", "Tecnología cívica", "Bienestar animal",
        "Medio ambiente", "Comunidad", "Salud",
    ]
    let roleOptions = [
        "Desarrollo web", "Análisis de datos", "Diseño de producto",
        "Comunicación", "Coordinación", "Mentoría",
    ]

    private let repository: any TalentRepositoryProtocol

    init(profile: DiscoveryProfile, repository: (any TalentRepositoryProtocol)? = nil) {
        headline = profile.headline ?? ""
        educationStatus = profile.educationStatus
        fieldOfStudy = profile.fieldOfStudy ?? ""
        institutionName = profile.institutionName ?? ""
        academicCycle = profile.academicCycle.map(String.init) ?? ""
        city = profile.city ?? ""
        weeklyAvailabilityHours = profile.weeklyAvailabilityHours.map(String.init) ?? ""
        preferredModalities = Set(profile.preferredModalities)
        causeInterests = Set(profile.causeInterests)
        roleInterests = Set(profile.roleInterests)
        self.repository = repository ?? AppContainer.shared.talentRepository
    }

    func save() async -> DiscoveryProfile? {
        isSaving = true
        error = nil
        defer { isSaving = false }

        do {
            return try await repository.updateDiscoveryProfile(
                UpdateDiscoveryProfileRequest(
                    headline: headline,
                    educationStatus: educationStatus,
                    fieldOfStudy: fieldOfStudy,
                    institutionName: institutionName,
                    academicCycle: Int(academicCycle),
                    city: city,
                    weeklyAvailabilityHours: Int(weeklyAvailabilityHours),
                    preferredModalities: OpportunityModality.allCases.filter(preferredModalities.contains),
                    causeInterests: causeOptions.filter(causeInterests.contains),
                    roleInterests: roleOptions.filter(roleInterests.contains)
                )
            )
        } catch {
            SessionState.revisar(error)
            self.error = AppError(from: error)
            return nil
        }
    }
}
