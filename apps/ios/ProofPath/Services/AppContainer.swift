import Foundation

/// Inyección de dependencias sin frameworks — 05-IOS-ARCHITECTURE.md §3.
@MainActor
final class AppContainer {
    static let shared = AppContainer()

    /// **El plan B de la demo.** Un booleano, no una recompilación con banderas
    /// de scheme: si el backend no responde en la sala, se enciende esto.
    var useMockData = false {
        didSet { reconstruir() }
    }

    private(set) var apiClient: any APIClientProtocol = APIClient()
    private(set) var talentRepository: any TalentRepositoryProtocol =
        TalentRepository(client: APIClient())

    private init() {}

    private func reconstruir() {
        apiClient = useMockData ? MockAPIClient() : APIClient()
        talentRepository = TalentRepository(client: apiClient)
    }
}
