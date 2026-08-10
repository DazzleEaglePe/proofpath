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
    /// El simulador llega al backend local por localhost.
    static let apiBaseURL = URL(string: "http://localhost:3001")!
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

    init(baseURL: URL = Config.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
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
        // En una demo, un request colgado 60 segundos es peor que un error.
        urlRequest.timeoutInterval = 15
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if request.requiresAuth, let token = KeychainStore.shared.token {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = request.body {
            urlRequest.httpBody = try encoder.encode(body)
        }

        let (data, response) = try await session.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }

        switch http.statusCode {
        case 200...299:
            return data
        case 401:
            throw APIError.unauthorized
        case 400...499:
            let mensaje = (try? decoder.decode(APIErrorBody.self, from: data))?.message
            throw APIError.client(http.statusCode, mensaje)
        default:
            throw APIError.server(http.statusCode)
        }
    }
}

private struct APIErrorBody: Decodable {
    let error: String?
    let message: String?
}
