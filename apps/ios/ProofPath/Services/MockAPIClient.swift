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
        if path == "/auth/talent/register" { return Data(authChallenge.utf8) }
        if path == "/auth/talent/forgot-password" { return Data(authChallenge.utf8) }
        if path == "/auth/talent/verify-email" || path == "/auth/talent/login" {
            return Data(onboarding.utf8)
        }
        if path == "/auth/talent/reset-password" { return Data(authMessage.utf8) }
        if path == "/auth/onboarding" { return Data(onboarding.utf8) }
        if path == "/me/talentpass" { return Data(talentPass.utf8) }
        if path == "/me/experiences" { return Data(experiencias.utf8) }
        if path == "/me/profile" { return Data(discoveryProfile.utf8) }
        if path == "/me/opportunities/recommended" { return Data(oportunidades.utf8) }
        if path == "/programs" { return Data(programas.utf8) }
        if path == "/experiences", method == .post { return Data(experienciaCreada.utf8) }
        if path.hasPrefix("/experiences/") { return Data(detalle.utf8) }
        throw APIError.client(404, "Sin fixture para \(path)")
    }

    static let onboarding = """
    {"token":"mock-token","profile":{"id":"tp_1","fullName":"Bryan Chávez Núñez","givenNames":"Bryan","familyNames":"Chávez Núñez","tokenId":"1","walletAddress":"0xabc"}}
    """

    static let authChallenge = """
    {"challengeId":"challenge_demo","expiresAt":"2026-08-10T23:59:59.000Z","message":"Te enviamos un código.","developmentCode":"123456"}
    """

    static let authMessage = """
    {"message":"Contraseña actualizada. Ya puedes iniciar sesión."}
    """

    static let talentPass = """
    {
      "profileId": "tp_1",
      "fullName": "Bryan Chávez Núñez",
      "email": "bryan@example.com",
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

    static let programas = """
    [
      {
        "id":"programa_mentorias",
        "title":"Plataforma de mentorías juveniles",
        "description":"Acompaña la construcción de una plataforma para conectar mentores y estudiantes.",
        "organizationName":"Fundación Impulso Joven",
        "organizationIsTrusted":true,
        "cause":"Educación",
        "modality":"REMOTE",
        "location":"Remoto · Perú",
        "weeklyHours":8,
        "applicationDeadline":"2026-09-20T23:59:59.000Z",
        "requiredSkills":["React","Comunicación"],
        "startDate":"2026-03-01T00:00:00.000Z",
        "endDate":null
      },
      {
        "id":"programa_datos",
        "title":"Proyecto de Datos Abiertos",
        "description":"Convierte información pública en herramientas útiles para comunidades locales.",
        "organizationName":"Red Cívica Perú",
        "organizationIsTrusted":true,
        "cause":"Tecnología cívica",
        "modality":"HYBRID",
        "location":"Lima",
        "weeklyHours":10,
        "applicationDeadline":"2026-09-30T23:59:59.000Z",
        "requiredSkills":["TypeScript","Análisis de datos","Colaboración"],
        "startDate":"2026-05-15T00:00:00.000Z",
        "endDate":"2026-12-15T00:00:00.000Z"
      }
    ]
    """

    static let discoveryProfile = """
    {
      "fullName":"Bryan Chávez Núñez",
      "email":"bryan@example.com",
      "headline":"Desarrollador, participante de hackathons",
      "educationStatus":"STUDENT",
      "fieldOfStudy":"Ciencia de la Computación",
      "institutionName":"Universidad Nacional de Ingeniería",
      "academicCycle":7,
      "city":"Lima",
      "weeklyAvailabilityHours":12,
      "preferredModalities":["REMOTE","HYBRID"],
      "causeInterests":["Educación","Tecnología cívica"],
      "roleInterests":["Desarrollo web","Análisis de datos"]
    }
    """

    static let oportunidades = """
    [
      {
        "id":"op_mentorias",
        "title":"Mentorías digitales para colegios públicos",
        "description":"Diseña herramientas y acompaña talleres para que más estudiantes descubran carreras digitales.",
        "organizationName":"Fundación Impulso Joven",
        "organizationIsTrusted":true,
        "cause":"Educación",
        "modality":"REMOTE",
        "location":"Remoto · Perú",
        "weeklyHours":8,
        "applicationDeadline":"2026-09-20T23:59:59.000Z",
        "requiredSkills":["React","Comunicación"],
        "startDate":"2026-10-05T00:00:00.000Z",
        "endDate":"2026-12-18T00:00:00.000Z",
        "recommendationReasons":["Conecta con tu interés en Educación","Coincide con tu modalidad preferida","Aprovecha tu experiencia en React"]
      },
      {
        "id":"op_datos",
        "title":"Datos abiertos para barrios más seguros",
        "description":"Convierte información pública en visualizaciones y recursos para líderes vecinales.",
        "organizationName":"Red Cívica Perú",
        "organizationIsTrusted":true,
        "cause":"Tecnología cívica",
        "modality":"HYBRID",
        "location":"Lima",
        "weeklyHours":10,
        "applicationDeadline":"2026-09-30T23:59:59.000Z",
        "requiredSkills":["TypeScript","Análisis de datos","Colaboración"],
        "startDate":"2026-10-15T00:00:00.000Z",
        "endDate":"2027-01-30T00:00:00.000Z",
        "recommendationReasons":["Conecta con tu interés en Tecnología cívica","Aprovecha tu experiencia en TypeScript y Colaboración","Está disponible en tu ciudad"]
      },
      {
        "id":"op_adopcion",
        "title":"Campaña digital de adopción responsable",
        "description":"Mejora la comunicación digital con la que familias conocen animales en adopción.",
        "organizationName":"Patitas al Rescate",
        "organizationIsTrusted":true,
        "cause":"Bienestar animal",
        "modality":"HYBRID",
        "location":"Lima",
        "weeklyHours":6,
        "applicationDeadline":"2026-10-10T23:59:59.000Z",
        "requiredSkills":["Diseño de producto","Comunicación"],
        "startDate":"2026-10-20T00:00:00.000Z",
        "endDate":null,
        "recommendationReasons":["Coincide con tu modalidad preferida","Encaja con tu disponibilidad semanal"]
      }
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
