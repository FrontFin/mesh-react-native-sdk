import { StatusBar } from "expo-status-bar";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FrontFinance from "@front-finance/frontfinance-rn-sdk";
import { useCallback, useEffect, useState } from "react";
import { FrontApi } from "@front-finance/api";

export default function App() {
  const [data, setData] = useState(null);
  const [client_id, setClientId] = useState("");
  const [client_secret, setClientSecret] = useState("");
  const [user_id, setUserId] = useState("");
  const [view, setView] = useState(false);
  const [error, setError] = useState(null);
  const [iframeLink, setIframeLink] = useState("");

  const getAuthLink = useCallback(async () => {
    setError(null);
    const api = new FrontApi({
      baseURL: "https://sandbox-integration-api.getfront.com",
      headers: {
        "x-client-id": client_id,
        "x-client-secret": client_secret,
      },
    });
    try {
      // this request should be performed from the backend side
    const response = await api.managedAccountAuthentication.v1CataloglinkList({
      // callbackUrl: window.location.href // insert your callback URL here
      userId: user_id,
    });

    const data = response.data;
    if (response.status !== 200 || !data?.content) {
      const error = data?.message || response.statusText;
      setError(error);
    } else if (!data.content.url) {
      setError("Iframe url is empty");
    } else {
      setIframeLink(data.content.url);
    }
    } catch (error) {
      console.log(error,"CATE")
    }
  }, []);

  useEffect(() => {
    if (iframeLink.length) {
      setView(true);
    }
  }, [iframeLink]);

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

  if (view && iframeLink.length) {
    console.log(iframeLink, "URL");
    return (
      <FrontFinance
        url={iframeLink}
        onReceive={(payload) => {
          Alert.alert(
            "Success",
            `Broker: ${payload?.brokerName}
          Token: ${payload?.accountTokens[0].accessToken}
          Refresh Token: ${payload?.accountTokens[0].refreshToken}
          Token expiry: ${payload?.expiresInSeconds}
          ID: ${payload?.accountTokens[0].account.accountId}
          Name: ${payload?.accountTokens[0].account.accountName}
          Cash: ${payload?.accountTokens[0].account.cash}`,
            [
              {
                text: "back to app",
                onPress: () => {
                  setData(payload);
                  setView(false);
                },
              },
            ]
          );
        }}
        onError={(err) => console.log(err)}
      />
    );
  }

  if (!view) {
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
        {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
        <TouchableOpacity
          onPress={getAuthLink}
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
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});
