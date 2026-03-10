import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  Alert,
  RefreshControl,
  Platform,
  Switch,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

const WHATSAPP_BASE = "/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/";

const MEDIA_TYPES = [
  { key: "Images", dir: "WhatsApp Images/", icon: "image", color: "#25D366", exts: [".jpg", ".jpeg", ".png", ".webp"] },
  { key: "Videos", dir: "WhatsApp Video/", icon: "videocam", color: "#34B7F1", exts: [".mp4", ".3gp", ".mkv"] },
  { key: "Documents", dir: "WhatsApp Documents/", icon: "document", color: "#7C3AED", exts: [".pdf", ".docx", ".xlsx", ".zip", ".txt"] },
  { key: "Voice", dir: "WhatsApp Voice Notes/", icon: "mic", color: "#F59E0B", exts: [".opus", ".m4a", ".ogg", ".aac"] },
];

const THIRTY_DAYS = 30 * 24 * 60 * 60;

type MediaFile = {
  id: string;
  name: string;
  path: string;
  size: number;
  mtime: number;
  type: string;
  selected: boolean;
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function isOld(mtime: number) {
  if (!mtime) return false;
  const now = Date.now() / 1000;
  return now - mtime > THIRTY_DAYS;
}

async function scanType(typeInfo: typeof MEDIA_TYPES[0]): Promise<MediaFile[]> {
  const dir = WHATSAPP_BASE + typeInfo.dir;
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return [];
    const names = await FileSystem.readDirectoryAsync(dir);
    const files: MediaFile[] = [];
    for (const name of names) {
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      if (!typeInfo.exts.includes(ext)) continue;
      try {
        const fi = await FileSystem.getInfoAsync(dir + name);
        if (fi.exists) {
          files.push({
            id: dir + name,
            name,
            path: dir + name,
            size: (fi as any).size || 0,
            mtime: (fi as any).modificationTime || 0,
            type: typeInfo.key,
            selected: false,
          });
        }
      } catch {}
    }
    return files;
  } catch {
    return [];
  }
}

