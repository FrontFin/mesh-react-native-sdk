import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";

const FormControl = (props: any) => {
  const {
    env_options,
    client_id,
    client_secret,
    user_id,
    setUserId,
    setClientId,
    setClientSecret,
    env,
    setEnv,
    getAuthLink
  } = props;

  const [showOptions, setShowOptions] = useState(false);

  return (
    <SafeAreaView>
      <StatusBar backgroundColor="red" translucent style="auto" />
      <View style={{ flex: 1, marginTop: 100 }}>
        <View style={{ height: 80 }}>
          <Text style={{ fontSize: 16, left: 10 }}>Select Env:</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "black",
              borderRadius: 20,
              justifyContent: "space-evenly",
              top: 10,
            }}
          >
            <TextInput
              style={{
                height: 40,
                width: "80%",
              }}
              editable={false}
              value={env}
              onChangeText={setEnv}
            />
            <TouchableOpacity
              onPress={() => {
                setShowOptions(!showOptions);
              }}
            >
              <Text>v</Text>
            </TouchableOpacity>
          </View>
          {showOptions && (
            <View
              style={{
                height: 100,
                width: "100%",
                alignSelf: "center",
                zIndex: 10,
                top: 80,
                position: "absolute",
              }}
            >
              {env_options.map((option: any) => {
                return (
                  <TouchableOpacity
                    style={{
                      height: 40,
                      backgroundColor: "black",
                      marginVertical: 3,
                      borderBottomColor: "#161616",
                      borderBottomWidth: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      zIndex: 20,
                    }}
                    onPress={() => {
                      setEnv(option.name);
                      setShowOptions(false);
                    }}
                    key={option.index}
                  >
                    <Text style={{ color: "red", fontSize: 18 }}>
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        {!showOptions && (
          <>
            <View style={{ height: 80 }}>
              <Text style={{ fontSize: 16, left: 10 }}>
                Enter your Client Id
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "black",
                  height: 40,
                  width: "100%",
                  alignSelf: "center",
                  top: 10,
                }}
                value={client_id}
                onChangeText={setClientId}
              />
            </View>
            <View style={{ height: 140 }}>
              <Text style={{ fontSize: 16, left: 10 }}>
                Enter your Client Secret
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "black",
                  minHeight: 100,
                  width: "100%",
                  alignSelf: "center",
                  top: 10,
                  height: "auto",
                }}
                value={client_secret}
                onChangeText={setClientSecret}
                numberOfLines={3}
                multiline={true}
              />
            </View>
            <View style={{ height: 80 }}>
              <Text style={{ fontSize: 16, left: 10 }}>
                Enter your Unique User Id
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "black",
                  height: 40,
                  width: "100%",
                  alignSelf: "center",
                  top: 10,
                }}
                value={user_id}
                onChangeText={setUserId}
              />
            </View>
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
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default FormControl;
