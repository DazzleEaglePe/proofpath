import SwiftUI

struct OnboardingView: View {
    @State private var viewModel: OnboardingViewModel
    @State private var pasoActual = 0
    @FocusState private var campoActivo: Campo?

    private enum Campo { case nombre, correo }

    init(alTerminar: @escaping () -> Void) {
        _viewModel = State(wrappedValue: OnboardingViewModel(alTerminar: alTerminar))
    }

    var body: some View {
        ZStack {
            fondo

            VStack(spacing: 0) {
                encabezado

                Group {
                    switch pasoActual {
                    case 0: primeraEscena
                    case 1: segundaEscena
                    default: formulario
                    }
                }
                .id(pasoActual)
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))

                pie
            }
        }
        .animation(.easeInOut(duration: 0.34), value: pasoActual)
    }

    private var fondo: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()

            Circle()
                .fill(Color.ppMarca.opacity(0.13))
                .frame(width: 360, height: 360)
                .blur(radius: 80)
                .offset(x: 160, y: -310)

            GeometryReader { proxy in
                Path { path in
                    stride(from: 0, through: proxy.size.width, by: 48).forEach { x in
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: proxy.size.height * 0.72))
                    }
                    stride(from: 0, through: proxy.size.height * 0.72, by: 48).forEach { y in
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: proxy.size.width, y: y))
                    }
                }
                .stroke(Color.white.opacity(0.028), lineWidth: 0.5)
                .mask(
                    LinearGradient(colors: [.black, .clear], startPoint: .top, endPoint: .bottom)
                )
            }
            .ignoresSafeArea()
        }
    }

    private var encabezado: some View {
        HStack {
            HStack(spacing: Espacio.sm) {
                ZStack {
                    Capsule()
                        .fill(Color.ppMarca)
                        .frame(width: 7, height: 27)
                        .rotationEffect(.degrees(45))
                    Capsule()
                        .fill(Color.ppFondoOscuro)
                        .frame(width: 7, height: 27)
                        .overlay(Capsule().stroke(Color.white.opacity(0.75), lineWidth: 1))
                        .rotationEffect(.degrees(-45))
                }
                .frame(width: 28, height: 30)
                Text("ProofPath")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }

            Spacer()

            if pasoActual < 2 {
                Button("Saltar") { pasoActual = 2 }
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.ppTextoSecundario)
            } else {
                Text("Paso 3 de 3")
                    .font(.caption2)
                    .foregroundStyle(Color.ppTextoTerciario)
            }
        }
        .padding(.horizontal, Espacio.xl)
        .padding(.top, Espacio.md)
    }

    private var primeraEscena: some View {
        VStack(spacing: 0) {
            Spacer(minLength: Espacio.xl)

            ZStack {
                RoundedRectangle(cornerRadius: 38, style: .continuous)
                    .fill(Color.ppTarjetaOscura)
                    .frame(width: 252, height: 340)
                    .overlay(
                        RoundedRectangle(cornerRadius: 38, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                    .rotationEffect(.degrees(5))
                    .offset(x: 10)

                VStack(alignment: .leading, spacing: Espacio.lg) {
                    HStack {
                        Text("TALENTPASS")
                            .font(.caption2)
                            .fontWeight(.black)
                            .kerning(1)
                        Spacer()
                        Image(systemName: "checkmark.seal.fill")
                    }

                    Spacer()

                    Text("Tu experiencia\nya cuenta.")
                        .font(.system(size: 31, weight: .bold, design: .rounded))
                        .tracking(-1.2)

                    HStack {
                        Text("#0001")
                        Spacer()
                        Text("VERIFICABLE ↗")
                    }
                    .font(.caption2)
                    .fontWeight(.bold)
                }
                .foregroundStyle(Color.ppFondoOscuro)
                .padding(Espacio.xl)
                .frame(width: 252, height: 340)
                .background(
                    RoundedRectangle(cornerRadius: 38, style: .continuous)
                        .fill(Color.ppMarca)
                )
                .rotationEffect(.degrees(-4))
                .shadow(color: Color.ppMarca.opacity(0.16), radius: 32, y: 18)

                HStack(spacing: Espacio.sm) {
                    Image(systemName: "link")
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Evidencia conectada")
                            .font(.caption2)
                            .foregroundStyle(Color.ppTextoTerciario)
                        Text("5 competencias")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundStyle(.white)
                    }
                }
                .padding(Espacio.md)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                .offset(x: -105, y: 125)
            }
            .frame(height: 405)

            textoEscena(
                titulo: "Lo que hiciste también es experiencia.",
                descripcion: "Convierte voluntariados y proyectos reales en evidencia profesional que puedes llevar contigo."
            )
        }
    }

    private var segundaEscena: some View {
        VStack(spacing: 0) {
            Spacer(minLength: Espacio.xl)

            ZStack {
                Circle()
                    .stroke(Color.ppMarca.opacity(0.18), lineWidth: 1)
                    .frame(width: 270, height: 270)
                Circle()
                    .stroke(Color.white.opacity(0.06), lineWidth: 1)
                    .frame(width: 190, height: 190)

                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 58))
                    .foregroundStyle(Color.ppMarca)
                    .frame(width: 128, height: 128)
                    .background(Color.ppMarcaSuave, in: Circle())
                    .overlay(Circle().stroke(Color.ppMarca.opacity(0.24), lineWidth: 1))

                sello(icono: "sparkles", texto: "IA propone")
                    .offset(x: -104, y: -84)
                sello(icono: "person.2.fill", texto: "ONG confirma")
                    .offset(x: 112, y: -38)
                sello(icono: "cube.transparent", texto: "Arbitrum ancla")
                    .offset(x: -64, y: 118)
            }
            .frame(height: 405)

            textoEscena(
                titulo: "Tecnología que respalda, personas que deciden.",
                descripcion: "La IA sugiere competencias. La organización las confirma. Nadie recibe puntajes ni etiquetas."
            )
        }
    }

    private var formulario: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text("Crea tu")
                    .foregroundStyle(.white)
                + Text(" TalentPass")
                    .foregroundStyle(Color.ppMarca)
                Text("en menos de un minuto.")
                    .foregroundStyle(.white)
            }
            .font(.system(size: 38, weight: .bold, design: .rounded))
            .tracking(-1.4)
            .padding(.top, Espacio.xxxl)
            .frame(maxWidth: .infinity, alignment: .leading)

            Text("Usaremos estos datos para crear tu perfil. Tu información personal no se publica en la cadena.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
                .padding(.top, Espacio.md)

            VStack(spacing: Espacio.md) {
                HStack(spacing: Espacio.md) {
                    Image(systemName: "person")
                        .foregroundStyle(Color.ppTextoTerciario)
                        .frame(width: 18)
                    TextField("Nombre completo", text: $viewModel.fullName)
                        .focused($campoActivo, equals: .nombre)
                        .textContentType(.name)
                        .submitLabel(.next)
                        .onSubmit { campoActivo = .correo }
                }
                .padding(Espacio.lg)
                .background(Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 17))
                .overlay(RoundedRectangle(cornerRadius: 17).stroke(campoActivo == .nombre ? Color.ppMarca.opacity(0.6) : Color.ppBordeOscuro))

                HStack(spacing: Espacio.md) {
                    Image(systemName: "envelope")
                        .foregroundStyle(Color.ppTextoTerciario)
                        .frame(width: 18)
                    TextField("Correo electrónico", text: $viewModel.email)
                        .focused($campoActivo, equals: .correo)
                        .textContentType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .submitLabel(.go)
                        .onSubmit { Task { await viewModel.crear() } }
                }
                .padding(Espacio.lg)
                .background(Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 17))
                .overlay(RoundedRectangle(cornerRadius: 17).stroke(campoActivo == .correo ? Color.ppMarca.opacity(0.6) : Color.ppBordeOscuro))
            }
            .padding(.top, Espacio.xl)

            if case let .failed(error) = viewModel.state {
                HStack(alignment: .top, spacing: Espacio.sm) {
                    Image(systemName: "exclamationmark.triangle.fill")
                    Text(error.message)
                }
                .font(.caption)
                .foregroundStyle(Color.ppPeligro)
                .padding(.top, Espacio.md)
            }
        }
        .scrollIndicators(.hidden)
        .padding(.horizontal, Espacio.xl)
    }

    private var pie: some View {
        VStack(spacing: Espacio.lg) {
            HStack(spacing: 6) {
                ForEach(0..<3) { indice in
                    Capsule()
                        .fill(indice == pasoActual ? Color.ppMarca : Color.white.opacity(0.15))
                        .frame(width: indice == pasoActual ? 24 : 6, height: 6)
                }
            }

            Button {
                campoActivo = nil
                if pasoActual < 2 {
                    pasoActual += 1
                } else {
                    Task { await viewModel.crear() }
                }
            } label: {
                HStack(spacing: Espacio.sm) {
                    if esCargando {
                        ProgressView().tint(Color.ppFondoOscuro)
                        Text("Creando tu TalentPass…")
                    } else {
                        Text(pasoActual < 2 ? "Continuar" : "Crear mi TalentPass")
                        Image(systemName: "arrow.right")
                    }
                }
            }
            .buttonStyle(.blancoOvalado)
            .disabled(pasoActual == 2 && (!viewModel.puedeEnviar || esCargando))

            Text("Privacidad por diseño · Anclado en Arbitrum")
                .font(.caption2)
                .foregroundStyle(Color.ppTextoTerciario)
        }
        .padding(.horizontal, Espacio.xl)
        .padding(.top, Espacio.lg)
        .padding(.bottom, Espacio.xl)
        .background(
            LinearGradient(
                colors: [Color.ppFondoOscuro.opacity(0), Color.ppFondoOscuro],
                startPoint: .top,
                endPoint: .center
            )
        )
    }

    private func textoEscena(titulo: String, descripcion: String) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            Text(titulo)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .tracking(-1)
                .foregroundStyle(.white)
            Text(descripcion)
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, Espacio.xl)
    }

    private func sello(icono: String, texto: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icono)
                .foregroundStyle(Color.ppMarca)
            Text(texto)
                .fontWeight(.semibold)
        }
        .font(.caption2)
        .foregroundStyle(.white)
        .padding(.horizontal, Espacio.md)
        .padding(.vertical, 9)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
