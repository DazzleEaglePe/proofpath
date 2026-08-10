import SwiftUI

/// Modificadores reutilizables.
///
/// En SwiftUI los `ViewModifier` cumplen el papel que en la web cumplen las
/// clases de utilidad: encapsulan una decision visual en un solo lugar, y
/// cambiarla ahi la cambia en toda la app.

extension View {
    /// Tarjeta estandar. Equivale al `<Card>` de la web.
    func tarjeta(padding: CGFloat = Espacio.lg) -> some View {
        self
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                    .fill(Color.ppCard)
            )
    }

    /// Chip de texto. Sin barras, sin porcentajes, sin niveles.
    func chip(color: Color = .primary, fondo: Color? = nil) -> some View {
        self
            .font(.subheadline)
            .foregroundStyle(color)
            .padding(.horizontal, Espacio.md)
            .padding(.vertical, 6)
            .background(
                Capsule().fill(fondo ?? Color(uiColor: .tertiarySystemFill))
            )
    }

    /// Titulo de seccion, en versalitas. Espeja los encabezados de la web.
    func tituloDeSeccion() -> some View {
        self
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(.secondary)
            .textCase(.uppercase)
            .kerning(0.5)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Boton principal. Un solo lugar define como se ve la accion primaria.
struct BotonPrincipal: ButtonStyle {
    var completo = true

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.body)
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .padding(.vertical, 14)
            .padding(.horizontal, Espacio.xl)
            .frame(maxWidth: completo ? .infinity : nil)
            .background(
                RoundedRectangle(cornerRadius: Radio.boton, style: .continuous)
                    .fill(Color.ppMarca)
            )
            // Retroalimentacion sutil al tocar: la plataforma la espera y no
            // cuesta nada.
            .opacity(configuration.isPressed ? 0.85 : 1)
            .animation(.easeOut(duration: 0.12), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == BotonPrincipal {
    static var principal: BotonPrincipal { BotonPrincipal() }
    static var principalAjustado: BotonPrincipal { BotonPrincipal(completo: false) }
}

/// Estado vacio con una linea de explicacion. Se repite en varias pantallas.
struct EstadoVacio: View {
    let icono: String
    let mensaje: String

    var body: some View {
        VStack(spacing: Espacio.sm) {
            Image(systemName: icono)
                .font(.title)
                .foregroundStyle(.tertiary)
            Text(mensaje)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Espacio.xl)
    }
}
