import SwiftUI

extension View {
    func tarjetaDark(padding: CGFloat = Espacio.lg) -> some View {
        self
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [Color.white.opacity(0.055), Color.white.opacity(0.025)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                    .stroke(Color.ppBordeOscuro, lineWidth: 1)
            )
    }

    func tarjeta(padding: CGFloat = Espacio.lg) -> some View {
        tarjetaDark(padding: padding)
    }

    func chipDark(color: Color = .white, fondo: Color? = nil) -> some View {
        self
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(color)
            .padding(.horizontal, Espacio.md)
            .padding(.vertical, 7)
            .background(Capsule().fill(fondo ?? Color.white.opacity(0.06)))
            .overlay(Capsule().stroke(color.opacity(0.16), lineWidth: 1))
    }

    func chip(color: Color = .white, fondo: Color? = nil) -> some View {
        chipDark(color: color, fondo: fondo)
    }

    func tituloDeSeccion() -> some View {
        self
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundStyle(Color.ppTextoTerciario)
            .textCase(.uppercase)
            .kerning(1.1)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct BotonPrincipal: ButtonStyle {
    var completo = true
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.callout)
            .fontWeight(.bold)
            .foregroundStyle(Color.ppFondoOscuro)
            .padding(.vertical, 15)
            .padding(.horizontal, Espacio.xl)
            .frame(maxWidth: completo ? .infinity : nil)
            .background(Capsule().fill(Color.ppMarca))
            .opacity(isEnabled ? (configuration.isPressed ? 0.78 : 1) : 0.34)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == BotonPrincipal {
    static var principal: BotonPrincipal { BotonPrincipal() }
    static var principalAjustado: BotonPrincipal { BotonPrincipal(completo: false) }
}

struct BotonBlancoOvalado: ButtonStyle {
    @Environment(\.isEnabled) private var isEnabled

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.callout)
            .fontWeight(.bold)
            .foregroundStyle(Color.ppFondoOscuro)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity)
            .background(Capsule().fill(Color.ppMarca))
            .opacity(isEnabled ? (configuration.isPressed ? 0.8 : 1) : 0.34)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == BotonBlancoOvalado {
    static var blancoOvalado: BotonBlancoOvalado { BotonBlancoOvalado() }
}

struct EstadoVacio: View {
    let icono: String
    let mensaje: String

    var body: some View {
        VStack(spacing: Espacio.md) {
            Image(systemName: icono)
                .font(.title2)
                .foregroundStyle(Color.ppMarca)
            Text(mensaje)
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Espacio.xl)
    }
}
