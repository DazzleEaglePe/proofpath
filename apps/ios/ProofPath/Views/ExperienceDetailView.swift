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
        .background(Color.ppBackground)
        .navigationTitle("Experiencia")
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load() }
    }

    private func contenido(_ d: ExperienceDetail) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Espacio.xl) {
                encabezado(d)

                seccion(Strings.contribuciones) {
                    Text(d.contributions)
                        .font(.body)
                        .tarjeta()
                }

                if !d.evidences.isEmpty {
                    seccion(Strings.evidencias) {
                        VStack(alignment: .leading, spacing: Espacio.md) {
                            ForEach(d.evidences) { ev in
                                if let url = URL(string: ev.url) {
                                    Link(destination: url) {
                                        HStack(spacing: Espacio.sm) {
                                            Image(systemName: icono(para: ev.type))
                                                .frame(width: 20)
                                            Text(ev.label)
                                            Spacer()
                                            Image(systemName: "arrow.up.right")
                                                .font(.caption)
                                                .foregroundStyle(.tertiary)
                                        }
                                        .font(.subheadline)
                                        .foregroundStyle(Color.ppMarca)
                                    }
                                }
                            }
                        }
                        .tarjeta()
                    }
                }

                if !d.skills.hard.isEmpty {
                    seccion(Strings.competenciasTecnicas) { chips(d.skills.hard) }
                }
                if !d.skills.human.isEmpty {
                    seccion(Strings.competenciasHumanas) { chips(d.skills.human) }
                }

                if let credencial = d.credential {
                    VStack(alignment: .leading, spacing: Espacio.md) {
                        VerifiedBadge(verificado: credencial.isVerified, grande: true)

                        if let txHash = credencial.txHash,
                           let url = URL(string: "https://sepolia.arbiscan.io/tx/\(txHash)") {
                            Link(destination: url) {
                                HStack(spacing: Espacio.sm) {
                                    Image(systemName: "arrow.up.right.square")
                                    Text(Strings.verEnArbiscan)
                                }
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(Color.ppMarca)
                            }
                        }
                    }
                    .tarjeta()
                }
            }
            .padding(Espacio.lg)
        }
    }

    private func encabezado(_ d: ExperienceDetail) -> some View {
        VStack(alignment: .leading, spacing: Espacio.xs) {
            Text(d.programTitle)
                .font(.title3)
                .fontWeight(.bold)
            Text(d.role)
                .foregroundStyle(.secondary)
            Text(d.organizationName)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            if let horas = d.hoursCommitted {
                Text("\(horas) horas")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
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

    /// Nombres sueltos, sin barras ni niveles. Ver 00-CONTEXT.md §2.1.
    private func chips(_ nombres: [String]) -> some View {
        FlowLayout(espacio: Espacio.sm) {
            ForEach(nombres, id: \.self) { nombre in
                Text(nombre).chip()
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

/// Layout que acomoda los chips en filas y baja de linea cuando no entran.
///
/// SwiftUI no trae un "wrap" nativo, y es justo el tipo de cosa por la que uno
/// terminaria agregando una dependencia. Con el protocolo `Layout` de iOS 16 son
/// treinta lineas y queda bajo nuestro control.
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
                let tamaño = subviews[indice].sizeThatFits(.unspecified)
                subviews[indice].place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(tamaño))
                x += tamaño.width + espacio
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
            let tamaño = subviews[indice].sizeThatFits(.unspecified)
            if x + tamaño.width > anchoMaximo, !actual.indices.isEmpty {
                filas.append(actual)
                actual = Fila()
                x = 0
            }
            actual.indices.append(indice)
            actual.alto = max(actual.alto, tamaño.height)
            x += tamaño.width + espacio
        }

        if !actual.indices.isEmpty { filas.append(actual) }
        return filas
    }
}
