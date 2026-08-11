import SwiftUI

struct OnboardingView: View {
    @State private var viewModel: OnboardingViewModel
    @State private var pasoActual = 0
    @State private var mostrarLogin = false
    @State private var mostrarVerificacion = false
    @State private var mostrarContrasena = false
    @FocusState private var campoActivo: Campo?

    private enum Campo { case nombres, apellidos, correo, contrasena }

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
        .fullScreenCover(isPresented: $mostrarLogin) {
            TalentLoginView()
        }
        .fullScreenCover(isPresented: $mostrarVerificacion) {
            TalentEmailVerificationView(viewModel: viewModel)
        }
        .onChange(of: viewModel.challenge?.challengeId) { _, challengeId in
            if challengeId != nil { mostrarVerificacion = true }
        }
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

            VStack(spacing: Espacio.sm) {
                campoFormulario(
                    etiqueta: "Nombres",
                    icono: "person",
                    texto: $viewModel.givenNames,
                    campo: .nombres,
                    contenido: .givenName,
                    capitalizacion: .words,
                    submitLabel: .next
                ) {
                    campoActivo = .apellidos
                }

                campoFormulario(
                    etiqueta: "Apellidos",
                    icono: "person.text.rectangle",
                    texto: $viewModel.familyNames,
                    campo: .apellidos,
                    contenido: .familyName,
                    capitalizacion: .words,
                    submitLabel: .next
                ) {
                    campoActivo = .correo
                }

                campoFormulario(
                    etiqueta: "Correo electrónico",
                    icono: "envelope",
                    texto: $viewModel.email,
                    campo: .correo,
                    contenido: .emailAddress,
                    capitalizacion: .never,
                    teclado: .emailAddress,
                    submitLabel: .next,
                    desactivarAutocorreccion: true
                ) {
                    campoActivo = .contrasena
                }

                campoFormulario(
                    etiqueta: "Contraseña",
                    icono: "lock",
                    texto: $viewModel.password,
                    campo: .contrasena,
                    contenido: .newPassword,
                    capitalizacion: .never,
                    submitLabel: .go,
                    desactivarAutocorreccion: true,
                    esSeguro: true,
                    mostrarTextoSeguro: $mostrarContrasena
                ) {
                    Task { await viewModel.registrar() }
                }

                Text("Usa al menos 12 caracteres.")
                    .font(.caption2)
                    .foregroundStyle(Color.ppTextoTerciario)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.leading, 2)
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
                    Task { await viewModel.registrar() }
                }
            } label: {
                HStack(spacing: Espacio.sm) {
                    if esCargando {
                        ProgressView().tint(Color.ppFondoOscuro)
                        Text("Enviando código…")
                    } else {
                        Text(pasoActual < 2 ? "Continuar" : "Crear mi TalentPass")
                    }
                }
            }
            .buttonStyle(.blancoOvalado)
            .disabled(pasoActual == 2 && (!viewModel.puedeEnviar || esCargando))

            if pasoActual == 2 {
                HStack(spacing: 4) {
                    Text("¿Ya tienes una cuenta de TalentPass?")
                        .foregroundStyle(Color.ppTextoTerciario)
                    Button("Inicia sesión") {
                        campoActivo = nil
                        mostrarLogin = true
                    }
                    .fontWeight(.bold)
                    .foregroundStyle(Color.ppMarca)
                }
                .font(.caption2)
            }
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

    private func campoFormulario(
        etiqueta: String,
        icono: String,
        texto: Binding<String>,
        campo: Campo,
        contenido: UITextContentType?,
        capitalizacion: TextInputAutocapitalization,
        teclado: UIKeyboardType = .default,
        submitLabel: SubmitLabel,
        desactivarAutocorreccion: Bool = false,
        esSeguro: Bool = false,
        mostrarTextoSeguro: Binding<Bool> = .constant(false),
        alEnviar: @escaping () -> Void
    ) -> some View {
        let estaEnFoco = campoActivo == campo
        let etiquetaElevada = estaEnFoco || !texto.wrappedValue.isEmpty

        return ZStack(alignment: .leading) {
            HStack(spacing: Espacio.md) {
                Image(systemName: icono)
                    .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                    .frame(width: 18)

                Group {
                    if esSeguro && !mostrarTextoSeguro.wrappedValue {
                        SecureField("", text: texto)
                    } else {
                        TextField("", text: texto)
                    }
                }
                .focused($campoActivo, equals: campo)
                .font(.body)
                .foregroundStyle(Color.white)
                .tint(Color.ppMarca)
                .textContentType(contenido)
                .textInputAutocapitalization(capitalizacion)
                .keyboardType(teclado)
                .autocorrectionDisabled(desactivarAutocorreccion)
                .submitLabel(submitLabel)
                .onSubmit(alEnviar)
                .accessibilityLabel(etiqueta)

                if esSeguro {
                    Button {
                        mostrarTextoSeguro.wrappedValue.toggle()
                    } label: {
                        Image(systemName: mostrarTextoSeguro.wrappedValue ? "eye.slash" : "eye")
                            .foregroundStyle(Color.ppTextoTerciario)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(mostrarTextoSeguro.wrappedValue ? "Ocultar contraseña" : "Mostrar contraseña")
                }
            }
            .padding(.horizontal, Espacio.lg)
            .frame(minHeight: 64)

            Text(etiqueta)
                .font(etiquetaElevada ? .caption2 : .body)
                .fontWeight(etiquetaElevada ? .semibold : .regular)
                .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                .padding(.horizontal, etiquetaElevada ? 7 : 0)
                .background(etiquetaElevada ? Color.ppTarjetaOscura : Color.clear)
                .offset(x: 54, y: etiquetaElevada ? -32 : 0)
                .allowsHitTesting(false)
        }
        .background {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(Color.ppTarjetaOscura)
                .overlay {
                    RoundedRectangle(cornerRadius: 17, style: .continuous)
                        .stroke(
                            estaEnFoco ? Color.ppMarca.opacity(0.82) : Color.ppBordeOscuro,
                            lineWidth: estaEnFoco ? 1.25 : 1
                        )
                }
        }
        .shadow(color: estaEnFoco ? Color.ppMarca.opacity(0.1) : .clear, radius: 12)
        .contentShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .onTapGesture { campoActivo = campo }
        .animation(.easeOut(duration: 0.18), value: etiquetaElevada)
        .animation(.easeOut(duration: 0.18), value: estaEnFoco)
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}

private struct TalentEmailVerificationView: View {
    @Environment(\.dismiss) private var dismiss
    @Bindable var viewModel: OnboardingViewModel

    var body: some View {
        ZStack {
            FondoAutenticacion()

            VStack(spacing: 0) {
                EncabezadoAutenticacion(accionCerrar: { dismiss() })

                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        etiquetaSuperior("ÚLTIMO PASO")

                        Group {
                            Text("Verifica tu ").foregroundStyle(.white)
                            + Text("correo.").foregroundStyle(Color.ppMarca)
                        }
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .tracking(-1.6)
                        .padding(.top, Espacio.md)

                        Text("Escribe el código de 6 dígitos que enviamos a \(viewModel.email). Así protegemos tu TalentPass desde el inicio.")
                            .font(.subheadline)
                            .foregroundStyle(Color.ppTextoSecundario)
                            .lineSpacing(3)
                            .padding(.top, Espacio.lg)

                        CampoAccesoFlotante(
                            etiqueta: "Código de verificación",
                            icono: "number.square",
                            texto: $viewModel.verificationCode,
                            contenido: .oneTimeCode,
                            teclado: .numberPad
                        )
                        .padding(.top, Espacio.xxl)
                        .onChange(of: viewModel.verificationCode) { _, value in
                            viewModel.verificationCode = String(value.filter(\.isNumber).prefix(6))
                        }

                        if let codigo = viewModel.challenge?.developmentCode {
                            codigoDesarrollo(codigo)
                        }

                        if case let .failed(error) = viewModel.state {
                            mensajeError(error.message)
                        }

                        if case let .failed(error) = viewModel.verificationState {
                            mensajeError(error.message)
                        }

                        Button {
                            Task { await viewModel.verificarCorreo() }
                        } label: {
                            HStack(spacing: Espacio.sm) {
                                if estaVerificando { ProgressView().tint(Color.ppFondoOscuro) }
                                Text(estaVerificando ? "Verificando…" : "Verificar y crear TalentPass")
                            }
                        }
                        .buttonStyle(.principal)
                        .disabled(viewModel.verificationCode.count != 6 || estaVerificando)
                        .padding(.top, Espacio.xl)

                        Button("Reenviar código") {
                            Task { await viewModel.registrar() }
                        }
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(Color.ppMarca)
                        .frame(maxWidth: .infinity)
                        .padding(.top, Espacio.lg)

                    }
                    .padding(.horizontal, Espacio.xl)
                    .padding(.bottom, Espacio.xxl)
                }
                .scrollIndicators(.hidden)
            }
        }
    }

    private var estaVerificando: Bool {
        if case .loading = viewModel.verificationState { return true }
        return false
    }
}

