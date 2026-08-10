import SwiftUI

struct TalentPassView: View {
    @State private var viewModel = TalentPassViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                fondo

                Group {
                    switch viewModel.state {
                    case .idle, .loading:
                        cargando
                    case let .loaded(datos):
                        contenido(datos)
                    case let .failed(error):
                        ErrorView(error: error) {
                            Task { await viewModel.load() }
                        }
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
                .fill(Color.ppMarca.opacity(0.09))
                .frame(width: 330, height: 330)
                .blur(radius: 90)
                .offset(x: 170, y: -350)
        }
    }

    private var cargando: some View {
        VStack(spacing: Espacio.md) {
            ProgressView().tint(Color.ppMarca)
            Text("Preparando tu TalentPass")
                .font(.caption)
                .foregroundStyle(Color.ppTextoTerciario)
        }
    }

    private func contenido(_ datos: TalentPassViewModel.Datos) -> some View {
        ScrollView {
            LazyVStack(spacing: Espacio.xl) {
                barraSuperior(datos)
                bienvenida(datos)
                tarjetaPass(datos)
                accesos(datos)
                experiencias(datos)
                competencias(datos)

                Text(Strings.lemaCierre)
                    .font(.caption2)
                    .foregroundStyle(Color.ppTextoTerciario)
                    .padding(.vertical, Espacio.lg)
            }
            .padding(.horizontal, Espacio.lg)
            .padding(.bottom, Espacio.xxl)
        }
        .scrollIndicators(.hidden)
        .refreshable { await viewModel.load() }
    }

    private func barraSuperior(_ datos: TalentPassViewModel.Datos) -> some View {
        HStack {
            HStack(spacing: Espacio.sm) {
                ZStack {
                    Capsule()
                        .fill(Color.ppMarca)
                        .frame(width: 6, height: 24)
                        .rotationEffect(.degrees(45))
                    Capsule()
                        .fill(Color.ppFondoOscuro)
                        .frame(width: 6, height: 24)
                        .overlay(Capsule().stroke(Color.white.opacity(0.7), lineWidth: 1))
                        .rotationEffect(.degrees(-45))
                }
                .frame(width: 25, height: 27)
                Text("ProofPath")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
            }

            Spacer()

        }
        .padding(.top, Espacio.sm)
    }

    private func bienvenida(_ datos: TalentPassViewModel.Datos) -> some View {
        HStack(alignment: .bottom) {
            VStack(alignment: .leading, spacing: 5) {
                Text("Hola, \(primerNombre(datos.pass.fullName))")
                    .font(.system(size: 31, weight: .bold, design: .rounded))
                    .tracking(-1.1)
                    .foregroundStyle(.white)
                Text("Tu experiencia está lista para abrir puertas.")
                    .font(.subheadline)
                    .foregroundStyle(Color.ppTextoSecundario)
            }
            Spacer()
            NavigationLink(destination: NewExperienceView()) {
                Image(systemName: "plus")
                    .font(.headline)
                    .foregroundStyle(Color.ppFondoOscuro)
                    .frame(width: 44, height: 44)
                    .background(Color.ppMarca, in: Circle())
            }
            .accessibilityLabel("Registrar experiencia")
        }
        .padding(.top, Espacio.md)
    }