export default function MediaCleanerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const isWeb = Platform.OS === "web";

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [activeType, setActiveType] = useState("Images");
  const [refreshing, setRefreshing] = useState(false);
  const [filterOld, setFilterOld] = useState(false);
  const [filterLarge, setFilterLarge] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(async () => {
    if (isWeb) return;
    setRefreshing(true);
    const all: MediaFile[] = [];
    for (const t of MEDIA_TYPES) {
      const found = await scanType(t);
      all.push(...found);
    }
    setFiles(all);
    setRefreshing(false);
  }, [isWeb]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleSelect = (id: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f)));
  };

  const selectAll = () => {
    setFiles((prev) =>
      prev.map((f) =>
        f.type === activeType && matchesFilter(f) ? { ...f, selected: true } : f
      )
    );
  };

  const deselectAll = () => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: false })));
  };

  const matchesFilter = (f: MediaFile) => {
    if (filterOld && !isOld(f.mtime)) return false;
    if (filterLarge && f.size < 1024 * 1024) return false;
    return true;
  };

  const activeFiles = files
    .filter((f) => f.type === activeType)
    .filter(matchesFilter)
    .sort((a, b) => b.size - a.size);

  const selectedFiles = files.filter((f) => f.selected);
  const totalSize = files.filter((f) => f.type === activeType).reduce((s, f) => s + f.size, 0);
  const selectedSize = selectedFiles.reduce((s, f) => s + f.size, 0);

  const deleteSelected = () => {
    if (selectedFiles.length === 0) {
      Alert.alert("Nothing Selected", "Select files to delete.");
      return;
    }
    Alert.alert(
      "Delete Files",
      `Delete ${selectedFiles.length} file(s) (${fmtBytes(selectedSize)})?\n\nThis action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            let deleted = 0;
            for (const f of selectedFiles) {
              try {
                await FileSystem.deleteAsync(f.path, { idempotent: true });
                deleted++;
              } catch {}
            }
            const remaining = files.filter(
              (f) => !selectedFiles.some((s) => s.id === f.id)
            );
            setFiles(remaining);
            setIsDeleting(false);
            Alert.alert(
              "Done",
              `Deleted ${deleted} file(s) and freed ${fmtBytes(selectedSize)}.`
            );
          },
        },
      ]
    );
  };

  const typeInfo = MEDIA_TYPES.find((t) => t.key === activeType) ?? MEDIA_TYPES[0];
  const allTypeFiles = files.filter((f) => f.type === activeType);
  const selectedCount = activeFiles.filter((f) => f.selected).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {isWeb ? (
        <View style={styles.webNote}>
          <Ionicons name="phone-portrait-outline" size={48} color={theme.textSecondary} />
          <Text style={[styles.webNoteTitle, { color: theme.text }]}>Android Only</Text>
          <Text style={[styles.webNoteDesc, { color: theme.textSecondary }]}>
            The Media Cleaner scans WhatsApp media folders on your Android device. Open this app on Android to use this feature.
          </Text>
        </View>
      ) : (
        <>
          {/* Type tabs */}
          <View style={[styles.typeTabs, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            {MEDIA_TYPES.map((t) => {
              const count = files.filter((f) => f.type === t.key).length;
              const active = activeType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeTab, active && { borderBottomColor: t.color, borderBottomWidth: 2 }]}
                  onPress={() => setActiveType(t.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={t.icon as any} size={18} color={active ? t.color : theme.textSecondary} />
                  <Text style={[styles.typeTabText, { color: active ? t.color : theme.textSecondary }]}>
                    {t.key}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.badge, { backgroundColor: active ? t.color : isDark ? "#3A3A3A" : "#E5E7EB" }]}>
                      <Text style={{ fontSize: 10, color: active ? "#fff" : theme.textSecondary, fontFamily: "Inter_600SemiBold" }}>
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stats bar */}
          <View style={[styles.statsBar, { backgroundColor: isDark ? "#111" : "#F0FDF4", borderBottomColor: theme.border }]}>
            <View style={styles.statItem}>
              <Ionicons name="albums" size={14} color={Colors.primary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {allTypeFiles.length} files
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="server" size={14} color={Colors.primary} />
              <Text style={[styles.statText, { color: theme.textSecondary }]}>
                {fmtBytes(totalSize)} total
              </Text>
            </View>
            {selectedCount > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={14} color="#EF4444" />
                <Text style={[styles.statText, { color: "#EF4444" }]}>
                  {selectedCount} selected ({fmtBytes(selectedSize)})
                </Text>
              </View>
            )}
          </View>

          {/* Filters */}
          <View style={[styles.filters, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.filterChip, filterOld && { backgroundColor: "#F59E0B20", borderColor: "#F59E0B" }]}
              onPress={() => setFilterOld(!filterOld)}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={13} color={filterOld ? "#F59E0B" : theme.textSecondary} />
              <Text style={[styles.filterText, { color: filterOld ? "#F59E0B" : theme.textSecondary }]}>
                30+ days old
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filterLarge && { backgroundColor: "#EF444420", borderColor: "#EF4444" }]}
              onPress={() => setFilterLarge(!filterLarge)}
              activeOpacity={0.8}
            >
              <Ionicons name="layers-outline" size={13} color={filterLarge ? "#EF4444" : theme.textSecondary} />
              <Text style={[styles.filterText, { color: filterLarge ? "#EF4444" : theme.textSecondary }]}>
                Large (1MB+)
              </Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.selBtn} onPress={selectAll} activeOpacity={0.7}>
              <Text style={[styles.selBtnText, { color: Colors.primary }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.selBtn} onPress={deselectAll} activeOpacity={0.7}>
              <Text style={[styles.selBtnText, { color: theme.textSecondary }]}>None</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={activeFiles}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={Colors.primary} />
            }
            contentContainerStyle={{
              padding: 12,
              paddingBottom: bottomPad + 90,
              gap: 8,
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                {refreshing ? null : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={56} color={Colors.primary} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>All Clean!</Text>
                    <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
                      {files.filter((f) => f.type === activeType).length > 0
                        ? "No files match the current filters."
                        : "No WhatsApp media found. Make sure you've granted file permissions and WhatsApp is installed."}
                    </Text>
                  </>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.fileCard,
                  { backgroundColor: theme.card },
                  item.selected && { borderColor: "#EF4444", borderWidth: 2 },
                ]}
                onPress={() => toggleSelect(item.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.fileIcon,
                    { backgroundColor: (MEDIA_TYPES.find((t) => t.key === item.type)?.color ?? Colors.primary) + "20" },
                  ]}
                >
                  <Ionicons
                    name={(MEDIA_TYPES.find((t) => t.key === item.type)?.icon as any) ?? "document"}
                    size={22}
                    color={MEDIA_TYPES.find((t) => t.key === item.type)?.color ?? Colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.fileMeta}>
                    <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                      {fmtBytes(item.size)}
                    </Text>
                    {isOld(item.mtime) && (
                      <View style={styles.oldBadge}>
                        <Text style={styles.oldBadgeText}>30+ days</Text>
                      </View>
                    )}
                    {item.size >= 1024 * 1024 && (
                      <View style={[styles.oldBadge, { backgroundColor: "#EF444420" }]}>
                        <Text style={[styles.oldBadgeText, { color: "#EF4444" }]}>Large</Text>
                      </View>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    item.selected && { backgroundColor: "#EF4444", borderColor: "#EF4444" },
                    !item.selected && { borderColor: theme.border },
                  ]}
                >
                  {item.selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Delete bar */}
          {selectedFiles.length > 0 && (
            <View style={[styles.deleteBar, { backgroundColor: theme.card, borderTopColor: theme.border, paddingBottom: bottomPad + 8 }]}>
              <Text style={[styles.deleteBarText, { color: theme.text }]}>
                {selectedFiles.length} selected · {fmtBytes(selectedSize)}
              </Text>
              <TouchableOpacity
                style={[styles.deleteBtn, isDeleting && { opacity: 0.6 }]}
                onPress={deleteSelected}
                disabled={isDeleting}
                activeOpacity={0.8}
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.deleteBtnText}>
                  {isDeleting ? "Deleting..." : "Delete Selected"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webNote: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  webNoteTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  webNoteDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  typeTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  typeTab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    gap: 3,
  },
  typeTabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 16,
    borderBottomWidth: 1,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  filters: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  selBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  selBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  fileCard: {
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  fileName: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  fileMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  fileSize: { fontSize: 12, fontFamily: "Inter_400Regular" },
  oldBadge: {
    backgroundColor: "#F59E0B20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oldBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#F59E0B" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  deleteBarText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  deleteBtn: {
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  deleteBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
