import XCTest
@testable import ProofPath

/// Pruebas de los contratos que alimentan las cuatro secciones autenticadas.
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
        XCTAssertEqual(pass.email, "bruno@example.com")
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

    func testCargaProgramasParaElSelector() async {
        let vm = NewExperienceViewModel(repository: RepositorioFalso())

        await vm.loadPrograms()

        guard case let .loaded(programs) = vm.programsState else {
            return XCTFail("Se esperaba la lista de programas")
        }
        XCTAssertEqual(programs.count, 2)
        XCTAssertEqual(programs.first?.organizationName, "Fundación Impulso Joven")
        XCTAssertTrue(vm.programId.isEmpty, "Con varias opciones el usuario debe elegir")
    }

    func testFiltroDeExperienciasSeparaRevisionYVerificadas() async {
        let vm = ExperiencesViewModel(repository: RepositorioFalso())

        await vm.load()
        vm.filter = .review
        XCTAssertEqual(vm.filteredExperiences.map(\.id), ["exp_3"])

        vm.filter = .verified
        XCTAssertEqual(vm.filteredExperiences.count, 2)
    }

    func testExplorarFiltraSinExponerPuntajes() async throws {
        let vm = ExploreViewModel(repository: RepositorioFalso())

        await vm.load()
        vm.modality = .remote

        XCTAssertEqual(vm.filteredOpportunities.map(\.id), ["op_mentorias"])

        vm.searchText = "talleres"
        XCTAssertEqual(
            vm.filteredOpportunities.map(\.id),
            ["op_mentorias"],
            "La búsqueda también debe considerar la descripción"
        )

        let raw = try XCTUnwrap(
            JSONSerialization.jsonObject(with: Data(MockFixtures.oportunidades.utf8))
                as? [[String: Any]]
        )
        XCTAssertFalse(raw.contains { $0["score"] != nil || $0["rank"] != nil })
    }

    func testCuentaCargaPerfilParaRecomendaciones() async {
        let vm = AccountViewModel(repository: RepositorioFalso())

        await vm.load()

        guard case let .loaded(data) = vm.state else {
            return XCTFail("Se esperaba cuenta cargada")
        }
        XCTAssertEqual(data.profile.fieldOfStudy, "Ingeniería de Software")
        XCTAssertTrue(data.profile.hasRecommendationData)
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

    func fetchPrograms() async throws -> [ProgramSummary] {
        try decodificar(MockFixtures.programas)
    }

    func fetchRecommendedOpportunities() async throws -> [Opportunity] {
        try decodificar(MockFixtures.oportunidades)
    }

    func fetchDiscoveryProfile() async throws -> DiscoveryProfile {
        try decodificar(MockFixtures.discoveryProfile)
    }

    func updateDiscoveryProfile(_ profile: UpdateDiscoveryProfileRequest) async throws -> DiscoveryProfile {
        try decodificar(MockFixtures.discoveryProfile)
    }

    func fetchExperience(id: String) async throws -> ExperienceDetail {
        try decodificar(MockFixtures.detalle)
    }

    func createExperience(_ draft: ExperienceDraft) async throws -> CreatedExperience {
        try decodificar(MockFixtures.experienciaCreada)
    }
}
