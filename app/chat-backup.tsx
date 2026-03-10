import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  useColorScheme,
  Alert,
  Share,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Message = {
  id: string;
  date: string;
  time: string;
  sender: string;
  text: string;
};

function parseWhatsAppChat(content: string): Message[] {
  const lines = content.split("\n");
  const messages: Message[] = [];
  // formats: [12/02/2024, 10:30] John: Hello
  //          12/02/2024, 10:30 - John: Hello
  const pattern1 = /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\]\s+([^:]+):\s+(.+)$/;
  const pattern2 = /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*-\s*([^:]+):\s+(.+)$/;

  let currentMsg: Message | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const m1 = trimmed.match(pattern1);
    const m2 = trimmed.match(pattern2);
    const match = m1 || m2;

    if (match) {
      if (currentMsg) messages.push(currentMsg);
      currentMsg = {
        id: `${messages.length}-${Date.now()}`,
        date: match[1],
        time: match[2],
        sender: match[3].trim(),
        text: match[4],
      };
    } else if (currentMsg) {
      currentMsg.text += "\n" + trimmed;
    }
  }
  if (currentMsg) messages.push(currentMsg);
  return messages;
}

function getSenders(messages: Message[]): string[] {
  const set = new Set<string>();
  messages.forEach((m) => set.add(m.sender));
  return Array.from(set);
}

const SENDER_COLORS = ["#25D366", "#34B7F1", "#7C3AED", "#F59E0B", "#EF4444", "#10B981"];

export default function ChatBackupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [filtered, setFiltered] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [senderColors, setSenderColors] = useState<Record<string, string>>({});

  const pickFile = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/plain",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) {
        setLoading(false);
        return;
      }
      const asset = result.assets[0];
      setFileName(asset.name);
      const content = await FileSystem.readAsStringAsync(asset.uri);
      const parsed = parseWhatsAppChat(content);
      if (parsed.length === 0) {
        Alert.alert("No Messages Found", "Could not parse the chat file. Make sure it's an exported WhatsApp chat (.txt) file.");
        setLoading(false);
        return;
      }
      const senders = getSenders(parsed);
      const colorMap: Record<string, string> = {};
      senders.forEach((s, i) => {
        colorMap[s] = SENDER_COLORS[i % SENDER_COLORS.length];
      });
      setSenderColors(colorMap);
      setMessages(parsed);
      setFiltered(parsed);
    } catch (e) {
      Alert.alert("Error", "Failed to read the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback(
    (text: string) => {
      setSearch(text);
      if (!text.trim()) {
        setFiltered(messages);
        return;
      }
      const q = text.toLowerCase();
      setFiltered(
        messages.filter(
          (m) =>
            m.text.toLowerCase().includes(q) ||
            m.sender.toLowerCase().includes(q)
        )
      );
    },
    [messages]
  );

  const exportSummary = async () => {
    const senders = getSenders(messages);
    const counts = senders.map((s) => ({
      name: s,
      count: messages.filter((m) => m.sender === s).length,
    }));
    const summary = [
      `Chat Summary: ${fileName}`,
      `Total Messages: ${messages.length}`,
      "",
      "Messages per participant:",
      ...counts.map((c) => `  ${c.name}: ${c.count} messages`),
      "",
      `Date range: ${messages[0]?.date} → ${messages[messages.length - 1]?.date}`,
    ].join("\n");
    await Share.share({ message: summary, title: "Chat Summary" });
  };

  const copyMessage = (msg: Message) => {
    Clipboard.setStringAsync(`[${msg.date}, ${msg.time}] ${msg.sender}: ${msg.text}`);
    Alert.alert("Copied", "Message copied to clipboard.");
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (messages.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyBox]}>
          <Ionicons name="document-text-outline" size={64} color={Colors.primary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            WhatsApp Chat Backup Viewer
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Import an exported WhatsApp chat file (.txt) to view messages in a chat interface.
            Export a chat from WhatsApp → More → Export Chat → Without Media.
          </Text>
          <TouchableOpacity
            style={styles.importBtn}
            onPress={pickFile}
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.importBtnText}>
              {loading ? "Loading..." : "Import Chat File"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border, paddingTop: topPad }]}>
        <View style={styles.topBarRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.topBarTitle, { color: theme.text }]} numberOfLines={1}>
              {fileName}
            </Text>
            <Text style={[styles.topBarSub, { color: theme.textSecondary }]}>
              {filtered.length} of {messages.length} messages
            </Text>
          </View>
          <TouchableOpacity onPress={exportSummary} style={styles.topBarAction}>
            <Ionicons name="share-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={pickFile} style={styles.topBarAction}>
            <Ionicons name="folder-open-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBox, { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" }]}>
          <Ionicons name="search" size={16} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search messages..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12, paddingBottom: bottomPad + 20 }}
        renderItem={({ item, index }) => {
          const senders = getSenders(messages);
          const isFirst = index === 0 || filtered[index - 1]?.sender !== item.sender;
          const color = senderColors[item.sender] || Colors.primary;
          const isSelf = senders.indexOf(item.sender) === 0;
          return (
            <TouchableOpacity
              onLongPress={() => copyMessage(item)}
              activeOpacity={0.85}
              style={[
                styles.msgRow,
                isSelf ? styles.msgRowRight : styles.msgRowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isSelf
                      ? Colors.primary
                      : isDark
                      ? "#1E1E1E"
                      : "#FFFFFF",
                    borderColor: isSelf ? Colors.primary : theme.border,
                    alignSelf: isSelf ? "flex-end" : "flex-start",
                  },
                ]}
              >
                {isFirst && !isSelf && (
                  <Text style={[styles.senderName, { color }]}>{item.sender}</Text>
                )}
                <Text
                  style={[
                    styles.msgText,
                    { color: isSelf ? "#fff" : theme.text },
                  ]}
                >
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.msgTime,
                    { color: isSelf ? "rgba(255,255,255,0.7)" : theme.textSecondary },
                  ]}
                >
                  {item.time}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  importBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  importBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topBarRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    marginBottom: 10,
  },
  topBarTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  topBarSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  topBarAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  msgRow: {
    marginVertical: 3,
  },
  msgRowRight: { alignItems: "flex-end" },
  msgRowLeft: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  senderName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
  },
  msgText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
