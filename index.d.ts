import React from "react";

export interface FrontFinanceProps {
  url: string;
  onReceive?: () => any;
  onError?: () => any;
}

declare function b2bCatalog(
  client_id: string,
  client_secret: string,
  user_id: string
): string;

declare const FrontFinance: React.FC<FrontFinanceProps>;
export { FrontFinance, b2bCatalog };
