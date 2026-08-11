import SwiftUI

struct DiscoveryProfileEditView: View {
    @State private var viewModel: DiscoveryProfileEditViewModel
    @Environment(\.dismiss) private var dismiss
    let onSaved: (DiscoveryProfile) -> Void

    init(profile: DiscoveryProfile, onSaved: @escaping (DiscoveryProfile) -> Void) {
        _viewModel = State(initialValue: DiscoveryProfileEditViewModel(profile: profile))
        self.onSaved = onSaved
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.ppFondoOscuro.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: Espacio.xl) {
                        intro
                        education
                        availability
                        causes
                        roles

                        if let error = viewModel.error {
                            Text(error.message)
                                .font(.caption)
                                .foregroundStyle(Color.ppPeligro)
                                .padding(Espacio.lg)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.ppPeligroSuave, in: RoundedRectangle(cornerRadius: 16))
                        }

                        Button {
                            Task {
                                if let saved = await viewModel.save() {
                                    onSaved(saved)
                                    dismiss()
                                }
                            }
                        } label: {
                            HStack(spacing: Espacio.sm) {
                                if viewModel.isSaving { ProgressView().tint(Color.ppFondoOscuro) }
                                Text(viewModel.isSaving ? "Guardando…" : "Guardar perfil")
                            }
                        }
                        .buttonStyle(.principal)
                        .disabled(viewModel.isSaving)
                    }
                    .padding(Espacio.lg)
                    .padding(.bottom, Espacio.xxl)
                }
                .scrollIndicators(.hidden)
            }
            .navigationTitle("Perfil para oportunidades")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(Color.ppFondoOscuro, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cerrar") { dismiss() }
                        .foregroundStyle(Color.ppMarca)
                }
            }
        }
    }

    private var intro: some View {
        VStack(alignment: .leading, spacing: Espacio.sm) {
            Text("Cuéntanos qué buscas.")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .tracking(-1)
                .foregroundStyle(.white)
            Text("Estos datos son opcionales, permanecen fuera de la cadena y se usan para ordenar oportunidades relevantes para ti.")
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)
                .lineSpacing(3)
        }
    }

    private var education: some View {
        formSection(title: "Formación", icon: "graduationcap") {
            Picker("Situación académica", selection: $viewModel.educationStatus) {
                Text("Seleccionar").tag(EducationStatus?.none)
                ForEach(EducationStatus.allCases, id: \.self) { status in
                    Text(status.label).tag(EducationStatus?.some(status))
                }
            }
            .pickerStyle(.menu)
            .tint(Color.ppMarca)
            .inputSurface()

            profileTextField("Carrera o área de estudio", text: $viewModel.fieldOfStudy)
                .inputSurface()
            profileTextField("Universidad o instituto", text: $viewModel.institutionName)
                .inputSurface()
            profileTextField("Ciclo actual", text: $viewModel.academicCycle)
                .keyboardType(.numberPad)
                .inputSurface()
        }
    }

    private var availability: some View {
        formSection(title: "Disponibilidad", icon: "clock") {
            profileTextField("Ciudad", text: $viewModel.city)
                .inputSurface()
            profileTextField("Horas disponibles por semana", text: $viewModel.weeklyAvailabilityHours)
                .keyboardType(.numberPad)
                .inputSurface()

            Text("MODALIDADES PREFERIDAS").tituloDeSeccion()
            choiceGrid {
                ForEach(OpportunityModality.allCases, id: \.self) { modality in
                    choiceButton(
                        label: modality.label,
                        icon: modality.icon,
                        selected: viewModel.preferredModalities.contains(modality)
                    ) {
                        toggle(modality, in: &viewModel.preferredModalities)
                    }
                }
            }
        }
    }

    private var causes: some View {
        formSection(title: "Causas que te importan", icon: "heart") {
            choiceGrid {
                ForEach(viewModel.causeOptions, id: \.self) { cause in
                    choiceButton(
                        label: cause,
                        icon: "heart",
                        selected: viewModel.causeInterests.contains(cause)
                    ) {
                        toggle(cause, in: &viewModel.causeInterests)
                    }
                }
            }
        }
    }

    private var roles: some View {
        formSection(title: "Roles por explorar", icon: "sparkles") {
            choiceGrid {
                ForEach(viewModel.roleOptions, id: \.self) { role in
                    choiceButton(
                        label: role,
                        icon: "plus",
                        selected: viewModel.roleInterests.contains(role)
                    ) {
                        toggle(role, in: &viewModel.roleInterests)
                    }
                }
            }
        }
    }

    private func formSection<Content: View>(
        title: String,
        icon: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: Espacio.md) {
            Label(title, systemImage: icon)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(.white)
                .symbolRenderingMode(.monochrome)
            content()
        }
    }

    private func choiceGrid<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: Espacio.sm)], spacing: Espacio.sm) {
            content()
        }
    }

    private func profileTextField(_ prompt: String, text: Binding<String>) -> some View {
        TextField(
            "",
            text: text,
            prompt: Text(prompt).foregroundStyle(Color.ppTextoTerciario)
        )
    }

    private func choiceButton(
        label: String,
        icon: String,
        selected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Label(label, systemImage: selected ? "checkmark" : icon)
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundStyle(selected ? Color.ppFondoOscuro : Color.ppTextoSecundario)
                .padding(.horizontal, Espacio.md)
                .frame(maxWidth: .infinity, minHeight: 42, alignment: .leading)
                .background(selected ? Color.ppMarca : Color.white.opacity(0.045), in: RoundedRectangle(cornerRadius: 13))
                .overlay(RoundedRectangle(cornerRadius: 13).stroke(selected ? Color.clear : Color.ppBordeOscuro))
        }
        .buttonStyle(.plain)
    }

    private func toggle<T: Hashable>(_ value: T, in set: inout Set<T>) {
        if set.contains(value) { set.remove(value) } else { set.insert(value) }
    }
}

private extension View {
    func inputSurface() -> some View {
        self
            .font(.subheadline)
            .foregroundStyle(.white)
            .tint(Color.ppMarca)
            .padding(.horizontal, Espacio.lg)
            .frame(minHeight: 54)
            .background(Color.ppTarjetaOscura, in: RoundedRectangle(cornerRadius: 15))
            .overlay(RoundedRectangle(cornerRadius: 15).stroke(Color.ppBordeOscuro))
    }
}
