import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getApiUrl } from "@/lib/query-client";

const STICKER_EMOJIS = ["😂", "🔥", "💯", "❤️", "😍", "🎉", "👀", "💪", "🤣", "✨", "😭", "🙏"];

type StickerResult = {
  title: string;
  text: string;
  emojis: string;
  tags: string[];
};

export default function AiStickerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mode, setMode] = useState<"ai" | "image">("ai");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StickerResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stickerBg, setStickerBg] = useState("#25D366");
  const [stickerName, setStickerName] = useState("My Pack");

  const BG_COLORS = ["#25D366", "#34B7F1", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#1A1A2E", "#FF6B6B"];

  const generateAiSticker = async () => {
    if (!prompt.trim()) {
      Alert.alert("Enter a prompt", "Describe the sticker you want to create.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const url = new URL("/api/generate-sticker", getApiUrl()).toString();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch {
      Alert.alert("Error", "Failed to generate sticker. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission Required", "Please allow access to your photo library.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!picked.canceled && picked.assets?.[0]) {
      setSelectedImage(picked.assets[0].uri);
    }
  };

  const copyStickerText = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(`${result.emojis} ${result.text}`);
    Alert.alert("Copied!", "Sticker text copied. Paste it into WhatsApp!");
  };

  const saveImageSticker = async () => {
    if (!selectedImage) return;
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Allow media access to save sticker.");
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(selectedImage);
      await MediaLibrary.createAlbumAsync("WhatsToolbox", asset, false);
      Alert.alert("Saved!", "Sticker image saved to your gallery in WhatsToolbox album.");
    } catch {
      Alert.alert("Error", "Failed to save sticker.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 30 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Mode Toggle */}
      <View style={[styles.modeToggle, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "ai" && { backgroundColor: Colors.primary }]}
          onPress={() => setMode("ai")}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={16} color={mode === "ai" ? "#fff" : theme.textSecondary} />
          <Text style={[styles.modeBtnText, { color: mode === "ai" ? "#fff" : theme.textSecondary }]}>
            AI Generate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "image" && { backgroundColor: Colors.primary }]}
          onPress={() => setMode("image")}
          activeOpacity={0.8}
        >
          <Ionicons name="image" size={16} color={mode === "image" ? "#fff" : theme.textSecondary} />
          <Text style={[styles.modeBtnText, { color: mode === "image" ? "#fff" : theme.textSecondary }]}>
            From Image
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "ai" ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>
            STICKER PACK NAME
          </Text>
          <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="e.g. Funny Reactions"
              placeholderTextColor={theme.textSecondary}
              value={stickerName}
              onChangeText={setStickerName}
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>
            DESCRIBE YOUR STICKER
          </Text>
          <View style={[styles.inputBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.input, styles.multiline, { color: theme.text }]}
              placeholder="e.g. A hilarious reaction when something goes wrong at work"
              placeholderTextColor={theme.textSecondary}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Quick prompts */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>
            QUICK IDEAS
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                "Funny office reaction",
                "Weekend vibes",
                "Monday mood",
                "Food lover",
                "Gym motivation",
                "Love emoji pack",
                "Savage reply",
                "Celebration time",
              ].map((idea) => (
                <TouchableOpacity
                  key={idea}
                  style={[styles.chip, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => setPrompt(idea)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>{idea}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.generateBtn, loading && { opacity: 0.7 }]}
            onPress={generateAiSticker}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="sparkles" size={20} color="#fff" />
            )}
            <Text style={styles.generateBtnText}>
              {loading ? "Creating Sticker..." : "Generate Sticker"}
            </Text>
          </TouchableOpacity>

          {result && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
                YOUR STICKER PACK: {stickerName.toUpperCase()}
              </Text>
              {/* Background color picker */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {BG_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setStickerBg(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        stickerBg === c && styles.colorDotSelected,
                      ]}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Main sticker preview */}
              <View style={[styles.stickerPreview, { backgroundColor: stickerBg }]}>
                <Text style={styles.stickerEmojis}>{result.emojis}</Text>
                <Text style={styles.stickerText}>{result.title}</Text>
                <Text style={styles.stickerSub}>{result.text}</Text>
              </View>

              {/* Mini sticker variants */}
              <View style={styles.stickerGrid}>
                {result.tags.map((tag, i) => (
                  <View
                    key={i}
                    style={[
                      styles.miniSticker,
                      { backgroundColor: BG_COLORS[(i + 2) % BG_COLORS.length] },
                    ]}
                  >
                    <Text style={styles.miniStickerEmoji}>
                      {STICKER_EMOJIS[i % STICKER_EMOJIS.length]}
                    </Text>
                    <Text style={styles.miniStickerText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.copyBtn} onPress={copyStickerText} activeOpacity={0.8}>
                <Ionicons name="copy-outline" size={18} color="#fff" />
                <Text style={styles.copyBtnText}>Copy Sticker Text</Text>
              </TouchableOpacity>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Copy and paste this sticker text into WhatsApp to use it as a text sticker.
              </Text>
            </>
          )}
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>
            SELECT IMAGE
          </Text>
          <TouchableOpacity
            style={[styles.imagePicker, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePickerEmpty}>
                <Ionicons name="add-circle-outline" size={48} color={Colors.primary} />
                <Text style={[styles.imagePickerText, { color: theme.textSecondary }]}>
                  Tap to select an image
                </Text>
                <Text style={[styles.imagePickerHint, { color: theme.textSecondary }]}>
                  Image will be cropped to square (1:1)
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {selectedImage && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 16 }]}>
                STICKER BACKGROUND
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  {BG_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setStickerBg(c)}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c },
                        stickerBg === c && styles.colorDotSelected,
                      ]}
                    />
                  ))}
                </View>
              </ScrollView>

              {/* Sticker preview frame */}
              <View style={[styles.stickerFrame, { backgroundColor: stickerBg }]}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.stickerFrameImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={18} color={Colors.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.text }]}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                  onPress={saveImageSticker}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download" size={18} color="#fff" />
                  <Text style={[styles.actionBtnText, { color: "#fff" }]}>Save Sticker</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                Save the sticker to your gallery, then share it on WhatsApp as an image.
              </Text>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  inputBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  input: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    paddingVertical: 13,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 13,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  generateBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
  },
  generateBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
  stickerPreview: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  stickerEmojis: { fontSize: 48, marginBottom: 8 },
  stickerText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  stickerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  miniSticker: {
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    width: "30%",
  },
  miniStickerEmoji: { fontSize: 26, marginBottom: 4 },
  miniStickerText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  copyBtn: {
    backgroundColor: Colors.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  copyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  imagePicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 8,
  },
  imagePickerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  imagePickerText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  imagePickerHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  selectedImage: { width: "100%", height: "100%" },
  stickerFrame: {
    width: 200,
    height: 200,
    borderRadius: 24,
    alignSelf: "center",
    overflow: "hidden",
    padding: 12,
    marginBottom: 16,
  },
  stickerFrameImage: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