private struct TalentLoginView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = TalentLoginViewModel()
    @State private var modo: Modo = .login
    @State private var mostrarContrasena = false
    @State private var mostrarNuevaContrasena = false

    private enum Modo { case login, recuperar, codigo, actualizada }

    var body: some View {
        ZStack {
            FondoAutenticacion()

            VStack(spacing: 0) {
                EncabezadoAutenticacion(accionCerrar: { dismiss() })

                ScrollView {
                    Group {
                        switch modo {
                        case .login: contenidoLogin
                        case .recuperar: contenidoRecuperacion
                        case .codigo: contenidoCodigo
                        case .actualizada: contenidoActualizado
                        }
                    }
                    .id(modo)
                    .transition(.move(edge: .trailing).combined(with: .opacity))
                    .padding(.horizontal, Espacio.xl)
                    .padding(.bottom, Espacio.xxl)
                }
                .scrollIndicators(.hidden)
            }
        }
        .animation(.easeInOut(duration: 0.26), value: modo)
    }

    private var contenidoLogin: some View {
        VStack(alignment: .leading, spacing: 0) {

            Group {
                Text("Vuelve a tu ").foregroundStyle(.white)
                + Text("TalentPass.").foregroundStyle(Color.ppMarca)
            }
            .font(.system(size: 42, weight: .bold, design: .rounded))
            .tracking(-1.6)
            .padding(.top, Espacio.md)

            Text("Ingresa con tu correo y contraseña para continuar donde lo dejaste.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
                .padding(.top, Espacio.lg)

            VStack(spacing: Espacio.md) {
                CampoAccesoFlotante(
                    etiqueta: "Correo electrónico",
                    icono: "envelope",
                    texto: $viewModel.email,
                    contenido: .emailAddress,
                    capitalizacion: .never,
                    teclado: .emailAddress
                )

                CampoAccesoFlotante(
                    etiqueta: "Contraseña",
                    icono: "lock",
                    texto: $viewModel.password,
                    contenido: .password,
                    capitalizacion: .never,
                    esSeguro: true,
                    mostrarTextoSeguro: $mostrarContrasena,
                    alEnviar: { Task { await viewModel.ingresar() } }
                )
            }
            .padding(.top, Espacio.xxl)

            HStack {
                Spacer()
                Button("¿Olvidaste tu contraseña?") { modo = .recuperar }
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.ppMarca)
            }
            .padding(.top, Espacio.md)

            if case let .failed(error) = viewModel.loginState {
                mensajeError(error.message)
            }

            Button {
                Task { await viewModel.ingresar() }
            } label: {
                HStack(spacing: Espacio.sm) {
                    if estaIngresando { ProgressView().tint(Color.ppFondoOscuro) }
                    Text(estaIngresando ? "Ingresando…" : "Iniciar sesión")
                    if !estaIngresando { Image(systemName: "") }
                }
            }
            .buttonStyle(.principal)
            .disabled(!viewModel.puedeIngresar || estaIngresando)
            .padding(.top, Espacio.xl)

            HStack(spacing: 4) {
                Text("¿Aún no tienes un TalentPass?")
                    .foregroundStyle(Color.ppTextoTerciario)
                Button("Crear cuenta") { dismiss() }
                    .fontWeight(.bold)
                    .foregroundStyle(Color.ppMarca)
            }
            .font(.caption)
            .frame(maxWidth: .infinity)
            .padding(.top, Espacio.lg)

            //notaPrivacidad
        }
    }

    private var contenidoRecuperacion: some View {
        VStack(alignment: .leading, spacing: 0) {
            etiquetaSuperior("RECUPERAR ACCESO")

            Group {
                Text("Recupera tu ").foregroundStyle(.white)
                + Text("cuenta.").foregroundStyle(Color.ppMarca)
            }
            .font(.system(size: 42, weight: .bold, design: .rounded))
            .tracking(-1.6)
            .padding(.top, Espacio.md)

            Text("Te enviaremos un código temporal. Por seguridad, siempre mostraremos la misma confirmación aunque el correo no esté registrado.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
                .padding(.top, Espacio.lg)

            CampoAccesoFlotante(
                etiqueta: "Correo electrónico",
                icono: "envelope",
                texto: $viewModel.email,
                contenido: .emailAddress,
                capitalizacion: .never,
                teclado: .emailAddress,
                alEnviar: solicitarRecuperacion
            )
            .padding(.top, Espacio.xxl)

            if case let .failed(error) = viewModel.recoveryRequestState {
                mensajeError(error.message)
            }

            Button(action: solicitarRecuperacion) {
                HStack(spacing: Espacio.sm) {
                    if estaSolicitandoCodigo { ProgressView().tint(Color.ppFondoOscuro) }
                    Text(estaSolicitandoCodigo ? "Enviando código…" : "Continuar")
                }
            }
            .buttonStyle(.principal)
            .disabled(!viewModel.puedeRecuperar || estaSolicitandoCodigo)
            .padding(.top, Espacio.xl)

            botonVolver
            //notaPrivacidad
        }
    }

    private var contenidoCodigo: some View {
        VStack(alignment: .leading, spacing: 0) {
            etiquetaSuperior("NUEVA CONTRASEÑA")

            Group {
                Text("Crea un nuevo ").foregroundStyle(.white)
                + Text("acceso.").foregroundStyle(Color.ppMarca)
            }
            .font(.system(size: 42, weight: .bold, design: .rounded))
            .tracking(-1.6)
            .padding(.top, Espacio.md)

            Text("Ingresa el código de 6 dígitos y elige una contraseña de al menos 12 caracteres.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
                .padding(.top, Espacio.lg)

            VStack(spacing: Espacio.md) {
                CampoAccesoFlotante(
                    etiqueta: "Código de recuperación",
                    icono: "number.square",
                    texto: $viewModel.code,
                    contenido: .oneTimeCode,
                    teclado: .numberPad
                )
                .onChange(of: viewModel.code) { _, value in
                    viewModel.code = String(value.filter(\.isNumber).prefix(6))
                }

                CampoAccesoFlotante(
                    etiqueta: "Nueva contraseña",
                    icono: "lock.rotation",
                    texto: $viewModel.newPassword,
                    contenido: .newPassword,
                    capitalizacion: .never,
                    esSeguro: true,
                    mostrarTextoSeguro: $mostrarNuevaContrasena,
                    alEnviar: restablecer
                )
            }
            .padding(.top, Espacio.xxl)

            if let codigo = viewModel.recoveryChallenge?.developmentCode {
                codigoDesarrollo(codigo)
            }

            if case let .failed(error) = viewModel.resetState {
                mensajeError(error.message)
            }

            if case let .failed(error) = viewModel.recoveryRequestState {
                mensajeError(error.message)
            }

            Button(action: restablecer) {
                HStack(spacing: Espacio.sm) {
                    if estaRestableciendo { ProgressView().tint(Color.ppFondoOscuro) }
                    Text(estaRestableciendo ? "Actualizando…" : "Guardar nueva contraseña")
                }
            }
            .buttonStyle(.principal)
            .disabled(!viewModel.puedeRestablecer || estaRestableciendo)
            .padding(.top, Espacio.xl)

            Button("Reenviar código") { solicitarRecuperacion() }
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(Color.ppMarca)
                .frame(maxWidth: .infinity)
                .padding(.top, Espacio.lg)

            botonVolver
        }
    }

    private var contenidoActualizado: some View {
        VStack(alignment: .leading, spacing: 0) {
            etiquetaSuperior("ACCESO RECUPERADO")

            Image(systemName: "checkmark.shield.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.ppMarca)
                .padding(.top, Espacio.xxl)

            Text("Tu contraseña está lista.")
                .font(.system(size: 38, weight: .bold, design: .rounded))
                .tracking(-1.4)
                .foregroundStyle(.white)
                .padding(.top, Espacio.lg)

            Text(viewModel.resetState.value?.message ?? "Ya puedes volver a tu TalentPass.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
                .padding(.top, Espacio.md)

            Button("Volver a iniciar sesión") {
                viewModel.prepararLoginDespuesDeRecuperar()
                modo = .login
            }
            .buttonStyle(.principal)
            .padding(.top, Espacio.xxl)
        }
    }

    private var botonVolver: some View {
        Button {
            modo = .login
        } label: {
            Label("Volver a iniciar sesión", systemImage: "arrow.left")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(Color.ppTextoSecundario)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, Espacio.lg)
    }

    private func solicitarRecuperacion() {
        Task {
            await viewModel.solicitarRecuperacion()
            if viewModel.recoveryChallenge != nil { modo = .codigo }
        }
    }

    private func restablecer() {
        Task {
            await viewModel.restablecerContrasena()
            if viewModel.resetState.value != nil { modo = .actualizada }
        }
    }

    private var estaIngresando: Bool {
        if case .loading = viewModel.loginState { return true }
        return false
    }

    private var estaSolicitandoCodigo: Bool {
        if case .loading = viewModel.recoveryRequestState { return true }
        return false
    }

    private var estaRestableciendo: Bool {
        if case .loading = viewModel.resetState { return true }
        return false
    }
}

private struct CampoAccesoFlotante: View {
    let etiqueta: String
    let icono: String
    @Binding var texto: String
    let contenido: UITextContentType?
    let capitalizacion: TextInputAutocapitalization
    let teclado: UIKeyboardType
    let esSeguro: Bool
    @Binding var mostrarTextoSeguro: Bool
    let alEnviar: () -> Void

    @FocusState private var estaEnFoco: Bool

    init(
        etiqueta: String,
        icono: String,
        texto: Binding<String>,
        contenido: UITextContentType? = nil,
        capitalizacion: TextInputAutocapitalization = .never,
        teclado: UIKeyboardType = .default,
        esSeguro: Bool = false,
        mostrarTextoSeguro: Binding<Bool> = .constant(false),
        alEnviar: @escaping () -> Void = {}
    ) {
        self.etiqueta = etiqueta
        self.icono = icono
        _texto = texto
        self.contenido = contenido
        self.capitalizacion = capitalizacion
        self.teclado = teclado
        self.esSeguro = esSeguro
        _mostrarTextoSeguro = mostrarTextoSeguro
        self.alEnviar = alEnviar
    }

    var body: some View {
        let etiquetaElevada = estaEnFoco || !texto.isEmpty

        ZStack(alignment: .leading) {
            HStack(spacing: Espacio.md) {
                Image(systemName: icono)
                    .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                    .frame(width: 18)

                Group {
                    if esSeguro && !mostrarTextoSeguro {
                        SecureField("", text: $texto)
                    } else {
                        TextField("", text: $texto)
                    }
                }
                .focused($estaEnFoco)
                .font(.body)
                .foregroundStyle(Color.white)
                .tint(Color.ppMarca)
                .textContentType(contenido)
                .textInputAutocapitalization(capitalizacion)
                .keyboardType(teclado)
                .autocorrectionDisabled()
                .submitLabel(.go)
                .onSubmit(alEnviar)
                .accessibilityLabel(etiqueta)

                if esSeguro {
                    Button { mostrarTextoSeguro.toggle() } label: {
                        Image(systemName: mostrarTextoSeguro ? "eye.slash" : "eye")
                            .foregroundStyle(Color.ppTextoTerciario)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(mostrarTextoSeguro ? "Ocultar contraseña" : "Mostrar contraseña")
                }
            }
            .padding(.horizontal, Espacio.lg)
            .frame(minHeight: 64)

            Text(etiqueta)
                .font(etiquetaElevada ? .caption2 : .body)
                .fontWeight(etiquetaElevada ? .semibold : .regular)
                .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                .padding(.horizontal, etiquetaElevada ? 7 : 0)
                .background(etiquetaElevada ? Color.ppTarjetaOscura : Color.clear)
                .offset(x: 54, y: etiquetaElevada ? -32 : 0)
                .allowsHitTesting(false)
        }
        .background {
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(Color.ppTarjetaOscura)
                .overlay {
                    RoundedRectangle(cornerRadius: 17, style: .continuous)
                        .stroke(
                            estaEnFoco ? Color.ppMarca.opacity(0.82) : Color.ppBordeOscuro,
                            lineWidth: estaEnFoco ? 1.25 : 1
                        )
                }
        }
        .shadow(color: estaEnFoco ? Color.ppMarca.opacity(0.1) : .clear, radius: 12)
        .contentShape(RoundedRectangle(cornerRadius: 17, style: .continuous))
        .onTapGesture { estaEnFoco = true }
        .animation(.easeOut(duration: 0.18), value: etiquetaElevada)
        .animation(.easeOut(duration: 0.18), value: estaEnFoco)
    }
}

private struct EncabezadoAutenticacion: View {
    let accionCerrar: () -> Void

    var body: some View {
        HStack {
            MarcaProofPath()
            Spacer()
            Button(action: accionCerrar) {
                Image(systemName: "xmark")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(Color.white.opacity(0.07), in: Circle())
                    .overlay(Circle().stroke(Color.white.opacity(0.1), lineWidth: 1))
            }
            .accessibilityLabel("Cerrar")
        }
        .padding(.horizontal, Espacio.xl)
        .padding(.top, Espacio.md)
    }
}

private struct MarcaProofPath: View {
    var body: some View {
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
    }
}

private struct FondoAutenticacion: View {
    var body: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()

            Circle()
                .fill(Color.ppMarca.opacity(0.14))
                .frame(width: 390, height: 390)
                .blur(radius: 90)
                .offset(x: 175, y: -315)

            GeometryReader { proxy in
                Path { path in
                    stride(from: 0, through: proxy.size.width, by: 48).forEach { x in
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: proxy.size.height * 0.7))
                    }
                    stride(from: 0, through: proxy.size.height * 0.7, by: 48).forEach { y in
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: proxy.size.width, y: y))
                    }
                }
                .stroke(Color.white.opacity(0.028), lineWidth: 0.5)
                .mask(LinearGradient(colors: [.black, .clear], startPoint: .top, endPoint: .bottom))
            }
            .ignoresSafeArea()
        }
    }
}

