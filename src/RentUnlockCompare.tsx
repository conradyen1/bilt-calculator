import React from "react";

type CardId = "blue" | "obsidian" | "palladium";
type ObsidianChoice = "dining" | "grocery";

type Card = {
  id: CardId;
  name: string;
  annualFee: number;
};

const CARDS: Card[] = [
  { id: "blue", name: "Bilt Blue", annualFee: 0 },
  { id: "obsidian", name: "Bilt Obsidian", annualFee: 95 },
  { id: "palladium", name: "Bilt Palladium", annualFee: 495 },
];

// ----- Option 2: Bilt Cash -> unlock housing points -----
const CASHBACK_RATE = 0.04;
const CASH_PER_POINT = 30 / 1000; // $0.03 per point

const OBSIDIAN_3X_OPTIONS: { value: ObsidianChoice; label: string }[] = [
  { value: "dining", label: "Dining" },
  { value: "grocery", label: "Grocery" },
];

// ----- Option 1: Tiered housing points -----
const OPTION1_SPEND_FOR_1X = 0.75;

type Inputs = {
  rent: number;

  // new: total monthly spend (non-rent)
  totalSpend: number;

  // new: category allocation (percent)
  pctDining: number;
  pctGrocery: number;
  pctTravel: number;
};

function clamp0(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function int(n: number) {
  return Math.round(n).toLocaleString();
}

function yearly(n: number) {
  return n * 12;
}

const PCT_OPTIONS = Array.from({ length: 21 }, (_, i) => i * 5); // 0..100 step 5

function categoryPercents(i: Inputs) {
  const dining = clamp0(i.pctDining);
  const grocery = clamp0(i.pctGrocery);
  const travel = clamp0(i.pctTravel);

  const sum = dining + grocery + travel;
  const other = Math.max(0, 100 - sum);

  return { dining, grocery, travel, other, sum };
}

function normalizedPercents(i: Inputs) {
  const p = categoryPercents(i);
  if (p.sum <= 100) {
    return p;
  }

  const scale = p.sum > 0 ? 100 / p.sum : 0;
  return {
    dining: p.dining * scale,
    grocery: p.grocery * scale,
    travel: p.travel * scale,
    other: 0,
    sum: 100,
  };
}

function categoryAmounts(i: Inputs) {
  const total = clamp0(i.totalSpend);
  const p = normalizedPercents(i);

  const dining = (total * p.dining) / 100;
  const grocery = (total * p.grocery) / 100;
  const travel = (total * p.travel) / 100;
  const other = (total * p.other) / 100;

  return { dining, grocery, travel, other, total };
}

function spendPoints(
  card: Card,
  a: { dining: number; grocery: number; travel: number; other: number },
  choice: ObsidianChoice,
) {
  const dining = clamp0(a.dining);
  const grocery = clamp0(a.grocery);
  const travel = clamp0(a.travel);
  const other = clamp0(a.other);

  if (card.id === "blue") {
    // base: 1X everywhere
    return dining + grocery + travel + other;
  }

  if (card.id === "palladium") {
    // base: 2X everywhere (excluding housing)
    return 2 * (dining + grocery + travel + other);
  }

  // obsidian: 3X chosen (dining or grocery), 2X travel, 1X everything else
  const chosenBase = choice === "dining" ? dining : grocery;
  const nonChosenBase = choice === "dining" ? grocery : dining;
  return 3 * chosenBase + 2 * travel + 1 * (nonChosenBase + other);
}

function rentPointsOption1(i: Inputs) {
  const rent = clamp0(i.rent);
  const totalSpend = clamp0(i.totalSpend);

  const required = OPTION1_SPEND_FOR_1X * rent;
  const ratio = required <= 0 ? 0 : Math.min(1, totalSpend / required);
  const rentPts = rent * ratio;

  const extraSpendNeeded = Math.max(0, required - totalSpend);
  return { rentPts, extraSpendNeeded };
}

function rentPointsOption2(i: Inputs) {
  const rent = clamp0(i.rent);
  const totalSpend = clamp0(i.totalSpend);

  if (CASHBACK_RATE <= 0 || CASH_PER_POINT <= 0) {
    return { rentPts: 0, extraSpendNeeded: 0, biltCashEarned: 0 };
  }

  const cash = totalSpend * CASHBACK_RATE;
  const unlockablePts = cash / CASH_PER_POINT;
  const rentPts = Math.min(rent, unlockablePts);

  const requiredSpend = rent * (CASH_PER_POINT / CASHBACK_RATE); // 0.75 * rent
  const extraSpendNeeded = Math.max(0, requiredSpend - totalSpend);

  return { rentPts, extraSpendNeeded, biltCashEarned: cash };
}

function SelectPct({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium">{label}</div>
      <select
        className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      >
        {PCT_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}%
          </option>
        ))}
      </select>
    </label>
  );
}

