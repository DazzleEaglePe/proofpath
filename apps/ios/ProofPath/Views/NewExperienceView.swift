import SwiftUI

struct NewExperienceView: View {
    @State private var viewModel = NewExperienceViewModel()
    @State private var selectorPresentado = false
    @Environment(\.dismiss) private var dismiss
    @FocusState private var campoActivo: Campo?

    private enum Campo { case rol, contribuciones, evidencia, etiqueta }

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
        .task {
            if case .idle = viewModel.programsState {
                await viewModel.loadPrograms()
            }
        }
        .sheet(isPresented: $selectorPresentado) {
            if case let .loaded(programs) = viewModel.programsState {
                ProgramSelectorView(programs: programs, selection: $viewModel.programId)
            }
        }
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
                    selectorDePrograma
                    campoTexto(
                        placeholder: "Menciona uno o más roles",
                        icono: "briefcase",
                        texto: $viewModel.role,
                        foco: .rol
                    )
                }

                grupo(titulo: "Tu contribución", icono: "text.alignleft") {
                    campoMultilinea(
                        placeholder: "Menciona tus contribuciones en la organización",
                        texto: $viewModel.contributions,
                        foco: .contribuciones
                    )

                    Text(Strings.ayudaContribuciones)
                        .font(.caption2)
                        .foregroundStyle(Color.ppTextoTerciario)
                        .padding(.horizontal, Espacio.xs)
                }

                grupo(titulo: "Evidencia", icono: "link") {
                    campoTexto(
                        placeholder: "Repo del proyecto",
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

    @ViewBuilder
    private var selectorDePrograma: some View {
        switch viewModel.programsState {
        case .idle, .loading:
            HStack(spacing: Espacio.md) {
                ProgressView().tint(Color.ppMarca)
                Text("Buscando programas disponibles…")
                    .font(.subheadline)
                    .foregroundStyle(Color.ppTextoSecundario)
                Spacer()
            }
            .padding(Espacio.lg)
            .frame(minHeight: 68)
            .background(Color.ppTarjetaOscura, in: RoundedRectangle(cornerRadius: 17))
            .overlay(RoundedRectangle(cornerRadius: 17).stroke(Color.ppBordeOscuro))

        case let .failed(error):
            VStack(alignment: .leading, spacing: Espacio.md) {
                HStack(alignment: .top, spacing: Espacio.sm) {
                    Image(systemName: "wifi.exclamationmark")
                        .foregroundStyle(Color.ppPeligro)
                    Text(error.message)
                        .font(.caption)
                        .foregroundStyle(Color.ppTextoSecundario)
                }

                Button("Volver a cargar") {
                    Task { await viewModel.loadPrograms() }
                }
                .font(.caption)
                .fontWeight(.bold)
                .foregroundStyle(Color.ppMarca)
            }
            .padding(Espacio.lg)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.ppTarjetaOscura, in: RoundedRectangle(cornerRadius: 17))
            .overlay(RoundedRectangle(cornerRadius: 17).stroke(Color.ppBordeOscuro))

        case let .loaded(programs):
            Button {
                selectorPresentado = true
            } label: {
                HStack(spacing: Espacio.md) {
                    Image(systemName: "building.2")
                        .font(.headline)
                        .foregroundStyle(Color.ppMarca)
                        .frame(width: 40, height: 40)
                        .background(Color.ppMarcaSuave, in: Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text(viewModel.selectedProgram?.title ?? "Selecciona un programa")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .lineLimit(2)

                        Text(
                            viewModel.selectedProgram?.organizationName
                                ?? (programs.isEmpty ? "No hay programas disponibles" : "Ver programas abiertos")
                        )
                        .font(.caption2)
                        .foregroundStyle(Color.ppTextoSecundario)
                        .lineLimit(1)
                    }

                    Spacer()

                    Image(systemName: "chevron.up.chevron.down")
                        .font(.caption)
                        .foregroundStyle(Color.ppTextoTerciario)
                }
                .padding(Espacio.md)
                .frame(minHeight: 68)
                .background(Color.ppTarjetaOscura, in: RoundedRectangle(cornerRadius: 17))
                .overlay {
                    RoundedRectangle(cornerRadius: 17)
                        .stroke(viewModel.programId.isEmpty ? Color.ppBordeOscuro : Color.ppMarca.opacity(0.55))
                }
            }
            .buttonStyle(.plain)
            .disabled(programs.isEmpty)
            .accessibilityLabel("Seleccionar programa")
            .accessibilityValue(viewModel.selectedProgram?.title ?? "Sin seleccionar")
        }
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
        let estaEnFoco = campoActivo == foco
        let etiquetaElevada = estaEnFoco || !texto.wrappedValue.isEmpty

        return ZStack(alignment: .leading) {
            HStack(spacing: Espacio.md) {
                Image(systemName: icono)
                    .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                    .frame(width: 18)

                TextField("", text: texto)
                    .focused($campoActivo, equals: foco)
                    .font(.subheadline)
                    .foregroundStyle(Color.white)
                    .tint(Color.ppMarca)
                    .keyboardType(teclado)
                    .textInputAutocapitalization(teclado == .URL ? .never : .sentences)
                    .autocorrectionDisabled(teclado == .URL)
                    .accessibilityLabel(placeholder)
            }
            .padding(.horizontal, Espacio.lg)
            .frame(minHeight: 60)

            Text(placeholder)
                .font(etiquetaElevada ? .caption2 : .subheadline)
                .fontWeight(etiquetaElevada ? .semibold : .regular)
                .foregroundStyle(estaEnFoco ? Color.ppMarca : Color.ppTextoTerciario)
                .lineLimit(1)
                .padding(.horizontal, etiquetaElevada ? 6 : 0)
                .background(etiquetaElevada ? Color.ppTarjetaOscura : Color.clear)
                .offset(x: 46, y: etiquetaElevada ? -30 : 0)
                .allowsHitTesting(false)
        }
        .background {
            RoundedRectangle(cornerRadius: 17)
                .fill(Color.ppTarjetaOscura)
                .overlay {
                    RoundedRectangle(cornerRadius: 17)
                        .stroke(estaEnFoco ? Color.ppMarca.opacity(0.68) : Color.ppBordeOscuro, lineWidth: estaEnFoco ? 1.25 : 1)
                }
        }
        .shadow(color: estaEnFoco ? Color.ppMarca.opacity(0.08) : .clear, radius: 12)
        .contentShape(RoundedRectangle(cornerRadius: 17))
        .onTapGesture { campoActivo = foco }
        .animation(.easeInOut(duration: 0.2), value: etiquetaElevada)
        .animation(.easeInOut(duration: 0.2), value: estaEnFoco)
    }

    private func campoMultilinea(
        placeholder: String,
        texto: Binding<String>,
        foco: Campo
    ) -> some View {
        let estaEnFoco = campoActivo == foco

        return ZStack(alignment: .topLeading) {
            TextEditor(text: texto)
                .focused($campoActivo, equals: foco)
                .font(.subheadline)
                .foregroundStyle(Color.white)
                .tint(Color.ppMarca)
                .scrollContentBackground(.hidden)
                .padding(.horizontal, Espacio.sm)
                .padding(.vertical, Espacio.sm)
                .frame(minHeight: 166)
                .accessibilityLabel(placeholder)

            if texto.wrappedValue.isEmpty {
                Text(placeholder)
                    .font(.subheadline)
                    .foregroundStyle(estaEnFoco ? Color.ppMarca.opacity(0.78) : Color.ppTextoTerciario)
                    .padding(.horizontal, Espacio.lg)
                    .padding(.top, Espacio.lg)
                    .allowsHitTesting(false)
                    .transition(.opacity)
            }
        }
        .background {
            RoundedRectangle(cornerRadius: 17)
                .fill(Color.ppTarjetaOscura)
                .overlay {
                    RoundedRectangle(cornerRadius: 17)
                        .stroke(estaEnFoco ? Color.ppMarca.opacity(0.68) : Color.ppBordeOscuro, lineWidth: estaEnFoco ? 1.25 : 1)
                }
        }
        .shadow(color: estaEnFoco ? Color.ppMarca.opacity(0.08) : .clear, radius: 12)
        .contentShape(RoundedRectangle(cornerRadius: 17))
        .onTapGesture { campoActivo = foco }
        .animation(.easeInOut(duration: 0.16), value: texto.wrappedValue.isEmpty)
        .animation(.easeInOut(duration: 0.2), value: estaEnFoco)
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
