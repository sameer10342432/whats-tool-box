import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "@/constants/colors";

const SCHED_KEY = "scheduled_statuses";

type ScheduledStatus = {
  id: string;
  caption: string;
  imageUri: string | null;
  scheduledFor: string;
  createdAt: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPast(iso: string) {
  return new Date(iso) < new Date();
}

export default function StatusSchedulerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [caption, setCaption] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [statuses, setStatuses] = useState<ScheduledStatus[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "scheduled">("create");

  useEffect(() => {
    loadStatuses();
  }, []);

  async function loadStatuses() {
    const raw = await AsyncStorage.getItem(SCHED_KEY);
    if (raw) setStatuses(JSON.parse(raw));
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function scheduleStatus() {
    if (!caption.trim() && !imageUri) {
      Alert.alert("Incomplete", "Please add a caption or image.");
      return;
    }
    if (!date || !time) {
      Alert.alert("Incomplete", "Please set a date and time.");
      return;
    }

    const scheduledFor = new Date(`${date}T${time}`).toISOString();
    if (new Date(scheduledFor) <= new Date()) {
      Alert.alert("Invalid Time", "Please choose a future date and time.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newStatus: ScheduledStatus = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      caption: caption.trim(),
      imageUri,
      scheduledFor,
      createdAt: new Date().toISOString(),
    };

    const updated = [newStatus, ...statuses];
    setStatuses(updated);
    await AsyncStorage.setItem(SCHED_KEY, JSON.stringify(updated));

    setCaption("");
    setImageUri(null);
    setDate("");
    setTime("");
    setActiveTab("scheduled");

    Alert.alert(
      "Scheduled!",
      `We'll remind you on ${formatDate(scheduledFor)} to post this status.`,
      [{ text: "Got it" }]
    );
  }

  async function deleteStatus(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = statuses.filter((s) => s.id !== id);
    setStatuses(updated);
    await AsyncStorage.setItem(SCHED_KEY, JSON.stringify(updated));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabWrap, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.tabBar, { backgroundColor: isDark ? Colors.dark.background : "#F3F4F6" }]}>
          {(["create", "scheduled"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                activeTab === tab && { backgroundColor: Colors.primary },
              ]}
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
                {tab === "create" ? "Create" : `Scheduled (${statuses.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === "create" ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Note */}
          <View style={[styles.noteCard, { backgroundColor: isDark ? "#1A2A1A" : "#F0FFF4" }]}>
            <Ionicons name="information-circle" size={18} color={Colors.primary} />
            <Text style={[styles.noteText, { color: theme.text }]}>
              We'll remind you at the scheduled time to post your status manually on WhatsApp.
            </Text>
          </View>

          {/* Image */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text }]}>Status Image (Optional)</Text>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImg} />
                <TouchableOpacity
                  style={styles.removeImg}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={26} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.imagePicker, { borderColor: theme.border }]}
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={28} color={theme.textSecondary} />
                <Text style={[styles.imagePickerText, { color: theme.textSecondary }]}>
                  Tap to add image
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Caption */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text }]}>Caption</Text>
            <TextInput
              style={[styles.captionInput, { color: theme.text, borderColor: theme.border }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Write your status caption..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.label, { color: theme.text }]}>Schedule Time</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={[styles.dateInput, { color: theme.text, borderColor: theme.border }]}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
              />
              <TextInput
                style={[styles.timeInput, { color: theme.text, borderColor: theme.border }]}
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Example: 2026-03-15 and 09:30
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.scheduleBtn,
              {
                opacity:
                  (!caption.trim() && !imageUri) || !date || !time ? 0.5 : 1,
              },
            ]}
            onPress={scheduleStatus}
            disabled={(!caption.trim() && !imageUri) || !date || !time}
            activeOpacity={0.85}
          >
            <Ionicons name="time" size={22} color="#fff" />
            <Text style={styles.scheduleBtnText}>Schedule Status</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {statuses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={56} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No scheduled statuses</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Create a schedule to get reminders
              </Text>
            </View>
          ) : (
            statuses.map((s) => (
              <View
                key={s.id}
                style={[
                  styles.schedCard,
                  {
                    backgroundColor: theme.card,
                    borderLeftColor: isPast(s.scheduledFor)
                      ? "#EF4444"
                      : Colors.primary,
                  },
                ]}
              >
                {s.imageUri && (
                  <Image source={{ uri: s.imageUri }} style={styles.schedThumb} />
                )}
                <View style={styles.schedInfo}>
                  <View style={styles.schedTimeRow}>
                    <Ionicons
                      name="time"
                      size={14}
                      color={isPast(s.scheduledFor) ? "#EF4444" : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.schedTime,
                        {
                          color: isPast(s.scheduledFor)
                            ? "#EF4444"
                            : Colors.primary,
                        },
                      ]}
                    >
                      {formatDate(s.scheduledFor)}
                      {isPast(s.scheduledFor) ? " (Past)" : ""}
                    </Text>
                  </View>
                  {s.caption ? (
                    <Text
                      style={[styles.schedCaption, { color: theme.text }]}
                      numberOfLines={2}
                    >
                      {s.caption}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => deleteStatus(s.id)}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabWrap: {
    padding: 12,
    borderBottomWidth: 1,
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
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  noteCard: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  imagePicker: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 12,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  imagePreview: {
    position: "relative",
  },
  previewImg: {
    width: "100%",
    height: 160,
    borderRadius: 10,
  },
  removeImg: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 13,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 1.5,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  scheduleBtn: {
    backgroundColor: Colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  scheduleBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  schedCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  schedThumb: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  schedInfo: {
    flex: 1,
    gap: 6,
  },
  schedTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  schedTime: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  schedCaption: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
