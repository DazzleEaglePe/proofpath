import Foundation

/// Espejo de 02-DATA-MODEL.md, solo con lo que la app consume.
///
/// `tokenId` es String y no Int: es un uint256 y no entra en Int64
/// (05-IOS-ARCHITECTURE.md §5).

struct TalentPassData: Decodable, Sendable {
    let profileId: String
    let fullName: String
    let tokenId: String?
    let walletAddress: String?
    let isVerified: Bool
    let experienceCount: Int
    let skills: [SkillSummary]
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

struct OnboardingRequest: Encodable, Sendable {
    let fullName: String
    let email: String
}

struct OnboardingResponse: Decodable, Sendable {
    let token: String
    let profile: Profile

    struct Profile: Decodable, Sendable {
        let id: String
        let fullName: String
        let tokenId: String?
        let walletAddress: String?
    }
}
