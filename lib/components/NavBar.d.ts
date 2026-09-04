import React from 'react';
type NavBarProps = {
    goBack: () => void;
    showCloseAlert: () => void;
    isDarkTheme: boolean;
};
export declare const NavBar: ({ goBack, showCloseAlert, isDarkTheme }: NavBarProps) => React.JSX.Element;
export {};
