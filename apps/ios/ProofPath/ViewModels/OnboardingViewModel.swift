import Foundation
import Observation

@Observable
@MainActor
final class OnboardingViewModel {
    var givenNames = ""
    var familyNames = ""
    var email = ""
    var password = ""
    var verificationCode = ""

    private(set) var state: ViewState<AuthChallengeResponse> = .idle
    private(set) var verificationState: ViewState<OnboardingResponse> = .idle

    private let repository: any TalentAuthRepositoryProtocol
    private let alTerminar: () -> Void

    init(
        repository: (any TalentAuthRepositoryProtocol)? = nil,
        alTerminar: @escaping () -> Void
    ) {
        self.repository = repository ?? AppContainer.shared.talentAuthRepository
        self.alTerminar = alTerminar
    }

    var puedeEnviar: Bool {
        nombresLimpios.count >= 2
            && apellidosLimpios.count >= 2
            && emailLimpio.contains("@")
            && password.count >= 12
    }

    var challenge: AuthChallengeResponse? { state.value }

    func registrar() async {
        guard puedeEnviar else { return }
        verificationCode = ""
        verificationState = .idle
        state = .loading
        do {
            let respuesta = try await repository.register(
                givenNames: nombresLimpios,
                familyNames: apellidosLimpios,
                email: emailLimpio,
                password: password
            )
            state = .loaded(respuesta)
        } catch {
            state = .failed(AppError(from: error))
        }
    }

    func verificarCorreo() async {
        guard let challengeId = challenge?.challengeId, verificationCode.count == 6 else { return }
        verificationState = .loading
        do {
            let response = try await repository.verifyEmail(
                challengeId: challengeId,
                code: verificationCode
            )
            verificationState = .loaded(response)
            alTerminar()
        } catch {
            verificationState = .failed(AppError(from: error))
        }
    }

    private var nombresLimpios: String {
        givenNames.split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    private var apellidosLimpios: String {
        familyNames.split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    private var emailLimpio: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}

@Observable
@MainActor
final class TalentLoginViewModel {
    var email = ""
    var password = ""
    var code = ""
    var newPassword = ""

    private(set) var loginState: ViewState<OnboardingResponse> = .idle
    private(set) var recoveryRequestState: ViewState<AuthChallengeResponse> = .idle
    private(set) var resetState: ViewState<AuthMessageResponse> = .idle

    private let repository: any TalentAuthRepositoryProtocol

    init(repository: (any TalentAuthRepositoryProtocol)? = nil) {
        self.repository = repository ?? AppContainer.shared.talentAuthRepository
    }

    var puedeIngresar: Bool {
        emailLimpio.contains("@") && !password.isEmpty
    }

    var puedeRecuperar: Bool {
        emailLimpio.contains("@")
    }

    var puedeRestablecer: Bool {
        code.count == 6 && newPassword.count >= 12
    }

    var recoveryChallenge: AuthChallengeResponse? { recoveryRequestState.value }

    func ingresar() async {
        guard puedeIngresar else { return }
        loginState = .loading
        do {
            loginState = .loaded(try await repository.login(email: emailLimpio, password: password))
        } catch {
            loginState = .failed(AppError(from: error))
        }
    }

    func solicitarRecuperacion() async {
        guard puedeRecuperar else { return }
        recoveryRequestState = .loading
        do {
            recoveryRequestState = .loaded(try await repository.forgotPassword(email: emailLimpio))
        } catch {
            recoveryRequestState = .failed(AppError(from: error))
        }
    }

    func restablecerContrasena() async {
        guard let challengeId = recoveryChallenge?.challengeId, puedeRestablecer else { return }
        resetState = .loading
        do {
            resetState = .loaded(
                try await repository.resetPassword(
                    challengeId: challengeId,
                    code: code,
                    newPassword: newPassword
                )
            )
        } catch {
            resetState = .failed(AppError(from: error))
        }
    }

    func prepararLoginDespuesDeRecuperar() {
        password = ""
        code = ""
        newPassword = ""
        recoveryRequestState = .idle
        resetState = .idle
    }

    private var emailLimpio: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}
