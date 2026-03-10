import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Clipboard,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type FontStyle = {
  id: string;
  name: string;
  convert: (text: string) => string;
};

function makeMapper(normal: string, styled: string) {
  return (text: string) => {
    return text
      .split("")
      .map((ch) => {
        const idx = normal.indexOf(ch);
        if (idx === -1) return ch;
        return styled[idx] ?? ch;
      })
      .join("");
  };
}

const NORMAL_LOWER = "abcdefghijklmnopqrstuvwxyz";
const NORMAL_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NORMAL_ALL = NORMAL_LOWER + NORMAL_UPPER;

function fullMapper(lower: string, upper: string) {
  return (text: string) =>
    text
      .split("")
      .map((ch) => {
        const li = NORMAL_LOWER.indexOf(ch);
        if (li >= 0) return lower[li] ?? ch;
        const ui = NORMAL_UPPER.indexOf(ch);
        if (ui >= 0) return upper[ui] ?? ch;
        return ch;
      })
      .join("");
}

const FONT_STYLES: FontStyle[] = [
  {
    id: "bold",
    name: "Bold Serif",
    convert: fullMapper(
      "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳",
      "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙"
    ),
  },
  {
    id: "italic",
    name: "Italic",
    convert: fullMapper(
      "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧",
      "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍"
    ),
  },
  {
    id: "bold-italic",
    name: "Bold Italic",
    convert: fullMapper(
      "𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛",
      "𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁"
    ),
  },
  {
    id: "script",
    name: "Script",
    convert: fullMapper(
      "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃",
      "𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩"
    ),
  },
  {
    id: "double",
    name: "Double Struck",
    convert: fullMapper(
      "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫",
      "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"
    ),
  },
  {
    id: "fraktur",
    name: "Gothic / Fraktur",
    convert: fullMapper(
      "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷",
      "𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ"
    ),
  },
  {
    id: "mono",
    name: "Monospace",
    convert: fullMapper(
      "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣",
      "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉"
    ),
  },
  {
    id: "bubble",
    name: "Bubble",
    convert: fullMapper(
      "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ",
      "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ"
    ),
  },
  {
    id: "square",
    name: "Square",
    convert: fullMapper(
      "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄻🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉",
      "🅰🅱🅲🅳🅴🅵🅶🅷🅸🅹🅺🅻🅼🅽🅾🅿🆀🆁🆂🆃🆄🆅🆆🆇🆈🆉"
    ),
  },
  {
    id: "wide",
    name: "Wide / Fullwidth",
    convert: (text: string) =>
      text
        .split("")
        .map((ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 33 && code <= 126) return String.fromCodePoint(code + 65248);
          return ch;
        })
        .join(""),
  },
  {
    id: "small-caps",
    name: "Small Caps",
    convert: makeMapper(
      "abcdefghijklmnopqrstuvwxyz",
      "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ"
    ),
  },
  {
    id: "flip",
    name: "Upside Down",
    convert: (text: string) => {
      const flip: Record<string, string> = {
        a: "ɐ", b: "q", c: "ɔ", d: "p", e: "ǝ", f: "ɟ", g: "ƃ", h: "ɥ",
        i: "ı", j: "ɾ", k: "ʞ", l: "l", m: "ɯ", n: "u", o: "o", p: "d",
        q: "b", r: "ɹ", s: "s", t: "ʇ", u: "n", v: "ʌ", w: "ʍ", x: "x",
        y: "ʎ", z: "z",
      };
      return text
        .split("")
        .map((ch) => flip[ch.toLowerCase()] ?? ch)
        .reverse()
        .join("");
    },
  },
];

export default function FancyTextScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [input, setInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyStyle(id: string, text: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (Platform.OS === "web") {
      await navigator.clipboard.writeText(text);
    } else {
      Clipboard.setString(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function sendViaWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Could not open WhatsApp")
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Input */}
      <View style={[styles.inputCard, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TextInput
          style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
          value={input}
          onChangeText={setInput}
          placeholder="Type your text here..."
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          autoFocus={false}
        />
      </View>

      {input.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="text" size={52} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Fancy Text Generator</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Type text above to see it transformed into{"\n"}beautiful styles
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {FONT_STYLES.map((style) => {
            const converted = style.convert(input);
            const isCopied = copiedId === style.id;
            return (
              <View key={style.id} style={[styles.styleCard, { backgroundColor: theme.card }]}>
                <View style={styles.styleHeader}>
                  <Text style={[styles.styleName, { color: theme.textSecondary }]}>
                    {style.name}
                  </Text>
                  <View style={styles.styleActions}>
                    <TouchableOpacity
                      onPress={() => sendViaWhatsApp(converted)}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => copyStyle(style.id, converted)}
                      style={[
                        styles.copyBtn,
                        { backgroundColor: isCopied ? Colors.primary : isDark ? "#2A2A2A" : "#F3F4F6" },
                      ]}
                    >
                      <Ionicons
                        name={isCopied ? "checkmark" : "copy-outline"}
                        size={14}
                        color={isCopied ? "#fff" : theme.textSecondary}
                      />
                      <Text
                        style={[
                          styles.copyText,
                          { color: isCopied ? "#fff" : theme.textSecondary },
                        ]}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.styleText, { color: theme.text }]} selectable>
                  {converted}
                </Text>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minHeight: 70,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
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
  scroll: {
    padding: 14,
    gap: 10,
  },
  styleCard: {
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  styleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  styleName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  styleActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  iconBtn: {
    padding: 4,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  styleText: {
    fontSize: 18,
    lineHeight: 26,
  },
});