function ResultCard({ card, i }: { card: Card; i: Inputs }) {
  const [obsidianChoice, setObsidianChoice] =
    React.useState<ObsidianChoice>("dining");
  const amounts = categoryAmounts(i);
  const spendPts = spendPoints(
    card,
    amounts,
    card.id === "obsidian" ? obsidianChoice : "dining",
  );

  const o1 = rentPointsOption1(i);
  const o2 = rentPointsOption2(i);

  const totalO1 = spendPts + o1.rentPts;
  const totalO2 = spendPts + o2.rentPts;

  const annualFee = card.annualFee;

  const annualO1 = {
    rentPts: yearly(o1.rentPts),
    spendPts: yearly(spendPts),
    totalPts: yearly(totalO1),
    // out-of-pocket “cost” here is just annual fee (since spend is not a cost of the card)
    fee: annualFee,
  };

  const annualO2 = {
    rentPts: yearly(o2.rentPts),
    spendPts: yearly(spendPts),
    totalPts: yearly(totalO2),
    biltCash: yearly(o2.biltCashEarned),
    fee: annualFee,
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold">{card.name}</div>
          <div className="text-xs text-muted-foreground">
            Annual fee: {money(card.annualFee)}
          </div>
        </div>
        {card.id === "obsidian" && (
          <div className="flex justify-between gap-3">
            <div className="flex items-center justify-center text-xs text-muted-foreground">
              3X
            </div>
            <select
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={obsidianChoice} // ✅ selection shown in dropdown
              onChange={(e) =>
                setObsidianChoice(e.target.value as ObsidianChoice)
              }
            >
              {OBSIDIAN_3X_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="rounded-lg bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total spend / month</span>
            <span className="font-medium">{money(amounts.total)}</span>
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Dining</span>
              <span>{money(amounts.dining)}</span>
            </div>
            <div className="flex justify-between">
              <span>Grocery</span>
              <span>{money(amounts.grocery)}</span>
            </div>
            <div className="flex justify-between">
              <span>Travel</span>
              <span>{money(amounts.travel)}</span>
            </div>
            <div className="flex justify-between">
              <span>Other</span>
              <span>{money(amounts.other)}</span>
            </div>
          </div>
        </div>

        {/* Option 1 */}
        <div className="rounded-lg border p-3">
          <div className="text-sm font-semibold">Option 1 (Tiered)</div>
          <div className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rent points earned</span>
              <span className="font-medium">{int(o1.rentPts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Extra spend to reach 1X rent
              </span>
              <span className="font-medium">{money(o1.extraSpendNeeded)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spend points</span>
              <span className="font-medium">{int(spendPts)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Total points</span>
              <span className="font-semibold">{int(totalO1)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-muted/30 text-sm">
              <div className="text-sm font-semibold">Annual summary</div>

              <div className="mt-2 grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Rent points / year
                  </span>
                  <span className="font-medium">{int(annualO1.rentPts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Spend points / year
                  </span>
                  <span className="font-medium">{int(annualO1.spendPts)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Total points / year</span>
                  <span className="font-semibold">
                    {int(annualO1.totalPts)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual fee</span>
                  <span className="font-medium">{money(annualO1.fee)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Extra spend / year to reach 1X
                  </span>
                  <span className="font-medium">
                    {money(yearly(o1.extraSpendNeeded))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Option 2 */}
        <div className="rounded-lg border p-3">
          <div className="text-sm font-semibold">
            Option 2 (Bilt Cash → rent points)
          </div>
          <div className="mt-2 grid gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bilt Cash earned</span>
              <span className="font-medium">{money(o2.biltCashEarned)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Rent points unlocked
              </span>
              <span className="font-medium">{int(o2.rentPts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Extra spend to reach 1X rent
              </span>
              <span className="font-medium">{money(o2.extraSpendNeeded)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spend points</span>
              <span className="font-medium">{int(spendPts)}</span>
            </div>
            <div className="flex justify-between border-t pt-1">
              <span className="font-medium">Total points</span>
              <span className="font-semibold">{int(totalO2)}</span>
            </div>

            <div className="mt-2 rounded-lg bg-muted/30 text-sm">
              <div className="text-sm font-semibold">Annual summary</div>

              <div className="mt-2 grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Bilt Cash / year
                  </span>
                  <span className="font-medium">
                    {money(annualO2.biltCash)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Rent points / year
                  </span>
                  <span className="font-medium">{int(annualO2.rentPts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Spend points / year
                  </span>
                  <span className="font-medium">{int(annualO2.spendPts)}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-medium">Total points / year</span>
                  <span className="font-semibold">
                    {int(annualO2.totalPts)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual fee</span>
                  <span className="font-medium">{money(annualO2.fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Extra spend / year to reach 1X
                  </span>
                  <span className="font-medium">
                    {money(yearly(o2.extraSpendNeeded))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RentUnlockCompare() {
  const [i, setI] = React.useState<Inputs>({
    rent: 3500,
    totalSpend: 3500 * 0.75,

    pctDining: 25,
    pctGrocery: 25,
    pctTravel: 10,

    // obsidianChoice: "dining",
  });

  const p = categoryPercents(i);
  const overAllocated = p.sum > 100;

  // Helpers to keep dropdowns valid: if sum > 100, visually warn + disable “Other” (auto)
  // You can also auto-clamp, but warning is less surprising.

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          Rent Points Unlock Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Set your monthly rent, total non-rent spend, and category allocation.
          Compare Blue / Obsidian / Palladium across both earning options.
        </p>
      </div>

      {/* Inputs */}
      <div className="mt-6 rounded-xl border bg-background p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <div className="text-sm font-medium">Monthly rent</div>
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              inputMode="decimal"
              value={i.rent}
              onChange={(e) =>
                setI((s) => ({
                  ...s,
                  rent: Number(e.target.value),
                  totalSpend: Number(e.target.value) * 0.75,
                }))
              }
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">
              Total monthly spend (non-rent)
            </div>
            <input
              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
              inputMode="decimal"
              value={i.totalSpend}
              onChange={(e) =>
                setI((s) => ({ ...s, totalSpend: Number(e.target.value) }))
              }
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Used to compute Bilt Cash (Option 2) and points on spending (all
              cards).
            </div>
          </label>
        </div>

        <div className="mt-5 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Category allocation</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Pick % splits. <span className="font-medium">Other</span>{" "}
                auto-fills the remainder.
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-muted-foreground">Allocated</div>
              <div
                className={`font-semibold ${overAllocated ? "text-red-600" : ""}`}
              >
                {p.sum}%{" "}
                <span className="text-muted-foreground font-normal">
                  (+ Other {p.other}%)
                </span>
              </div>
            </div>
          </div>

          {overAllocated && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Your Dining + Grocery + Travel exceeds 100%. Reduce one of them.
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <SelectPct
              label="Dining %"
              value={i.pctDining}
              onChange={(v) => setI((s) => ({ ...s, pctDining: v }))}
            />
            <SelectPct
              label="Grocery %"
              value={i.pctGrocery}
              onChange={(v) => setI((s) => ({ ...s, pctGrocery: v }))}
            />
            <SelectPct
              label="Travel %"
              value={i.pctTravel}
              onChange={(v) => setI((s) => ({ ...s, pctTravel: v }))}
            />

            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">Other % (auto)</div>
              <div className="mt-2 text-lg font-semibold">{p.other}%</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Remaining share of total spend.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {CARDS.map((card) => (
          <ResultCard key={card.id} card={card} i={i} />
        ))}
      </div>
    </div>
  );
}
