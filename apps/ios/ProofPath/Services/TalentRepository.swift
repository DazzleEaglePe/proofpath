import Foundation

/// Traduce dominio ↔ API. No conoce SwiftUI (05-IOS-ARCHITECTURE.md §1).
protocol TalentRepositoryProtocol: Sendable {
    func onboard(fullName: String, email: String) async throws -> OnboardingResponse
    func fetchTalentPass() async throws -> TalentPassData
    func fetchExperiences() async throws -> [Experience]
    func fetchExperience(id: String) async throws -> ExperienceDetail
    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience
}

struct TalentRepository: TalentRepositoryProtocol {
    let client: any APIClientProtocol

    func onboard(fullName: String, email: String) async throws -> OnboardingResponse {
        let respuesta: OnboardingResponse = try await client.send(
            APIRequest(
                path: "/auth/onboarding",
                method: .post,
                body: OnboardingRequest(fullName: fullName, email: email),
                requiresAuth: false
            )
        )
        // El voluntario nunca ve nada de esto: ni wallet, ni token, ni tokenId.
        await SessionState.shared.iniciar(token: respuesta.token)
        return respuesta
    }

    func fetchTalentPass() async throws -> TalentPassData {
        try await client.send(APIRequest(path: "/me/talentpass"))
    }

    func fetchExperiences() async throws -> [Experience] {
        try await client.send(APIRequest(path: "/me/experiences"))
    }

    func fetchExperience(id: String) async throws -> ExperienceDetail {
        try await client.send(APIRequest(path: "/experiences/\(id)"))
    }

    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience {
        try await client.send(APIRequest(path: "/experiences", method: .post, body: draft))
    }
}
