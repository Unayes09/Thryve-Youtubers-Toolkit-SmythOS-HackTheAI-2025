import { prisma } from "@/lib/prisma";
import { CREDIT_COSTS, CreditCostKey } from "@/lib/credit-costs";

/**
 * Deducts credits from a user's account
 * @param userId - The user's ID
 * @param costKey - The credit cost key from CREDIT_COSTS
 * @returns Promise<{ success: boolean; remainingCredits?: number; error?: string }>
 */
export async function deductCredits(
  userId: string,
  costKey: CreditCostKey
): Promise<{ success: boolean; remainingCredits?: number; error?: string }> {
  const cost = CREDIT_COSTS[costKey];

  try {
    // Deduct credits atomically
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: cost,
        },
      },
    });

    // Check if credits went negative
    if (updatedUser.credits < 0) {
      // Revert the deduction
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: cost } },
      });

      return {
        success: false,
        error: "Insufficient credits",
      };
    }

    return {
      success: true,
      remainingCredits: updatedUser.credits,
    };
  } catch (error) {
    console.error("Error deducting credits:", error);
    return {
      success: false,
      error: "Failed to deduct credits",
    };
  }
}
