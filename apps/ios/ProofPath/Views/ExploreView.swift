import SwiftUI

struct ExploreView: View {
    @State private var viewModel = ExploreViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                background

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: Espacio.xl) {
                        header
                        recommendationContext
                        search
                        modalityFilters
                        content
                    }
                    .padding(.horizontal, Espacio.lg)
                    .padding(.bottom, 110)
                }
                .scrollIndicators(.hidden)
                .refreshable { await viewModel.load() }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .task {
            if case .idle = viewModel.state { await viewModel.load() }
        }
    }

    private var background: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()
            Circle()
                .fill(Color.ppMarca.opacity(0.1))
                .frame(width: 330, height: 330)
                .blur(radius: 95)
                .offset(x: 175, y: -360)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Espacio.sm) {
            /*Text("EXPLORAR")
                .font(.caption2)
                .fontWeight(.black)
                .kerning(1.4)
                .foregroundStyle(Color.ppMarca)*/

            Text("Encuentra dónde\ntu experiencia suma.")
                .font(.system(size: 34, weight: .bold, design: .rounded))
                .tracking(-1.2)
                .foregroundStyle(.white)

            Text("Oportunidades de organizaciones verificadas, ordenadas según tus intereses, disponibilidad y experiencia demostrada.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
        }
        .padding(.top, Espacio.lg)
    }

    private var recommendationContext: some View {
        HStack(alignment: .top, spacing: Espacio.md) {
            Image(systemName: "sparkles")
                .font(.headline)
                .foregroundStyle(Color.ppMarca)
                .frame(width: 38, height: 38)
                .background(Color.ppMarcaSuave, in: Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text("Recomendaciones con contexto")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                Text("Siempre te contamos por qué aparece cada oportunidad. Nunca calificamos personas.")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoSecundario)
                    .lineSpacing(2)
            }
        }
        .tarjetaDark()
    }

    private var search: some View {
        HStack(spacing: Espacio.md) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(viewModel.searchText.isEmpty ? Color.ppTextoTerciario : Color.ppMarca)
            TextField(
                "",
                text: $viewModel.searchText,
                prompt: Text("Buscar por causa, ONG o actividad")
                    .foregroundStyle(Color.ppTextoTerciario)
            )
                .font(.subheadline)
                .foregroundStyle(.white)
                .tint(Color.ppMarca)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()

            if !viewModel.searchText.isEmpty {
                Button { viewModel.searchText = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Color.ppTextoTerciario)
                }
                .accessibilityLabel("Limpiar búsqueda")
            }
        }
        .padding(.horizontal, Espacio.lg)
        .frame(minHeight: 54)
        .background(Color.ppTarjetaOscura, in: Capsule())
        .overlay(Capsule().stroke(Color.ppBordeOscuro))
    }

    private var modalityFilters: some View {
        ScrollView(.horizontal) {
            HStack(spacing: Espacio.sm) {
                filterChip(label: "Todas", icon: "square.grid.2x2", modality: nil)
                ForEach(OpportunityModality.allCases, id: \.self) { modality in
                    filterChip(label: modality.label, icon: modality.icon, modality: modality)
                }
            }
        }
        .scrollIndicators(.hidden)
    }

    private func filterChip(
        label: String,
        icon: String,
        modality: OpportunityModality?
    ) -> some View {
        let selected = viewModel.modality == modality
        return Button {
            withAnimation(.easeOut(duration: 0.18)) { viewModel.modality = modality }
        } label: {
            Label(label, systemImage: icon)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(selected ? Color.ppFondoOscuro : Color.ppTextoSecundario)
                .padding(.horizontal, Espacio.md)
                .padding(.vertical, 9)
                .background(selected ? Color.ppMarca : Color.white.opacity(0.05), in: Capsule())
                .overlay(Capsule().stroke(selected ? Color.clear : Color.ppBordeOscuro))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var content: some View {
        switch viewModel.state {
        case .idle, .loading:
            VStack(spacing: Espacio.md) {
                ProgressView().tint(Color.ppMarca)
                Text("Buscando oportunidades para ti…")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoTerciario)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Espacio.xxxl)

        case let .failed(error):
            ErrorView(error: error) { Task { await viewModel.load() } }

        case .loaded:
            if viewModel.filteredOpportunities.isEmpty {
                EstadoVacio(
                    icono: "magnifyingglass",
                    mensaje: "No encontramos oportunidades con estos filtros."
                )
            } else {
                VStack(alignment: .leading, spacing: Espacio.md) {
                    Text("PARA TI")
                        .tituloDeSeccion()

                    ForEach(viewModel.filteredOpportunities) { opportunity in
                        NavigationLink(destination: OpportunityDetailView(opportunity: opportunity)) {
                            OpportunityCard(opportunity: opportunity)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct OpportunityCard: View {
    let opportunity: Opportunity

    var body: some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            HStack(spacing: Espacio.sm) {
                Text(opportunity.organizationName)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.ppTextoSecundario)
                    .lineLimit(1)
                if opportunity.organizationIsTrusted {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.caption)
                        .foregroundStyle(Color.ppMarca)
                }
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.caption)
                    .foregroundStyle(Color.ppTextoTerciario)
            }

            Text(opportunity.title)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .multilineTextAlignment(.leading)

            Text(opportunity.description)
                .font(.caption)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineLimit(2)
                .lineSpacing(2)

            HStack(spacing: Espacio.sm) {
                Label(opportunity.modality.label, systemImage: opportunity.modality.icon)
                    .chipDark(color: Color.ppMarca, fondo: Color.ppMarcaSuave)
                if let weeklyHours = opportunity.weeklyHours {
                    Text("\(weeklyHours) h/sem")
                        .chipDark(color: Color.ppTextoSecundario)
                }
                if let cause = opportunity.cause {
                    Text(cause)
                        .chipDark(color: Color.ppTextoSecundario)
                        .lineLimit(1)
                }
            }

            if let reason = opportunity.recommendationReasons.first {
                HStack(alignment: .top, spacing: Espacio.sm) {
                    Image(systemName: "sparkle")
                        .font(.caption)
                        .foregroundStyle(Color.ppMarca)
                    Text(reason)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color.ppMarca)
                }
                .padding(Espacio.md)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.ppMarcaSuave, in: RoundedRectangle(cornerRadius: 13))
            }
        }
        .tarjetaDark(padding: Espacio.lg)
    }
}

