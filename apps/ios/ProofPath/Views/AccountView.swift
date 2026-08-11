import SwiftUI

struct AccountView: View {
    let account: TalentPassData
    let profile: DiscoveryProfile
    var showsDismissButton = true
    var onEditProfile: () -> Void = {}

    @Environment(\.dismiss) private var dismiss
    @State private var confirmarCierre = false

    var body: some View {
        ZStack {
            fondo

            ScrollView {
                VStack(spacing: Espacio.xl) {
                    encabezado
                    identidad
                    perfilParaOportunidades
                    resumenCuenta
                    privacidad
                    cerrarSesion

                }
                .padding(.horizontal, Espacio.xl)
                .padding(.bottom, Espacio.xxl)
            }
            .scrollIndicators(.hidden)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color.ppFondoOscuro)
        .alert("¿Cerrar sesión?", isPresented: $confirmarCierre) {
            Button("Cancelar", role: .cancel) {}
            Button("Cerrar sesión", role: .destructive) {
                SessionState.shared.cerrar()
            }
        } message: {
            Text("Tendrás que ingresar nuevamente con tu correo y contraseña. Tu TalentPass y tus experiencias no se eliminarán.")
        }
    }

    private var fondo: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()
            Circle()
                .fill(Color.ppMarca.opacity(0.10))
                .frame(width: 300, height: 300)
                .blur(radius: 85)
                .offset(x: 155, y: -245)
        }
    }

    private var encabezado: some View {
        HStack(alignment: .center) {
            VStack(alignment: .leading, spacing: 3) {
                Text("MI CUENTA")
                    .font(.caption2)
                    .fontWeight(.black)
                    .kerning(1.3)
                    .foregroundStyle(Color.ppMarca)
                Text("Cuenta y acceso")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }

            Spacer()

            if showsDismissButton {
                Button { dismiss() } label: {
                    Image(systemName: "xmark")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.white)
                        .frame(width: 38, height: 38)
                        .background(Color.white.opacity(0.07), in: Circle())
                        .overlay(Circle().stroke(Color.white.opacity(0.1), lineWidth: 1))
                }
                .accessibilityLabel("Cerrar Mi cuenta")
            }
        }
        .padding(.top, Espacio.xl)
    }

    private var identidad: some View {
        VStack(spacing: Espacio.md) {
            Text(iniciales)
                .font(.system(size: 28, weight: .black, design: .rounded))
                .foregroundStyle(Color.ppFondoOscuro)
                .frame(width: 76, height: 76)
                .background(Color.ppMarca, in: Circle())
                .overlay(Circle().stroke(Color.white.opacity(0.14), lineWidth: 1))

            VStack(spacing: 5) {
                Text(account.fullName)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)
                Text(account.email)
                    .font(.subheadline)
                    .foregroundStyle(Color.ppTextoSecundario)
                    .textSelection(.enabled)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var resumenCuenta: some View {
        VStack(spacing: 0) {
            fila(
                icono: "checkmark.shield.fill",
                titulo: "Correo verificado",
                detalle: "Cuenta protegida",
                destacado: true
            )

            Divider().overlay(Color.white.opacity(0.07))

            fila(
                icono: "person.text.rectangle",
                titulo: "TalentPass",
                detalle: account.tokenId.map { "#\($0)" } ?? "En preparación"
            )

            Divider().overlay(Color.white.opacity(0.07))

            fila(
                icono: "key.fill",
                titulo: "Método de acceso",
                detalle: "Correo y contraseña"
            )
        }
        .padding(.horizontal, Espacio.lg)
        .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: Radio.tarjeta))
        .overlay(RoundedRectangle(cornerRadius: Radio.tarjeta).stroke(Color.ppBordeOscuro, lineWidth: 1))
    }

    private var perfilParaOportunidades: some View {
        Button(action: onEditProfile) {
            VStack(alignment: .leading, spacing: Espacio.md) {
                HStack(spacing: Espacio.md) {
                    Image(systemName: "sparkles")
                        .font(.headline)
                        .foregroundStyle(Color.ppMarca)
                        .frame(width: 42, height: 42)
                        .background(Color.ppMarcaSuave, in: Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Perfil para oportunidades")
                            .font(.subheadline)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                        Text(
                            profile.hasRecommendationData
                                ? "Tus preferencias mejoran lo que ves en Explorar."
                                : "Agrega tu formación e intereses para recibir mejores recomendaciones."
                        )
                        .font(.caption)
                        .foregroundStyle(Color.ppTextoSecundario)
                        .multilineTextAlignment(.leading)
                    }

                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(Color.ppTextoTerciario)
                }

                if profile.hasRecommendationData {
                    HStack(spacing: Espacio.sm) {
                        if let field = profile.fieldOfStudy {
                            Text(field).chipDark(color: Color.ppMarca, fondo: Color.ppMarcaSuave)
                        }
                        if let institution = profile.institutionName {
                            Text(institution)
                                .chipDark(color: Color.ppTextoSecundario)
                                .lineLimit(1)
                        }
                    }
                }
            }
            .tarjetaDark()
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Editar perfil para oportunidades")
    }

    private var privacidad: some View {
        HStack(alignment: .top, spacing: Espacio.md) {
            Image(systemName: "lock.shield")
                .foregroundStyle(Color.ppMarca)
                .frame(width: 22)

            VStack(alignment: .leading, spacing: 5) {
                Text("Tu información sigue siendo tuya")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.white)
                Text("Cerrar sesión solo elimina el acceso de este dispositivo. No borra tu perfil ni tus experiencias.")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoSecundario)
                    .lineSpacing(2)
            }
        }
        .padding(Espacio.lg)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.ppMarcaSuave, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var cerrarSesion: some View {
        Button {
            confirmarCierre = true
        } label: {
            Label("Cerrar sesión", systemImage:"")
                .font(.callout)
                .fontWeight(.bold)
                .foregroundStyle(Color.ppPeligro)
                .padding(.vertical, 15)
                .frame(maxWidth: .infinity)
                .background(Color.ppPeligroSuave, in: Capsule())
                .overlay(Capsule().stroke(Color.ppPeligro.opacity(0.38), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func fila(
        icono: String,
        titulo: String,
        detalle: String,
        destacado: Bool = false
    ) -> some View {
        HStack(spacing: Espacio.md) {
            Image(systemName: icono)
                .font(.caption)
                .foregroundStyle(destacado ? Color.ppMarca : Color.ppTextoSecundario)
                .frame(width: 34, height: 34)
                .background(
                    destacado ? Color.ppMarcaSuave : Color.white.opacity(0.045),
                    in: Circle()
                )

            Text(titulo)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.white)

            Spacer()

            Text(detalle)
                .font(.caption)
                .foregroundStyle(destacado ? Color.ppMarca : Color.ppTextoTerciario)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, Espacio.md)
    }

    private var iniciales: String {
        account.fullName
            .split(whereSeparator: \.isWhitespace)
            .prefix(2)
            .compactMap(\.first)
            .map(String.init)
            .joined()
            .uppercased()
    }
}
