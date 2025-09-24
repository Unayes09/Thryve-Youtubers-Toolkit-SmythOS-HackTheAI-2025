"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CREDIT_COSTS, CREDIT_COST_DESCRIPTIONS } from "@/lib/credit-costs";

interface CreditCostsDropdownProps {
  credits: number;
}

export function CreditCostsDropdown({ credits }: CreditCostsDropdownProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className="bg-primary text-white rounded-full px-3 py-1 cursor-help">
            Credits: {credits}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="w-80 p-4 bg-white border border-gray-200 shadow-lg"
        >
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-gray-900 mb-2">
              Credit Costs
            </h3>
            <div className="space-y-2">
              {Object.entries(CREDIT_COSTS).map(([key, cost]) => (
                <div
                  key={key}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 flex-1">
                    {
                      CREDIT_COST_DESCRIPTIONS[
                        key as keyof typeof CREDIT_COST_DESCRIPTIONS
                      ]
                    }
                  </span>
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {cost} credits
                  </Badge>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Current Balance:</span>
                <Badge className="bg-primary text-white text-xs">
                  {credits} credits
                </Badge>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