private struct OpportunityDetailView: View {
    let opportunity: Opportunity

    var body: some View {
        ZStack {
            Color.ppFondoOscuro.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: Espacio.xl) {
                    VStack(alignment: .leading, spacing: Espacio.md) {
                        HStack(spacing: Espacio.sm) {
                            Text(opportunity.organizationName)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(Color.ppMarca)
                            if opportunity.organizationIsTrusted {
                                Image(systemName: "checkmark.seal.fill")
                                    .foregroundStyle(Color.ppMarca)
                            }
                        }
                        Text(opportunity.title)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .tracking(-1)
                            .foregroundStyle(.white)
                        Text(opportunity.description)
                            .font(.subheadline)
                            .foregroundStyle(Color.ppTextoSecundario)
                            .lineSpacing(4)
                    }

                    VStack(spacing: 0) {
                        detailRow(icon: opportunity.modality.icon, title: "Modalidad", value: opportunity.modality.label)
                        Divider().overlay(Color.ppBordeOscuro)
                        detailRow(icon: "mappin.and.ellipse", title: "Ubicación", value: opportunity.location ?? "Por confirmar")
                        Divider().overlay(Color.ppBordeOscuro)
                        detailRow(icon: "clock", title: "Dedicación", value: opportunity.weeklyHours.map { "\($0) horas por semana" } ?? "Flexible")
                        if let deadline = opportunity.applicationDeadline {
                            Divider().overlay(Color.ppBordeOscuro)
                            detailRow(icon: "calendar", title: "Postula hasta", value: deadline.formatted(date: .abbreviated, time: .omitted))
                        }
                    }
                    .tarjetaDark(padding: 0)

                    if !opportunity.recommendationReasons.isEmpty {
                        VStack(alignment: .leading, spacing: Espacio.md) {
                            Text("POR QUÉ APARECE PARA TI").tituloDeSeccion()
                            ForEach(opportunity.recommendationReasons, id: \.self) { reason in
                                Label(reason, systemImage: "sparkle")
                                    .font(.subheadline)
                                    .foregroundStyle(.white)
                                    .labelStyle(ReasonLabelStyle())
                            }
                        }
                    }

                    if !opportunity.requiredSkills.isEmpty {
                        VStack(alignment: .leading, spacing: Espacio.md) {
                            Text("COMPETENCIAS ÚTILES").tituloDeSeccion()
                            LazyVGrid(columns: [GridItem(.adaptive(minimum: 120))], spacing: Espacio.sm) {
                                ForEach(opportunity.requiredSkills, id: \.self) { skill in
                                    Text(skill).chipDark(color: Color.ppTextoSecundario)
                                }
                            }
                        }
                    }

                    HStack(alignment: .top, spacing: Espacio.md) {
                        Image(systemName: "paperplane")
                            .foregroundStyle(Color.ppMarca)
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Postulaciones, siguiente fase")
                                .font(.subheadline)
                                .fontWeight(.bold)
                                .foregroundStyle(.white)
                            Text("Explorar ya usa oportunidades reales. El envío y seguimiento de postulaciones tendrá su propio flujo para no mezclarlo con experiencias verificadas.")
                                .font(.caption)
                                .foregroundStyle(Color.ppTextoSecundario)
                                .lineSpacing(2)
                        }
                    }
                    .padding(Espacio.lg)
                    .background(Color.ppMarcaSuave, in: RoundedRectangle(cornerRadius: 18))
                }
                .padding(Espacio.lg)
                .padding(.bottom, Espacio.xxl)
            }
            .scrollIndicators(.hidden)
        }
        .navigationTitle("Oportunidad")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.ppFondoOscuro, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
    }

    private func detailRow(icon: String, title: String, value: String) -> some View {
        HStack(spacing: Espacio.md) {
            Image(systemName: icon)
                .foregroundStyle(Color.ppMarca)
                .frame(width: 34, height: 34)
                .background(Color.ppMarcaSuave, in: Circle())
            Text(title)
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
            Spacer()
            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundStyle(.white)
                .multilineTextAlignment(.trailing)
        }
        .padding(Espacio.lg)
    }
}

private struct ReasonLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .top, spacing: Espacio.md) {
            configuration.icon.foregroundStyle(Color.ppMarca)
            configuration.title
        }
        .padding(Espacio.md)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 14))
    }
}
