import SwiftUI

/// Tokens de diseño — espejo de `apps/web/src/app/globals.css`.
///
/// **Por que un sistema propio y no una libreria de SwiftUI.**
///
/// En SwiftUI no existe un equivalente real a shadcn, y no por falta de
/// librerias sino porque el modelo es distinto: shadcn funciona copiando codigo
/// sobre primitivas headless y Tailwind, mientras que en SwiftUI **los
/// componentes nativos ya son el sistema de diseño** — traen accesibilidad,
/// Dynamic Type, VoiceOver, modo oscuro y las animaciones de la plataforma sin
/// que uno escriba nada.
///
/// Ademas `05-IOS-ARCHITECTURE.md §9` es explicito: cero SPM salvo que sea
/// inevitable. Una dependencia de UI seria justo lo contrario de inevitable.
///
/// Lo que si hace falta es esto: un puñado de tokens y modificadores para que la
/// app y la web se vean como el mismo producto. Son ~100 lineas y no dependen de
/// nadie.
extension Color {
    /// Color que responde al modo claro/oscuro sin necesidad de asset catalog.
    init(claro: UInt32, oscuro: UInt32) {
        self.init(uiColor: UIColor { entorno in
            UIColor(hex: entorno.userInterfaceStyle == .dark ? oscuro : claro)
        })
    }

    // Superficies y texto. Se apoyan en los colores del sistema donde tiene
    // sentido, para heredar el comportamiento correcto en ambos modos.
    static let ppBackground = Color(uiColor: .systemGroupedBackground)
    static let ppCard = Color(uiColor: .secondarySystemGroupedBackground)
    static let ppBorde = Color(uiColor: .separator)

    /// Teal de marca. El unico color saturado fuera de los estados.
    static let ppMarca = Color(claro: 0x0F766E, oscuro: 0x2DD4BF)
    static let ppMarcaSuave = Color(claro: 0xE6F5F3, oscuro: 0x10302E)

    /// Verde de "verificado". Junto con el rojo, es lo que tiene que leerse
    /// desde el fondo de la sala.
    static let ppOk = Color(claro: 0x067647, oscuro: 0x4ADE80)
    static let ppOkSuave = Color(claro: 0xE7F6EE, oscuro: 0x0F2E1E)

    static let ppPeligro = Color(claro: 0xB42318, oscuro: 0xF87171)
    static let ppPeligroSuave = Color(claro: 0xFDECEA, oscuro: 0x341A19)
}

private extension UIColor {
    convenience init(hex: UInt32) {
        self.init(
            red: CGFloat((hex >> 16) & 0xFF) / 255,
            green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255,
            alpha: 1
        )
    }
}

/// Escala de espaciado. Multiplos de 4, igual que la de Tailwind.
enum Espacio {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
}

enum Radio {
    static let chip: CGFloat = 999
    static let tarjeta: CGFloat = 12
    static let boton: CGFloat = 10
}
