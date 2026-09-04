export declare const useSDKStyles: (isDarkTheme: boolean) => {
    statusBarStyle: {
        backgroundColor: string;
    };
    navBarStyles: {
        navBarContainer: {
            flexDirection: "row";
            justifyContent: "space-between";
            alignItems: "center";
            height: number;
            paddingTop: number;
            paddingStart: number;
            paddingEnd: number;
            backgroundColor: string;
        };
        navBarImgContainer: {
            width: number;
            height: number;
            alignItems: "center";
            justifyContent: "center";
        };
        navBarImgButton: {
            width: number;
            height: number;
            resizeMode: "contain";
        };
        navBarLogo: {
            height: number;
            resizeMode: "contain";
        };
    };
};
