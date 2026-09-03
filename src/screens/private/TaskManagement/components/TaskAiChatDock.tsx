import { useTaskAiChat, useTaskAiModelStatus } from "@/src/api/taskAi.api";
import AppButton from "@/src/components/ui/AppButton";
import AppIcon from "@/src/components/ui/AppIcon";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  TaskAiSimilarExample,
  extractTaskAiChatData,
  taskAiErrorMessage,
} from "@/src/types/taskAi.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import TaskAiTrainControls from "./TaskAiTrainControls";

const POS_STORAGE_KEY = "task-ai-chat-dock-pos";
const EDGE_PAD = 12;
const DRAG_THRESHOLD = 6;
const FAB_H = 48;
const FAB_W = 118;

type DockPos = { x: number; y: number };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  rationale?: string | null;
  examples?: TaskAiSimilarExample[];
};

function clamp(pos: DockPos, bounds: { w: number; h: number }): DockPos {
  const maxX = Math.max(EDGE_PAD, bounds.w - FAB_W - EDGE_PAD);
  const maxY = Math.max(EDGE_PAD, bounds.h - FAB_H - EDGE_PAD);
  return {
    x: Math.min(Math.max(EDGE_PAD, pos.x), maxX),
    y: Math.min(Math.max(EDGE_PAD, pos.y), maxY),
  };
}

type Props = {
  /** Extra space reserved at the bottom (sibling FAB). */
  bottomReserve?: number;
};

