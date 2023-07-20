import React from "react";
import { View, Text } from "react-native";

const Reports = (props) => {
  const { data } = props;
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
  }
};

export default Reports;
