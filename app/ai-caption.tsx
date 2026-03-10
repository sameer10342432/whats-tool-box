import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { getApiUrl } from "@/lib/query-client";
import { fetch } from "expo/fetch";

type CaptionStyle = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  gradient: [string, string];
};

const STYLES: CaptionStyle[] = [
  { id: "funny", label: "Funny", emoji: "😂", color: "#F59E0B", gradient: ["#F59E0B", "#F97316"] },
  { id: "motivational", label: "Motivational", emoji: "💪", color: "#3B82F6", gradient: ["#3B82F6", "#8B5CF6"] },
  { id: "romantic", label: "Romantic", emoji: "❤️", color: "#EC4899", gradient: ["#EC4899", "#F43F5E"] },
  { id: "business", label: "Business", emoji: "💼", color: "#10B981", gradient: ["#10B981", "#059669"] },
  { id: "aesthetic", label: "Aesthetic", emoji: "✨", color: "#8B5CF6", gradient: ["#8B5CF6", "#A855F7"] },
  { id: "sarcastic", label: "Sarcastic", emoji: "🙄", color: "#6B7280", gradient: ["#6B7280", "#4B5563"] },
];

type GeneratedCaption = {
  style: string;
  text: string;
};

export default function AiCaptionScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [topic, setTopic] = useState("");
  const [selectedStyles, setSelectedStyles] = useState<string[]>(["funny"]);
  const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function toggleStyle(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyles((prev) =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter((s) => s !== id) : prev
        : [...prev, id]
    );
  }

  async function generate() {
    if (!topic.trim()) {
      Alert.alert("Missing Topic", "Please describe what your status is about.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setCaptions([]);

    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/generate-caption", baseUrl);
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), styles: selectedStyles }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to generate captions");

      const data = await res.json();
      setCaptions(data.captions || []);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Error", "Failed to generate captions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCaption(text: string, idx: number) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function shareViaWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open WhatsApp"));
  }

  const getStyleInfo = (id: string) => STYLES.find((s) => s.id === id);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#F59E0B", "#EF4444"]}
          style={styles.banner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="sparkles" size={28} color="#fff" />
          <View>
            <Text style={styles.bannerTitle}>AI Caption Generator</Text>
            <Text style={styles.bannerSub}>Powered by GPT · No API key needed</Text>
          </View>
        </LinearGradient>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>What is your status about?</Text>
          <TextInput
            style={[styles.topicInput, { color: theme.text, borderColor: theme.border }]}
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g. beach sunset, morning coffee, gym workout..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Caption Style{" "}
            <Text style={{ color: theme.textSecondary, fontFamily: "Inter_400Regular" }}>
              (select multiple)
            </Text>
          </Text>
          <View style={styles.stylesGrid}>
            {STYLES.map((s) => {
              const isSelected = selectedStyles.includes(s.id);
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.styleChip,
                    { borderColor: isSelected ? s.color : theme.border },
                    isSelected && { backgroundColor: s.color + "18" },
                  ]}
                  onPress={() => toggleStyle(s.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.styleEmoji}>{s.emoji}</Text>
                  <Text style={[styles.styleLabel, { color: isSelected ? s.color : theme.textSecondary }]}>
                    {s.label}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={14} color={s.color} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.genBtn, { opacity: topic.trim() ? 1 : 0.5 }]}
          onPress={generate}
          disabled={loading || !topic.trim()}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.genBtnText}>
                Generate {selectedStyles.length} Caption{selectedStyles.length !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              AI is crafting your captions...
            </Text>
          </View>
        )}

        {captions.length > 0 && (
          <>
            <Text style={[styles.resultsTitle, { color: theme.text }]}>Generated Captions</Text>
            {captions.map((caption, idx) => {
              const styleInfo = getStyleInfo(caption.style);
              return (
                <View key={idx} style={[styles.captionCard, { backgroundColor: theme.card }]}>
                  {styleInfo && (
                    <LinearGradient
                      colors={styleInfo.gradient}
                      style={styles.captionStyleTag}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.captionStyleEmoji}>{styleInfo.emoji}</Text>
                      <Text style={styles.captionStyleLabel}>{styleInfo.label}</Text>
                    </LinearGradient>
                  )}
                  <Text style={[styles.captionText, { color: theme.text }]} selectable>
                    {caption.text}
                  </Text>
                  <View style={styles.captionActions}>
                    <TouchableOpacity
                      style={[
                        styles.captionBtn,
                        {
                          backgroundColor: copiedIdx === idx
                            ? Colors.primary
                            : isDark ? "#2A2A2A" : "#F3F4F6",
                        },
                      ]}
                      onPress={() => copyCaption(caption.text, idx)}
                    >
                      <Ionicons
                        name={copiedIdx === idx ? "checkmark" : "copy-outline"}
                        size={16}
                        color={copiedIdx === idx ? "#fff" : theme.textSecondary}
                      />
                      <Text style={[styles.captionBtnText, { color: copiedIdx === idx ? "#fff" : theme.textSecondary }]}>
                        {copiedIdx === idx ? "Copied!" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.captionBtn, { backgroundColor: Colors.primary + "15" }]}
                      onPress={() => shareViaWhatsApp(caption.text)}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color={Colors.primary} />
                      <Text style={[styles.captionBtnText, { color: Colors.primary }]}>
                        Use on WhatsApp
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  banner: {
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bannerTitle: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  bannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
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
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  topicInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
  },
  stylesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  styleEmoji: { fontSize: 15 },
  styleLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  genBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    backgroundColor: "#F59E0B",
  },
  genBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  loadingState: { alignItems: "center", paddingVertical: 24, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  resultsTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 4 },
  captionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  captionStyleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  captionStyleEmoji: { fontSize: 14 },
  captionStyleLabel: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  captionText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22, padding: 14 },
  captionActions: { flexDirection: "row", gap: 8, padding: 12, paddingTop: 0 },
  captionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  captionBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
