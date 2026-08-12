import SwiftUI

struct ExperiencesView: View {
    @State private var viewModel = ExperiencesViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                fondo

                Group {
                    switch viewModel.state {
                    case .idle, .loading:
                        cargando
                    case .failed(let error):
                        ErrorView(error: error) {
                            Task { await viewModel.load() }
                        }
                    case .loaded:
                        contenido
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await viewModel.load() }
    }

    private var fondo: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()
            Circle()
                .fill(Color.ppMarca.opacity(0.08))
                .frame(width: 300, height: 300)
                .blur(radius: 90)
                .offset(x: 180, y: -350)
        }
    }

    private var cargando: some View {
        VStack(spacing: Espacio.md) {
            ProgressView().tint(Color.ppMarca)
            Text("Cargando tus experiencias…")
                .font(.caption)
                .foregroundStyle(Color.ppTextoTerciario)
        }
    }

    private var contenido: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Espacio.xl) {
                encabezado
                filtros

                if viewModel.filteredExperiences.isEmpty {
                    EstadoVacio(
                        icono: viewModel.filter == .verified ? "checkmark.seal" : "tray",
                        mensaje: mensajeVacio
                    )
                    .tarjetaDark()
                } else {
                    LazyVStack(spacing: Espacio.md) {
                        ForEach(viewModel.filteredExperiences) { experience in
                            NavigationLink(destination: ExperienceDetailView(experienceId: experience.id)) {
                                HStack(spacing: Espacio.md) {
                                    Image(systemName: experience.isVerified ? "checkmark.shield.fill" : "clock")
                                        .font(.subheadline)
                                        .foregroundStyle(experience.isVerified ? Color.ppFondoOscuro : Color.ppMarca)
                                        .frame(width: 42, height: 42)
                                        .background(
                                            experience.isVerified ? Color.ppMarca : Color.ppMarcaSuave,
                                            in: Circle()
                                        )

                                    ExperienceCard(experiencia: experience)

                                    Image(systemName: "chevron.right")
                                        .font(.caption)
                                        .foregroundStyle(Color.ppTextoTerciario)
                                }
                                .padding(Espacio.lg)
                                .background(
                                    Color.white.opacity(0.035),
                                    in: RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                                )
                                .overlay {
                                    RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                                        .stroke(Color.ppBordeOscuro)
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, Espacio.lg)
            .padding(.top, Espacio.lg)
            .padding(.bottom, 110)
        }
        .scrollIndicators(.hidden)
        .refreshable { await viewModel.load() }
    }

    private var encabezado: some View {
        HStack(alignment: .bottom, spacing: Espacio.lg) {
            VStack(alignment: .leading, spacing: 6) {
                /*Text("TU HISTORIAL")
                    .font(.caption2)
                    .fontWeight(.black)
                    .kerning(1.3)
                    .foregroundStyle(Color.ppMarca)*/

                Text("Experiencias")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .tracking(-1.2)
                    .foregroundStyle(.white)

                Text("\(viewModel.total) registradas · cada una conserva su estado y evidencia")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoSecundario)
            }

            Spacer()

            NavigationLink(destination: NewExperienceView()) {
                Image(systemName: "plus")
                    .font(.headline)
                    .foregroundStyle(Color.ppFondoOscuro)
                    .frame(width: 48, height: 48)
                    .background(Color.ppMarca, in: Circle())
                    .shadow(color: Color.ppMarca.opacity(0.18), radius: 18, y: 8)
            }
            .accessibilityLabel("Registrar experiencia")
        }
    }

    private var filtros: some View {
        HStack(spacing: 5) {
            ForEach(ExperienceFilter.allCases) { filter in
                Button {
                    withAnimation(.easeOut(duration: 0.2)) {
                        viewModel.filter = filter
                    }
                } label: {
                    Text(filter.rawValue)
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundStyle(
                            viewModel.filter == filter ? Color.ppFondoOscuro : Color.ppTextoSecundario
                        )
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            viewModel.filter == filter ? Color.ppMarca : Color.clear,
                            in: Capsule()
                        )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(viewModel.filter == filter ? .isSelected : [])
            }
        }
        .padding(4)
        .background(Color.white.opacity(0.045), in: Capsule())
        .overlay(Capsule().stroke(Color.ppBordeOscuro))
    }

    private var mensajeVacio: String {
        switch viewModel.filter {
        case .all:
            return Strings.sinExperiencias
        case .review:
            return "No tienes experiencias esperando validación."
        case .verified:
            return "Todavía no tienes experiencias verificadas."
        }
    }
}
