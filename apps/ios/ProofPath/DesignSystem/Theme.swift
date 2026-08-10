import SwiftUI

/// Tokens compartidos con la web: carbón, superficies cálidas y lima de marca.
extension Color {
    static let ppFondoOscuro = Color(red: 8 / 255, green: 11 / 255, blue: 9 / 255)
    static let ppTarjetaOscura = Color(red: 17 / 255, green: 21 / 255, blue: 18 / 255)
    static let ppTarjetaElevada = Color(red: 23 / 255, green: 29 / 255, blue: 24 / 255)
    static let ppBordeOscuro = Color.white.opacity(0.10)

    static let ppBackground = Color.ppFondoOscuro
    static let ppCard = Color.ppTarjetaOscura
    static let ppBorde = Color.ppBordeOscuro

    static let ppMarca = Color(red: 184 / 255, green: 255 / 255, blue: 61 / 255)
    static let ppMarcaSuave = Color.ppMarca.opacity(0.11)
    static let ppMarcaAzul = Color.ppMarca
    static let ppMarcaRosa = Color.ppMarca

    static let ppOk = Color.ppMarca
    static let ppOkSuave = Color.ppMarca.opacity(0.12)
    static let ppPeligro = Color(red: 1, green: 117 / 255, blue: 109 / 255)
    static let ppPeligroSuave = Color.ppPeligro.opacity(0.12)

    static let ppTextoSecundario = Color.white.opacity(0.56)
    static let ppTextoTerciario = Color.white.opacity(0.34)

    init(claro: UInt32, oscuro: UInt32) {
        self.init(uiColor: UIColor { entorno in
            UIColor(hex: entorno.userInterfaceStyle == .dark ? oscuro : claro)
        })
    }
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

enum Espacio {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 12
    static let lg: CGFloat = 16
    static let xl: CGFloat = 24
    static let xxl: CGFloat = 32
    static let xxxl: CGFloat = 44
}

enum Radio {
    static let chip: CGFloat = 999
    static let tarjeta: CGFloat = 22
    static let boton: CGFloat = 999
}
