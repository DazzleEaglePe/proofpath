import SwiftUI

struct ExperienceDetailView: View {
    let experienceId: String
    @State private var viewModel: ExperienceDetailViewModel

    init(experienceId: String) {
        self.experienceId = experienceId
        _viewModel = State(wrappedValue: ExperienceDetailViewModel(experienceId: experienceId))
    }

    var body: some View {
        ZStack {
            Color.ppBackground.ignoresSafeArea()

            Group {
                switch viewModel.state {
                case .idle, .loading:
                    ProgressView().tint(Color.ppMarca)
                case let .loaded(detalle):
                    contenido(detalle)
                case let .failed(error):
                    ErrorView(error: error) { Task { await viewModel.load() } }
                }
            }
        }
        .navigationTitle("Experiencia")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color.ppFondoOscuro, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .task { await viewModel.load() }
    }

    private func contenido(_ detalle: ExperienceDetail) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Espacio.xl) {
                encabezado(detalle)

                seccion(Strings.contribuciones, icono: "text.alignleft") {
                    Text(detalle.contributions)
                        .font(.subheadline)
                        .foregroundStyle(Color.ppTextoSecundario)
                        .lineSpacing(4)
                        .tarjetaDark(padding: Espacio.lg)
                }

                if !detalle.evidences.isEmpty {
                    seccion(Strings.evidencias, icono: "link") {
                        VStack(spacing: 0) {
                            ForEach(Array(detalle.evidences.enumerated()), id: \.element.id) { indice, evidencia in
                                if let url = URL(string: evidencia.url) {
                                    Link(destination: url) {
                                        HStack(spacing: Espacio.md) {
                                            Image(systemName: icono(para: evidencia.type))
                                                .font(.caption)
                                                .foregroundStyle(Color.ppMarca)
                                                .frame(width: 34, height: 34)
                                                .background(Color.ppMarcaSuave, in: Circle())
                                            VStack(alignment: .leading, spacing: 3) {
                                                Text(evidencia.label)
                                                    .font(.subheadline)
                                                    .fontWeight(.semibold)
                                                    .foregroundStyle(.white)
                                                Text("Abrir evidencia")
                                                    .font(.caption2)
                                                    .foregroundStyle(Color.ppTextoTerciario)
                                            }
                                            Spacer()
                                            Image(systemName: "arrow.up.right")
                                                .font(.caption)
                                                .foregroundStyle(Color.ppTextoTerciario)
                                        }
                                        .padding(.vertical, Espacio.md)
                                    }
                                    if indice < detalle.evidences.count - 1 {
                                        Divider().overlay(Color.white.opacity(0.07))
                                    }
                                }
                            }
                        }
                        .padding(.horizontal, Espacio.lg)
                        .background(Color.white.opacity(0.03), in: RoundedRectangle(cornerRadius: Radio.tarjeta))
                        .overlay(RoundedRectangle(cornerRadius: Radio.tarjeta).stroke(Color.ppBordeOscuro))
                    }
                }

                if !detalle.skills.hard.isEmpty {
                    seccion(Strings.competenciasTecnicas, icono: "chevron.left.forwardslash.chevron.right") {
                        chips(detalle.skills.hard)
                            .tarjetaDark()
                    }
                }

                if !detalle.skills.human.isEmpty {
                    seccion(Strings.competenciasHumanas, icono: "person.2") {
                        chips(detalle.skills.human)
                            .tarjetaDark()
                    }
                }

                if let credencial = detalle.credential {
                    estadoCredencial(credencial)
                }
            }
            .padding(Espacio.lg)
            .padding(.bottom, Espacio.xl)
        }
        .scrollIndicators(.hidden)
    }

    private func encabezado(_ detalle: ExperienceDetail) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                Text("EXPERIENCIA PROFESIONAL")
                    .font(.caption2)
                    .fontWeight(.black)
                    .kerning(1.1)
                Spacer()
                Text(detalle.status.etiqueta.uppercased())
                    .font(.system(size: 9, weight: .black))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Color.black.opacity(0.1), in: Capsule())
            }
            .opacity(0.6)

            Spacer(minLength: Espacio.xxxl)

            Text(detalle.programTitle)
                .font(.system(size: 29, weight: .bold, design: .rounded))
                .tracking(-1)
            Text(detalle.role)
                .font(.subheadline)
                .fontWeight(.semibold)
                .padding(.top, Espacio.xs)

            HStack {
                Label(detalle.organizationName, systemImage: "building.2")
                Spacer()
                if let horas = detalle.hoursCommitted {
                    Label("\(horas) h", systemImage: "clock")
                }
            }
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.top, Espacio.xl)
        }
        .foregroundStyle(Color.ppFondoOscuro)
        .padding(Espacio.xl)
        .frame(minHeight: 220)
        .background(Color.ppMarca, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
    }

    private func estadoCredencial(_ credencial: CredentialInfo) -> some View {
        VStack(alignment: .leading, spacing: Espacio.lg) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("Integridad de la credencial")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Text("Contenido anclado y auditable")
                        .font(.caption)
                        .foregroundStyle(Color.ppTextoTerciario)
                }
                Spacer()
                VerifiedBadge(verificado: credencial.isVerified)
            }

            Text(credencial.credentialHash)
                .font(.caption2.monospaced())
                .foregroundStyle(Color.ppTextoTerciario)
                .lineLimit(2)

            if let txHash = credencial.txHash,
               let url = URL(string: "https://sepolia.arbiscan.io/tx/\(txHash)") {
                Link(destination: url) {
                    HStack {
                        Text(Strings.verEnArbiscan)
                        Spacer()
                        Image(systemName: "arrow.up.right")
                    }
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.ppFondoOscuro)
                    .padding(.horizontal, Espacio.lg)
                    .padding(.vertical, 13)
                    .background(Color.ppMarca, in: Capsule())
                }
            }
        }
        .tarjetaDark(padding: Espacio.lg)
    }

    private func seccion<Contenido: View>(
        _ titulo: String,
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
            contenido()
        }
    }

    private func chips(_ nombres: [String]) -> some View {
        FlowLayout(espacio: Espacio.sm) {
            ForEach(nombres, id: \.self) { nombre in
                Text(nombre).chip(color: .white)
            }
        }
    }

    private func icono(para tipo: String) -> String {
        switch tipo {
        case "REPOSITORY": "chevron.left.forwardslash.chevron.right"
        case "DEPLOYED_DEMO": "globe"
        case "DOCUMENT": "doc.text"
        case "IMAGE": "photo"
        default: "link"
        }
    }
}

