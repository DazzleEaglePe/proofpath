import SwiftUI

/// Detalle de experiencia — 04-IOS-APP.md §2.3.
/// El botón "Ver en Arbiscan" es lo que cierra el círculo visualmente.
struct ExperienceDetailView: View {
    let experienceId: String

    @State private var viewModel: ExperienceDetailViewModel

    init(experienceId: String) {
        self.experienceId = experienceId
        _viewModel = State(wrappedValue: ExperienceDetailViewModel(experienceId: experienceId))
    }

    var body: some View {
        Group {
            switch viewModel.state {
            case .idle, .loading:
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            case let .loaded(detalle):
                contenido(detalle)
            case let .failed(error):
                ErrorView(error: error) { Task { await viewModel.load() } }
            }
        }
        .navigationTitle("Experiencia")
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load() }
    }

    private func contenido(_ d: ExperienceDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(d.programTitle).font(.title3).fontWeight(.bold)
                    Text(d.role).foregroundStyle(.secondary)
                    Text(d.organizationName).font(.subheadline).foregroundStyle(.secondary)
                    if let horas = d.hoursCommitted {
                        Text("\(horas) horas").font(.caption).foregroundStyle(.tertiary)
                    }
                }

                seccion(Strings.contribuciones) {
                    Text(d.contributions).font(.body)
                }

                if !d.evidences.isEmpty {
                    seccion(Strings.evidencias) {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(d.evidences) { ev in
                                if let url = URL(string: ev.url) {
                                    Link(destination: url) {
                                        HStack(spacing: 6) {
                                            Image(systemName: "link")
                                            Text(ev.label)
                                        }
                                        .font(.subheadline)
                                    }
                                }
                            }
                        }
                    }
                }

                if !d.skills.hard.isEmpty {
                    seccion(Strings.competenciasTecnicas) { chips(d.skills.hard) }
                }
                if !d.skills.human.isEmpty {
                    seccion(Strings.competenciasHumanas) { chips(d.skills.human) }
                }

                if let credencial = d.credential {
                    VStack(alignment: .leading, spacing: 12) {
                        VerifiedBadge(verificado: credencial.isVerified, grande: true)

                        if let txHash = credencial.txHash,
                           let url = URL(string: "https://sepolia.arbiscan.io/tx/\(txHash)") {
                            Link(destination: url) {
                                HStack(spacing: 6) {
                                    Image(systemName: "arrow.up.right.square")
                                    Text(Strings.verEnArbiscan)
                                }
                                .font(.subheadline)
                                .fontWeight(.semibold)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
        }
    }

    private func seccion<Contenido: View>(
        _ titulo: String,
        @ViewBuilder contenido: () -> Contenido
    ) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(titulo.uppercased())
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(.secondary)
            contenido()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func chips(_ nombres: [String]) -> some View {
        // Nombres sueltos, sin barras ni niveles. Ver 00-CONTEXT.md §2.1.
        VStack(alignment: .leading, spacing: 6) {
            ForEach(nombres, id: \.self) { nombre in
                Text(nombre)
                    .font(.subheadline)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(Color(.secondarySystemBackground)))
            }
        }
    }
}
