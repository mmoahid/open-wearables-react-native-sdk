import { Ionicons } from "@expo/vector-icons";
import OpenWearablesHealthSDK from "open-wearables";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Group } from "./Group";
import { INITIAL_HOST } from "../utils/constants";

interface SessionGroupProperties {
  credentials: Record<string, any>;
  onConnectSuccess?: () => void;
}

export function SessionGroup({
  credentials,
  onConnectSuccess,
}: SessionGroupProperties) {
  const [hostInput, setHostInput] = useState(INITIAL_HOST);
  const [invitationCode, setInvitationCode] = useState("");
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (credentials.host) {
      setHostInput(credentials.host);
    }
  }, [credentials]);

  const normalizeHost = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.length === 0) return "";

    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    try {
      const url = new URL(withScheme);
      return url.origin;
    } catch {
      return withScheme.replace(/\/+$/, "");
    }
  };

  const readJsonResponse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        text.trim().startsWith("<")
          ? "The server sent a web page instead of app data. Use only the base Mo Health Sync server URL, with no /docs at the end."
          : "The server sent a response the app could not read."
      );
    }
  };

  const connect = async () => {
    setConnecting(true);
    try {
      const host = normalizeHost(hostInput);
      const code = invitationCode.trim().toUpperCase();

      if (host.length === 0) {
        Alert.alert("Connect failed", "Enter the server URL first.");
        return;
      }

      if (!/^https?:\/\/[^\s/]+/i.test(host)) {
        Alert.alert(
          "Connect failed",
          "Use the Mo Health Sync server URL. It should start with https://, or http:// for same-Wi-Fi testing."
        );
        return;
      }

      setHostInput(host);
      setInvitationCode(code);
      OpenWearablesHealthSDK.configure(host);

      const response = await fetch(
        `${host}/api/v1/invitation-code/redeem`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        }
      );

      if (!response.ok) {
        const res = await readJsonResponse(response);
        Alert.alert("Connect failed", res.detail || `HTTP ${response.status}`);
        return;
      }

      const data = await readJsonResponse(response);
      const userId = data.user_id as string | null;
      const accessToken = data.access_token as string | null;
      const refreshToken = data.refresh_token as string | null;
      if (userId == null || accessToken == null || refreshToken == null)
        throw new Error("Invalid response from server");

      const bearerToken = accessToken.startsWith("Bearer ")
        ? accessToken
        : `Bearer ${accessToken}`;

      await OpenWearablesHealthSDK.signIn(
        userId,
        bearerToken,
        refreshToken,
        null
      );
      onConnectSuccess?.();
    } catch (e: any) {
      const message = e?.message ?? String(e);
      Alert.alert(
        "Connect error",
        message === "Network request failed"
          ? "The phone could not reach the Mo Health Sync server. Check that the URL is correct and the server is running."
          : message
      );
    } finally {
      setConnecting(false);
    }
  };

  const canConnect =
    !connecting && hostInput.trim().length > 0 && invitationCode.trim().length > 0;

  return (
    <Group name="Mo Health Sync Connection">
      <View style={styles.inputsContainer}>
        <View style={styles.inputRow}>
          <Ionicons name="globe-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            onChangeText={setHostInput}
            value={hostInput}
            placeholder="Mo Health Sync server URL"
            placeholderTextColor="#48484A"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.separator} />
        <View style={styles.inputRow}>
          <Ionicons name="ticket-outline" size={20} color="#8E8E93" />
          <TextInput
            style={styles.input}
            onChangeText={setInvitationCode}
            value={invitationCode}
            placeholder="One-time connection code"
            placeholderTextColor="#48484A"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>
      <Pressable
        onPress={connect}
        disabled={!canConnect}
        style={({ pressed }) => [
          styles.connectButton,
          !canConnect && styles.connectButtonDisabled,
          pressed && canConnect && styles.connectButtonPressed,
        ]}
      >
        <Text style={styles.connectButtonText}>
          {connecting ? "Connecting…" : "Connect"}
        </Text>
      </Pressable>
    </Group>
  );
}

const styles = StyleSheet.create({
  inputsContainer: {
    backgroundColor: "#2C2C2E",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#38383A",
    marginLeft: 42,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  connectButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  connectButtonDisabled: {
    opacity: 0.45,
  },
  connectButtonPressed: {
    opacity: 0.85,
  },
  connectButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
});
