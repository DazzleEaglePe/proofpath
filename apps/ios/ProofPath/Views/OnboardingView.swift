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
        VStack(alignment: .leading, spacing: Espacio.xl) {
            Spacer()

            VStack(alignment: .leading, spacing: Espacio.sm) {
                Text(Strings.onboardingTitulo)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                Text(Strings.onboardingSubtitulo)
                    .font(.body)
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: Espacio.md) {
                campo(Strings.campoNombre, texto: $viewModel.fullName, tipo: .nombre)
                    .textContentType(.name)
                    .submitLabel(.next)
                    .onSubmit { campoActivo = .correo }

                campo(Strings.campoCorreo, texto: $viewModel.email, tipo: .correo)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.go)
                    .onSubmit { Task { await viewModel.crear() } }
            }

            if case let .failed(error) = viewModel.state {
                Label(error.message, systemImage: "exclamationmark.circle")
                    .font(.footnote)
                    .foregroundStyle(Color.ppPeligro)
            }

            Button {
                Task { await viewModel.crear() }
            } label: {
                if esCargando {
                    HStack(spacing: Espacio.sm) {
                        ProgressView().tint(.white)
                        // La única señal de que algo se está creando.
                        Text(Strings.creandoPass)
                    }
                } else {
                    Text(Strings.botonCrear)
                }
            }
            .buttonStyle(.principal)
            .disabled(!viewModel.puedeEnviar || esCargando)

            Spacer()

            // La línea de adopción más fuerte del proyecto, dicha sin jerga.
            Text("Sin instalar nada más. Sin comprar cripto.")
                .font(.footnote)
                .foregroundStyle(.tertiary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding(Espacio.xl)
        .background(Color.ppBackground)
    }

    private func campo(_ titulo: String, texto: Binding<String>, tipo: Campo) -> some View {
        TextField(titulo, text: texto)
            .focused($campoActivo, equals: tipo)
            .padding(.horizontal, Espacio.lg)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: Radio.boton, style: .continuous)
                    .fill(Color.ppCard)
            )
            .overlay(
                RoundedRectangle(cornerRadius: Radio.boton, style: .continuous)
                    .stroke(campoActivo == tipo ? Color.ppMarca : Color.ppBorde, lineWidth: 1)
            )
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
