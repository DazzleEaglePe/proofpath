import SwiftUI

struct NewExperienceView: View {
    @State private var viewModel = NewExperienceViewModel()
    @Environment(\.dismiss) private var dismiss
    @FocusState private var campoActivo: Campo?

    private enum Campo { case programa, rol, contribuciones, evidencia, etiqueta }

    var body: some View {
        ZStack {
            Color.ppBackground.ignoresSafeArea()

            if case let .loaded(creada) = viewModel.state {
                exito(creada)
            } else {
                formulario
            }
        }
        .navigationTitle(Strings.nuevaExperiencia)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.ppFondoOscuro, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    private var formulario: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Espacio.xl) {
                VStack(alignment: .leading, spacing: Espacio.sm) {
                    Text("Cuéntanos qué hiciste.")
                        .font(.system(size: 31, weight: .bold, design: .rounded))
                        .tracking(-1.1)
                        .foregroundStyle(.white)
                    Text("La organización revisará esta experiencia y confirmará las competencias respaldadas por tu evidencia.")
                        .font(.subheadline)
                        .foregroundStyle(Color.ppTextoSecundario)
                        .lineSpacing(3)
                }

                grupo(titulo: "Programa y rol", icono: "person.crop.rectangle") {
                    campoTexto(
                        placeholder: "Programa",
                        icono: "number",
                        texto: $viewModel.programId,
                        foco: .programa
                    )
                    campoTexto(
                        placeholder: "Ej. Software Engineer",
                        icono: "briefcase",
                        texto: $viewModel.role,
                        foco: .rol
                    )
                }

                grupo(titulo: "Tu contribución", icono: "text.alignleft") {
                    TextEditor(text: $viewModel.contributions)
                        .focused($campoActivo, equals: .contribuciones)
                        .font(.subheadline)
                        .foregroundStyle(.white)
                        .scrollContentBackground(.hidden)
                        .frame(minHeight: 150)
                        .padding(Espacio.md)
                        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 17))
                        .overlay(
                            RoundedRectangle(cornerRadius: 17)
                                .stroke(campoActivo == .contribuciones ? Color.ppMarca.opacity(0.55) : Color.ppBordeOscuro)
                        )
                    grupo(titulo: "Tus contribuciones", icono: "") {
                        campoTexto(placeholder: "Menciona tus contribuciones en la organizacion", icono: "", texto: $viewModel.role, foco: .rol)
                    }

                    Text(Strings.ayudaContribuciones)
                        .font(.caption2)
                        .foregroundStyle(Color.ppTextoTerciario)
                        .padding(.horizontal, Espacio.xs)
                }

                grupo(titulo: "Evidencia", icono: "link") {
                    campoTexto(
                        placeholder: "https://github.com/…",
                        icono: "link",
                        texto: $viewModel.evidenceURL,
                        foco: .evidencia,
                        teclado: .URL
                    )
                    campoTexto(
                        placeholder: "Nombre de la evidencia",
                        icono: "tag",
                        texto: $viewModel.evidenceLabel,
                        foco: .etiqueta
                    )
                }

                grupo(titulo: "Fecha de inicio", icono: "calendar") {
                    DatePicker(
                        "Fecha de inicio",
                        selection: $viewModel.startDate,
                        displayedComponents: .date
                    )
                    .font(.subheadline)
                    .foregroundStyle(.white)
                    .tint(Color.ppMarca)
                    .padding(Espacio.lg)
                    .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 17))
                    .overlay(RoundedRectangle(cornerRadius: 17).stroke(Color.ppBordeOscuro))
                }

                if case let .failed(error) = viewModel.state {
                    HStack(alignment: .top, spacing: Espacio.sm) {
                        Image(systemName: "exclamationmark.triangle.fill")
                        Text(error.message)
                    }
                    .font(.caption)
                    .foregroundStyle(Color.ppPeligro)
                    .padding(Espacio.lg)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.ppPeligroSuave, in: RoundedRectangle(cornerRadius: 17))
                }

                Button {
                    campoActivo = nil
                    Task { await viewModel.enviar() }
                } label: {
                    HStack(spacing: Espacio.sm) {
                        if esCargando {
                            ProgressView().tint(Color.ppFondoOscuro)
                            Text("Enviando experiencia…")
                        } else {
                            Text(Strings.botonEnviar)
                            Image(systemName: "arrow.right")
                        }
                    }
                }
                .buttonStyle(.principal)
                .disabled(!viewModel.puedeEnviar || esCargando)
            }
            .padding(Espacio.lg)
            .padding(.bottom, Espacio.xxl)
        }
        .scrollIndicators(.hidden)
    }

    private func exito(_ creada: CreatedExperience) -> some View {
        VStack(spacing: Espacio.xl) {
            ZStack {
                Circle()
                    .fill(Color.ppMarcaSuave)
                    .frame(width: 112, height: 112)
                Circle()
                    .stroke(Color.ppMarca.opacity(0.2), lineWidth: 1)
                    .frame(width: 142, height: 142)
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(Color.ppMarca)
            }

            VStack(spacing: Espacio.md) {
                Text("Experiencia enviada")
                    .font(.system(size: 29, weight: .bold, design: .rounded))
                    .tracking(-1)
                    .foregroundStyle(.white)
                Text(creada.message)
                    .font(.subheadline)
                    .foregroundStyle(Color.ppTextoSecundario)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                Text("La organización revisará la evidencia antes de confirmar tus competencias.")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoTerciario)
                    .multilineTextAlignment(.center)
            }

            Button("Volver a mi TalentPass") { dismiss() }
                .buttonStyle(.principal)
        }
        .padding(Espacio.xl)
    }

    private func grupo<Contenido: View>(
        titulo: String,
        icono: String,
        @ViewBuilder contenido: () -> Contenido
    ) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            HStack(spacing: Espacio.sm) {
                Image(systemName: icono)
                    .foregroundStyle(Color.ppMarca)
                Text(titulo)
            }
            .font(.caption)
            .fontWeight(.bold)
            .foregroundStyle(.white)

            VStack(spacing: Espacio.md) {
                contenido()
            }
        }
    }

    private func campoTexto(
        placeholder: String,
        icono: String,
        texto: Binding<String>,
        foco: Campo,
        teclado: UIKeyboardType = .default
    ) -> some View {
        HStack(spacing: Espacio.md) {
            Image(systemName: icono)
                .foregroundStyle(Color.ppTextoTerciario)
                .frame(width: 18)
            TextField(placeholder, text: texto)
                .focused($campoActivo, equals: foco)
                .font(.subheadline)
                .foregroundStyle(.white)
                .keyboardType(teclado)
                .textInputAutocapitalization(teclado == .URL ? .never : .sentences)
                .autocorrectionDisabled(teclado == .URL)
        }
        .padding(Espacio.lg)
        .background(Color.white.opacity(0.04), in: RoundedRectangle(cornerRadius: 17))
        .overlay(
            RoundedRectangle(cornerRadius: 17)
                .stroke(campoActivo == foco ? Color.ppMarca.opacity(0.55) : Color.ppBordeOscuro)
        )
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