private func etiquetaSuperior(_ texto: String) -> some View {
    Text(texto)
        .font(.caption2)
        .fontWeight(.black)
        .kerning(1.4)
        .foregroundStyle(Color.ppMarca)
        .padding(.top, Espacio.xxxl)
}

private func mensajeError(_ texto: String) -> some View {
    HStack(alignment: .top, spacing: Espacio.sm) {
        Image(systemName: "exclamationmark.triangle.fill")
        Text(texto)
    }
    .font(.caption)
    .foregroundStyle(Color.ppPeligro)
    .padding(.top, Espacio.md)
}

private func codigoDesarrollo(_ codigo: String) -> some View {
    HStack(spacing: Espacio.sm) {
        Image(systemName: "hammer.fill")
        Text("Código local: \(codigo)")
            .fontWeight(.bold)
    }
    .font(.caption)
    .foregroundStyle(Color.ppMarca)
    .padding(.horizontal, Espacio.md)
    .padding(.vertical, Espacio.sm)
    .background(Color.ppMarcaSuave, in: Capsule())
    .padding(.top, Espacio.md)
}
/*
private var notaPrivacidad: some View {
    HStack(spacing: Espacio.sm) {
        Image(systemName: "lock.shield")
            .foregroundStyle(Color.ppMarca)
        Text("Tu información personal permanece fuera de la cadena.")
            .foregroundStyle(Color.ppTextoTerciario)
    }
    .font(.caption2)
    .padding(Espacio.lg)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.ppMarcaSuave, in: RoundedRectangle(cornerRadius: 17, style: .continuous))
    .padding(.top, Espacio.xxl)
}
*/
