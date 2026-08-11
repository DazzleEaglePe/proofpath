import SwiftUI

struct AuthenticatedRootView: View {
    @State private var selectedTab: Tab = .talentPass

    private enum Tab: Hashable {
        case talentPass
        case explore
        case experiences
        case account
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            TalentPassView()
                .tag(Tab.talentPass)
                .tabItem {
                    Label("TalentPass", systemImage: "person.text.rectangle")
                }

            ExploreView()
                .tag(Tab.explore)
                .tabItem {
                    Label("Explorar", systemImage: "safari")
                }

            ExperiencesView()
                .tag(Tab.experiences)
                .tabItem {
                    Label("Experiencias", systemImage: "checkmark.seal")
                }

            AccountTabView()
                .tag(Tab.account)
                .tabItem {
                    Label("Cuenta", systemImage: "person.crop.circle")
                }
        }
        .tint(Color.ppMarca)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarBackground(Color.ppTarjetaOscura.opacity(0.94), for: .tabBar)
    }
}
