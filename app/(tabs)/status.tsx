import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  FlatList,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Colors from "@/constants/colors";

const STORAGE_KEY = "saved_statuses";

type StatusItem = {
  id: string;
  uri: string;
  type: "image" | "video";
  savedAt: string;
};

export default function StatusScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"browse" | "saved">("browse");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setStatuses(JSON.parse(raw));
    } catch {}
  }

  async function saveStatus(item: StatusItem) {
    const updated = [item, ...statuses];
    setStatuses(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function deleteStatus(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = statuses.filter((s) => s.id !== id);
    setStatuses(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  async function pickAndSave() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photos to save statuses."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        for (const asset of result.assets) {
          const newItem: StatusItem = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            uri: asset.uri,
            type: asset.type === "video" ? "video" : "image",
            savedAt: new Date().toISOString(),
          };
          await saveStatus(newItem);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save status.");
    } finally {
      setLoading(false);
    }
  }

  const renderStatusItem = ({ item }: { item: StatusItem }) => (
    <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
      <Image source={{ uri: item.uri }} style={styles.statusThumb} />
      {item.type === "video" && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
      <View style={styles.statusMeta}>
        <Text style={[styles.statusDate, { color: theme.textSecondary }]}>
          {new Date(item.savedAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity onPress={() => deleteStatus(item.id)}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Status Saver</Text>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? Colors.dark.background : "#F3F4F6" }]}>
          {(["browse", "saved"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: Colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? "#fff" : theme.textSecondary },
                ]}
              >
                {tab === "browse" ? "Browse" : `Saved (${statuses.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === "browse" ? (
        <View style={styles.browseContainer}>
          {/* Info Banner */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? "#1A2A1A" : "#F0FFF4" }]}>
            <Ionicons name="information-circle" size={20} color={Colors.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              Open your WhatsApp, view a status, then come back here and tap "Save from Gallery" to save it.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={pickAndSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-download" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Save from Gallery</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.whatsappBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              router.push("/saved-status" as any);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark" size={20} color={Colors.primary} />
            <Text style={[styles.whatsappBtnText, { color: theme.text }]}>
              View Saved Gallery
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.stepsCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.stepsTitle, { color: theme.text }]}>How it works</Text>
            {[
              { step: "1", text: "Open WhatsApp and view statuses" },
              { step: "2", text: "Note the status you want to save" },
              { step: "3", text: 'Tap "Save from Gallery" above' },
              { step: "4", text: "Select the status from your photos" },
            ].map((s) => (
              <View key={s.step} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{s.step}</Text>
                </View>
                <Text style={[styles.stepText, { color: theme.textSecondary }]}>{s.text}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={statuses}
          keyExtractor={(item) => item.id}
          renderItem={renderStatusItem}
          numColumns={2}
          contentContainerStyle={[
            styles.gallery,
            { paddingBottom: bottomPad + 90 },
          ]}
          columnWrapperStyle={styles.galleryRow}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={56} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved statuses</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Go to Browse tab to save your first status
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  browseContainer: {
    padding: 16,
    gap: 12,
  },
  infoBanner: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  whatsappBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  whatsappBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  stepsCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  stepsTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  gallery: {
    padding: 12,
  },
  galleryRow: {
    gap: 10,
    marginBottom: 10,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  statusThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    padding: 4,
  },
  statusMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
  },
  statusDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
