import React from 'react';

export interface FrontFinanceProps {
    client_id: string;
    client_secret: string;
    userId: string;
    onReceive?: () => any;
    onError?: () => any;
}

declare const FrontFinance: React.FC<FrontFinanceProps>;
export default FrontFinance;