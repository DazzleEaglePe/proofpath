import Foundation
import Security

/// Guarda el JWT en el Keychain — 04-IOS-APP.md §3.
///
/// Nada de OAuth para el MVP: un solo token, guardado donde corresponde y no en
/// UserDefaults.
final class KeychainStore: @unchecked Sendable {
    static let shared = KeychainStore()

    private let servicio = "org.proofpath.app"
    private let cuenta = "jwt"

    private init() {}

    var token: String? {
        get { leer() }
        set {
            if let newValue { guardar(newValue) } else { borrar() }
        }
    }

    var haySesion: Bool { token != nil }

    private func guardar(_ valor: String) {
        borrar()
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servicio,
            kSecAttrAccount as String: cuenta,
            kSecValueData as String: Data(valor.utf8),
            // Accesible solo con el dispositivo desbloqueado y sin salir en backups.
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
        ]
        SecItemAdd(query as CFDictionary, nil)
    }

    private func leer() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servicio,
            kSecAttrAccount as String: cuenta,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data
        else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private func borrar() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: servicio,
            kSecAttrAccount as String: cuenta,
        ]
        SecItemDelete(query as CFDictionary)
    }
}
