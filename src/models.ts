export type SpendInputs = {
  monthlyRent: number; // $ / month
  rentFeePct: number; // % fee if any (0 if none)
  monthlyDining: number;
  monthlyTravel: number;
  monthlyOther: number;

  transactionsPerMonth: number; // to satisfy “min txns to earn”
  useRentDay: boolean;
  rentDayExtraSpend: number; // extra non-rent spend you can shift onto rent day ($/month)
  pointValueCpp: number; // cents per point valuation, for $ value estimate
};

export type EarnRates = {
  rent: number; // points per $
  dining: number;
  travel: number;
  other: number;
};

export type RentDayRule =
  | { type: "none" }
  | {
      type: "double_non_rent";
      monthlyBonusCapPoints: number; // cap of *bonus* points earned from doubling (simplified)
      appliesTo: Array<"dining" | "travel" | "other">;
    };

export type CardProfile = {
  id: string;
  name: string;

  annualFee: number;

  rates: EarnRates;

  // Eligibility / rules
  minTransactionsPerMonthToEarn?: number; // e.g. 5
  annualRentPointsCap?: number; // e.g. 100000 points/year

  rentDay: RentDayRule;

  notes?: string[];
};

export type CardResult = {
  cardId: string;
  cardName: string;

  annualBasePoints: number;
  annualBonusPoints: number;
  annualTotalPoints: number;

  annualPointValueUSD: number;

  annualFeesUSD: number; // annual fee + rent fee cost
  netValueUSD: number; // point value - fees
  effectiveReturnPct: number; // netValue / total spend

  warnings: string[];
};
