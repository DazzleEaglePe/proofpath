import Foundation

enum HTTPMethod: String, Sendable {
    case get = "GET"
    case post = "POST"
    case patch = "PATCH"
}

struct APIRequest: Sendable {
    let path: String
    var method: HTTPMethod = .get
    var body: (any Encodable & Sendable)?
    var requiresAuth: Bool = true
}

enum APIError: Error, Equatable {
    case invalidResponse
    case unauthorized
    case client(Int, String?)
    case server(Int)
}

protocol APIClientProtocol: Sendable {
    func send<T: Decodable>(_ request: APIRequest) async throws -> T
    func send(_ request: APIRequest) async throws
}

enum Config {
    /// Por defecto, tanto TestFlight/App Store como la demo del simulador usan
    /// la API pública. Para desarrollo local se puede definir la variable de
    /// entorno del Scheme: PROOFPATH_API_BASE_URL=http://localhost:3001
    static let apiBaseURL: URL = {
        let configured = ProcessInfo.processInfo.environment["PROOFPATH_API_BASE_URL"]
            ?? "https://proofpath.ecabot.site/api"

        guard let url = URL(string: configured) else {
            preconditionFailure("PROOFPATH_API_BASE_URL no contiene una URL válida")
        }
        return url
    }()
}

extension JSONDecoder {
    /// El backend serializa en camelCase (06-API-SPEC.md §1).
    ///
    /// NO poner `.convertFromSnakeCase`: contra un backend camelCase rompe el
    /// decoding de forma confusa, y es el bug que 05-IOS-ARCHITECTURE §10 señala
    /// como el que más tiempo hace perder.
    static var appDecoder: JSONDecoder {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601WithFractionalSeconds
        return d
    }
}

extension JSONDecoder.DateDecodingStrategy {
    /// El backend manda ISO 8601 con milisegundos (`2026-08-09T14:00:00.000Z`),
    /// que el `.iso8601` estándar no acepta.
    static var iso8601WithFractionalSeconds: JSONDecoder.DateDecodingStrategy {
        .custom { decoder in
            let texto = try decoder.singleValueContainer().decode(String.self)
            let conMilis = ISO8601DateFormatter()
            conMilis.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let fecha = conMilis.date(from: texto) { return fecha }

            let sinMilis = ISO8601DateFormatter()
            sinMilis.formatOptions = [.withInternetDateTime]
            if let fecha = sinMilis.date(from: texto) { return fecha }

            throw DecodingError.dataCorrupted(
                .init(codingPath: decoder.codingPath, debugDescription: "Fecha invalida: \(texto)")
            )
        }
    }
}

actor APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let decoder = JSONDecoder.appDecoder
    private let encoder = JSONEncoder()

    init(baseURL: URL = Config.apiBaseURL, session: URLSession? = nil) {
        self.baseURL = baseURL
        self.session = session ?? Self.makeSession()
    }

    func send<T: Decodable>(_ request: APIRequest) async throws -> T {
        let data = try await perform(request)
        return try decoder.decode(T.self, from: data)
    }

    func send(_ request: APIRequest) async throws {
        _ = try await perform(request)
    }

    private func perform(_ request: APIRequest) async throws -> Data {
        var urlRequest = URLRequest(url: baseURL.appending(path: request.path))
        urlRequest.httpMethod = request.method.rawValue
        // Un intento breve con recuperación automática ofrece mejor UX que una
        // única espera larga. La API normalmente responde en menos de 300 ms.
        urlRequest.timeoutInterval = 15
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if request.requiresAuth, let token = KeychainStore.shared.token {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = request.body {
            urlRequest.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await data(for: urlRequest, request: request)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }

        switch http.statusCode {
        case 200...299:
            return data
        case 401:
            let mensaje = (try? decoder.decode(APIErrorBody.self, from: data))?.message
            if request.requiresAuth { throw APIError.unauthorized }
            throw APIError.client(http.statusCode, mensaje)
        case 400...499:
            let mensaje = (try? decoder.decode(APIErrorBody.self, from: data))?.message
            throw APIError.client(http.statusCode, mensaje)
        default:
            throw APIError.server(http.statusCode)
        }
    }

    /// Reintenta una sola vez operaciones seguras ante cortes transitorios.
    /// El login también es idempotente: repetirlo solo emite otra sesión, sin
    /// duplicar perfiles ni experiencias. Los POST que escriben datos jamás se
    /// reintentan automáticamente.
    private func data(
        for urlRequest: URLRequest,
        request: APIRequest
    ) async throws -> (Data, URLResponse) {
        let puedeReintentar = request.method == .get || request.path == "/auth/talent/login"
        let intentos = puedeReintentar ? 2 : 1

        for intento in 1...intentos {
            do {
                return try await session.data(for: urlRequest)
            } catch let error as URLError where intento < intentos && error.esTransitorio {
                try await Task.sleep(for: .milliseconds(350))
            }
        }

        // El bucle siempre retorna o lanza; este fallback mantiene la función
        // exhaustiva para el compilador sin ocultar el error real.
        return try await session.data(for: urlRequest)
    }

    private static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.default
        configuration.waitsForConnectivity = true
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 35
        configuration.httpMaximumConnectionsPerHost = 4
        return URLSession(configuration: configuration)
    }
}

private extension URLError {
    var esTransitorio: Bool {
        switch code {
        case .timedOut, .networkConnectionLost, .cannotConnectToHost, .dnsLookupFailed:
            return true
        default:
            return false
        }
    }
}

private struct APIErrorBody: Decodable {
    let error: String?
    let message: String?
}
