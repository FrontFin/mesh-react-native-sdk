import { StatusBar } from "expo-status-bar";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import FrontFinance from "@front-finance/frontfinance-rn-sdk";
import { useCallback, useEffect, useState } from "react";
import { FrontApi } from "@front-finance/api";
import FormControl from "./components/form";
import Reports from "./components/reports";
import { production_url, sandbox_url } from "./utility/constants";

const env_options = [
  { index: 0, name: "sandbox" },
  { index: 1, name: "production" },
];

export default function App() {
  const [data, setData] = useState(null);
  const [client_id, setClientId] = useState("");
  const [client_secret, setClientSecret] = useState("");
  const [user_id, setUserId] = useState("");
  const [view, setView] = useState(false);
  const [error, setError] = useState(null);
  const [iframeLink, setIframeLink] = useState("");
  const [env, setEnv] = useState("sandbox");

  const getAuthLink = useCallback(async () => {
    setError(null);
    const api = new FrontApi({
      baseURL: env === "sandbox" ? sandbox_url : production_url,
      headers: {
        "x-client-id": client_id,
        "x-client-secret": client_secret,
      },
    });
    try {
      console.log(user_id, "UID");
      // this request should be performed from the backend side
      const response = await api.managedAccountAuthentication.v1CataloglinkList(
        {
          // callbackUrl: window.location.href // insert your callback URL here
          userId: user_id,
        }
      );

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
      console.log(error, "CATE");
    }
  }, []);

  useEffect(() => {
    if (iframeLink.length) {
      setView(true);
    }
  }, [iframeLink]);

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
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="red" translucent style="auto" />
        <ScrollView contentContainerStyle={{ padding: 10 }}>
          <FormControl
            client_id={client_id}
            client_secret={client_secret}
            userId={user_id}
            env_options={env_options}
            env={env}
            setClientId={setClientId}
            setClientSecret={setClientSecret}
            setUserId={setUserId}
            setEnv={setEnv}
            getAuthLink={getAuthLink}
          />
          {data && <Reports data={data} />}
          {error && <Text style={{ color: "red" }}>Error: {error}</Text>}
        </ScrollView>
      </SafeAreaView>
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