struct FlowLayout: Layout {
    var espacio: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let ancho = proposal.width ?? .infinity
        let filas = acomodar(subviews: subviews, anchoMaximo: ancho)
        let alto = filas.map(\.alto).reduce(0, +) + espacio * CGFloat(max(filas.count - 1, 0))
        return CGSize(width: ancho, height: alto)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for fila in acomodar(subviews: subviews, anchoMaximo: bounds.width) {
            var x = bounds.minX
            for indice in fila.indices {
                let tamano = subviews[indice].sizeThatFits(.unspecified)
                subviews[indice].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(tamano))
                x += tamano.width + espacio
            }
            y += fila.alto + espacio
        }
    }

    private struct Fila {
        var indices: [Int] = []
        var alto: CGFloat = 0
    }

    private func acomodar(subviews: Subviews, anchoMaximo: CGFloat) -> [Fila] {
        var filas: [Fila] = []
        var actual = Fila()
        var x: CGFloat = 0

        for indice in subviews.indices {
            let tamano = subviews[indice].sizeThatFits(.unspecified)
            if x + tamano.width > anchoMaximo, !actual.indices.isEmpty {
                filas.append(actual)
                actual = Fila()
                x = 0
            }
            actual.indices.append(indice)
            actual.alto = max(actual.alto, tamano.height)
            x += tamano.width + espacio
        }

        if !actual.indices.isEmpty { filas.append(actual) }
        return filas
    }
}
