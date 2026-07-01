import type { CostStatus, DefaultFundingSourceType, FundingSourceType } from "@/types";

export const COST_STATUS_LABELS: Record<CostStatus, string> = {
  estimate: "Ocena",
  inquiry: "Povpraševanje",
  offer: "Ponudba",
  contracted: "Pogodbeno",
  partly_paid: "Delno plačano",
  paid: "Plačano",
  cancelled: "Preklicano"
};

export const FUNDING_SOURCE_TYPE_LABELS: Record<DefaultFundingSourceType, string> = {
  own_funds: "Lastna sredstva",
  loan: "Kredit",
  mixed: "Mešano (50/50)"
};

export const FUNDING_SOURCE_KIND_LABELS: Record<FundingSourceType, string> = {
  own_funds: "Lastna sredstva",
  loan: "Kredit",
  family_support: "Pomoč družine",
  sale_income: "Prihodek od prodaje",
  grant: "Nepovratna sredstva",
  reserve: "Rezerva",
  other: "Drugo"
};

export const PAYMENT_EVENT_STATUS_LABELS: Record<string, string> = {
  planned: "Planirano",
  due: "Zapadlo",
  paid: "Plačano",
  overdue: "Zamuja",
  cancelled: "Preklicano"
};
