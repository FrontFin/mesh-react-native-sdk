import React from "react";

export interface FrontFinanceProps {
  url: string;
  onReceive?: (payload: any) => any;
  onError?: (error: any) => any;
}

declare const FrontFinance: React.FC<FrontFinanceProps>;
export { FrontFinance };
