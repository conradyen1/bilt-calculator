import type { CardProfile } from "./models";

export const sampleCards: CardProfile[] = [
  {
    id: "bilt_20_default",
    name: "Bilt 2.0 (Default)",
    annualFee: 0,
    rates: { rent: 1, dining: 3, travel: 2, other: 1 },
    minTransactionsPerMonthToEarn: 5,
    annualRentPointsCap: 100_000,
    rentDay: {
      type: "double_non_rent",
      monthlyBonusCapPoints: 10_000, // simplified
      appliesTo: ["dining", "travel", "other"],
    },
    notes: [
      "Requires 5+ transactions/month to earn points",
      "Rent points capped annually (profile assumption)",
      "Rent Day doubles non-rent points (simplified model)",
    ],
  },
  {
    id: "bilt_20_no_rentday",
    name: "Bilt 2.0 (No Rent Day)",
    annualFee: 0,
    rates: { rent: 1, dining: 3, travel: 2, other: 1 },
    minTransactionsPerMonthToEarn: 5,
    annualRentPointsCap: 100_000,
    rentDay: { type: "none" },
    notes: ["Same base earn, Rent Day disabled in this profile."],
  },
  {
    id: "flat_2x_points",
    name: "Flat 2x Points (Generic)",
    annualFee: 0,
    rates: { rent: 0, dining: 2, travel: 2, other: 2 }, // assumes rent doesn't earn (common case)
    rentDay: { type: "none" },
    notes: ["Useful benchmark if your rent can’t earn points on most cards."],
  },
  {
    id: "cashback_2pct",
    name: "2% Cashback (Benchmark)",
    annualFee: 0,
    rates: { rent: 0, dining: 0, travel: 0, other: 0 }, // handled separately? we’ll approximate via cpp below
    rentDay: { type: "none" },
    notes: [
      "Set pointValueCpp=2.0 and treat 'points' as cents to approximate cashback.",
      "This is a modeling trick; feel free to add a true cashback mode later.",
    ],
  },
];
