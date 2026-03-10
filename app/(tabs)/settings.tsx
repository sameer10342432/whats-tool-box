import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Switch,
  Share,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const SETTINGS_KEY = "app_settings";

type SettingsData = {
  notifications: boolean;
  autoSave: boolean;
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [settings, setSettings] = useState<SettingsData>({
    notifications: true,
    autoSave: false,
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (raw) setSettings(JSON.parse(raw));
    });
  }, []);

  async function updateSetting(key: keyof SettingsData, val: boolean) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  }

  async function shareApp() {
    try {
      await Share.share({
        message:
          "Check out WhatsToolbox — the ultimate WhatsApp utility app! 🔧\nStatus saver, direct chat, AI captions, and more.",
      });
    } catch {}
  }

  function openPrivacy() {
    Linking.openURL("https://example.com/privacy");
  }

  function openTerms() {
    Linking.openURL("https://example.com/terms");
  }

  function rateApp() {
    Alert.alert("Rate WhatsToolbox", "Thank you for using WhatsToolbox! 🙏", [
      { text: "Not now", style: "cancel" },
      { text: "Rate 5 Stars", onPress: () => {} },
    ]);
  }

  type SettingRow = {
    label: string;
    icon: string;
    iconColor: string;
    type: "toggle" | "action";
    key?: keyof SettingsData;
    value?: boolean;
    onPress?: () => void;
    destructive?: boolean;
  };

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: "Preferences",
      rows: [
        {
          label: "Notifications",
          icon: "notifications",
          iconColor: "#3B82F6",
          type: "toggle",
          key: "notifications",
          value: settings.notifications,
        },
        {
          label: "Auto-save Statuses",
          icon: "cloud-download",
          iconColor: Colors.primary,
          type: "toggle",
          key: "autoSave",
          value: settings.autoSave,
        },
      ],
    },
    {
      title: "About",
      rows: [
        {
          label: "Share App",
          icon: "share-social",
          iconColor: "#8B5CF6",
          type: "action",
          onPress: shareApp,
        },
        {
          label: "Rate App",
          icon: "star",
          iconColor: "#F59E0B",
          type: "action",
          onPress: rateApp,
        },
        {
          label: "Privacy Policy",
          icon: "shield-checkmark",
          iconColor: "#10B981",
          type: "action",
          onPress: openPrivacy,
        },
        {
          label: "Terms of Service",
          icon: "document-text",
          iconColor: "#6B7280",
          type: "action",
          onPress: openTerms,
        },
      ],
    },
  ];

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Card */}
        <View style={[styles.appCard, { backgroundColor: theme.card }]}>
          <View style={styles.appIconWrap}>
            <Ionicons name="construct" size={28} color="#fff" />
          </View>
          <View>
            <Text style={[styles.appName, { color: theme.text }]}>WhatsToolbox</Text>
            <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
              {section.rows.map((row, idx) => (
                <View key={row.label}>
                  <TouchableOpacity
                    style={styles.row}
                    onPress={row.type === "action" ? row.onPress : undefined}
                    disabled={row.type === "toggle"}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.rowIcon, { backgroundColor: row.iconColor + "20" }]}
                    >
                      <Ionicons name={row.icon as any} size={18} color={row.iconColor} />
                    </View>
                    <Text
                      style={[
                        styles.rowLabel,
                        { color: row.destructive ? "#EF4444" : theme.text },
                      ]}
                    >
                      {row.label}
                    </Text>
                    {row.type === "toggle" && row.key ? (
                      <Switch
                        value={row.value}
                        onValueChange={(val) => updateSetting(row.key!, val)}
                        trackColor={{ false: theme.border, true: Colors.primary + "80" }}
                        thumbColor={row.value ? Colors.primary : theme.textSecondary}
                        ios_backgroundColor={theme.border}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={theme.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  {idx < section.rows.length - 1 && (
                    <View
                      style={[styles.divider, { backgroundColor: theme.border }]}
                    />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Made with ❤️ for WhatsApp users
        </Text>
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
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    padding: 16,
    gap: 6,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 20,
    borderRadius: 18,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  appIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  appVersion: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  section: {
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 16,
    paddingBottom: 8,
  },
});
