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
  Linking,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

type Contact = {
  id: string;
  number: string;
};

export default function BulkMessageScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [message, setMessage] = useState("");
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [sending, setSending] = useState(false);

  function addContact() {
    const clean = newNumber.replace(/\D/g, "");
    if (clean.length < 7) {
      Alert.alert("Invalid", "Please enter a valid phone number.");
      return;
    }
    if (contacts.find((c) => c.number === clean)) {
      Alert.alert("Duplicate", "This number is already in the list.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setContacts([
      ...contacts,
      {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        number: clean,
      },
    ]);
    setNewNumber("");
  }

  function removeContact(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setContacts(contacts.filter((c) => c.id !== id));
  }

  async function sendNext(idx: number) {
    if (idx >= contacts.length) {
      setSending(false);
      setCurrentIdx(-1);
      Alert.alert(
        "Done!",
        `Messages sent to ${contacts.length} contacts.`,
        [{ text: "OK" }]
      );
      return;
    }

    setCurrentIdx(idx);
    const contact = contacts[idx];
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${contact.number}?text=${encoded}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {}

    // Wait 2s then prompt for next
    setTimeout(() => {
      Alert.alert(
        `Send to next? (${idx + 1}/${contacts.length})`,
        `Next: ${contacts[idx + 1]?.number || "Done"}`,
        [
          {
            text: "Skip",
            style: "destructive",
            onPress: () => sendNext(idx + 1),
          },
          {
            text: "Send",
            onPress: () => sendNext(idx + 1),
          },
        ]
      );
    }, 2000);
  }

  function startSending() {
    if (!message.trim()) {
      Alert.alert("Missing Message", "Please enter a message to send.");
      return;
    }
    if (contacts.length === 0) {
      Alert.alert("No Contacts", "Please add at least one contact.");
      return;
    }
    setSending(true);
    sendNext(0);
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Warning */}
        <View style={[styles.noteCard, { backgroundColor: isDark ? "#1A1A2E" : "#EFF6FF" }]}>
          <Ionicons name="shield-checkmark" size={18} color="#3B82F6" />
          <Text style={[styles.noteText, { color: isDark ? "#93C5FD" : "#1D4ED8" }]}>
            Chats open one by one to stay compliant with WhatsApp's policies. No auto-sending.
          </Text>
        </View>

        {/* Message */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Message</Text>
          <TextInput
            style={[styles.msgInput, { color: theme.text, borderColor: theme.border }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: theme.textSecondary }]}>
            {message.length} characters
          </Text>
        </View>

        {/* Add Contact */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>
            Contacts{" "}
            <Text style={{ color: Colors.primary }}>{contacts.length}</Text>
          </Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.numberInput, { color: theme.text, borderColor: theme.border }]}
              value={newNumber}
              onChangeText={setNewNumber}
              placeholder="Phone number with country code"
              placeholderTextColor={theme.textSecondary}
              keyboardType="phone-pad"
              maxLength={15}
              onSubmitEditing={addContact}
            />
            <TouchableOpacity
              style={[styles.addBtn, { opacity: newNumber.length < 7 ? 0.5 : 1 }]}
              onPress={addContact}
              disabled={newNumber.length < 7}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {contacts.length > 0 && (
            <View style={styles.contactsList}>
              {contacts.map((contact, idx) => (
                <View
                  key={contact.id}
                  style={[
                    styles.contactRow,
                    {
                      backgroundColor: currentIdx === idx
                        ? Colors.primary + "20"
                        : isDark ? Colors.dark.background : "#F9FAFB",
                      borderColor:
                        currentIdx === idx ? Colors.primary : theme.border,
                    },
                  ]}
                >
                  <View style={[styles.contactNum, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.contactNumText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.contactNumber, { color: theme.text }]}>
                    +{contact.number}
                  </Text>
                  {currentIdx === idx && (
                    <Ionicons name="send" size={14} color={Colors.primary} />
                  )}
                  <TouchableOpacity onPress={() => removeContact(contact.id)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {contacts.length === 0 && (
            <View style={styles.emptyContacts}>
              <Ionicons name="people-outline" size={36} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No contacts added yet
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { opacity: contacts.length === 0 || !message.trim() || sending ? 0.5 : 1 },
          ]}
          onPress={startSending}
          disabled={contacts.length === 0 || !message.trim() || sending}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={styles.sendBtnText}>
            {sending ? `Sending (${currentIdx + 1}/${contacts.length})...` : `Send to ${contacts.length} Contact${contacts.length !== 1 ? "s" : ""}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  msgInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  addRow: {
    flexDirection: "row",
    gap: 10,
  },
  numberInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 48,
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  contactsList: {
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactNumText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  contactNumber: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyContacts: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 4,
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
