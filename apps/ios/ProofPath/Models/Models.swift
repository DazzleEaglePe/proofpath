import Foundation

/// Espejo de 02-DATA-MODEL.md, solo con lo que la app consume.
///
/// `tokenId` es String y no Int: es un uint256 y no entra en Int64
/// (05-IOS-ARCHITECTURE.md §5).

struct TalentPassData: Decodable, Identifiable, Sendable {
    let profileId: String
    let fullName: String
    let email: String
    let tokenId: String?
    let walletAddress: String?
    let isVerified: Bool
    let experienceCount: Int
    let skills: [SkillSummary]

    var id: String { profileId }
}

/// SIN campo de score, nivel o porcentaje. Es intencional y no se agrega.
/// Ver 00-CONTEXT.md §2.1. Si un asistente propone agregarlo "para la UI",
/// se rechaza.
struct SkillSummary: Decodable, Identifiable, Sendable {
    let name: String
    let type: SkillType
    let experienceCount: Int
    let experienceTitles: [String]

    var id: String { name }
}

enum SkillType: String, Decodable, Sendable {
    case hard = "HARD"
    /// "human", nunca "soft": son competencias humanas observadas en contexto.
    case human = "HUMAN"
}

enum ExperienceStatus: String, Decodable, Sendable {
    case draft = "DRAFT"
    case aiAnalyzed = "AI_ANALYZED"
    case orgConfirmed = "ORG_CONFIRMED"
    case issued = "ISSUED"

    var etiqueta: String {
        self == .issued ? Strings.verificada : Strings.enRevision
    }
}

struct Experience: Decodable, Identifiable, Sendable {
    let id: String
    let programTitle: String
    let organizationName: String
    let role: String
    let startDate: Date
    let endDate: Date?
    let status: ExperienceStatus
    let isVerified: Bool
    let txHash: String?
}

/// Programa abierto que el talento puede elegir al registrar una experiencia.
/// El `id` viaja a la API, pero nunca se muestra como dato editable.
struct ProgramSummary: Decodable, Identifiable, Sendable {
    let id: String
    let title: String
    let description: String
    let organizationName: String
    let organizationIsTrusted: Bool
    let cause: String?
    let modality: OpportunityModality
    let location: String?
    let weeklyHours: Int?
    let applicationDeadline: Date?
    let requiredSkills: [String]
    let startDate: Date
    let endDate: Date?
}

enum EducationStatus: String, Codable, CaseIterable, Sendable {
    case student = "STUDENT"
    case graduate = "GRADUATE"
    case professional = "PROFESSIONAL"
    case other = "OTHER"

    var label: String {
        switch self {
        case .student: "Estudiante"
        case .graduate: "Egresado/a"
        case .professional: "Profesional"
        case .other: "Otra situación"
        }
    }
}

enum OpportunityModality: String, Codable, CaseIterable, Sendable {
    case remote = "REMOTE"
    case hybrid = "HYBRID"
    case onsite = "ONSITE"

    var label: String {
        switch self {
        case .remote: "Remoto"
        case .hybrid: "Híbrido"
        case .onsite: "Presencial"
        }
    }

    var icon: String {
        switch self {
        case .remote: "wifi"
        case .hybrid: "arrow.triangle.branch"
        case .onsite: "building.2"
        }
    }
}

struct DiscoveryProfile: Codable, Sendable {
    let fullName: String
    let email: String
    let headline: String?
    let educationStatus: EducationStatus?
    let fieldOfStudy: String?
    let institutionName: String?
    let academicCycle: Int?
    let city: String?
    let weeklyAvailabilityHours: Int?
    let preferredModalities: [OpportunityModality]
    let causeInterests: [String]
    let roleInterests: [String]

    var hasRecommendationData: Bool {
        fieldOfStudy != nil || !preferredModalities.isEmpty || !causeInterests.isEmpty || !roleInterests.isEmpty
    }
}

struct UpdateDiscoveryProfileRequest: Encodable, Sendable {
    let headline: String
    let educationStatus: EducationStatus?
    let fieldOfStudy: String
    let institutionName: String
    let academicCycle: Int?
    let city: String
    let weeklyAvailabilityHours: Int?
    let preferredModalities: [OpportunityModality]
    let causeInterests: [String]
    let roleInterests: [String]
}

struct Opportunity: Decodable, Identifiable, Sendable {
    let id: String
    let title: String
    let description: String
    let organizationName: String
    let organizationIsTrusted: Bool
    let cause: String?
    let modality: OpportunityModality
    let location: String?
    let weeklyHours: Int?
    let applicationDeadline: Date?
    let requiredSkills: [String]
    let startDate: Date
    let endDate: Date?
    let recommendationReasons: [String]
}

struct Evidence: Decodable, Identifiable, Sendable {
    let type: String
    let url: String
    let label: String

    var id: String { url }
}

struct ExperienceDetail: Decodable, Sendable {
    let id: String
    let programTitle: String
    let organizationName: String
    let role: String
    let contributions: String
    let hoursCommitted: Int?
    let startDate: Date
    let endDate: Date?
    let status: ExperienceStatus
    let evidences: [Evidence]
    let skills: SkillGroups
    let credential: CredentialInfo?
}

struct SkillGroups: Decodable, Sendable {
    let hard: [String]
    let human: [String]
}

struct CredentialInfo: Decodable, Sendable {
    let credentialHash: String
    let isVerified: Bool
    let txHash: String?
    let batchId: String?
}

// ─── Escritura ──────────────────────────────────────────────

struct ExperienceDraft: Encodable, Sendable {
    let programId: String
    let role: String
    let contributions: String
    let hoursCommitted: Int?
    let startDate: String
    let endDate: String?
    let evidences: [EvidenceDraft]
}

struct EvidenceDraft: Encodable, Sendable {
    let type: String
    let url: String
    let label: String
}

struct CreatedExperience: Decodable, Sendable {
    let id: String
    let status: String
    let organizationName: String
    let message: String
}

struct TalentRegistrationRequest: Encodable, Sendable {
    let givenNames: String
    let familyNames: String
    let email: String
    let password: String
}

/// Compatibilidad con el endpoint de onboarding anterior durante la migración.
struct OnboardingRequest: Encodable, Sendable {
    let fullName: String
    let email: String
}

struct AuthChallengeResponse: Decodable, Sendable {
    let challengeId: String?
    let expiresAt: Date?
    let message: String
    let developmentCode: String?
}

struct VerifyEmailRequest: Encodable, Sendable {
    let challengeId: String
    let code: String
}

struct TalentLoginRequest: Encodable, Sendable {
    let email: String
    let password: String
}

struct ForgotPasswordRequest: Encodable, Sendable {
    let email: String
}

struct ResetPasswordRequest: Encodable, Sendable {
    let challengeId: String
    let code: String
    let newPassword: String
}

struct AuthMessageResponse: Decodable, Sendable {
    let message: String
}

struct OnboardingResponse: Decodable, Sendable {
    let token: String
    let profile: Profile

    struct Profile: Decodable, Sendable {
        let id: String
        let fullName: String
        let givenNames: String?
        let familyNames: String?
        let tokenId: String?
        let walletAddress: String?
    }
}
