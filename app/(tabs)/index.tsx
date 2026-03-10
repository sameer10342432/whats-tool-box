import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

type Tool = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconLib: "ionicons" | "mci";
  color: string;
  route: string;
};

const TOOLS: Tool[] = [
  {
    id: "status",
    title: "Status Saver",
    description: "Save WhatsApp statuses",
    icon: "images",
    iconLib: "ionicons",
    color: "#25D366",
    route: "/(tabs)/status",
  },
  {
    id: "direct-chat",
    title: "Direct Chat",
    description: "Chat without saving number",
    icon: "chatbubble-ellipses",
    iconLib: "ionicons",
    color: "#128C7E",
    route: "/direct-chat",
  },
  {
    id: "text-repeater",
    title: "Text Repeater",
    description: "Repeat messages fast",
    icon: "copy",
    iconLib: "ionicons",
    color: "#075E54",
    route: "/text-repeater",
  },
  {
    id: "bulk-message",
    title: "Bulk Message",
    description: "Message multiple contacts",
    icon: "people",
    iconLib: "ionicons",
    color: "#34B7F1",
    route: "/bulk-message",
  },
  {
    id: "fancy-text",
    title: "Fancy Text",
    description: "Stylish Unicode fonts",
    icon: "format-text",
    iconLib: "mci",
    color: "#7C3AED",
    route: "/fancy-text",
  },
  {
    id: "ai-caption",
    title: "AI Caption",
    description: "AI-powered captions",
    icon: "sparkles",
    iconLib: "ionicons",
    color: "#F59E0B",
    route: "/ai-caption",
  },
  {
    id: "scheduler",
    title: "Status Scheduler",
    description: "Schedule your statuses",
    icon: "time",
    iconLib: "ionicons",
    color: "#EF4444",
    route: "/status-scheduler",
  },
  {
    id: "saved",
    title: "Saved Gallery",
    description: "Your saved statuses",
    icon: "bookmark",
    iconLib: "ionicons",
    color: "#10B981",
    route: "/saved-status",
  },
];

const ADVANCED_TOOLS: Tool[] = [
  {
    id: "chat-backup",
    title: "Chat Backup",
    description: "Read exported chat files",
    icon: "document-text",
    iconLib: "ionicons",
    color: "#6366F1",
    route: "/chat-backup",
  },
  {
    id: "status-analytics",
    title: "Status Analytics",
    description: "Insights & storage stats",
    icon: "bar-chart",
    iconLib: "ionicons",
    color: "#0EA5E9",
    route: "/status-analytics",
  },
  {
    id: "ai-sticker",
    title: "AI Sticker",
    description: "Generate sticker packs",
    icon: "happy",
    iconLib: "ionicons",
    color: "#EC4899",
    route: "/ai-sticker",
  },
  {
    id: "chat-organizer",
    title: "Chat Organizer",
    description: "Organize chats by category",
    icon: "folder-open",
    iconLib: "ionicons",
    color: "#F97316",
    route: "/chat-organizer",
  },
  {
    id: "media-cleaner",
    title: "Media Cleaner",
    description: "Free up storage space",
    icon: "trash-bin",
    iconLib: "ionicons",
    color: "#EF4444",
    route: "/media-cleaner",
  },
];

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool.iconLib === "mci") {
    return (
      <MaterialCommunityIcons
        name={tool.icon as any}
        size={28}
        color="#fff"
      />
    );
  }
  return <Ionicons name={tool.icon as any} size={28} color="#fff" />;
}

function AdvancedToolRow({ tool }: { tool: Tool }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  return (
    <TouchableOpacity
      style={[styles.advRow, { backgroundColor: theme.card }]}
      onPress={() => router.push(tool.route as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.advIcon, { backgroundColor: tool.color }]}>
        <ToolIcon tool={tool} />
      </View>
      <View style={styles.advText}>
        <Text style={[styles.advTitle, { color: theme.text }]}>{tool.title}</Text>
        <Text style={[styles.advDesc, { color: theme.textSecondary }]}>{tool.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.deepDark}
      />

      {/* Header */}
      <LinearGradient
        colors={[Colors.deepDark, Colors.primaryDark]}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>WhatsToolbox</Text>
            <Text style={styles.headerSubtitle}>Your WhatsApp utility suite</Text>
          </View>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => router.push("/(tabs)/settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Core Tools */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          ALL TOOLS
        </Text>

        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={[styles.card, { backgroundColor: theme.card }]}
              onPress={() => router.push(tool.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, { backgroundColor: tool.color }]}>
                <ToolIcon tool={tool} />
              </View>
              <Text
                style={[styles.cardTitle, { color: theme.text }]}
                numberOfLines={1}
              >
                {tool.title}
              </Text>
              <Text
                style={[styles.cardDesc, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {tool.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Advanced Tools */}
        <View style={styles.advancedHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginBottom: 0 }]}>
            ADVANCED TOOLS
          </Text>
          <View style={styles.advBadge}>
            <Text style={styles.advBadgeText}>Phase 2</Text>
          </View>
        </View>

        <View style={styles.advGrid}>
          {ADVANCED_TOOLS.map((tool) => (
            <AdvancedToolRow key={tool.id} tool={tool} />
          ))}
        </View>

        {/* Quick Actions */}
        <Text
          style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 28 }]}
        >
          QUICK ACTIONS
        </Text>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.card }]}
          onPress={() => router.push("/direct-chat")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryDark, Colors.primary]}
            style={styles.quickActionGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.quickActionText}>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>
              Open Direct Chat
            </Text>
            <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>
              Message anyone without saving their number
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickAction, { backgroundColor: theme.card }]}
          onPress={() => router.push("/ai-caption")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#F59E0B", "#EF4444"]}
            style={styles.quickActionGradient}
          >
            <Ionicons name="sparkles" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.quickActionText}>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>
              AI Caption Generator
            </Text>
            <Text style={[styles.quickActionDesc, { color: theme.textSecondary }]}>
              Create perfect captions with AI
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 14,
    marginLeft: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  advancedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 28,
    marginBottom: 14,
    marginLeft: 4,
  },
  advBadge: {
    backgroundColor: Colors.primary + "25",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  advBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  advGrid: {
    gap: 10,
  },
  advRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  advIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  advText: { flex: 1 },
  advTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  advDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  quickActionGradient: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  quickActionDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
