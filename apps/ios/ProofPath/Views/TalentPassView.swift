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
        List {
            Section {
                encabezado(datos.pass)
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
            }

            Section(Strings.misExperiencias) {
                if datos.experiencias.isEmpty {
                    Text(Strings.sinExperiencias)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                ForEach(datos.experiencias) { exp in
                    NavigationLink(destination: ExperienceDetailView(experienceId: exp.id)) {
                        ExperienceCard(experiencia: exp)
                    }
                    .listRowInsets(EdgeInsets(top: 6, leading: 16, bottom: 6, trailing: 16))
                }
            }

            Section(Strings.competencias) {
                ForEach(datos.pass.skills) { skill in
                    SkillEvidenceRow(skill: skill)
                        .padding(.vertical, 4)
                }
            }
        }
        .listStyle(.insetGrouped)
        .refreshable { await viewModel.load() }
    }

    private func encabezado(_ pass: TalentPassData) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 12) {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 44))
                    .foregroundStyle(.tint)

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
                .padding(.top, 2)
        }
    }
}
