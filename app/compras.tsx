// app/compras.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ListRenderItemInfo } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type LocationKey = "GALPAO" | "ARCA" | "ESCRITORIO";

type Item = {
  id: string;
  name: string;
  qty?: string;
  done: boolean;
  createdAt: number;
};

type ListsState = Record<LocationKey, Item[]>;

const LOCATIONS: { key: LocationKey; label: string; color: string }[] = [
  { key: "GALPAO", label: "Galpão", color: "#2563EB" },
  { key: "ARCA", label: "Arca", color: "#16A34A" },
  { key: "ESCRITORIO", label: "Escritório", color: "#EA580C" },
];

const STORAGE_KEY = "shopping_lists_v2";

export default function ComprasScreen() {
  const [lists, setLists] = useState<ListsState>({
    GALPAO: [],
    ARCA: [],
    ESCRITORIO: [],
  });
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationKey>("GALPAO");
  const [editing, setEditing] = useState<{ loc: LocationKey; item: Item } | null>(null);
  const nameInputRef = useRef<TextInput>(null);

  // Carregar do storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLists(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  // Salvar (debounce simples)
  useEffect(() => {
    const id = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lists)).catch(() => {});
    }, 200);
    return () => clearTimeout(id);
  }, [lists]);

  const totals = useMemo(() => {
    const t: Record<LocationKey, { all: number; done: number }> = {
      GALPAO: { all: lists.GALPAO.length, done: lists.GALPAO.filter(i => i.done).length },
      ARCA: { all: lists.ARCA.length, done: lists.ARCA.filter(i => i.done).length },
      ESCRITORIO: { all: lists.ESCRITORIO.length, done: lists.ESCRITORIO.filter(i => i.done).length },
    };
    return t;
  }, [lists]);

  function addItem() {
    const trimmed = name.trim();
    if (!trimmed) {
      nameInputRef.current?.focus();
      return;
    }
    const newItem: Item = {
      id: Math.random().toString(36).slice(2),
      name: trimmed,
      qty: qty.trim() || undefined,
      done: false,
      createdAt: Date.now(),
    };
    setLists(prev => ({
      ...prev,
      [selectedLocation]: [newItem, ...prev[selectedLocation]],
    }));
    setName("");
    setQty("");
  }

  function toggleDone(loc: LocationKey, id: string) {
    setLists(prev => ({
      ...prev,
      [loc]: prev[loc].map(i => (i.id === id ? { ...i, done: !i.done } : i)),
    }));
  }

  function removeItem(loc: LocationKey, id: string) {
    setLists(prev => ({
      ...prev,
      [loc]: prev[loc].filter(i => i.id !== id),
    }));
  }

  function startEdit(loc: LocationKey, item: Item) {
    setEditing({ loc, item });
  }

  function saveEdit(newName: string, newQty?: string) {
    if (!editing) return;
    const { loc, item } = editing;
    const trimmed = newName.trim();
    if (!trimmed) return;
    setLists(prev => ({
      ...prev,
      [loc]: prev[loc].map(i =>
        i.id === item.id ? { ...i, name: trimmed, qty: newQty?.trim() || undefined } : i
      ),
    }));
    setEditing(null);
  }

  function clearDone(loc: LocationKey) {
    const count = lists[loc].filter(i => i.done).length;
    if (count === 0) return;
    Alert.alert(
      "Limpar comprados",
      `Remover ${count} item(ns) marcados como comprados em ${labelOf(loc)}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () =>
            setLists(prev => ({
              ...prev,
              [loc]: prev[loc].filter(i => !i.done),
            })),
        },
      ]
    );
  }

  function labelOf(loc: LocationKey) {
    return LOCATIONS.find(l => l.key === loc)?.label ?? loc;
  }
  function colorOf(loc: LocationKey) {
    return LOCATIONS.find(l => l.key === loc)?.color ?? "#2563EB";
  }

  // Factory de renderItem com nome para debug (sem warning)
  const renderItemForLocation = (loc: LocationKey) => {
    function RenderItem({ item }: ListRenderItemInfo<Item>) {
      return (
        <View style={styles.row}>
          <TouchableOpacity
            onPress={() => toggleDone(loc, item.id)}
            style={[styles.checkbox, item.done && styles.checkboxChecked]}
            accessibilityRole="button"
            accessibilityLabel={item.done ? "Desmarcar comprado" : "Marcar como comprado"}
          >
            {item.done ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.itemTextWrap}
            onLongPress={() => startEdit(loc, item)}
            accessibilityRole="button"
            accessibilityLabel="Editar item"
          >
            <Text style={[styles.itemText, item.done && styles.itemTextDone]}>
              {item.name}
              {item.qty ? <Text style={styles.qtyText}>  •  {item.qty}</Text> : null}
            </Text>
            <Text style={styles.metaText}>
              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString().slice(0, 5)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => startEdit(loc, item)} style={styles.iconBtn} accessibilityLabel="Editar">
            <Ionicons name="create-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => removeItem(loc, item.id)} style={styles.iconBtn} accessibilityLabel="Excluir">
            <Ionicons name="trash-outline" size={20} color="#B91C1C" />
          </TouchableOpacity>
        </View>
      );
    }
    RenderItem.displayName = `RenderItem_${loc}`;
    return RenderItem;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Lista de Compras</Text>

        {/* Card de adição */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Adicionar item</Text>

          {/* Segment de locais */}
          <View style={styles.segment}>
            {LOCATIONS.map(loc => {
              const active = selectedLocation === loc.key;
              return (
                <Pressable
                  key={loc.key}
                  onPress={() => setSelectedLocation(loc.key)}
                  style={[styles.segmentBtn, active && { backgroundColor: loc.color }]}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{loc.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Inputs */}
          <View style={styles.inputRow}>
            <TextInput
              ref={nameInputRef}
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Fita isolante"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, { flex: 1.4 }]}
              returnKeyType="done"
              onSubmitEditing={addItem}
            />
            <TextInput
              value={qty}
              onChangeText={setQty}
              placeholder="Qtd (opcional)"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, { flex: 1 }]}
            />
            <TouchableOpacity onPress={addItem} style={[styles.addBtn, { backgroundColor: colorOf(selectedLocation) }]}>
              <Ionicons name="add" size={22} color="#fff" />
              <Text style={styles.addBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seções por local */}
        {LOCATIONS.map(loc => {
          const data = lists[loc.key];
          const { all, done } = totals[loc.key];
          return (
            <View key={loc.key} style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: loc.color }]} />
                <Text style={styles.sectionTitle}>{loc.label}</Text>
                <View style={styles.sectionRight}>
                  <View style={styles.chips}>
                    <View style={styles.chip}>
                      <Ionicons name="list-outline" size={14} color="#111827" />
                      <Text style={styles.chipText}>Itens: {all}</Text>
                    </View>
                    <View style={styles.chip}>
                      <Ionicons name="checkmark-done-outline" size={14} color="#111827" />
                      <Text style={styles.chipText}>Comprados: {done}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <FlatList
                data={data}
                keyExtractor={(i) => i.id}
                renderItem={renderItemForLocation(loc.key)}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum item aqui ainda.</Text>}
                scrollEnabled={false}
              />

              {done > 0 && (
                <TouchableOpacity onPress={() => clearDone(loc.key)} style={styles.clearBtn}>
                  <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                  <Text style={styles.clearBtnText}>Limpar comprados</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal de edição */}
      <EditModal
        visible={!!editing}
        initialName={editing?.item.name || ""}
        initialQty={editing?.item.qty || ""}
        onCancel={() => setEditing(null)}
        onSave={saveEdit}
      />
    </KeyboardAvoidingView>
  );
}

function EditModal({
  visible,
  initialName,
  initialQty,
  onCancel,
  onSave,
}: {
  visible: boolean;
  initialName: string;
  initialQty?: string;
  onCancel: () => void;
  onSave: (name: string, qty?: string) => void;
}) {
  const [n, setN] = useState(initialName);
  const [q, setQ] = useState(initialQty || "");

  useEffect(() => {
    setN(initialName);
    setQ(initialQty || "");
  }, [initialName, initialQty, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.card}>
          <Text style={modalStyles.title}>Editar item</Text>
          <TextInput value={n} onChangeText={setN} placeholder="Nome" placeholderTextColor="#9CA3AF" style={modalStyles.input} />
          <TextInput value={q} onChangeText={setQ} placeholder="Quantidade (opcional)" placeholderTextColor="#9CA3AF" style={modalStyles.input} />

          <View style={modalStyles.row}>
            <TouchableOpacity onPress={onCancel} style={[modalStyles.btn, modalStyles.btnOutline]}>
              <Text style={[modalStyles.btnText, modalStyles.btnTextOutline]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(n, q)} style={[modalStyles.btn, modalStyles.btnPrimary]}>
              <Text style={modalStyles.btnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#F3F4F6", // cinza claro
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentText: {
    color: "#374151",
    fontWeight: "700",
  },
  segmentTextActive: {
    color: "#fff",
  },
  inputRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    color: "#111827",
    marginRight: 8,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 8,
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  sectionRight: {
    marginLeft: "auto",
  },
  chips: {
    flexDirection: "row",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  itemTextWrap: {
    flex: 1,
    marginRight: 8,
  },
  itemText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  itemTextDone: {
    textDecorationLine: "line-through",
    color: "#6B7280",
  },
  qtyText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  metaText: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  iconBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  clearBtnText: {
    color: "#B91C1C",
    fontWeight: "800",
    marginLeft: 6,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    color: "#111827",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimary: {
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },
  btnOutline: {
    backgroundColor: "#fff",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    marginRight: 8,
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
  },
  btnTextOutline: {
    color: "#111827",
    fontWeight: "800",
  },
});
