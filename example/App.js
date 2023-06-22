import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FrontFinance from "@front-finance/frontfinance-rn-sdk";
import { useCallback, useState } from "react";

export default function App() {
  const [data, setData] = useState(null);
  const [client_id, setClientId] = useState("");
  const [client_secret, setClientSecret] = useState("");
  const [user_id, setUserId] = useState("");
  const [view, setView] = useState(false);

  const renderFields = useCallback(() => {
    return (
      <View style={{ flex: 1, marginTop: 100 }}>
        <View style={{ height: 80 }}>
          <Text>Enter your Client Id</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "black",
              height: 40,
              width: "80%",
              alignSelf: "center",
              top: 20,
            }}
            value={client_id}
            onChangeText={setClientId}
          />
        </View>
        <View style={{ height: 80 }}>
          <Text>Enter your Client Secret</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "black",
              height: 40,
              width: "80%",
              alignSelf: "center",
              top: 20,
            }}
            value={client_secret}
            onChangeText={setClientSecret}
          />
        </View>
        <View style={{ height: 80 }}>
          <Text>Enter your Unique User Id</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "black",
              height: 40,
              width: "80%",
              alignSelf: "center",
              top: 20,
            }}
            value={user_id}
            onChangeText={setUserId}
          />
        </View>
      </View>
    );
  }, [client_id, client_secret, user_id]);

  if (view) {
    return (
      <FrontFinance
        client_id={client_id}
        client_secret={client_secret}
        userId={user_id}
        onReceive={(payload) => {
          setData(payload);
          setView(false);
        }}
        onError={(err) => console.log(err)}
      />
    );
  }
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="red" translucent style="auto" />
      {renderFields()}
      {data && (
        <View>
          <Text>
            <Text style={{ fontWeight: "bold" }}>Broker:</Text>{" "}
            {data?.brokerName}
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
      )}
      <TouchableOpacity
        onPress={() => setView(true)}
        style={{
          backgroundColor: "black",
          height: 50,
          width: "80%",
          alignSelf: "center",
          borderRadius: 50,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 100,
        }}
      >
        <Text style={{ textAlign: "center", fontSize: 18, color: "red" }}>
          Connect
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
});
