import Foundation

/// Plan B de la demo — 04-IOS-APP.md §6.
///
/// Si el backend no responde en la sala, se enciende `useMockData` en
/// `AppContainer` y las cuatro pantallas se muestran igual.
///
/// Los fixtures son **los mismos datos del seed** de 02-DATA-MODEL.md §6, para
/// que web y móvil muestren lo mismo si hay que degradar a mitad del pitch.
struct MockAPIClient: APIClientProtocol {
    /// Latencia creíble: sin ella la pantalla aparece de golpe y se nota falsa.
    var latencia: Duration = .milliseconds(400)

    func send<T: Decodable>(_ request: APIRequest) async throws -> T {
        try await Task.sleep(for: latencia)
        let data = try MockFixtures.json(for: request.path, method: request.method)
        return try JSONDecoder.appDecoder.decode(T.self, from: data)
    }

    func send(_ request: APIRequest) async throws {
        try await Task.sleep(for: latencia)
    }
}

enum MockFixtures {
    static func json(for path: String, method: HTTPMethod) throws -> Data {
        if path == "/auth/onboarding" { return Data(onboarding.utf8) }
        if path == "/me/talentpass" { return Data(talentPass.utf8) }
        if path == "/me/experiences" { return Data(experiencias.utf8) }
        if path == "/experiences", method == .post { return Data(experienciaCreada.utf8) }
        if path.hasPrefix("/experiences/") { return Data(detalle.utf8) }
        throw APIError.client(404, "Sin fixture para \(path)")
    }

    static let onboarding = """
    {"token":"mock-token","profile":{"id":"tp_1","fullName":"Bruno Valdez","tokenId":"1","walletAddress":"0xabc"}}
    """

    static let talentPass = """
    {
      "profileId": "tp_1",
      "fullName": "Bruno Valdez",
      "tokenId": "1",
      "walletAddress": "0xabc",
      "isVerified": true,
      "experienceCount": 3,
      "skills": [
        {"name":"Colaboración","type":"HUMAN","experienceCount":3,
         "experienceTitles":["Proyecto de Datos","Campaña Humanitaria","Programa de Mentoría"]},
        {"name":"Comunicación","type":"HUMAN","experienceCount":2,
         "experienceTitles":["Campaña Humanitaria","Programa de Mentoría"]},
        {"name":"React","type":"HARD","experienceCount":1,
         "experienceTitles":["Plataforma de mentorías juveniles"]},
        {"name":"TypeScript","type":"HARD","experienceCount":1,
         "experienceTitles":["Plataforma de mentorías juveniles"]}
      ]
    }
    """

    static let experiencias = """
    [
      {"id":"exp_1","programTitle":"Plataforma de mentorías juveniles",
       "organizationName":"Fundación Impulso Joven","role":"Full Stack Developer",
       "startDate":"2026-03-01T00:00:00.000Z","endDate":"2026-07-01T00:00:00.000Z",
       "status":"ISSUED","isVerified":true,"txHash":"0xabc123"},
      {"id":"exp_2","programTitle":"Campaña Humanitaria",
       "organizationName":"Fundación Impulso Joven","role":"Voluntario de logística",
       "startDate":"2026-01-10T00:00:00.000Z","endDate":"2026-02-20T00:00:00.000Z",
       "status":"ISSUED","isVerified":true,"txHash":"0xabc123"},
      {"id":"exp_3","programTitle":"Programa de Mentoría",
       "organizationName":"Fundación Impulso Joven","role":"Mentor de pares",
       "startDate":"2026-04-01T00:00:00.000Z","endDate":null,
       "status":"AI_ANALYZED","isVerified":false,"txHash":null}
    ]
    """

    static let detalle = """
    {
      "id":"exp_1","programTitle":"Plataforma de mentorías juveniles",
      "organizationName":"Fundación Impulso Joven","role":"Full Stack Developer",
      "contributions":"Construí el dashboard de seguimiento, el sistema de autenticación y la integración con la API de mentorías. Coordiné con dos voluntarias de diseño para cerrar el flujo de registro.",
      "hoursCommitted":320,
      "startDate":"2026-03-01T00:00:00.000Z","endDate":"2026-07-01T00:00:00.000Z",
      "status":"ISSUED",
      "evidences":[
        {"type":"REPOSITORY","url":"https://github.com/impulsojoven/plataforma-mentorias","label":"Repositorio del proyecto"},
        {"type":"DEPLOYED_DEMO","url":"https://mentorias.impulsojoven.org","label":"Demo desplegada"}
      ],
      "skills":{"hard":["React","TypeScript","REST APIs"],"human":["Colaboración","Autonomía"]},
      "credential":{"credentialHash":"0xc8827c3b","isVerified":true,"txHash":"0xabc123","batchId":"1"}
    }
    """

    static let experienciaCreada = """
    {"id":"exp_nueva","status":"DRAFT","organizationName":"Fundación Impulso Joven",
     "message":"Enviada a Fundación Impulso Joven para validación"}
    """
}
