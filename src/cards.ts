export type CardId = "blue" | "obsidian" | "palladium";

export type BiltCard = {
  id: CardId;
  name: string;
  annualFee: number;
  tagline: string;
  highlights: string[];

  // Calculator fields:
  points: {
    rent: number; // up to 1X
    everyday: number; // non-rent everyday
    travel?: number; // if applicable
    chosen3x?: number; // if applicable (obsidian)
  };

  // optional: show Bilt Cash as separate from points (if you want)
  biltCashEverydayPct: number; // e.g. 0.04 for 4%
};

export const BILT_CARDS: BiltCard[] = [
  {
    id: "blue",
    name: "Bilt Blue",
    annualFee: 0,
    tagline: "No annual fee",
    highlights: [
      "Up to 1X points on rent and mortgage",
      "1X points on everyday purchases",
      "4% back in Bilt Cash on everyday purchases (excluding rent/mortgage)",
    ],
    points: { rent: 1, everyday: 1 },
    biltCashEverydayPct: 0.04,
  },
  {
    id: "obsidian",
    name: "Bilt Obsidian",
    annualFee: 95,
    tagline: "Pick dining or grocery for 3X",
    highlights: [
      "Choose dining or grocery as 3X category annually",
      "2X points on travel",
      "Up to 1X points on rent and mortgage",
      "Hotel credit (via Bilt Travel portal)",
    ],
    points: { rent: 1, everyday: 1, travel: 2, chosen3x: 3 },
    biltCashEverydayPct: 0.04,
  },
  {
    id: "palladium",
    name: "Bilt Palladium",
    annualFee: 495,
    tagline: "Premium card",
    highlights: [
      "2X points on everyday purchases (excluding rent/mortgage)",
      "Up to 1X points on rent and mortgage",
      "$200 Bilt Cash annually + hotel credits",
      "Priority Pass",
    ],
    points: { rent: 1, everyday: 2 },
    biltCashEverydayPct: 0.04,
  },
];
