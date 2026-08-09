# ProofPath — iOS ARCHITECTURE

**Complemento de `04-IOS-APP.md`** (alcance y pantallas). Este documento define
arquitectura, patrones y convenciones de código.

**Target:** iOS 17+ · SwiftUI · Swift 5.9+ · async/await
**Destinatario:** Claude Code / Gemini. Este archivo es la fuente de verdad del móvil.

---

## 1. Patrón: MVVM con Observation

iOS 17 trae el macro `@Observable`, que reemplaza a `ObservableObject` + `@Published`.
**Usar `@Observable`.** Si el asistente genera `ObservableObject`, está usando patrones de
iOS 16 y hay que corregirlo.

```
View  ──observa──►  ViewModel  ──llama──►  Repository  ──►  APIClient  ──►  Backend
 │                      │                       │
 SwiftUI          @Observable            protocolo + mock
                  @MainActor
```

**Qué va en cada capa:**

| Capa | Responsabilidad | Nunca hace |
|---|---|---|
| **View** | Presentación y gestos | Llamadas de red, lógica de negocio, formateo complejo |
| **ViewModel** | Estado de pantalla, orquestación, mapeo a strings de UI | Conocer `URLSession` o endpoints |
| **Repository** | Traduce dominio ↔ API, cachea si hace falta | Conocer SwiftUI |
| **APIClient** | HTTP, decoding, errores de transporte | Lógica de negocio |

### Lo que NO se usa

- **Coordinator pattern:** son 4 pantallas. `NavigationStack` con `path` alcanza.
  Meter Coordinator acá es sobreingeniería que cuesta horas y no aporta.
- **Combine:** async/await cubre todo el caso. No mezclar los dos paradigmas.
- **Redux/TCA:** no con este plazo.
- **CoreData:** no hay offline real en el MVP. El cache es en memoria.

---

## 2. Estado y concurrencia

```swift
@Observable
@MainActor
final class TalentPassViewModel {
    private(set) var state: ViewState<TalentPassData> = .idle

    private let repository: TalentRepositoryProtocol

    init(repository: TalentRepositoryProtocol) {
        self.repository = repository
    }

    func load() async {
        state = .loading
        do {
            let data = try await repository.fetchTalentPass()
            state = .loaded(data)
        } catch {
            state = .failed(AppError(from: error))
        }
    }
}
```

**Reglas duras:**

- Todo ViewModel es `@MainActor`. Sin excepciones. Evita el 90% de los bugs de UI.
- `private(set)` en el estado. La View lee, no escribe.
- El estado de pantalla es **un solo enum**, nunca booleanos sueltos
  (`isLoading` + `error` + `data` es la receta para estados imposibles).

```swift
enum ViewState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(AppError)
}
```

En la View:

```swift
struct TalentPassView: View {
    @State private var viewModel: TalentPassViewModel

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:  ProgressView()
            case .loaded(let data): content(data)
            case .failed(let error): ErrorView(error: error) {
                Task { await viewModel.load() }
            }
            }
        }
        .task { await viewModel.load() }
    }
}
```

`.task` (no `.onAppear`) porque cancela automáticamente al desaparecer la vista.

---

## 3. Inyección de dependencias

Sin frameworks. Protocolos + init injection + un contenedor simple.

```swift
protocol TalentRepositoryProtocol: Sendable {
    func fetchTalentPass() async throws -> TalentPassData
    func fetchExperiences() async throws -> [Experience]
    func fetchExperience(id: String) async throws -> ExperienceDetail
    func createExperience(_ draft: ExperienceDraft) async throws -> Experience
}

@MainActor
final class AppContainer {
    static let shared = AppContainer()

    /// Cambiar a true para demo sin backend. Ver §7.
    var useMockData = false

    lazy var apiClient: APIClientProtocol =
        useMockData ? MockAPIClient() : APIClient(baseURL: Config.apiBaseURL)

    lazy var talentRepository: TalentRepositoryProtocol =
        TalentRepository(client: apiClient)
}
```

**El flag `useMockData` es el plan B de la demo.** Un booleano, no una recompilación con
banderas de scheme.

---

## 4. Capa de red

```swift
protocol APIClientProtocol: Sendable {
    func send<T: Decodable>(_ request: APIRequest) async throws -> T
}

struct APIRequest {
    let path: String
    let method: HTTPMethod
    let body: Encodable?
    var requiresAuth: Bool = true
}

actor APIClient: APIClientProtocol {
    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()

    func send<T: Decodable>(_ request: APIRequest) async throws -> T {
        var urlRequest = URLRequest(url: baseURL.appending(path: request.path))
        urlRequest.httpMethod = request.method.rawValue
        urlRequest.timeoutInterval = 15

        if request.requiresAuth, let token = KeychainStore.shared.token {
            urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        // ... body encoding

        let (data, response) = try await session.data(for: urlRequest)
        guard let http = response as? HTTPURLResponse else { throw APIError.invalidResponse }

        switch http.statusCode {
        case 200...299:  return try decoder.decode(T.self, from: data)
        case 401:        throw APIError.unauthorized
        case 400...499:  throw APIError.client(http.statusCode)
        default:         throw APIError.server(http.statusCode)
        }
    }
}
```

**Ojo con el backend NestJS:** definir de entrada si serializa en `camelCase` o
`snake_case` y **no cambiarlo después**. Si el backend ya manda camelCase, quitar
`.convertFromSnakeCase` — dejarlo puesto con camelCase rompe el decoding de forma
confusa.