export default function TaskAiChatDock({ bottomReserve = 0 }: Props) {
  const { buildingId } = useAuth();
  const chatMut = useTaskAiChat();
  const { modelReady } = useTaskAiModelStatus(true);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pos, setPos] = useState<DockPos | null>(null);
  const [bounds, setBounds] = useState({ w: 0, h: 0 });
  const [keyboardH, setKeyboardH] = useState(0);

  const listRef = useRef<ScrollView>(null);
  const posRef = useRef<DockPos | null>(null);
  const boundsRef = useRef({ w: 0, h: 0, bottomReserve: 0, keyboardH: 0 });
  const loadedRef = useRef(false);
  const dragRef = useRef<{
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const usable = () => {
    const b = boundsRef.current;
    return {
      w: b.w,
      h: Math.max(0, b.h - b.keyboardH - b.bottomReserve),
    };
  };

  const applyPos = useCallback((next: DockPos, persist = false) => {
    const clamped = clamp(next, usable());
    posRef.current = clamped;
    setPos(clamped);
    if (persist) {
      AsyncStorage.setItem(POS_STORAGE_KEY, JSON.stringify(clamped)).catch(
        () => undefined,
      );
    }
  }, []);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    boundsRef.current = { ...boundsRef.current, bottomReserve, keyboardH };
    if (posRef.current) applyPos(posRef.current);
  }, [bottomReserve, keyboardH, applyPos]);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardH(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardH(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onOverlayLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    boundsRef.current = { ...boundsRef.current, w: width, h: height };
    setBounds({ w: width, h: height });
    if (loadedRef.current) {
      if (posRef.current) applyPos(posRef.current);
      return;
    }
    loadedRef.current = true;
    (async () => {
      let saved: DockPos | null = null;
      try {
        const raw = await AsyncStorage.getItem(POS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as DockPos;
          if (typeof parsed?.x === "number" && typeof parsed?.y === "number") {
            saved = parsed;
          }
        }
      } catch {
        saved = null;
      }
      const area = usable();
      const fallback: DockPos = {
        x: Math.max(EDGE_PAD, area.w - FAB_W - EDGE_PAD),
        y: Math.max(EDGE_PAD, area.h - FAB_H - EDGE_PAD),
      };
      applyPos(saved ?? fallback);
    })();
  };

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [messages, chatMut.isPending, open]);

  const beginDrag = () => {
    const current = posRef.current;
    if (!current) return;
    dragRef.current = {
      origX: current.x,
      origY: current.y,
      moved: false,
    };
  };

  const moveDrag = (dx: number, dy: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) drag.moved = true;
    applyPos({ x: drag.origX + dx, y: drag.origY + dy });
  };

  const endDrag = (toggleIfTap: boolean) => {
    const drag = dragRef.current;
    if (drag?.moved) {
      const current = posRef.current;
      if (current) applyPos(current, true);
    } else if (toggleIfTap) {
      setOpen((v) => !v);
    }
    dragRef.current = null;
  };

  const fabPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.hypot(g.dx, g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: beginDrag,
      onPanResponderMove: (_, g) => moveDrag(g.dx, g.dy),
      onPanResponderRelease: () => endDrag(true),
      onPanResponderTerminate: () => endDrag(false),
    }),
  ).current;

  const headerPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.hypot(g.dx, g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: beginDrag,
      onPanResponderMove: (_, g) => moveDrag(g.dx, g.dy),
      onPanResponderRelease: () => endDrag(false),
      onPanResponderTerminate: () => endDrag(false),
    }),
  ).current;

  const send = () => {
    const question = input.trim();
    if (!question || chatMut.isPending || !modelReady) return;

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", text: question },
    ]);
    setInput("");

    chatMut.mutate(
      {
        question,
        buildingId: buildingId != null && buildingId > 0 ? buildingId : null,
      },
      {
        onSuccess: (response) => {
          const data = extractTaskAiChatData(response);
          const suggestion =
            data?.suggestedActionTaken?.trim() ||
            "No suggestion returned. Try rephrasing the issue.";
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: suggestion,
              rationale: data?.rationale,
              examples: Array.isArray(data?.similarExamples)
                ? data!.similarExamples!
                : [],
            },
          ]);
        },
        onError: (error) => {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: taskAiErrorMessage(error),
            },
          ]);
        },
      },
    );
  };

  const area = usable();
  const panelW = Math.min(22 * 16, Math.max(280, area.w - 32));
  const panelH = Math.min(32 * 16, Math.max(280, area.h * 0.72));
  const panelShiftX =
    pos != null
      ? Math.min(0, area.w - EDGE_PAD - (pos.x + panelW))
      : 0;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 40,
      }}
      onLayout={onOverlayLayout}
    >
      {pos ? (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: pos.x,
            top: pos.y,
            alignItems: "flex-end",
          }}
        >
          {open ? (
            <View
              className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
              style={{
                width: panelW,
                height: panelH,
                transform: [{ translateX: panelShiftX }],
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 8,
              }}
            >
              <View className="border-b border-slate-200 bg-slate-50">
                <View
                  className="flex-row items-center justify-between gap-2 px-3 py-2.5"
                  {...headerPan.panHandlers}
                >
                  <View className="min-w-0 flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <AppIcon name="menu-outline" size={16} color="#94A3B8" />
                      <AppIcon
                        name="sparkles-outline"
                        size={16}
                        color="#453956"
                      />
                      <Text className="text-sm font-semibold text-slate-900">
                        Ask Task AI
                      </Text>
                    </View>
                    <Text
                      className="pl-5 text-[11px] text-slate-500"
                      numberOfLines={1}
                    >
                      {!modelReady
                        ? "Model not ready — retrain below to continue"
                        : "Describe an issue to get a suggested action"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setOpen(false)}
                    hitSlop={8}
                    className="h-8 w-8 items-center justify-center"
                    accessibilityLabel="Close chat"
                  >
                    <AppIcon name="close" size={18} color="#64748B" />
                  </Pressable>
                </View>
                <View className="border-t border-slate-100 bg-white px-3 py-2">
                  <TaskAiTrainControls />
                </View>
              </View>

              <ScrollView
                ref={listRef}
                className="flex-1 px-3 py-3"
                keyboardShouldPersistTaps="handled"
              >
                {messages.length === 0 ? (
                  <View className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
                    <Text className="text-center text-xs text-slate-500">
                      Water leaking from ceiling in unit 1203
                    </Text>
                  </View>
                ) : (
                  messages.map((m) => (
                    <View
                      key={m.id}
                      className={`mb-3 flex-row ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <View
                        className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                          m.role === "user"
                            ? "bg-primary"
                            : "border border-slate-200 bg-slate-50"
                        }`}
                      >
                        <Text
                          className={`text-sm leading-5 ${
                            m.role === "user" ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {m.text}
                        </Text>
                        {m.role === "assistant" && m.rationale?.trim() ? (
                          <Text className="mt-1.5 text-[11px] leading-4 text-slate-500">
                            {m.rationale}
                          </Text>
                        ) : null}
                        {m.role === "assistant" &&
                        m.examples &&
                        m.examples.length > 0 ? (
                          <View className="mt-2 border-t border-slate-200 pt-2">
                            {m.examples.slice(0, 3).map((ex) => (
                              <Text
                                key={ex.taskId}
                                className="mb-1 text-[11px] text-slate-500"
                              >
                                <Text className="font-semibold text-slate-700">
                                  {ex.title?.trim() || `Task #${ex.taskId}`}
                                </Text>
                                {ex.actionTaken?.trim()
                                  ? ` — ${ex.actionTaken}`
                                  : ""}
                              </Text>
                            ))}
                          </View>
                        ) : null}
                      </View>
                    </View>
                  ))
                )}
                {chatMut.isPending ? (
                  <View className="mb-2 flex-row justify-start">
                    <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <ActivityIndicator size="small" color="#64748B" />
                      <Text className="text-xs text-slate-500">Thinking…</Text>
                    </View>
                  </View>
                ) : null}
              </ScrollView>

              <View className="flex-row items-end gap-2 border-t border-slate-200 bg-slate-50 p-2.5">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={
                    modelReady ? "Ask about an issue…" : "Model not ready"
                  }
                  placeholderTextColor="#94A3B8"
                  editable={modelReady && !chatMut.isPending}
                  multiline
                  textAlignVertical="top"
                  className="min-h-[44px] max-h-24 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  blurOnSubmit={false}
                  onKeyPress={(e) => {
                    if (
                      e.nativeEvent.key === "Enter" &&
                      !(e.nativeEvent as { shiftKey?: boolean }).shiftKey
                    ) {
                      send();
                    }
                  }}
                />
                <AppButton
                  size="sm"
                  fullWidth={false}
                  iconOnly
                  leftIcon="send"
                  disabled={!input.trim() || !modelReady || chatMut.isPending}
                  loading={chatMut.isPending}
                  onPress={send}
                  accessibilityLabel="Send"
                />
              </View>
            </View>
          ) : null}

          <View {...fabPan.panHandlers}>
            <View
              className="flex-row items-center justify-center gap-2 rounded-full bg-primary px-4"
              style={{
                height: FAB_H,
                minWidth: FAB_W,
                shadowColor: "#000",
                shadowOpacity: 0.16,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                elevation: 6,
              }}
              accessibilityRole="button"
              accessibilityLabel={
                open ? "Close Ask Task AI" : "Open Ask Task AI"
              }
            >
              <AppIcon
                name={open ? "close" : "chatbubble-ellipses-outline"}
                size={20}
                color="#fff"
              />
              <Text className="pr-0.5 text-sm font-semibold text-white">
                {open ? "Close" : "Ask AI"}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
