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
  Clipboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const SEPARATORS = [
  { label: "New Line", value: "\n" },
  { label: "Space", value: " " },
  { label: "Comma", value: ", " },
  { label: "None", value: "" },
];

export default function TextRepeaterScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [separator, setSeparator] = useState("\n");
  const [copied, setCopied] = useState(false);

  function getRepeated() {
    if (!text) return "";
    return Array(count).fill(text).join(separator);
  }

  async function copyResult() {
    const result = getRepeated();
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(result);
    } else {
      Clipboard.setString(result);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp() {
    const result = getRepeated();
    if (!result) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const url = `https://wa.me/?text=${encodeURIComponent(result)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open WhatsApp")
    );
  }

  const repeated = getRepeated();
  const charCount = repeated.length;

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
        {/* Input */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Text to Repeat</Text>
          <TextInput
            style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
            value={text}
            onChangeText={setText}
            placeholder="Enter your message..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Count */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Repeat Count:{" "}
            <Text style={{ color: Colors.primary }}>{count}x</Text>
          </Text>
          <View style={styles.countRow}>
            <TouchableOpacity
              style={[styles.countBtn, { borderColor: theme.border }]}
              onPress={() => {
                if (count > 1) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCount(count - 1);
                }
              }}
            >
              <Ionicons name="remove" size={20} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              style={[styles.countInput, { color: theme.text, borderColor: theme.border }]}
              value={String(count)}
              onChangeText={(v) => {
                const n = parseInt(v) || 1;
                setCount(Math.min(Math.max(n, 1), 100));
              }}
              keyboardType="number-pad"
              maxLength={3}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.countBtn, { borderColor: theme.border }]}
              onPress={() => {
                if (count < 100) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCount(count + 1);
                }
              }}
            >
              <Ionicons name="add" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Quick presets */}
          <View style={styles.presets}>
            {[5, 10, 25, 50, 100].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.preset,
                  { borderColor: theme.border },
                  count === n && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCount(n);
                }}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: count === n ? "#fff" : theme.textSecondary },
                  ]}
                >
                  {n}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Separator */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Separator</Text>
          <View style={styles.separators}>
            {SEPARATORS.map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[
                  styles.sepBtn,
                  { borderColor: theme.border },
                  separator === s.value && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                ]}
                onPress={() => setSeparator(s.value)}
              >
                <Text
                  style={[
                    styles.sepText,
                    { color: separator === s.value ? "#fff" : theme.textSecondary },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        {text.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.previewHeader}>
              <Text style={[styles.label, { color: theme.text }]}>Preview</Text>
              <Text style={[styles.charCountText, { color: theme.textSecondary }]}>
                {charCount} chars
              </Text>
            </View>
            <View style={[styles.previewBox, { backgroundColor: isDark ? "#0A0A0A" : "#F9FAFB", borderColor: theme.border }]}>
              <Text style={[styles.previewText, { color: theme.text }]} numberOfLines={8}>
                {repeated.substring(0, 500)}
                {repeated.length > 500 ? "..." : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          style={[styles.copyBtn, { backgroundColor: theme.card, borderColor: Colors.primary, opacity: text ? 1 : 0.4 }]}
          onPress={copyResult}
          disabled={!text}
          activeOpacity={0.8}
        >
          <Ionicons name={copied ? "checkmark" : "copy"} size={20} color={Colors.primary} />
          <Text style={[styles.copyBtnText, { color: Colors.primary }]}>
            {copied ? "Copied!" : "Copy Result"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.waBtn, { opacity: text ? 1 : 0.4 }]}
          onPress={openWhatsApp}
          disabled={!text}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#fff" />
          <Text style={styles.waBtnText}>Send via WhatsApp</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
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
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  presets: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  separators: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  sepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sepText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  charCountText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  previewBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  previewText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    marginTop: 4,
  },
  copyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  waBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  waBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