    private func tarjetaPass(_ datos: TalentPassViewModel.Datos) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("TALENTPASS SBT")
                        .font(.caption2)
                        .fontWeight(.black)
                        .kerning(1.2)
                        .opacity(0.58)
                    Text(datos.pass.tokenId.map { "#\($0)" } ?? "PENDIENTE")
                        .font(.system(size: 35, weight: .bold, design: .rounded))
                        .tracking(-1.4)
                }
                Spacer()
                Image(systemName: "checkmark.shield.fill")
                    .font(.title2)
            }

            Spacer(minLength: Espacio.xxxl)

            Text(datos.pass.fullName)
                .font(.title3)
                .fontWeight(.bold)
                .tracking(-0.4)

            HStack {
                Label(
                    datos.pass.isVerified ? "Verificado en Arbitrum" : "Preparando registro",
                    systemImage: datos.pass.isVerified ? "checkmark.circle.fill" : "clock"
                )
                Spacer()
                Text("NO TRANSFERIBLE")
                    .font(.system(size: 8, weight: .black))
                    .kerning(0.8)
            }
            .font(.caption2)
            .fontWeight(.semibold)
            .padding(.top, Espacio.md)
        }
        .foregroundStyle(Color.ppFondoOscuro)
        .padding(Espacio.xl)
        .frame(minHeight: 225)
        .background(
            ZStack {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(Color.ppMarca)
                Circle()
                    .stroke(Color.black.opacity(0.06), lineWidth: 30)
                    .frame(width: 220, height: 220)
                    .offset(x: 140, y: -80)
            }
            .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        )
        .shadow(color: Color.ppMarca.opacity(0.13), radius: 28, y: 14)
        .accessibilityElement(children: .combine)
    }

    private func accesos(_ datos: TalentPassViewModel.Datos) -> some View {
        HStack(spacing: Espacio.md) {
            NavigationLink(destination: NewExperienceView()) {
                acceso(icono: "plus", titulo: "Nueva")
            }
            .buttonStyle(.plain)

            ShareLink(item: textoParaCompartir(datos)) {
                acceso(icono: "square.and.arrow.up", titulo: "Compartir")
            }
            .buttonStyle(.plain)

            VStack(spacing: Espacio.sm) {
                Image(systemName: datos.pass.isVerified ? "checkmark.seal.fill" : "clock")
                    .font(.headline)
                    .foregroundStyle(Color.ppMarca)
                Text(datos.pass.isVerified ? "Verificado" : "En proceso")
                    .font(.caption2)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.ppTextoSecundario)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Espacio.md)
            .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 18))
            .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.ppBordeOscuro, lineWidth: 1))
        }
    }

    private func experiencias(_ datos: TalentPassViewModel.Datos) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            cabeceraSeccion(
                titulo: "Experiencias verificadas",
                detalle: "\(datos.experiencias.count) credenciales"
            )

            if datos.experiencias.isEmpty {
                EstadoVacio(icono: "tray", mensaje: Strings.sinExperiencias)
                    .tarjetaDark()
            } else {
                VStack(spacing: Espacio.md) {
                    ForEach(Array(datos.experiencias.enumerated()), id: \.element.id) { indice, experiencia in
                        NavigationLink(destination: ExperienceDetailView(experienceId: experiencia.id)) {
                            HStack(spacing: Espacio.md) {
                                Text(String(format: "%02d", indice + 1))
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(Color.ppMarca)
                                    .frame(width: 34, height: 34)
                                    .background(Color.ppMarcaSuave, in: Circle())

                                VStack(alignment: .leading, spacing: 4) {
                                    Text(experiencia.programTitle)
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundStyle(.white)
                                        .lineLimit(1)
                                    Text("\(experiencia.role) · \(experiencia.organizationName)")
                                        .font(.caption2)
                                        .foregroundStyle(Color.ppTextoSecundario)
                                        .lineLimit(1)
                                }

                                Spacer()

                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundStyle(Color.ppTextoTerciario)
                            }
                            .tarjetaDark()
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func competencias(_ datos: TalentPassViewModel.Datos) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            cabeceraSeccion(
                titulo: "Competencias con evidencia",
                detalle: "Sin puntajes"
            )

            VStack(spacing: 0) {
                ForEach(Array(datos.pass.skills.enumerated()), id: \.element.id) { indice, skill in
                    HStack(alignment: .top, spacing: Espacio.md) {
                        Image(systemName: skill.type == .hard ? "chevron.left.forwardslash.chevron.right" : "person.2")
                            .font(.caption)
                            .foregroundStyle(Color.ppMarca)
                            .frame(width: 34, height: 34)
                            .background(Color.ppMarcaSuave, in: Circle())

                        VStack(alignment: .leading, spacing: 5) {
                            Text(skill.name)
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .foregroundStyle(.white)
                            Text(Strings.demostradaEn(skill.experienceCount))
                                .font(.caption2)
                                .foregroundStyle(Color.ppTextoSecundario)
                            if let primera = skill.experienceTitles.first {
                                Text(primera)
                                    .font(.caption2)
                                    .foregroundStyle(Color.ppTextoTerciario)
                                    .lineLimit(1)
                            }
                        }
                        Spacer()
                    }
                    .padding(.vertical, Espacio.lg)

                    if indice < datos.pass.skills.count - 1 {
                        Divider().overlay(Color.white.opacity(0.07))
                    }
                }
            }
            .padding(.horizontal, Espacio.lg)
            .background(Color.white.opacity(0.03), in: RoundedRectangle(cornerRadius: Radio.tarjeta))
            .overlay(RoundedRectangle(cornerRadius: Radio.tarjeta).stroke(Color.ppBordeOscuro, lineWidth: 1))
        }
    }

    private func cabeceraSeccion(titulo: String, detalle: String) -> some View {
        HStack(alignment: .firstTextBaseline) {
            Text(titulo)
                .font(.headline)
                .foregroundStyle(.white)
            Spacer()
            Text(detalle)
                .font(.caption2)
                .foregroundStyle(Color.ppTextoTerciario)
        }
    }

    private func acceso(icono: String, titulo: String) -> some View {
        VStack(spacing: Espacio.sm) {
            Image(systemName: icono)
                .font(.headline)
                .foregroundStyle(.white)
            Text(titulo)
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundStyle(Color.ppTextoSecundario)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Espacio.md)
        .background(Color.white.opacity(0.035), in: RoundedRectangle(cornerRadius: 18))
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.ppBordeOscuro, lineWidth: 1))
    }

    private func primerNombre(_ nombre: String) -> String {
        nombre.split(separator: " ").first.map(String.init) ?? nombre
    }

    private func textoParaCompartir(_ datos: TalentPassViewModel.Datos) -> String {
        let id = datos.pass.tokenId.map { " #\($0)" } ?? ""
        return "Este es el TalentPass\(id) de \(datos.pass.fullName): experiencia respaldada por evidencia verificable."
    }
}
