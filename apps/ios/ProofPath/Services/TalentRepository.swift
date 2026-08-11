import Foundation

/// Traduce dominio ↔ API. No conoce SwiftUI (05-IOS-ARCHITECTURE.md §1).
protocol TalentRepositoryProtocol: Sendable {
    func onboard(fullName: String, email: String) async throws -> OnboardingResponse
    func fetchTalentPass() async throws -> TalentPassData
    func fetchExperiences() async throws -> [Experience]
    func fetchPrograms() async throws -> [ProgramSummary]
    func fetchRecommendedOpportunities() async throws -> [Opportunity]
    func fetchDiscoveryProfile() async throws -> DiscoveryProfile
    func updateDiscoveryProfile(_ profile: UpdateDiscoveryProfileRequest) async throws -> DiscoveryProfile
    func fetchExperience(id: String) async throws -> ExperienceDetail
    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience
}

protocol TalentAuthRepositoryProtocol: Sendable {
    func register(givenNames: String, familyNames: String, email: String, password: String) async throws -> AuthChallengeResponse
    func verifyEmail(challengeId: String, code: String) async throws -> OnboardingResponse
    func login(email: String, password: String) async throws -> OnboardingResponse
    func forgotPassword(email: String) async throws -> AuthChallengeResponse
    func resetPassword(challengeId: String, code: String, newPassword: String) async throws -> AuthMessageResponse
}

struct TalentRepository: TalentRepositoryProtocol, TalentAuthRepositoryProtocol {
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

    func register(
        givenNames: String,
        familyNames: String,
        email: String,
        password: String
    ) async throws -> AuthChallengeResponse {
        try await client.send(
            APIRequest(
                path: "/auth/talent/register",
                method: .post,
                body: TalentRegistrationRequest(
                    givenNames: givenNames,
                    familyNames: familyNames,
                    email: email,
                    password: password
                ),
                requiresAuth: false
            )
        )
    }

    func verifyEmail(challengeId: String, code: String) async throws -> OnboardingResponse {
        let response: OnboardingResponse = try await client.send(
            APIRequest(
                path: "/auth/talent/verify-email",
                method: .post,
                body: VerifyEmailRequest(challengeId: challengeId, code: code),
                requiresAuth: false
            )
        )
        await SessionState.shared.iniciar(token: response.token)
        return response
    }

    func login(email: String, password: String) async throws -> OnboardingResponse {
        let response: OnboardingResponse = try await client.send(
            APIRequest(
                path: "/auth/talent/login",
                method: .post,
                body: TalentLoginRequest(email: email, password: password),
                requiresAuth: false
            )
        )
        await SessionState.shared.iniciar(token: response.token)
        return response
    }

    func forgotPassword(email: String) async throws -> AuthChallengeResponse {
        try await client.send(
            APIRequest(
                path: "/auth/talent/forgot-password",
                method: .post,
                body: ForgotPasswordRequest(email: email),
                requiresAuth: false
            )
        )
    }

    func resetPassword(challengeId: String, code: String, newPassword: String) async throws -> AuthMessageResponse {
        try await client.send(
            APIRequest(
                path: "/auth/talent/reset-password",
                method: .post,
                body: ResetPasswordRequest(challengeId: challengeId, code: code, newPassword: newPassword),
                requiresAuth: false
            )
        )
    }

    func fetchTalentPass() async throws -> TalentPassData {
        try await client.send(APIRequest(path: "/me/talentpass"))
    }

    func fetchExperiences() async throws -> [Experience] {
        try await client.send(APIRequest(path: "/me/experiences"))
    }

    func fetchPrograms() async throws -> [ProgramSummary] {
        try await client.send(APIRequest(path: "/programs"))
    }

    func fetchRecommendedOpportunities() async throws -> [Opportunity] {
        try await client.send(APIRequest(path: "/me/opportunities/recommended"))
    }

    func fetchDiscoveryProfile() async throws -> DiscoveryProfile {
        try await client.send(APIRequest(path: "/me/profile"))
    }

    func updateDiscoveryProfile(_ profile: UpdateDiscoveryProfileRequest) async throws -> DiscoveryProfile {
        try await client.send(APIRequest(path: "/me/profile", method: .patch, body: profile))
    }

    func fetchExperience(id: String) async throws -> ExperienceDetail {
        try await client.send(APIRequest(path: "/experiences/\(id)"))
    }

    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience {
        try await client.send(APIRequest(path: "/experiences", method: .post, body: draft))
    }
}
