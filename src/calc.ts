import type { CardProfile, CardResult, SpendInputs } from "@/models";

const round = (n: number) => Math.round(n);
const clampNonNeg = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

export function calcCard(card: CardProfile, input: SpendInputs): CardResult {
  const monthlyRent = clampNonNeg(input.monthlyRent);
  const rentFeePct = clampNonNeg(input.rentFeePct);
  const monthlyDining = clampNonNeg(input.monthlyDining);
  const monthlyTravel = clampNonNeg(input.monthlyTravel);
  const monthlyOther = clampNonNeg(input.monthlyOther);
  const txns = clampNonNeg(input.transactionsPerMonth);

  const useRentDay = !!input.useRentDay;
  const rentDayExtraSpend = clampNonNeg(input.rentDayExtraSpend);
  const cpp = clampNonNeg(input.pointValueCpp);

  const warnings: string[] = [];

  // Total monthly spend (we treat rent fee as a cash cost, not “spend earning points”)
  const monthlySpend =
    monthlyRent + monthlyDining + monthlyTravel + monthlyOther;

  // Check min txns requirement
  const minTxns = card.minTransactionsPerMonthToEarn ?? 0;
  const eligible = txns >= minTxns;
  if (minTxns > 0 && !eligible) {
    warnings.push(
      `Not eligible: requires ${minTxns}+ transactions/month to earn points (you entered ${txns}).`,
    );
  }

  // Points from rent
  let annualRentPoints = eligible ? monthlyRent * 12 * card.rates.rent : 0;

  // Apply annual rent points cap if any
  if (card.annualRentPointsCap != null) {
    if (annualRentPoints > card.annualRentPointsCap) {
      warnings.push(
        `Rent points capped at ${card.annualRentPointsCap.toLocaleString()} points/year for this profile.`,
      );
      annualRentPoints = card.annualRentPointsCap;
    }
  }

  // Non-rent base points
  const annualDiningPoints = eligible
    ? monthlyDining * 12 * card.rates.dining
    : 0;
  const annualTravelPoints = eligible
    ? monthlyTravel * 12 * card.rates.travel
    : 0;
  const annualOtherPoints = eligible ? monthlyOther * 12 * card.rates.other : 0;

  let annualBasePoints =
    annualRentPoints +
    annualDiningPoints +
    annualTravelPoints +
    annualOtherPoints;

  // Rent Day bonus (simplified: doubles *non-rent* points on selected categories up to a monthly bonus cap)
  let annualBonusPoints = 0;

  if (useRentDay && card.rentDay.type !== "none" && eligible) {
    const rd = card.rentDay;
    if (rd.type === "double_non_rent") {
      // We allow user to shift some spend onto Rent Day: treat it as “other” spend bucket by default.
      // You can improve this later by allocating across categories.
      const shift = Math.min(
        rentDayExtraSpend,
        monthlyDining + monthlyTravel + monthlyOther,
      );
      if (rentDayExtraSpend > shift) {
        warnings.push(
          "Rent Day extra spend exceeds your non-rent spend; extra ignored.",
        );
      }

      // Determine which categories get doubled bonus (bonus = +base points for that spend portion)
      // For simplicity: bonus points from “shifted spend” are computed using a blended earn rate.
      const totalEligibleNonRent =
        (rd.appliesTo.includes("dining") ? monthlyDining : 0) +
        (rd.appliesTo.includes("travel") ? monthlyTravel : 0) +
        (rd.appliesTo.includes("other") ? monthlyOther : 0);

      const blendedRate =
        totalEligibleNonRent > 0
          ? ((rd.appliesTo.includes("dining")
              ? monthlyDining * card.rates.dining
              : 0) +
              (rd.appliesTo.includes("travel")
                ? monthlyTravel * card.rates.travel
                : 0) +
              (rd.appliesTo.includes("other")
                ? monthlyOther * card.rates.other
                : 0)) /
            totalEligibleNonRent
          : 0;

      const monthlyBonus = Math.min(
        shift * blendedRate,
        rd.monthlyBonusCapPoints,
      );
      annualBonusPoints = monthlyBonus * 12;

      if (shift > 0 && blendedRate === 0) {
        warnings.push(
          "Rent Day selected, but no eligible categories configured for doubling in this profile.",
        );
      }
      if (shift * blendedRate > rd.monthlyBonusCapPoints) {
        warnings.push(
          `Rent Day bonus capped at ${rd.monthlyBonusCapPoints.toLocaleString()} bonus points/month for this profile.`,
        );
      }
    }
  }

  const annualTotalPoints = annualBasePoints + annualBonusPoints;

  // Value
  const annualPointValueUSD = (annualTotalPoints * cpp) / 100;

  // Fees: annual fee + rent fee cash cost
  const annualRentFeeUSD = monthlyRent * (rentFeePct / 100) * 12;
  const annualFeesUSD = card.annualFee + annualRentFeeUSD;

  const netValueUSD = annualPointValueUSD - annualFeesUSD;

  const annualSpendUSD = monthlySpend * 12;
  const effectiveReturnPct =
    annualSpendUSD > 0 ? (netValueUSD / annualSpendUSD) * 100 : 0;

  // Warn on rent fee
  if (annualRentFeeUSD > 0) {
    warnings.push(
      `Rent fee cost included: $${annualRentFeeUSD.toFixed(2)}/year.`,
    );
  }

  return {
    cardId: card.id,
    cardName: card.name,
    annualBasePoints: round(annualBasePoints),
    annualBonusPoints: round(annualBonusPoints),
    annualTotalPoints: round(annualTotalPoints),
    annualPointValueUSD: Number(annualPointValueUSD.toFixed(2)),
    annualFeesUSD: Number(annualFeesUSD.toFixed(2)),
    netValueUSD: Number(netValueUSD.toFixed(2)),
    effectiveReturnPct: Number(effectiveReturnPct.toFixed(2)),
    warnings,
  };
}

export function compareCards(
  cards: CardProfile[],
  input: SpendInputs,
): CardResult[] {
  return cards
    .map((c) => calcCard(c, input))
    .sort((a, b) => b.netValueUSD - a.netValueUSD);
}
