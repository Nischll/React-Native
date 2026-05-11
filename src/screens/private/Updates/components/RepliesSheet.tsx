import {
  CommunicationItem,
  useCreateCommunicationWithRefresh,
  useDeleteCommunicationWithRefresh,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { timeAgo } from "@/src/utils/timeAgo";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

// ─── Constants ────────────────────────────────────────────────────────────────

const REPLY_DELETE_WIDTH = 72;
const REPLY_SWIPE_THRESHOLD = 44;

// ─── Single reply row with swipe-to-delete ────────────────────────────────────

interface ReplyRowProps {
  item: CommunicationItem;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
  onRequestDelete: (id: number) => void;
}

function ReplyRow({
  item,
  openSwipeId,
  onSwipeOpen,
  onRequestDelete,
}: ReplyRowProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isSwiped = openSwipeId === item.id;

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.message);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.8)).current;

  const { mutate: updateMsg, isPending: updating } =
    useUpdateCommunicationWithRefresh();

  const snapOpen = () => {
    Animated.spring(translateX, {
      toValue: -REPLY_DELETE_WIDTH,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    onSwipeOpen(item.id);
  };

  const snapClosed = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    deleteScale.setValue(0.8);
    if (openSwipeId === item.id) onSwipeOpen(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        isOwn && Math.abs(g.dx) > 8 && Math.abs(g.dy) < 15,
      onPanResponderMove: (_, g) => {
        if (!isOwn) return;
        const dx = Math.min(0, g.dx);
        translateX.setValue(Math.max(-(REPLY_DELETE_WIDTH + 8), dx));
        const progress = Math.min(1, Math.abs(dx) / REPLY_DELETE_WIDTH);
        deleteScale.setValue(0.8 + progress * 0.2);
      },
      onPanResponderRelease: (_, g) => {
        if (!isOwn) return;
        if (g.dx < -REPLY_SWIPE_THRESHOLD) {
          snapOpen();
        } else {
          snapClosed();
        }
      },
    }),
  ).current;

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === item.message) {
      setEditing(false);
      return;
    }
    updateMsg(
      { id: item.id, message: trimmed, parentId: item.parentId ?? null },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    // Outer wrapper clips overflow so delete zone doesn't bleed
    <View style={{ borderRadius: 12, overflow: "hidden" }}>
      {/* Delete zone — always behind */}
      {isOwn && (
        <View
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: REPLY_DELETE_WIDTH,
            backgroundColor: "#FEE2E2",
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => {
              snapClosed();
              onRequestDelete(item.id);
            }}
            style={{ alignItems: "center", gap: 3 }}
          >
            <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
              <AppIcon name="trash-outline" size={20} color="#EF4444" />
            </Animated.View>
            <Text style={{ fontSize: 10, color: "#EF4444", fontWeight: "700" }}>
              Delete
            </Text>
          </Pressable>
        </View>
      )}

      {/* Tap-to-close overlay when swiped */}
      {isSwiped && (
        <Pressable
          onPress={snapClosed}
          style={{
            position: "absolute",
            top: -1000,
            left: -1000,
            right: -1000,
            bottom: -1000,
            zIndex: 5,
          }}
        />
      )}

      {/* Swipeable row */}
      <Animated.View
        style={{ transform: [{ translateX }], zIndex: 6 }}
        {...(isOwn ? panResponder.panHandlers : {})}
      >
        <View
          style={{
            backgroundColor: "#F8FAFC",
            borderRadius: 12,
            padding: 12,
            borderWidth: 1,
            borderColor: "#F1F5F9",
          }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AuthorAvatar
              fullName={item.createdByFullName}
              size={30}
              fontSize={11}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ fontSize: 13, fontWeight: "700", color: "#1E293B" }}
                >
                  {item.createdByFullName}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 11, color: "#94A3B8" }}>
                    {timeAgo(item.createdDate)}
                  </Text>
                  {isOwn && !isSwiped && (
                    <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                      <AppIcon
                        name="pencil-outline"
                        size={13}
                        color="#94A3B8"
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {editing ? (
                <View style={{ marginTop: 6 }}>
                  <TextInput
                    value={editText}
                    onChangeText={setEditText}
                    multiline
                    autoFocus
                    style={{
                      fontSize: 13,
                      color: "#1E293B",
                      borderWidth: 1,
                      borderColor: "#7C3AED",
                      borderRadius: 8,
                      padding: 8,
                      minHeight: 40,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginTop: 6,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setEditing(false);
                        setEditText(item.message);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          fontWeight: "600",
                        }}
                      >
                        Cancel
                      </Text>
                    </Pressable>
                    <Pressable onPress={handleSaveEdit} disabled={updating}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#7C3AED",
                          fontWeight: "700",
                        }}
                      >
                        {updating ? "Saving…" : "Save"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 13,
                    color: "#334155",
                    marginTop: 3,
                    lineHeight: 19,
                  }}
                >
                  {item.message}
                </Text>
              )}
            </View>
          </View>

          {item.reactions?.length > 0 && (
            <View style={{ marginLeft: 38 }}>
              <ReactionBar
                communicationId={item.id}
                reactions={item.reactions}
                onOpenPicker={() => setShowReactionPicker(true)}
              />
            </View>
          )}
        </View>
      </Animated.View>

      {/* Reaction picker modal */}
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            padding: 32,
          }}
          onPress={() => setShowReactionPicker(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <ReactionPicker
              communicationId={item.id}
              onClose={() => setShowReactionPicker(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Replies Bottom Sheet ─────────────────────────────────────────────────────

interface RepliesSheetProps {
  visible: boolean;
  parentItem: CommunicationItem;
  onClose: () => void;
}

export function RepliesSheet({
  visible,
  parentItem,
  onClose,
}: RepliesSheetProps) {
  const [replyText, setReplyText] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);

  const { mutate: create, isPending: sending } =
    useCreateCommunicationWithRefresh();
  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();

  const hasText = replyText.trim().length > 0;
  const flatReplies = parentItem.replies ?? [];

  const handleSend = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    create(
      { message: trimmed, parentId: parentItem.id },
      { onSuccess: () => setReplyText("") },
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteMsg(deleteTargetId, {
      onSuccess: () => setDeleteTargetId(null),
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/*
        FIX: Full-screen flex container so KeyboardAvoidingView
        can push the sheet up correctly on first open.
        Using flex:1 here instead of a bare Pressable backdrop
        means the sheet's KAV has a proper parent to measure against.
      */}
      <View style={{ flex: 1 }}>
        {/* Tap backdrop to close */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        {/*
          FIX for keyboard hiding composer:
          - On iOS: behavior="padding" works correctly
          - On Android: behavior="height" is unreliable; instead we use
            keyboardVerticalOffset and rely on the Modal's
            windowSoftInputMode. The real fix on Android is wrapping in
            a View with position absolute and using the
            `android:windowSoftInputMode="adjustResize"` in AndroidManifest.
            As a pure-RN workaround, we set behavior="padding" on both
            platforms inside a Modal — this works because the Modal renders
            in its own window context on Android too.
        */}
        <KeyboardAvoidingView
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          style={{
            backgroundColor: "#fff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            // FIX: maxHeight as a flex constraint, not absolute
            // so KAV can shrink it when keyboard appears
            maxHeight: "82%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          {/* Drag handle */}
          <View
            style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}
          >
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#E2E8F0",
              }}
            />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F1F5F9",
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 16,
                fontWeight: "700",
                color: "#1E293B",
              }}
            >
              {flatReplies.length}{" "}
              {flatReplies.length === 1 ? "Reply" : "Replies"}
            </Text>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              hitSlop={12}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="close" size={16} color="#64748B" />
            </Pressable>
          </View>

          {/* Original post preview */}
          <View
            style={{
              marginHorizontal: 16,
              marginTop: 12,
              marginBottom: 8,
              padding: 12,
              backgroundColor: "#FAFAFA",
              borderRadius: 12,
              borderLeftWidth: 3,
              borderLeftColor: "#7C3AED",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#7C3AED",
                marginBottom: 2,
              }}
            >
              {parentItem.createdByFullName}
            </Text>
            <Text
              style={{ fontSize: 13, color: "#64748B", lineHeight: 18 }}
              numberOfLines={3}
            >
              {parentItem.message}
            </Text>
          </View>

          {/*
            FIX: FlatList inside a flex:1 View so it doesn't expand
            to push the composer off screen. The composer is anchored
            at the bottom of KAV, FlatList takes remaining space.
          */}
          <View style={{ flex: 1 }}>
            <FlatList
              data={flatReplies}
              keyExtractor={(r) => String(r.id)}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 4,
                paddingBottom: 8,
                gap: 8,
              }}
              showsVerticalScrollIndicator={false}
              // Close any open swipe when list scrolls
              onScrollBeginDrag={() => setOpenSwipeId(null)}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <Text style={{ fontSize: 13, color: "#94A3B8" }}>
                    No replies yet. Be the first!
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <ReplyRow
                  item={item}
                  openSwipeId={openSwipeId}
                  onSwipeOpen={setOpenSwipeId}
                  onRequestDelete={setDeleteTargetId}
                />
              )}
            />
          </View>

          {/*
            Composer — always at the bottom of KAV.
            FIX for send button disappearing: the row uses flexDirection:"row"
            with alignItems:"flex-end". On Android, when the TextInput grows,
            the button was being pushed out of bounds because the parent had
            no explicit height constraint. Fixed by giving the outer composer
            View a minHeight and ensuring the button has an explicit
            alignSelf:"flex-end" so it never gets stretched or hidden.
          */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: Platform.OS === "ios" ? 32 : 16,
              borderTopWidth: 1,
              borderTopColor: "#F1F5F9",
              gap: 10,
              // Prevent composer from being zero-height on first render
              minHeight: Platform.OS === "ios" ? 80 : 64,
            }}
          >
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={`Reply to ${parentItem.createdByFullName}…`}
              placeholderTextColor="#CBD5E1"
              multiline
              // FIX: explicit textAlignVertical so Android doesn't
              // misalign the text and cause layout recalculation issues
              textAlignVertical="top"
              style={{
                flex: 1,
                fontSize: 14,
                color: "#1E293B",
                backgroundColor: "#F8FAFC",
                borderWidth: 1,
                borderColor: "#E2E8F0",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingTop: 10,
                paddingBottom: 10,
                // FIX: explicit min/max heights prevent Android layout
                // thrashing that caused the button to disappear
                minHeight: 42,
                maxHeight: 100,
              }}
            />

            {/*
              FIX for send button disappearing:
              - alignSelf:"flex-end" anchors it to the bottom of the row
              - explicit width+height so it can never collapse to 0
              - backgroundColor derived from hasText (computed once, not inline)
                so it always reflects current state without render lag
            */}
            <Pressable
              onPress={handleSend}
              disabled={!hasText || sending}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                minWidth: 42, // prevent flex from collapsing it
                minHeight: 42,
                borderRadius: 12,
                backgroundColor: hasText && !sending ? "#7C3AED" : "#E2E8F0",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "flex-end",
                opacity: pressed && hasText ? 0.85 : 1,
              })}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppIcon
                  name="send"
                  size={16}
                  color={hasText ? "#fff" : "#94A3B8"}
                />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>

      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete Reply"
        message="This will permanently delete this reply."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </Modal>
  );
}
