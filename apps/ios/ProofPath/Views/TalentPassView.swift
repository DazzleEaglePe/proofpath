import SwiftUI

/// La pantalla que se muestra al final del pitch (04-IOS-APP.md §2.2).
/// La que más cuidado merece.
struct TalentPassView: View {
    @State private var viewModel = TalentPassViewModel()

    var body: some View {
        NavigationStack {
            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                case let .loaded(datos):
                    contenido(datos)
                case let .failed(error):
                    ErrorView(error: error) {
                        Task { await viewModel.load() }
                    }
                }
            }
            .background(Color.ppBackground)
            .navigationTitle("Mi TalentPass")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(destination: NewExperienceView()) {
                        Image(systemName: "plus")
                    }
                    .accessibilityLabel(Strings.nuevaExperiencia)
                }
            }
        }
        // `.task` y no `.onAppear`: cancela solo al desaparecer la vista.
        .task { await viewModel.load() }
    }

    private func contenido(_ datos: TalentPassViewModel.Datos) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Espacio.xl) {
                encabezado(datos.pass)

                seccion(Strings.misExperiencias) {
                    if datos.experiencias.isEmpty {
                        EstadoVacio(icono: "tray", mensaje: Strings.sinExperiencias)
                            .tarjeta()
                    } else {
                        VStack(spacing: 0) {
                            ForEach(Array(datos.experiencias.enumerated()), id: \.element.id) { indice, exp in
                                NavigationLink(destination: ExperienceDetailView(experienceId: exp.id)) {
                                    HStack {
                                        ExperienceCard(experiencia: exp)
                                        Image(systemName: "chevron.right")
                                            .font(.footnote)
                                            .foregroundStyle(.tertiary)
                                    }
                                }
                                .buttonStyle(.plain)

                                if indice < datos.experiencias.count - 1 {
                                    Divider().padding(.vertical, Espacio.sm)
                                }
                            }
                        }
                        .tarjeta()
                    }
                }

                seccion(Strings.competencias) {
                    VStack(alignment: .leading, spacing: Espacio.lg) {
                        ForEach(datos.pass.skills) { skill in
                            SkillEvidenceRow(skill: skill)
                        }
                    }
                    .tarjeta()
                }

                Text(Strings.lemaCierre)
                    .font(.footnote)
                    .foregroundStyle(.tertiary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, Espacio.sm)
            }
            .padding(Espacio.lg)
        }
        .refreshable { await viewModel.load() }
    }

    private func encabezado(_ pass: TalentPassData) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            HStack(spacing: Espacio.md) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(Color.ppMarca)

                VStack(alignment: .leading, spacing: 2) {
                    Text(pass.fullName)
                        .font(.title3)
                        .fontWeight(.bold)
                    if let tokenId = pass.tokenId {
                        Text("TalentPass #\(tokenId)")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            VerifiedBadge(verificado: pass.isVerified, grande: true)
        }
        .tarjeta()
    }

    private func seccion<Contenido: View>(
        _ titulo: String,
        @ViewBuilder contenido: () -> Contenido
    ) -> some View {
        VStack(alignment: .leading, spacing: Espacio.sm) {
            Text(titulo).tituloDeSeccion()
            contenido()
        }
    }
}
