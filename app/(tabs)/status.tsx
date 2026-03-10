import React, { useState, useEffect, useCallback } from "react";
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
  RefreshControl,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const STORAGE_KEY = "saved_statuses";
const ITEM_SIZE = (SCREEN_W - 4) / 3;

type StatusItem = {
  id: string;
  uri: string;
  type: "image" | "video";
  savedAt: string;
  duration?: number;
};

type MediaAsset = {
  id: string;
  uri: string;
  mediaType: string;
  duration: number;
  modificationTime: number;
};

export default function StatusScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState<"browse" | "saved">("browse");
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [savedStatuses, setSavedStatuses] = useState<StatusItem[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<"undetermined" | "granted" | "denied">("undetermined");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MediaAsset | StatusItem | null>(null);
  const [selectedMode, setSelectedMode] = useState<"browse" | "saved">("browse");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadSaved();
    checkPermission();
  }, []);

  async function checkPermission() {
    if (Platform.OS === "web") return;
    const { status } = await MediaLibrary.getPermissionsAsync();
    setPermissionStatus(status as any);
    if (status === "granted") {
      loadMedia(true);
    }
  }

  async function requestPermission() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    setPermissionStatus(status as any);
    if (status === "granted") {
      loadMedia(true);
    }
  }

  async function loadMedia(reset = false) {
    if (Platform.OS === "web") return;
    if (loading && !reset) return;
    setLoading(true);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [[MediaLibrary.SortBy.modificationTime, false]],
        first: 60,
        after: reset ? undefined : endCursor,
      });

      const assets = result.assets as unknown as MediaAsset[];
      if (reset) {
        setMediaAssets(assets);
      } else {
        setMediaAssets((prev) => [...prev, ...assets]);
      }
      setHasMore(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (e) {
      console.log("Media load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadSaved() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items: StatusItem[] = JSON.parse(raw);
        setSavedStatuses(items);
        setSavedIds(new Set(items.map((s) => s.id)));
      }
    } catch {}
  }

  async function saveStatus(asset: MediaAsset) {
    if (savedIds.has(asset.id)) {
      Alert.alert("Already Saved", "This status is already in your gallery.");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newItem: StatusItem = {
      id: asset.id,
      uri: asset.uri,
      type: asset.mediaType === "video" ? "video" : "image",
      savedAt: new Date().toISOString(),
      duration: asset.duration,
    };
    const updated = [newItem, ...savedStatuses];
    setSavedStatuses(updated);
    setSavedIds(new Set(updated.map((s) => s.id)));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setSaving(false);
  }

  async function deleteStatus(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = savedStatuses.filter((s) => s.id !== id);
    setSavedStatuses(updated);
    setSavedIds(new Set(updated.map((s) => s.id)));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if ((selected as StatusItem)?.id === id) setSelected(null);
  }

  async function shareItem(uri: string) {
    try {
      await Share.share({ url: uri });
    } catch {}
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMedia(true);
  }, []);

  function openAsset(asset: MediaAsset) {
    setSelected(asset);
    setSelectedMode("browse");
  }

  function openSaved(item: StatusItem) {
    setSelected(item);
    setSelectedMode("saved");
  }

  function isSavedAsset(asset: MediaAsset) {
    return savedIds.has(asset.id);
  }

  function formatDuration(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const renderBrowseItem = ({ item }: { item: MediaAsset }) => {
    const saved = isSavedAsset(item);
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => openAsset(item)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.uri }} style={styles.gridImage} />
        {item.mediaType === "video" && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color="#fff" />
            {item.duration > 0 && (
              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            )}
          </View>
        )}
        {saved && (
          <View style={styles.savedBadge}>
            <Ionicons name="checkmark" size={11} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSavedItem = ({ item }: { item: StatusItem }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => openSaved(item)}
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
            { text: "Delete", style: "destructive", onPress: () => deleteStatus(item.id) },
          ])
        }
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const selectedUri =
    selected
      ? selectedMode === "saved"
        ? (selected as StatusItem).uri
        : (selected as MediaAsset).uri
      : null;

  const selectedIsSaved =
    selected && selectedMode === "browse"
      ? isSavedAsset(selected as MediaAsset)
      : true;

  const permissionDenied = Platform.OS !== "web" && permissionStatus === "denied";
  const permissionNeeded = Platform.OS !== "web" && permissionStatus === "undetermined";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Status Saver</Text>
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
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === tab ? "#fff" : theme.textSecondary },
                ]}
              >
                {tab === "browse" ? "Browse" : `Saved (${savedStatuses.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Browse Tab */}
      {activeTab === "browse" && (
        <>
          {Platform.OS === "web" ? (
            <View style={styles.webMsg}>
              <Ionicons name="phone-portrait-outline" size={48} color={theme.textSecondary} />
              <Text style={[styles.webMsgText, { color: theme.text }]}>
                Use the mobile app to browse and save statuses from your gallery
              </Text>
            </View>
          ) : permissionDenied ? (
            <View style={styles.permContainer}>
              <Ionicons name="lock-closed-outline" size={56} color={theme.textSecondary} />
              <Text style={[styles.permTitle, { color: theme.text }]}>Gallery Access Denied</Text>
              <Text style={[styles.permText, { color: theme.textSecondary }]}>
                Please enable photo access in your device settings to browse media.
              </Text>
            </View>
          ) : permissionNeeded ? (
            <View style={styles.permContainer}>
              <View style={styles.permIcon}>
                <Ionicons name="images" size={40} color="#fff" />
              </View>
              <Text style={[styles.permTitle, { color: theme.text }]}>Browse Your Gallery</Text>
              <Text style={[styles.permText, { color: theme.textSecondary }]}>
                WhatsToolbox needs access to your gallery to show and save statuses — just like a status saver app.
              </Text>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <Text style={styles.permBtnText}>Allow Access</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={mediaAssets}
              keyExtractor={(item) => item.id}
              renderItem={renderBrowseItem}
              numColumns={3}
              contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
              columnWrapperStyle={styles.gridRow}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={Colors.primary}
                  colors={[Colors.primary]}
                />
              }
              onEndReached={() => {
                if (hasMore && !loading) loadMedia(false);
              }}
              onEndReachedThreshold={0.3}
              ListHeaderComponent={
                mediaAssets.length > 0 ? (
                  <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                    {mediaAssets.length} items — tap to preview & save
                  </Text>
                ) : null
              }
              ListFooterComponent={
                loading && !refreshing ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : null
              }
              ListEmptyComponent={
                loading ? (
                  <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      Loading gallery...
                    </Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="images-outline" size={56} color={theme.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No media found</Text>
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      Pull down to refresh
                    </Text>
                  </View>
                )
              }
            />
          )}
        </>
      )}

      {/* Saved Tab */}
      {activeTab === "saved" && (
        <FlatList
          data={savedStatuses}
          keyExtractor={(item) => item.id}
          renderItem={renderSavedItem}
          numColumns={3}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 90 }]}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            savedStatuses.length > 0 ? (
              <Text style={[styles.countLabel, { color: theme.textSecondary }]}>
                {savedStatuses.length} item{savedStatuses.length !== 1 ? "s" : ""} saved
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={56} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Nothing saved yet</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Browse your gallery and tap to save statuses
              </Text>
            </View>
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

          {selectedUri && (
            <Image
              source={{ uri: selectedUri }}
              style={styles.fullImg}
              resizeMode="contain"
            />
          )}

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 16 }]}>
            {selectedMode === "browse" && !selectedIsSaved && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={async () => {
                  if (selected) {
                    await saveStatus(selected as MediaAsset);
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
                <Text style={styles.actionText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            )}

            {selectedMode === "browse" && selectedIsSaved && (
              <View style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Ionicons name="checkmark-circle" size={22} color="#25D366" />
                <Text style={styles.actionText}>Saved</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => selectedUri && shareItem(selectedUri)}
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
                      onPress: () => deleteStatus((selected as StatusItem).id),
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
  grid: {
    paddingHorizontal: 0,
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
  durationText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  savedBadge: {
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
    paddingBottom: 8,
    paddingTop: 4,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 14,
  },
  loadingText: {
    fontSize: 14,
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
  webMsg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  webMsgText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    lineHeight: 24,
  },
  permContainer: {
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
    marginBottom: 8,
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
  permBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
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
