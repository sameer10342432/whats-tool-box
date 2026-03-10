import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  Linking,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Category = "Work" | "Friends" | "Family" | "Important";

type Contact = {
  id: string;
  name: string;
  phone: string;
  category: Category;
  favorite: boolean;
  note?: string;
};

const CATEGORIES: { key: Category; icon: string; color: string }[] = [
  { key: "Work", icon: "briefcase", color: "#34B7F1" },
  { key: "Friends", icon: "people", color: "#25D366" },
  { key: "Family", icon: "home", color: "#F59E0B" },
  { key: "Important", icon: "star", color: "#EF4444" },
];

const STORAGE_KEY = "chat_organizer_contacts";

export default function ChatOrganizerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | "Favorites">("Friends");
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [modalCategory, setModalCategory] = useState<Category>("Friends");

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch {}
  };

  const save = async (list: Contact[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setContacts(list);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const openModal = (contact?: Contact) => {
    if (contact) {
      setEditContact(contact);
      setName(contact.name);
      setPhone(contact.phone);
      setNote(contact.note || "");
      setModalCategory(contact.category);
    } else {
      setEditContact(null);
      setName("");
      setPhone("");
      setNote("");
      setModalCategory(
        activeCategory === "Favorites" ? "Friends" : activeCategory
      );
    }
    setShowModal(true);
  };

  const saveContact = () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a contact name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Required", "Please enter a phone number.");
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      Alert.alert("Invalid", "Please enter a valid phone number with country code.");
      return;
    }

    if (editContact) {
      const updated = contacts.map((c) =>
        c.id === editContact.id
          ? { ...c, name: name.trim(), phone: digits, note, category: modalCategory }
          : c
      );
      save(updated);
    } else {
      const newContact: Contact = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        phone: digits,
        category: modalCategory,
        favorite: false,
        note: note.trim(),
      };
      save([...contacts, newContact]);
    }
    setShowModal(false);
  };

  const deleteContact = (id: string) => {
    Alert.alert("Delete Contact", "Remove this contact from the organizer?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => save(contacts.filter((c) => c.id !== id)),
      },
    ]);
  };

  const toggleFavorite = (id: string) => {
    save(contacts.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)));
  };

  const openWhatsApp = (contact: Contact) => {
    const url = `https://wa.me/${contact.phone}`;
    Linking.openURL(url).catch(() =>
      Alert.alert("WhatsApp Not Found", "Please install WhatsApp to open this chat.")
    );
  };

  const filtered =
    activeCategory === "Favorites"
      ? contacts.filter((c) => c.favorite)
      : contacts.filter((c) => c.category === activeCategory);

  const getCategoryInfo = (key: Category) =>
    CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabs, { backgroundColor: theme.card, borderBottomColor: theme.border }]}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 8 }}
      >
        <TouchableOpacity
          style={[
            styles.tab,
            activeCategory === "Favorites" && { backgroundColor: "#F59E0B" },
            activeCategory !== "Favorites" && { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" },
          ]}
          onPress={() => setActiveCategory("Favorites")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="heart"
            size={15}
            color={activeCategory === "Favorites" ? "#fff" : theme.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeCategory === "Favorites" ? "#fff" : theme.textSecondary },
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.tab,
              activeCategory === cat.key && { backgroundColor: cat.color },
              activeCategory !== cat.key && { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" },
            ]}
            onPress={() => setActiveCategory(cat.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={cat.icon as any}
              size={15}
              color={activeCategory === cat.key ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                { color: activeCategory === cat.key ? "#fff" : theme.textSecondary },
              ]}
            >
              {cat.key}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    activeCategory === cat.key ? "rgba(255,255,255,0.3)" : isDark ? "#3A3A3A" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: activeCategory === cat.key ? "#fff" : theme.textSecondary,
                  fontFamily: "Inter_600SemiBold",
                }}
              >
                {contacts.filter((c) => c.category === cat.key).length}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Contact list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14, paddingBottom: bottomPad + 80, gap: 10 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={56} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No contacts here</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
              {activeCategory === "Favorites"
                ? "Mark contacts as favorites to see them here."
                : `Add contacts to ${activeCategory} using the + button.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const catInfo = getCategoryInfo(item.category);
          return (
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={[styles.avatar, { backgroundColor: catInfo.color + "20" }]}>
                <Text style={[styles.avatarText, { color: catInfo.color }]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.contactName, { color: theme.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={[styles.catBadge, { backgroundColor: catInfo.color + "20" }]}>
                    <Ionicons name={catInfo.icon as any} size={11} color={catInfo.color} />
                    <Text style={[styles.catBadgeText, { color: catInfo.color }]}>
                      {item.category}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.contactPhone, { color: theme.textSecondary }]}>
                  +{item.phone}
                </Text>
                {!!item.note && (
                  <Text style={[styles.contactNote, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.note}
                  </Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.iconBtn}>
                  <Ionicons
                    name={item.favorite ? "heart" : "heart-outline"}
                    size={20}
                    color={item.favorite ? "#EF4444" : theme.textSecondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openModal(item)} style={styles.iconBtn}>
                  <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => openWhatsApp(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteContact(item.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal()} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editContact ? "Edit Contact" : "Add Contact"}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Name</Text>
            <View style={[styles.fieldBox, { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" }]}>
              <TextInput
                style={[styles.fieldInput, { color: theme.text }]}
                placeholder="Contact name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Phone (with country code)
            </Text>
            <View style={[styles.fieldBox, { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" }]}>
              <TextInput
                style={[styles.fieldInput, { color: theme.text }]}
                placeholder="e.g. 12125550123"
                placeholderTextColor={theme.textSecondary}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Note (optional)
            </Text>
            <View style={[styles.fieldBox, { backgroundColor: isDark ? "#2A2A2A" : "#F3F4F6" }]}>
              <TextInput
                style={[styles.fieldInput, { color: theme.text }]}
                placeholder="Add a note..."
                placeholderTextColor={theme.textSecondary}
                value={note}
                onChangeText={setNote}
              />
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 12 }]}>
              Category
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catChip,
                    { borderColor: cat.color },
                    modalCategory === cat.key && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setModalCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={modalCategory === cat.key ? "#fff" : cat.color}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_600SemiBold",
                      color: modalCategory === cat.key ? "#fff" : cat.color,
                    }}
                  >
                    {cat.key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveContact} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>
                {editContact ? "Save Changes" : "Add Contact"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabs: { borderBottomWidth: 1 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  card: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  contactName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  catBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  catBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  contactPhone: { fontSize: 13, fontFamily: "Inter_400Regular" },
  contactNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  openBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  fieldBox: { borderRadius: 10, paddingHorizontal: 12 },
  fieldInput: { fontSize: 15, fontFamily: "Inter_400Regular", paddingVertical: 12 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 16 },
});
