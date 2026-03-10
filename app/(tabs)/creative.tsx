import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const TOOLS = [
  {
    id: "fancy-text",
    title: "Fancy Text Generator",
    description: "Transform your text into beautiful Unicode styles — script, bold, italic, bubble, and more.",
    icon: "format-text",
    iconLib: "mci" as const,
    gradient: ["#7C3AED", "#A855F7"] as [string, string],
    route: "/fancy-text",
    preview: "𝓗𝓮𝓵𝓵𝓸 𝓦𝓸𝓻𝓵𝓭",
  },
  {
    id: "ai-caption",
    title: "AI Caption Generator",
    description: "Generate captions for your statuses using AI. Choose from funny, motivational, romantic, or business styles.",
    icon: "sparkles",
    iconLib: "ionicons" as const,
    gradient: ["#F59E0B", "#EF4444"] as [string, string],
    route: "/ai-caption",
    preview: "✨ AI-powered",
    tag: "AI",
  },
  {
    id: "status-scheduler",
    title: "Status Scheduler",
    description: "Schedule reminders to post your WhatsApp statuses. Never miss the perfect moment.",
    icon: "time",
    iconLib: "ionicons" as const,
    gradient: ["#EF4444", "#F97316"] as [string, string],
    route: "/status-scheduler",
    preview: "⏰ Set & forget",
  },
];

export default function CreativeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Creative Tools</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          Create amazing WhatsApp content
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(tool.route as any);
            }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={tool.gradient}
              style={styles.cardBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bannerContent}>
                {tool.iconLib === "mci" ? (
                  <MaterialCommunityIcons name={tool.icon as any} size={32} color="#fff" />
                ) : (
                  <Ionicons name={tool.icon as any} size={32} color="#fff" />
                )}
                {tool.tag && (
                  <View style={styles.aiTag}>
                    <Text style={styles.aiTagText}>{tool.tag}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.previewText}>{tool.preview}</Text>
            </LinearGradient>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{tool.title}</Text>
              <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                {tool.description}
              </Text>
              <View style={styles.cardAction}>
                <Text style={{ color: tool.gradient[0], fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  Get Started
                </Text>
                <Ionicons name="arrow-forward-circle" size={20} color={tool.gradient[0]} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  scroll: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardBanner: {
    height: 110,
    padding: 16,
    justifyContent: "space-between",
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiTag: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiTagText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  previewText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cardAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
});
