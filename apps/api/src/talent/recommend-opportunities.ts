export interface RecommendationProfile {
  fieldOfStudy: string | null;
  city: string | null;
  weeklyAvailabilityHours: number | null;
  preferredModalities: string[];
  causeInterests: string[];
  roleInterests: string[];
}

export interface OpportunityCandidate {
  id: string;
  title: string;
  description: string;
  organizationName: string;
  organizationIsTrusted: boolean;
  cause: string | null;
  modality: string;
  location: string | null;
  weeklyHours: number | null;
  applicationDeadline: Date | null;
  requiredSkills: string[];
  startDate: Date;
  endDate: Date | null;
}

export type RecommendedOpportunity = OpportunityCandidate & {
  recommendationReasons: string[];
};

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function matchingValues(left: string[], right: string[]): string[] {
  const wanted = new Set(right.map(normalized));
  return left.filter((value) => wanted.has(normalized(value)));
}

/**
 * Recomendación v1, explicable y determinística.
 *
 * El puntaje solo ordena oportunidades durante este request. No se persiste,
 * no sale por la API y nunca califica al talento como persona.
 */
export function recommendOpportunities(
  profile: RecommendationProfile,
  verifiedSkills: string[],
  opportunities: OpportunityCandidate[],
): RecommendedOpportunity[] {
  const profileModalities = profile.preferredModalities.map(normalized);
  const profileCauses = profile.causeInterests.map(normalized);
  const searchableRoles = profile.roleInterests.map(normalized);
  const fieldTokens = normalized(profile.fieldOfStudy ?? '')
    .split(/\s+/)
    .filter((token) => token.length >= 4);

  return opportunities
    .map((opportunity) => {
      let rank = 0;
      const recommendationReasons: string[] = [];
      const matchedSkills = matchingValues(verifiedSkills, opportunity.requiredSkills);

      if (opportunity.cause && profileCauses.includes(normalized(opportunity.cause))) {
        rank += 5;
        recommendationReasons.push(`Conecta con tu interés en ${opportunity.cause}`);
      }

      if (profileModalities.includes(normalized(opportunity.modality))) {
        rank += 4;
        recommendationReasons.push('Coincide con tu modalidad preferida');
      }

      if (matchedSkills.length > 0) {
        rank += Math.min(matchedSkills.length, 3) * 3;
        recommendationReasons.push(
          `Aprovecha tu experiencia en ${matchedSkills.slice(0, 2).join(' y ')}`,
        );
      }

      const opportunityText = normalized(
        `${opportunity.title} ${opportunity.description} ${opportunity.requiredSkills.join(' ')}`,
      );
      if (searchableRoles.some((role) => opportunityText.includes(role))) {
        rank += 3;
        recommendationReasons.push('Se relaciona con los roles que quieres explorar');
      }

      if (fieldTokens.some((token) => opportunityText.includes(token))) {
        rank += 2;
        recommendationReasons.push('Se relaciona con tu área de formación');
      }

      if (
        profile.weeklyAvailabilityHours &&
        opportunity.weeklyHours &&
        opportunity.weeklyHours <= profile.weeklyAvailabilityHours
      ) {
        rank += 2;
        recommendationReasons.push('Encaja con tu disponibilidad semanal');
      }

      if (
        profile.city &&
        opportunity.location &&
        normalized(opportunity.location).includes(normalized(profile.city))
      ) {
        rank += 2;
        recommendationReasons.push('Está disponible en tu ciudad');
      }

      if (recommendationReasons.length === 0) {
        recommendationReasons.push(
          opportunity.organizationIsTrusted
            ? 'Nueva oportunidad de una organización verificada'
            : 'Nueva oportunidad abierta para voluntariado',
        );
      }

      return { opportunity, rank, recommendationReasons };
    })
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      const aDeadline = a.opportunity.applicationDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bDeadline = b.opportunity.applicationDeadline?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aDeadline - bDeadline;
    })
    .map(({ opportunity, recommendationReasons }) => ({
      ...opportunity,
      recommendationReasons: recommendationReasons.slice(0, 3),
    }));
}
