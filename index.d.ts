import React from 'react';

export interface FrontFinanceProps {
    url: string
    onReceive?: () => any;
    onError?: () => any;
}

declare const FrontFinance: React.FC<FrontFinanceProps>;
export default FrontFinance;