export const fetchDiscountCode = async (_email: string): Promise<{ status: string; discountCode: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { status: 'success', discountCode: 'SPORTCITY-2026-VITALITY' };
};