**Timeout de 15s.** En una demo, un request colgado 60 segundos es peor que un error.

---

## 5. Modelos

Espejo de `02-DATA-MODEL.md`. Solo lo que la app consume.

```swift
struct TalentPassData: Decodable, Sendable {
    let profileId: String
    let fullName: String
    let tokenId: String          // BigInt del backend → String. Nunca Int.
    let isVerified: Bool
    let experienceCount: Int
    let skills: [SkillSummary]
}

struct SkillSummary: Decodable, Identifiable, Sendable {
    let name: String
    let type: SkillType          // .hard | .human
    let experienceCount: Int     // ← conteo, NO score
    let experienceTitles: [String]

    var id: String { name }
}

struct Experience: Decodable, Identifiable, Sendable {
    let id: String
    let programTitle: String
    let organizationName: String
    let role: String
    let startDate: Date
    let endDate: Date?
    let status: ExperienceStatus
    let isVerified: Bool
    let txHash: String?
}
```

**`SkillSummary` no tiene ni tendrá campo de score, nivel o porcentaje.** Es intencional.
Ver `00-CONTEXT.md §2.1`. Si un asistente propone agregarlo "para la UI", se rechaza.

`tokenId` como `String`, no `Int`: es un `uint256` y no entra en `Int64`.

---

## 6. Errores

```swift
struct AppError: Error, Equatable {
    let title: String
    let message: String
    let isRetryable: Bool
}

extension AppError {
    init(from error: Error) {
        switch error {
        case APIError.unauthorized:
            self.init(title: "Sesión expirada",
                      message: "Inicia sesión nuevamente.", isRetryable: false)
        case is URLError:
            self.init(title: "Sin conexión",
                      message: "Revisa tu conexión e intenta de nuevo.", isRetryable: true)
        default:
            self.init(title: "Algo salió mal",
                      message: "Intenta nuevamente en unos segundos.", isRetryable: true)
        }
    }
}
```

Ningún error crudo llega a la UI. Nunca `error.localizedDescription` en pantalla — en una
demo proyectada, un stack trace se ve fatal.

---

## 7. MockAPIClient (plan B de demo)

No es opcional. Es lo que salva la demo si el backend cae.

```swift
struct MockAPIClient: APIClientProtocol {
    func send<T: Decodable>(_ request: APIRequest) async throws -> T {
        try await Task.sleep(for: .milliseconds(400))  // latencia creíble
        let json = MockFixtures.json(for: request.path)
        return try JSONDecoder.appDecoder.decode(T.self, from: json)
    }
}
```

Los fixtures deben ser los **mismos datos del seed** de `02-DATA-MODEL.md §6`, para que
web y móvil muestren lo mismo si hay que degradar a mitad del pitch.

**Probarlo con el WiFi apagado antes del miércoles.** Está en el checklist.

---

## 8. Diseño visual

Ver `04-IOS-APP.md §2` para las pantallas. Reglas transversales:

- **Prohibido en toda la app:** `ProgressView(value:)` para skills, estrellas, barras,
  porcentajes, niveles, o cualquier elemento que sugiera puntaje de una persona.
  Las skills se muestran como texto: *"Demostrada en 3 experiencias"*.
- **Badge de verificación:** un solo componente `VerifiedBadge` con dos estados
  (verificado / no verificado). Verde y gris. Que se lea desde el fondo de una sala.
- **Tipografía:** SF Pro del sistema, Dynamic Type. Sin fuentes custom — no hay tiempo y
  no aporta.
- **Dark mode:** soportar ambos. El proyector suele mostrar mejor el claro; probar los dos
  antes del pitch.
- **Sin animaciones elaboradas.** Transiciones por defecto de SwiftUI.

---

## 9. Convenciones

- Un `struct` por archivo. Nombre del archivo = nombre del tipo.
- Views tontas: si un `body` pasa de ~60 líneas, extraer subvistas.
- Nada de fuerza: sin `!`, sin `try!`, sin `as!`. `guard let` o valor por defecto.
- Strings de UI en un `Strings.swift` centralizado — facilita revisar que no se coló
  ningún lenguaje de scoring.
- Todo en español en la UI. Nombres de código en inglés.
- Sin dependencias externas. Cero SPM salvo que sea inevitable.

---

## 10. Tests

Con este plazo, **tres tests y nada más**:

1. `TalentPassViewModel` pasa de `.loading` a `.loaded` con repo mock
2. `TalentPassViewModel` pasa a `.failed` cuando el repo lanza
3. Decoding del fixture de `TalentPassData` sin errores

El tercero es el que más vale: atrapa el desajuste camelCase/snake_case, que es el bug
que más tiempo hace perder.

---

## 11. Orden de construcción

Pensado para que cada paso deje algo demostrable:

```
1. Modelos + APIClient + MockAPIClient           (~1.5h)
2. TalentPassView con datos mock                 (~2h)   ← ya se puede mostrar
3. ExperienceDetailView + botón Arbiscan         (~1.5h)
4. Conectar al backend real                      (~1h)
5. NewExperienceView                             (~1.5h)
6. OnboardingView + Keychain                     (~1h)
7. Export de llave privada                       (~0.5h)
8. Pulido, dark mode, Dynamic Type               (~1h)
```

**Los pasos 1-3 son los que salen en el pitch.** Si el tiempo se corta, se entregan esos
tres y la app igual cumple su función de 20 segundos. Los pasos 5-7 son producto, no demo.
