import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Platform,
  Modal,
  Dimensions,
  RefreshControl,
  Share,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const ITEM_SIZE = (SCREEN_W - 6) / 3;

const WHATSAPP_PATHS = [
  "file:///storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/WhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/Android/media/com.whatsapp.w4b/WhatsApp Business/Media/.Statuses/",
  "file:///storage/emulated/0/WhatsApp Business/Media/.Statuses/",
  "file:///storage/emulated/0/Android/media/com.gbwhatsapp/WhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/GBWhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/Android/media/com.fmwhatsapp/WhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/FMWhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/Android/media/com.yowhatsapp/WhatsApp/Media/.Statuses/",
  "file:///storage/emulated/0/YoWhatsApp/Media/.Statuses/",
];

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const VIDEO_EXTS = [".mp4", ".3gp", ".mkv", ".mov"];

type StatusFile = {
  uri: string;
  filename: string;
  type: "image" | "video";
};

type TabType = "images" | "videos";

export default function StatusScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<TabType>("images");
  const [images, setImages] = useState<StatusFile[]>([]);
  const [videos, setVideos] = useState<StatusFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<"no_folder" | "permission" | "expo_go" | null>(null);
  const [selected, setSelected] = useState<StatusFile | null>(null);
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (Platform.OS === "android") {
      requestPermissionAndScan();
    }
  }, []);

  async function requestPermissionAndScan() {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        if (newStatus !== "granted") {
          setError("permission");
          return;
        }
      }
      scanStatuses();
    } catch (e) {
      setError("permission");
    }
  }

  async function scanStatuses(isRefresh = false) {
    if (Platform.OS !== "android") return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      let foundPath: string | null = null;
      let allFiles: string[] = [];

      for (const path of WHATSAPP_PATHS) {
        try {
          // Check if path exists
          const info = await FileSystem.getInfoAsync(path);
          if (info.exists) {
            const files = await FileSystem.readDirectoryAsync(path);
            if (files && files.length > 0) {
              foundPath = path;
              allFiles = files;
              break;
            }
          }
        } catch (err) {
          // Silent fail for individual path checks
        }
      }

      if (!foundPath) {
        // Try fallback check without trailing slash just in case
        for (const path of WHATSAPP_PATHS) {
          const base = path.endsWith("/") ? path.slice(0, -1) : path;
          try {
            const info = await FileSystem.getInfoAsync(base);
            if (info.exists) {
              const files = await FileSystem.readDirectoryAsync(base);
              if (files && files.length > 0) {
                foundPath = base.endsWith("/") ? base : base + "/";
                allFiles = files;
                break;
              }
            }
          } catch {}
        }
      }

      if (!foundPath) {
        setError("no_folder");
        setImages([]);
        setVideos([]);
        return;
      }

      const imgs: StatusFile[] = [];
      const vids: StatusFile[] = [];

      for (const filename of allFiles) {
        const lower = filename.toLowerCase();
        const uri = foundPath + filename;

        if (IMAGE_EXTS.some((ext) => lower.endsWith(ext))) {
          imgs.push({ uri, filename, type: "image" });
        } else if (VIDEO_EXTS.some((ext) => lower.endsWith(ext))) {
          vids.push({ uri, filename, type: "video" });
        }
      }

      // Sort by newest if possible (though we don't have mtime here easily without more info calls)
      setImages(imgs.reverse());
      setVideos(vids.reverse());
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("permission") || msg.includes("Permission")) {
        setError("permission");
      } else {
        setError("no_folder");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function saveStatus(file: StatusFile) {
    if (savedSet.has(file.uri)) {
      Alert.alert("Already Saved", "This status is already saved to your gallery.");
      return;
    }
    setSaving(true);
    try {
      const asset = await MediaLibrary.createAssetAsync(file.uri);
      const album = await MediaLibrary.getAlbumAsync("WhatsToolbox");
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync("WhatsToolbox", asset, false);
      }
      setSavedSet((prev) => new Set([...prev, file.uri]));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved!", "Status saved to WhatsToolbox album in your gallery.");
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("permission") || msg.includes("Permission")) {
        Alert.alert(
          "Permission Required",
          "Please allow WhatsToolbox to save photos in your device settings."
        );
      } else {
        Alert.alert("Error", "Could not save status. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function shareStatus(file: StatusFile) {
    try {
      await Share.share({
        url: file.uri,
        title: "Share Status",
      });
    } catch {}
  }

  const onRefresh = useCallback(() => {
    scanStatuses(true);
  }, []);

  const data = activeTab === "images" ? images : videos;

  const renderItem = ({ item }: { item: StatusFile }) => {
    const isSaved = savedSet.has(item.uri);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => setSelected(item)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.uri }} style={styles.gridImage} resizeMode="cover" />

        {item.type === "video" && (
          <View style={styles.playBadge}>
            <Ionicons name="play" size={14} color="#fff" />
          </View>
        )}

        {isSaved && (
          <View style={styles.savedCheck}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}

        <TouchableOpacity
          style={styles.saveQuick}
          onPress={() => saveStatus(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={isSaved ? "checkmark-circle" : "download"}
            size={20}
            color={isSaved ? Colors.primary : "#fff"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  function renderEmptyOrError() {
    if (Platform.OS === "web") {
      return (
        <View style={styles.center}>
          <Ionicons name="phone-portrait-outline" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Android Only</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Status Saver works on Android devices only. Open WhatsApp, view some statuses, then come
            back here.
          </Text>
        </View>
      );
    }

    if (Platform.OS === "ios") {
      return (
        <View style={styles.center}>
          <Ionicons name="logo-android" size={60} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Android Only</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            WhatsApp Status Saver is only available on Android devices.
          </Text>
        </View>
      );
    }

    if (error === "permission") {
      return (
        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: "#EF4444" }]}>
            <Ionicons name="lock-closed" size={36} color="#fff" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Permission Required</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            WhatsToolbox needs storage access to read WhatsApp statuses. Please grant permission in
            Settings.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => scanStatuses()}>
            <Text style={styles.actionButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error === "no_folder") {
      return (
        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.primary }]}>
            <Ionicons name="logo-whatsapp" size={36} color="#fff" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Statuses Found</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Open WhatsApp and view some statuses first, then come back here to save them.
          </Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => scanStatuses()}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          <View style={[styles.noteBanner, { backgroundColor: isDark ? "#1A2A1A" : "#F0FFF4" }]}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={[styles.noteText, { color: theme.textSecondary }]}>
              Note: This feature requires a production build of the app (not Expo Go) to access
              WhatsApp's media folder.
            </Text>
          </View>
        </View>
      );
    }

    if (data.length === 0 && !loading) {
      return (
        <View style={styles.center}>
          <Ionicons
            name={activeTab === "images" ? "images-outline" : "videocam-outline"}
            size={60}
            color={theme.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No {activeTab === "images" ? "Image" : "Video"} Statuses
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No {activeTab === "images" ? "image" : "video"} statuses were found. Open WhatsApp and
            view some statuses.
          </Text>
        </View>
      );
    }

    return null;
  }

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
          {Platform.OS === "android" && !error && (
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => scanStatuses(true)}
              disabled={refreshing || loading}
            >
              <Ionicons name="refresh" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: isDark ? Colors.dark.background : "#F3F4F6" }]}>
          {(["images", "videos"] as const).map((tab) => {
            const count = tab === "images" ? images.length : videos.length;
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isActive && { backgroundColor: Colors.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
              >
                <Ionicons
                  name={tab === "images" ? "image" : "videocam"}
                  size={14}
                  color={isActive ? "#fff" : theme.textSecondary}
                />
                <Text style={[styles.tabLabel, { color: isActive ? "#fff" : theme.textSecondary }]}>
                  {tab === "images" ? "Images" : "Videos"}
                  {count > 0 ? ` (${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary, marginTop: 14 }]}>
            Scanning WhatsApp statuses...
          </Text>
        </View>
      ) : error || (Platform.OS !== "android") || data.length === 0 ? (
        renderEmptyOrError()
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.uri}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
              {data.length} {activeTab === "images" ? "image" : "video"} status
              {data.length !== 1 ? "es" : ""} found — tap to preview
            </Text>
          }
        />
      )}

      {/* Fullscreen Preview Modal */}
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
            <>
              <Image
                source={{ uri: selected.uri }}
                style={styles.fullImg}
                resizeMode="contain"
              />

              <View style={[styles.modalBar, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    savedSet.has(selected.uri) && { backgroundColor: "rgba(255,255,255,0.15)" },
                  ]}
                  onPress={() => {
                    saveStatus(selected);
                    setSelected(null);
                  }}
                  disabled={saving || savedSet.has(selected.uri)}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Ionicons
                      name={savedSet.has(selected.uri) ? "checkmark-circle" : "download"}
                      size={22}
                      color={savedSet.has(selected.uri) ? Colors.primary : "#fff"}
                    />
                  )}
                  <Text style={styles.modalBtnText}>
                    {savedSet.has(selected.uri) ? "Saved" : saving ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
                  onPress={() => {
                    shareStatus(selected);
                  }}
                >
                  <Ionicons name="share-social" size={22} color="#fff" />
                  <Text style={styles.modalBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 36,
    gap: 14,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  noteBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  grid: {
    paddingTop: 4,
    paddingHorizontal: 2,
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
  playBadge: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  savedCheck: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveQuick: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 14,
    padding: 4,
  },
  countLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 10,
    paddingVertical: 6,
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
  modalBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
