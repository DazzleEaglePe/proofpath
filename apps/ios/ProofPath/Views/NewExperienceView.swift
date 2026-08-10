import SwiftUI

/// Registrar experiencia — 04-IOS-APP.md §2.4.
///
/// **No hay pantalla de skills acá.** Las propone la IA y las confirma la ONG
/// desde web; el voluntario las ve ya confirmadas en su TalentPass.
struct NewExperienceView: View {
    @State private var viewModel = NewExperienceViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Form {
            if case let .loaded(creada) = viewModel.state {
                Section {
                    VStack(spacing: 10) {
                        Image(systemName: "paperplane.fill")
                            .font(.largeTitle)
                            .foregroundStyle(.tint)
                        Text(creada.message)
                            .font(.headline)
                            .multilineTextAlignment(.center)
                        Text("La organización va a revisarla y confirmar tus competencias.")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                        Button("Volver") { dismiss() }
                            .buttonStyle(.borderedProminent)
                            .padding(.top, 4)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                }
            } else {
                Section("Programa") {
                    TextField("ID del programa", text: $viewModel.programId)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                }

                Section(Strings.campoRol) {
                    TextField("Ej. Full Stack Developer", text: $viewModel.role)
                }

                Section {
                    TextEditor(text: $viewModel.contributions)
                        .frame(minHeight: 120)
                } header: {
                    Text(Strings.campoContribuciones)
                } footer: {
                    // El texto es el insumo de la IA: si es escueto, no hay nada
                    // que extraer.
                    Text(Strings.ayudaContribuciones)
                }

                Section(Strings.campoEvidencia) {
                    TextField("https://github.com/…", text: $viewModel.evidenceURL)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                    TextField("Cómo se llama", text: $viewModel.evidenceLabel)
                }

                Section("Inicio") {
                    DatePicker("Fecha de inicio", selection: $viewModel.startDate, displayedComponents: .date)
                }

                if case let .failed(error) = viewModel.state {
                    Section {
                        Text(error.message).font(.footnote).foregroundStyle(.red)
                    }
                }

                Section {
                    Button {
                        Task { await viewModel.enviar() }
                    } label: {
                        if esCargando {
                            HStack { ProgressView(); Text("Enviando…") }
                        } else {
                            Text(Strings.botonEnviar)
                        }
                    }
                    .disabled(!viewModel.puedeEnviar || esCargando)
                }
            }
        }
        .navigationTitle(Strings.nuevaExperiencia)
        .navigationBarTitleDisplayMode(.inline)
    }

    private var esCargando: Bool {
        if case .loading = viewModel.state { return true }
        return false
    }
}
