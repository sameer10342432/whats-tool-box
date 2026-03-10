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
  Modal,
  Dimensions,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const ITEM_SIZE = (SCREEN_W - 4) / 3;
const STORAGE_KEY = "saved_statuses";
const BROWSE_CACHE_KEY = "browse_cache";

type MediaItem = {
  id: string;
  uri: string;
  type: "image" | "video";
  duration?: number;
};

type SavedItem = MediaItem & { savedAt: string };

export default function StatusScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<"browse" | "saved">("browse");
  const [browseItems, setBrowseItems] = useState<MediaItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [selectedMode, setSelectedMode] = useState<"browse" | "saved">("browse");
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadSaved();
    loadBrowseCache();
  }, []);

  async function loadSaved() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: SavedItem[] = JSON.parse(raw);
        setSavedItems(items);
        setSavedIds(new Set(items.map((s) => s.id)));
      }
    } catch {}
  }

  async function loadBrowseCache() {
    try {
      const raw = await AsyncStorage.getItem(BROWSE_CACHE_KEY);
      if (raw) setBrowseItems(JSON.parse(raw));
    } catch {}
  }

  async function openGallery() {
    setLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access to browse and save statuses."
        );
        setLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 100,
        orderedSelection: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newItems: MediaItem[] = result.assets.map((asset) => ({
          id: asset.assetId || (Date.now().toString() + Math.random().toString(36).substr(2, 9)),
          uri: asset.uri,
          type: asset.type === "video" ? "video" : "image",
          duration: asset.duration ?? undefined,
        }));
        setBrowseItems(newItems);
        await AsyncStorage.setItem(BROWSE_CACHE_KEY, JSON.stringify(newItems));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to open gallery.");
    } finally {
      setLoading(false);
    }
  }

  async function saveItem(item: MediaItem) {
    if (savedIds.has(item.id)) {
      Alert.alert("Already Saved", "This status is already in your gallery.");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newSaved: SavedItem = { ...item, savedAt: new Date().toISOString() };
    const updated = [newSaved, ...savedItems];
    setSavedItems(updated);
    setSavedIds(new Set(updated.map((s) => s.id)));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaving(false);
  }

  async function deleteSaved(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = savedItems.filter((s) => s.id !== id);
    setSavedItems(updated);
    setSavedIds(new Set(updated.map((s) => s.id)));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  }

  async function shareItem(uri: string) {
    try {
      await Share.share({ url: uri });
    } catch {}
  }

  function formatDuration(secs?: number) {
    if (!secs) return "";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const renderBrowseItem = ({ item }: { item: MediaItem }) => {
    const saved = savedIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => { setSelected(item); setSelectedMode("browse"); }}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.uri }} style={styles.gridImage} />
        {item.type === "video" && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color="#fff" />
            {!!item.duration && (
              <Text style={styles.durText}>{formatDuration(item.duration)}</Text>
            )}
          </View>
        )}
        {saved && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSavedItem = ({ item }: { item: SavedItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => { setSelected(item); setSelectedMode("saved"); }}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.uri }} style={styles.gridImage} />
      {item.type === "video" && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteMini}
        onPress={() =>
          Alert.alert("Delete", "Remove from saved gallery?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => deleteSaved(item.id) },
          ])
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const isSaved = selected ? savedIds.has(selected.id) : false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Status Saver</Text>
          {activeTab === "browse" && browseItems.length > 0 && (
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={openGallery}
              disabled={loading}
            >
              <Ionicons name="refresh" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.tabBar, { backgroundColor: isDark ? Colors.dark.background : "#F3F4F6" }]}>
          {(["browse", "saved"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && { backgroundColor: Colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
                if (tab === "saved") loadSaved();
              }}
            >
              <Text style={[styles.tabLabel, { color: activeTab === tab ? "#fff" : theme.textSecondary }]}>
                {tab === "browse" ? "Browse" : `Saved (${savedItems.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Browse Tab */}
      {activeTab === "browse" && (
        browseItems.length === 0 ? (
          <View style={styles.emptyBrowse}>
            <View style={styles.permIcon}>
              <Ionicons name="images" size={40} color="#fff" />
            </View>
            <Text style={[styles.permTitle, { color: theme.text }]}>Browse Your Gallery</Text>
            <Text style={[styles.permText, { color: theme.textSecondary }]}>
              Open your gallery to browse photos and videos. Tap any item to preview and save it.
            </Text>
            <TouchableOpacity
              style={[styles.loadBtn, { opacity: loading ? 0.7 : 1 }]}
              onPress={openGallery}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="folder-open" size={20} color="#fff" />
                  <Text style={styles.loadBtnText}>Open Gallery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={browseItems}
            keyExtractor={(item) => item.id}
            renderItem={renderBrowseItem}
            numColumns={3}
            contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                {browseItems.length} items loaded — tap to preview & save
              </Text>
            }
          />
        )
      )}

      {/* Saved Tab */}
      {activeTab === "saved" && (
        <FlatList
          data={savedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderSavedItem}
          numColumns={3}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            savedItems.length > 0 ? (
              <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                {savedItems.length} item{savedItems.length !== 1 ? "s" : ""} saved
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={56} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing saved yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Browse gallery and tap any item to save
              </Text>
            </View>
          }
        />
      )}

      {/* Fullscreen Preview */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={[styles.closeBtn, { top: insets.top + 12 }]}
            onPress={() => setSelected(null)}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>

          {selected && (
            <Image source={{ uri: selected.uri }} style={styles.fullImg} resizeMode="contain" />
          )}

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 16 }]}>
            {selectedMode === "browse" && !isSaved && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={async () => {
                  if (selected) {
                    await saveItem(selected);
                    setSelected(null);
                    setActiveTab("saved");
                  }
                }}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="bookmark" size={22} color="#fff" />
                )}
                <Text style={styles.actionText}>{saving ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            )}

            {selectedMode === "browse" && isSaved && (
              <View style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                <Text style={styles.actionText}>Saved</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => selected && shareItem(selected.uri)}
            >
              <Ionicons name="share-social" size={22} color="#fff" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {selectedMode === "saved" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
                onPress={() => {
                  Alert.alert("Delete", "Remove from saved gallery?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: () => deleteSaved(selected!.id),
                    },
                  ]);
                }}
              >
                <Ionicons name="trash" size={22} color="#fff" />
                <Text style={styles.actionText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
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
  emptyBrowse: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  permIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  permText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  loadBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 10,
    marginTop: 8,
  },
  loadBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  grid: {
    paddingTop: 4,
  },
  gridRow: {
    gap: 2,
    marginBottom: 2,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  durText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteMini: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  countLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 12,
    paddingBottom: 6,
    paddingTop: 6,
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
  modal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 8,
  },
  fullImg: {
    width: "100%",
    height: "100%",
  },
  modalActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
