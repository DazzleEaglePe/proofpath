import XCTest
@testable import ProofPath

/// Tres tests y nada más — 05-IOS-ARCHITECTURE.md §10.
/// El tercero es el que más vale: atrapa el desajuste camelCase/snake_case.
@MainActor
final class TalentPassViewModelTests: XCTestCase {
    func testPasaDeLoadingALoaded() async {
        let vm = TalentPassViewModel(repository: RepositorioFalso())

        await vm.load()

        guard case let .loaded(datos) = vm.state else {
            return XCTFail("Se esperaba .loaded, llegó \(vm.state)")
        }
        XCTAssertEqual(datos.pass.fullName, "Bruno Valdez")
        XCTAssertEqual(datos.experiencias.count, 3)
    }

    func testPasaAFailedCuandoElRepositorioLanza() async {
        let vm = TalentPassViewModel(repository: RepositorioFalso(falla: true))

        await vm.load()

        guard case .failed = vm.state else {
            return XCTFail("Se esperaba .failed, llegó \(vm.state)")
        }
    }

    /// Decodifica el fixture tal cual viene del backend. Si alguien agrega
    /// `.convertFromSnakeCase` al decoder, este test se cae.
    func testDecodingDelFixtureSinErrores() throws {
        let data = Data(MockFixtures.talentPass.utf8)

        let pass = try JSONDecoder.appDecoder.decode(TalentPassData.self, from: data)

        XCTAssertEqual(pass.tokenId, "1")
        XCTAssertEqual(pass.experienceCount, 3)
        XCTAssertEqual(pass.skills.first?.experienceCount, 3)
    }

    func testLasSkillsNoTienenNingunCampoDePuntaje() throws {
        let data = Data(MockFixtures.talentPass.utf8)
        let json = try XCTUnwrap(
            JSONSerialization.jsonObject(with: data) as? [String: Any]
        )
        let skills = try XCTUnwrap(json["skills"] as? [[String: Any]])

        for skill in skills {
            let claves = Set(skill.keys)
            XCTAssertEqual(claves, ["name", "type", "experienceCount", "experienceTitles"])
        }
    }
}

private struct RepositorioFalso: TalentRepositoryProtocol {
    var falla = false

    private func decodificar<T: Decodable>(_ json: String) throws -> T {
        if falla { throw APIError.server(500) }
        return try JSONDecoder.appDecoder.decode(T.self, from: Data(json.utf8))
    }

    func onboard(fullName: String, email: String) async throws -> OnboardingResponse {
        try decodificar(MockFixtures.onboarding)
    }

    func fetchTalentPass() async throws -> TalentPassData {
        try decodificar(MockFixtures.talentPass)
    }

    func fetchExperiences() async throws -> [Experience] {
        try decodificar(MockFixtures.experiencias)
    }

    func fetchExperience(id: String) async throws -> ExperienceDetail {
        try decodificar(MockFixtures.detalle)
    }

    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience {
        try decodificar(MockFixtures.experienciaCreada)
    }
}
