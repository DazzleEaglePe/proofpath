import SwiftUI

/// Onboarding — 04-IOS-APP.md §2.1. Nombre, correo, y listo.
///
/// Detrás, el backend crea el perfil, genera la wallet embebida y acuña el
/// TalentPass. **El usuario no se entera de nada de eso.**
struct OnboardingView: View {
    @State private var viewModel: OnboardingViewModel
    @FocusState private var campoActivo: Campo?

    private enum Campo { case nombre, correo }

    init(alTerminar: @escaping () -> Void) {
        _viewModel = State(wrappedValue: OnboardingViewModel(alTerminar: alTerminar))
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Spacer()

            VStack(alignment: .leading, spacing: 8) {
                Text(Strings.onboardingTitulo)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                Text(Strings.onboardingSubtitulo)
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 12) {
                TextField(Strings.campoNombre, text: $viewModel.fullName)
                    .textContentType(.name)
                    .focused($campoActivo, equals: .nombre)
                    .submitLabel(.next)
                    .onSubmit { campoActivo = .correo }

                TextField(Strings.campoCorreo, text: $viewModel.email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .focused($campoActivo, equals: .correo)
                    .submitLabel(.go)
                    .onSubmit { Task { await viewModel.crear() } }
            }
            .textFieldStyle(.roundedBorder)

            if case let .failed(error) = viewModel.state {
                Text(error.message)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button {
                Task { await viewModel.crear() }
            } label: {
                if case .loading = viewModel.state {
                    HStack(spacing: 8) {
                        ProgressView().tint(.white)
                        // La única señal de que algo se está creando.
                        Text(Strings.creandoPass)
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    Text(Strings.botonCrear).frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .disabled(!viewModel.puedeEnviar || esCargando)

            Spacer()

            // La línea de adopción más fuerte del proyecto, dicha sin jerga.
            Text("Sin instalar nada más. Sin comprar cripto.")
                .font(.footnote)
                .foregroundStyle(.tertiary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(24)
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
