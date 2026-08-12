import SwiftUI

struct VerifiedBadge: View {
    let verificado: Bool
    var grande = false

    private var color: Color { verificado ? .ppOk : .ppTextoSecundario }
    private var fondo: Color { verificado ? .ppOkSuave : Color.white.opacity(0.06) }

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: verificado ? "checkmark.seal.fill" : "clock")
                .font(grande ? .subheadline : .caption2)
            Text(verificado ? Strings.verificadoEnArbitrum : Strings.sinVerificar)
                .font(grande ? .subheadline : .caption2)
                .fontWeight(.semibold)
        }
        .foregroundStyle(color)
        .padding(.horizontal, grande ? 14 : 10)
        .padding(.vertical, grande ? 9 : 6)
        .background(Capsule().fill(fondo))
        .overlay(Capsule().stroke(color.opacity(0.18), lineWidth: 1))
        .accessibilityLabel(verificado ? Strings.verificadoEnArbitrum : Strings.sinVerificar)
    }
}

struct ExperienceCard: View {
    let experiencia: Experience

    var body: some View {
        VStack(alignment: .leading, spacing: Espacio.xs) {
            Text(experiencia.programTitle)
                .font(.headline)
                .foregroundStyle(.white)

            Text(experiencia.role)
                .font(.subheadline)
                .foregroundStyle(Color.ppTextoSecundario)

            Text("\(experiencia.organizationName) · \(duracion)")
                .font(.caption)
                .foregroundStyle(Color.ppTextoTerciario)

            HStack(spacing: 4) {
                Image(systemName: experiencia.isVerified ? "checkmark.seal.fill" : "clock")
                Text(experiencia.status.etiqueta)
            }
            .font(.caption)
            .fontWeight(.medium)
            .foregroundStyle(experiencia.isVerified ? Color.ppOk : Color.ppTextoSecundario)
            .padding(.top, 2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, Espacio.xs)
    }

    private var duracion: String {
        guard let fin = experiencia.endDate else { return "En curso" }
        let meses = Calendar.current.dateComponents(
            [.month], from: experiencia.startDate, to: fin
        ).month ?? 0
        return meses <= 1 ? "1 mes" : "\(meses) meses"
    }
}

/// Skill con su conteo de experiencias.
///
/// PROHIBIDO: `ProgressView(value:)`, estrellas, barras, porcentajes o niveles.
/// Las competencias se muestran como texto (05-IOS-ARCHITECTURE.md §8).
struct SkillEvidenceRow: View {
    let skill: SkillSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: Espacio.sm) {
                Text(skill.name)
                    .font(.body)
                    .fontWeight(.semibold)

                if skill.type == .human {
                    Text("humana")
                        .font(.caption2)
                        .foregroundStyle(Color.ppTextoTerciario)
                }
            }

            Text(Strings.demostradaEn(skill.experienceCount))
                .font(.caption)
                .foregroundStyle(Color.ppTextoSecundario)

            ForEach(skill.experienceTitles, id: \.self) { titulo in
                Text("└── \(titulo)")
                    .font(.caption2)
                    .foregroundStyle(Color.ppTextoTerciario)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(skill.name). \(Strings.demostradaEn(skill.experienceCount))")
    }
}

struct ErrorView: View {
    let error: AppError
    let reintentar: () -> Void

    var body: some View {
        ZStack {
            Color.black.opacity(0.28)
                .ignoresSafeArea()

            VStack(spacing: Espacio.lg) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.title2)
                    .foregroundStyle(Color.ppPeligro)
                    .frame(width: 52, height: 52)
                    .background(Color.ppPeligroSuave, in: Circle())

                VStack(spacing: Espacio.sm) {
                    Text(error.title)
                        .font(.headline)
                        .foregroundStyle(.white)

                    Text(error.message)
                        .font(.subheadline)
                        .foregroundStyle(Color.ppTextoSecundario)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                }

                // Nunca dejar la pantalla sin salida. Si la sesión murió,
                // "Reintentar" fallaría siempre igual: corresponde volver al acceso.
                if error.requiereNuevaSesion {
                    Button(Strings.volverAEmpezar) { SessionState.shared.cerrar() }
                        .buttonStyle(.principalAjustado)
                } else if error.isRetryable {
                    Button(Strings.reintentar, action: reintentar)
                        .buttonStyle(.principalAjustado)
                }
            }
            .padding(Espacio.xxl)
            .frame(maxWidth: 360)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .stroke(Color.white.opacity(0.12))
            }
            .shadow(color: .black.opacity(0.35), radius: 36, y: 18)
            .padding(.horizontal, Espacio.xl)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .accessibilityElement(children: .contain)
    }
}
