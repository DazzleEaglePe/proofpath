import SwiftUI

struct ProgramSelectorView: View {
    let programs: [ProgramSummary]
    @Binding var selection: String

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Color.ppFondoOscuro.ignoresSafeArea()

                ScrollView {
                    LazyVStack(alignment: .leading, spacing: Espacio.md) {
                        VStack(alignment: .leading, spacing: Espacio.sm) {
                            Text("Elige dónde participaste")
                                .font(.system(size: 29, weight: .bold, design: .rounded))
                                .tracking(-0.9)
                                .foregroundStyle(.white)
                            Text("Mostramos el nombre de la organización para que envíes tu experiencia al equipo correcto.")
                                .font(.subheadline)
                                .foregroundStyle(Color.ppTextoSecundario)
                                .lineSpacing(3)
                        }
                        .padding(.bottom, Espacio.sm)

                        ForEach(programs) { program in
                            Button {
                                selection = program.id
                                dismiss()
                            } label: {
                                HStack(alignment: .top, spacing: Espacio.md) {
                                    Image(systemName: selection == program.id ? "checkmark" : "building.2")
                                        .font(.subheadline)
                                        .fontWeight(.bold)
                                        .foregroundStyle(
                                            selection == program.id ? Color.ppFondoOscuro : Color.ppMarca
                                        )
                                        .frame(width: 42, height: 42)
                                        .background(
                                            selection == program.id ? Color.ppMarca : Color.ppMarcaSuave,
                                            in: Circle()
                                        )

                                    VStack(alignment: .leading, spacing: 6) {
                                        Text(program.organizationName.uppercased())
                                            .font(.caption2)
                                            .fontWeight(.black)
                                            .kerning(0.8)
                                            .foregroundStyle(Color.ppMarca)

                                        Text(program.title)
                                            .font(.headline)
                                            .foregroundStyle(.white)
                                            .multilineTextAlignment(.leading)

                                        Text(program.description)
                                            .font(.caption)
                                            .foregroundStyle(Color.ppTextoSecundario)
                                            .lineLimit(3)
                                            .multilineTextAlignment(.leading)
                                    }

                                    Spacer(minLength: 0)
                                }
                                .padding(Espacio.lg)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(
                                    Color.white.opacity(selection == program.id ? 0.065 : 0.035),
                                    in: RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                                )
                                .overlay {
                                    RoundedRectangle(cornerRadius: Radio.tarjeta, style: .continuous)
                                        .stroke(
                                            selection == program.id
                                                ? Color.ppMarca.opacity(0.7)
                                                : Color.ppBordeOscuro,
                                            lineWidth: 1
                                        )
                                }
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("\(program.title), \(program.organizationName)")
                            .accessibilityAddTraits(selection == program.id ? .isSelected : [])
                        }
                    }
                    .padding(Espacio.xl)
                    .padding(.bottom, Espacio.xxl)
                }
                .scrollIndicators(.hidden)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(Color.ppMarca)
                }
            }
            .toolbarBackground(Color.ppFondoOscuro, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
        .presentationBackground(Color.ppFondoOscuro)
    }
}
