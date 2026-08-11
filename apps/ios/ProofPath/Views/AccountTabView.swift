import SwiftUI

struct AccountTabView: View {
    @State private var viewModel = AccountViewModel()
    @State private var editingProfile = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.ppFondoOscuro.ignoresSafeArea()

                switch viewModel.state {
                case .idle, .loading:
                    VStack(spacing: Espacio.md) {
                        ProgressView().tint(Color.ppMarca)
                        Text("Cargando tu cuenta…")
                            .font(.caption)
                            .foregroundStyle(Color.ppTextoTerciario)
                    }

                case let .failed(error):
                    ErrorView(error: error) {
                        Task { await viewModel.load() }
                    }

                case let .loaded(data):
                    AccountView(
                        account: data.pass,
                        profile: data.profile,
                        showsDismissButton: false,
                        onEditProfile: { editingProfile = true }
                    )
                }
            }
            .toolbar(.hidden, for: .navigationBar)
        }
        .task { await viewModel.load() }
        .sheet(isPresented: $editingProfile) {
            if let data = viewModel.state.value {
                DiscoveryProfileEditView(profile: data.profile) { saved in
                    viewModel.replaceProfile(saved)
                }
            }
        }
    }
}
