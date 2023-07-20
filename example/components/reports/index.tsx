import React from "react";
import { View, Text } from "react-native";
import {AccessTokenPayload} from "@front-finance/frontfinance-rn-sdk";

const Reports = (props: {data: AccessTokenPayload}) => {
  const data = props.data;
  if (data) {
    return (
      <View>
        <Text>
          <Text style={{ fontWeight: "bold" }}>Broker:</Text> {data?.brokerName}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Token:</Text>{" "}
          {data?.accountTokens[0].accessToken}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Refresh Token:</Text>{" "}
          {data?.accountTokens[0].refreshToken}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>
            Token expires in seconds:
          </Text>{" "}
          {data?.expiresInSeconds}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>ID:</Text>{" "}
          {data?.accountTokens[0].account.accountId}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Name:</Text>{" "}
          {data?.accountTokens[0].account.accountName}
          {"\n"}
          <Text style={{ fontWeight: "bold" }}>Cash:</Text> $
          {data?.accountTokens[0].account.cash}
          {"\n"}
        </Text>
      </View>
    );
  } else {
    return null;
  }
};

export default Reports;
