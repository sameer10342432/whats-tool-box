import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+92", country: "PK" },
  { code: "+91", country: "IN" },
  { code: "+971", country: "UAE" },
  { code: "+966", country: "SA" },
  { code: "+61", country: "AU" },
  { code: "+49", country: "DE" },
];

export default function DirectChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showCodes, setShowCodes] = useState(false);

  function buildUrl() {
    const cleanPhone = phone.replace(/\D/g, "");
    const fullNumber = countryCode.replace("+", "") + cleanPhone;
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${fullNumber}${message ? `?text=${encoded}` : ""}`;
  }

  async function openChat() {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 6) {
      Alert.alert("Invalid Number", "Please enter a valid phone number.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = buildUrl();
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "WhatsApp Not Found",
        "WhatsApp is not installed on this device."
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? "#1A2A1A" : "#F0FFF4" }]}>
          <Ionicons name="chatbubble-ellipses" size={22} color={Colors.primary} />
          <Text style={[styles.infoText, { color: theme.text }]}>
            Open a WhatsApp chat without saving the number to your contacts
          </Text>
        </View>

        {/* Phone Number */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={[styles.codeBtn, { borderColor: theme.border, backgroundColor: isDark ? Colors.dark.background : "#F9FAFB" }]}
              onPress={() => setShowCodes(!showCodes)}
            >
              <Text style={[styles.codeText, { color: theme.text }]}>{countryCode}</Text>
              <Ionicons name={showCodes ? "chevron-up" : "chevron-down"} size={14} color={theme.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.phoneInput, { color: theme.text, borderColor: theme.border }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          {showCodes && (
            <View style={[styles.codesList, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {COUNTRY_CODES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.codesRow,
                    countryCode === c.code && { backgroundColor: Colors.primary + "20" },
                  ]}
                  onPress={() => {
                    setCountryCode(c.code);
                    setShowCodes(false);
                  }}
                >
                  <Text style={[styles.codesCode, { color: theme.text }]}>{c.code}</Text>
                  <Text style={[styles.codesCountry, { color: theme.textSecondary }]}>{c.country}</Text>
                  {countryCode === c.code && (
                    <Ionicons name="checkmark" size={16} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Message */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Message{" "}
            <Text style={{ color: theme.textSecondary, fontFamily: "Inter_400Regular" }}>
              (optional)
            </Text>
          </Text>
          <TextInput
            style={[styles.messageInput, { color: theme.text, borderColor: theme.border }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a pre-filled message..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {message.length} characters
          </Text>
        </View>

        {/* URL Preview */}
        {phone.length > 4 && (
          <View style={[styles.urlCard, { backgroundColor: isDark ? "#111" : "#F3F4F6", borderColor: theme.border }]}>
            <Text style={[styles.urlLabel, { color: theme.textSecondary }]}>WhatsApp URL</Text>
            <Text style={[styles.url, { color: Colors.primary }]} numberOfLines={2}>
              {buildUrl()}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.openBtn, { opacity: phone.length < 6 ? 0.5 : 1 }]}
          onPress={openChat}
          disabled={phone.length < 6}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.openBtnText}>Open WhatsApp Chat</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  infoCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: "center",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  phoneRow: {
    flexDirection: "row",
    gap: 10,
  },
  codeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  codesList: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  codesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  codesCode: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    width: 48,
  },
  codesCountry: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  urlCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  urlLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  url: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  openBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
  },
  openBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
