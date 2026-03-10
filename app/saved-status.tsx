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
  Share,
  Modal,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

const { width: SCREEN_W } = Dimensions.get("window");
const STORAGE_KEY = "saved_statuses";

type StatusItem = {
  id: string;
  uri: string;
  type: "image" | "video";
  savedAt: string;
};

export default function SavedStatusScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const theme = isDark ? Colors.dark : Colors.light;

  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [selected, setSelected] = useState<StatusItem | null>(null);

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    loadSaved();
  }, []);

  async function loadSaved() {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) setStatuses(JSON.parse(raw));
  }

  async function deleteStatus(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = statuses.filter((s) => s.id !== id);
    setStatuses(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  }

  async function shareStatus(item: StatusItem) {
    try {
      await Share.share({ url: item.uri, message: "Shared via WhatsToolbox" });
    } catch {}
  }

  function confirmDelete(id: string) {
    Alert.alert("Delete Status", "Remove this status from your gallery?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteStatus(id),
      },
    ]);
  }

  const renderItem = ({ item }: { item: StatusItem }) => (
    <TouchableOpacity
      style={styles.thumb}
      onPress={() => setSelected(item)}
      activeOpacity={0.85}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbImg} />
      {item.type === "video" && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={12} color="#fff" />
        </View>
      )}
      <TouchableOpacity
        style={styles.deleteMini}
        onPress={() => confirmDelete(item.id)}
      >
        <Ionicons name="close-circle" size={20} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const ITEM_SIZE = (SCREEN_W - 48) / 3;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={statuses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 20 }]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No saved statuses
            </Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Go to the Status tab to save your first status
            </Text>
          </View>
        }
        ListHeaderComponent={
          statuses.length > 0 ? (
            <Text style={[styles.count, { color: theme.textSecondary }]}>
              {statuses.length} item{statuses.length !== 1 ? "s" : ""} saved
            </Text>
          ) : null
        }
      />

      {/* Full-screen viewer */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modal}>
          <TouchableOpacity
            style={styles.closeModal}
            onPress={() => setSelected(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {selected && (
            <Image
              source={{ uri: selected.uri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}

          <View style={[styles.modalActions, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => selected && shareStatus(selected)}
            >
              <Ionicons name="share-social" size={22} color="#fff" />
              <Text style={styles.modalBtnText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.deleteBtn]}
              onPress={() => selected && confirmDelete(selected.id)}
            >
              <Ionicons name="trash" size={22} color="#fff" />
              <Text style={styles.modalBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: {
    padding: 12,
    gap: 4,
  },
  row: {
    gap: 4,
    marginBottom: 4,
  },
  thumb: {
    width: (SCREEN_W - 48) / 3,
    height: (SCREEN_W - 48) / 3,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 3,
  },
  deleteMini: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  count: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    gap: 12,
    paddingHorizontal: 40,
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
    lineHeight: 20,
  },
  modal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closeModal: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  modalActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 20,
    gap: 12,
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
  deleteBtn: {
    backgroundColor: "#EF4444",
  },
  modalBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
