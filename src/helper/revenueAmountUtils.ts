export function parseRevenueAmount(value: string | undefined): number | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return 0;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

/** Booking / booking revenue (Revenue Details pay now) — same rules as web BookingForm. */
export function validateBookingRevenueWhenPaid(params: {
  paidFee?: string;
  damageDeposit?: string;
  paidType?: string;
  damageDepositPaidType?: string;
}): { ok: true } | { ok: false; message: string } {
  const feeAmount = parseRevenueAmount(params.paidFee);
  const depositAmount = parseRevenueAmount(params.damageDeposit);

  if (feeAmount === null || depositAmount === null) {
    return { ok: false, message: "Fee and deposit amounts must be valid numbers." };
  }

  const bothZero = feeAmount === 0 && depositAmount === 0;
  if (bothZero) return { ok: true };

  if (feeAmount > 0 && (!params.paidType || params.paidType === "NONE")) {
    return {
      ok: false,
      message: "Payment type is required when the fee amount is greater than zero.",
    };
  }

  if (
    depositAmount > 0 &&
    (!params.damageDepositPaidType || params.damageDepositPaidType === "NONE")
  ) {
    return {
      ok: false,
      message:
        "Deposit payment type is required when the deposit amount is greater than zero.",
    };
  }

  return { ok: true };
}

export function bookingRevenueAmountsForPayload(
  paidFee?: string,
  damageDeposit?: string,
): { paidFee: string; damageDeposit: string } {
  const feeAmount = parseRevenueAmount(paidFee) ?? 0;
  const depositAmount = parseRevenueAmount(damageDeposit) ?? 0;
  const bothZero = feeAmount === 0 && depositAmount === 0;

  return {
    paidFee: paidFee?.trim() || (bothZero ? "0" : ""),
    damageDeposit: damageDeposit?.trim() || (bothZero ? "0" : ""),
  };
}

/** Filter / device / pass / rental — same message as web Purchases & Revenue Details. */
export const PURCHASE_REVENUE_PAID_VALIDATION_MESSAGE =
  "When marked to pay, amount and payment type (other than None) are required.";

export function validatePurchaseRevenueWhenPaid(params: {
  paidAmount?: string | null;
  paidType?: string | null;
}): { ok: true } | { ok: false; message: string } {
  if (
    !String(params.paidAmount ?? "").trim() ||
    (params.paidType ?? "NONE") === "NONE"
  ) {
    return { ok: false, message: PURCHASE_REVENUE_PAID_VALIDATION_MESSAGE };
  }
  return { ok: true };
}

/** Explicit nulls so API clears prior fee / payment / deposit (same as web). */
export function unpaidBookingRevenuePayload() {
  return {
    isPaid: false as const,
    paidType: "NONE" as const,
    damageDepositPaidType: "NONE" as const,
    paidFee: null,
    receiptNumber: null,
    damageDeposit: null,
    depositReceiptNumber: null,
  };
}
