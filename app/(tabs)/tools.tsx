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
import Colors from "@/constants/colors";

type ToolItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconLib: "ionicons" | "mci";
  color: string;
  route: string;
  tag?: string;
};

const TOOLS: ToolItem[] = [
  {
    id: "direct-chat",
    title: "Direct Chat",
    description:
      "Open a WhatsApp chat without saving the contact's number first. Just enter the number and send.",
    icon: "chatbubble-ellipses",
    iconLib: "ionicons",
    color: "#25D366",
    route: "/direct-chat",
    tag: "Popular",
  },
  {
    id: "text-repeater",
    title: "Text Repeater",
    description:
      "Repeat any message or text up to 100 times with a single tap. Copy or send directly.",
    icon: "copy",
    iconLib: "ionicons",
    color: "#128C7E",
    route: "/text-repeater",
  },
  {
    id: "bulk-message",
    title: "Bulk Message Sender",
    description:
      "Send the same message to multiple contacts. Opens each chat sequentially so you stay compliant.",
    icon: "people",
    iconLib: "ionicons",
    color: "#34B7F1",
    route: "/bulk-message",
  },
];

export default function ToolsScreen() {
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Messaging Tools</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
          Supercharge your WhatsApp messaging
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
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, { backgroundColor: tool.color }]}>
                {tool.iconLib === "mci" ? (
                  <MaterialCommunityIcons name={tool.icon as any} size={26} color="#fff" />
                ) : (
                  <Ionicons name={tool.icon as any} size={26} color="#fff" />
                )}
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{tool.title}</Text>
                  {tool.tag && (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tool.tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                  {tool.description}
                </Text>
              </View>
            </View>
            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
              <Text style={{ color: Colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                Open Tool
              </Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={[styles.noteCard, { backgroundColor: isDark ? "#1A1A2E" : "#EFF6FF" }]}>
          <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
          <Text style={[styles.noteText, { color: isDark ? "#93C5FD" : "#1E40AF" }]}>
            All tools comply with WhatsApp's terms of service. No automated message sending.
          </Text>
        </View>
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
    gap: 12,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    padding: 16,
    gap: 14,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    gap: 6,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  tagBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  noteCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: "flex-start",
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
