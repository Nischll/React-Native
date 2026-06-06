import {
  CommunicationItem,
  useDeleteCommunicationWithRefresh,
  useUpdateCommunicationWithRefresh,
} from "@/src/api/communication.api";
import AppIcon from "@/src/components/ui/AppIcon";
import Card from "@/src/components/ui/Card";
import SelectField from "@/src/components/ui/SelectField";
import {
  MentionState,
  MentionSuggestions,
  MentionTextInput,
} from "@/src/helper/mentionTextInput";
import { MessageText } from "@/src/helper/messageDisplayText";
import { useEmployeeOptions } from "@/src/hooks/useEmployee";
import { useAuth } from "@/src/providers/AuthProvider";
import { timeAgo } from "@/src/utils/timeAgo";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { AuthorAvatar } from "./AuthorAvatar";
import { ReactionBar, ReactionPicker } from "./ReactionBar";

interface NoticeCardProps {
  item: CommunicationItem;
  openSwipeId: number | null;
  onSwipeOpen: (id: number | null) => void;
}

const DELETE_REVEAL_WIDTH = 80;
const SWIPE_THRESHOLD = 50;
const CARD_PADDING = 6;

export function NoticeCard({
  item,
  openSwipeId,
  onSwipeOpen,
}: NoticeCardProps) {
  const { user } = useAuth();
  const isOwn = user?.userId === item.createdBy;
  const isNew = item.seen === false;
  const hasUnseenReplies = item.replies.some((r) => r.seen === false);

  // const [showRepliesSheet, setShowRepliesSheet] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.message);
  const [expanded, setExpanded] = useState(false);
  const [deleteZoneVisible, setDeleteZoneVisible] = useState(false);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [editBuildingIds, setEditBuildingIds] = useState<string[]>([]);

  const translateX = useRef(new Animated.Value(0)).current;
  const deleteScale = useRef(new Animated.Value(0.8)).current;
  const isSwipedRef = useRef(false);

  const { mutate: updateMsg, isPending: updating } =
    useUpdateCommunicationWithRefresh();
  const { mutate: deleteMsg, isPending: deleting } =
    useDeleteCommunicationWithRefresh();
  const { employees } = useEmployeeOptions(1, 100);

  const isLong = item.message.length > 180;
  const displayText =
    isLong && !expanded ? item.message.slice(0, 180) + "…" : item.message;

  const snapOpen = () => {
    isSwipedRef.current = true;
    setDeleteZoneVisible(true);
    Animated.spring(translateX, {
      toValue: -DELETE_REVEAL_WIDTH,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
    deleteScale.setValue(1);
    onSwipeOpen(item.id);
  };

  const snapClosed = () => {
    isSwipedRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start(() => {
      setDeleteZoneVisible(false);
    });
    deleteScale.setValue(0.8);
    if (openSwipeId === item.id) onSwipeOpen(null);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => isSwipedRef.current,
      onMoveShouldSetPanResponder: (_, g) => {
        if (!isOwn) return false;
        const isHorizontal = Math.abs(g.dx) > Math.abs(g.dy) * 1.5;
        return isHorizontal && Math.abs(g.dx) > 5;
      },
      onPanResponderMove: (_, g) => {
        if (!isOwn) return;
        const dx = Math.min(0, g.dx);
        const clamped = Math.max(-(DELETE_REVEAL_WIDTH + 10), dx);
        translateX.setValue(clamped);
        const progress = Math.min(1, Math.abs(clamped) / DELETE_REVEAL_WIDTH);
        deleteScale.setValue(0.8 + progress * 0.2);
        if (progress > 0.05) setDeleteZoneVisible(true);
      },
      onPanResponderRelease: (_, g) => {
        if (!isOwn) return;
        if (g.dx < -SWIPE_THRESHOLD) {
          snapOpen();
        } else {
          snapClosed();
        }
      },
      onPanResponderTerminate: () => {
        snapClosed();
      },
    }),
  ).current;

  const handleDelete = () => {
    isSwipedRef.current = false;
    onSwipeOpen(null);

    Animated.timing(translateX, {
      toValue: -500,
      duration: 260,
      useNativeDriver: true,
    }).start(() => {
      setDeleteZoneVisible(false);
      deleteMsg(item.id);
    });
  };

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed) {
      setEditing(false);
      return;
    }

    // Resolve @mentions in current text → employee IDs
    const mentionedUsernames = (trimmed.match(/@([a-zA-Z0-9._-]+)/g) ?? []).map(
      (m) => m.slice(1),
    );
    const resolvedEmployeeIds = employees
      .filter((e) => mentionedUsernames.includes(e.username))
      .map((e) => Number(e.value));

    updateMsg(
      {
        id: item.id,
        message: trimmed,
        parentId: null,
        buildingIds:
          editBuildingIds.length > 0 ? editBuildingIds.map(Number) : [],
        employeeIds: resolvedEmployeeIds.length > 0 ? resolvedEmployeeIds : [],
      },
      {
        onSuccess: () => {
          setEditing(false);
          setEditBuildingIds([]);
        },
      },
    );
  };
  const unseenReplyCount = item.replies.reduce(
    (acc, r) => acc + (r.seen === false ? 1 : 0),
    0,
  );

  return (
    <View
      style={{
        paddingHorizontal: CARD_PADDING,
        paddingVertical: CARD_PADDING,
      }}
    >
      {isOwn && deleteZoneVisible && (
        <View
          style={{
            position: "absolute",
            right: CARD_PADDING,
            top: CARD_PADDING,
            bottom: CARD_PADDING,
            width: DELETE_REVEAL_WIDTH,
            backgroundColor: "#FEE2E2",
            borderTopRightRadius: 16,
            borderBottomRightRadius: 16,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {deleting ? (
            // Loading state while API is in-flight
            <View style={{ alignItems: "center", gap: 6 }}>
              <ActivityIndicator size="small" color="#EF4444" />
              <Text
                style={{ fontSize: 10, color: "#EF4444", fontWeight: "600" }}
              >
                Deleting…
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={handleDelete}
              style={{ alignItems: "center", gap: 4, padding: 8 }}
            >
              <Animated.View style={{ transform: [{ scale: deleteScale }] }}>
                <AppIcon name="trash-outline" size={22} color="#EF4444" />
              </Animated.View>
              <Text
                style={{ fontSize: 10, color: "#EF4444", fontWeight: "700" }}
              >
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Swipeable card */}
      <Animated.View
        style={{
          transform: [{ translateX }],
          zIndex: 6,
          borderRadius: 16,
          overflow: "visible",
        }}
        className="shadow-md"
        {...(isOwn ? panResponder.panHandlers : {})}
      >
        <Card
          style={{
            borderWidth: isNew ? 1.5 : 1,
            borderColor: isNew ? "#7C3AED" : "#E2E8F0",
            backgroundColor: "#fff",
            borderRadius: 16,
            shadowColor: "#64748B",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {isNew && <View style={{ height: 3, backgroundColor: "#7C3AED" }} />}

          <View style={{ padding: 14 }}>
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <AuthorAvatar
                fullName={item.createdByFullName}
                size={38}
                fontSize={13}
              />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1E293B",
                      flex: 1,
                    }}
                    numberOfLines={1}
                  >
                    {item.createdByFullName}
                  </Text>
                  {isNew && (
                    <View
                      style={{
                        backgroundColor: "#7C3AED",
                        borderRadius: 99,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        marginLeft: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#fff",
                          fontWeight: "700",
                        }}
                      >
                        NEW
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
                  {timeAgo(item.createdDate)}
                </Text>
              </View>

              {isOwn && (
                <Pressable
                  onPress={() => {
                    // Resolve existing employeeIds → @username mentions
                    const existingMentions = (item.employeeIds ?? [])
                      .map((id) =>
                        employees.find((e) => e.value === String(id)),
                      )
                      .filter(Boolean)
                      .map((e) => `@${e!.username}`)
                      .join(" ");

                    // Append mentions to message if not already there
                    const baseText = item.message;
                    const textWithMentions = existingMentions
                      ? baseText.includes("@")
                        ? baseText // already has mentions in message text
                        : `${baseText} ${existingMentions}`.trim()
                      : baseText;

                    setEditText(textWithMentions);
                    setEditBuildingIds(item.buildingIds?.map(String) ?? []);
                    // setEditEmployeeIds(item.employeeIds?.map(String) ?? []);
                    setEditing(true);
                  }}
                  hitSlop={8}
                  style={{ paddingTop: 2 }}
                >
                  <AppIcon name="pencil-outline" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Message */}
            <View style={{ marginTop: 12 }}>
              {editing ? (
                <View
                  style={{
                    borderWidth: 1.5,
                    borderColor: "#7C3AED",
                    borderRadius: 12,
                    padding: 10,
                    backgroundColor: "#FAFAF9",
                  }}
                >
                  <MentionTextInput
                    value={editText}
                    onChangeText={setEditText}
                    onMentionStateChange={setMentionState}
                    multiline
                    autoFocus
                    style={{ fontSize: 14, color: "#1E293B", minHeight: 60 }}
                  />

                  {mentionState && (
                    <MentionSuggestions
                      mentionState={mentionState}
                      value={editText}
                      onChangeText={setEditText}
                      onDismiss={() => setMentionState(null)}
                      direction="above"
                      // onMentionSelect={handleEditMentionSelect}
                    />
                  )}

                  {/* Multi-select building picker */}
                  <View style={{ marginTop: 10 }}>
                    <SelectField
                      label=""
                      multi
                      value={editBuildingIds}
                      onChange={setEditBuildingIds}
                      options={user?.buildingList ?? []}
                      placeholder="Tag buildings (optional)"
                    />
                  </View>

                  {/* Save / Cancel */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      marginTop: 10,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        setEditing(false);
                        setEditText(item.message);
                        setEditBuildingIds([]);
                        // setEditEmployeeIds([]);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
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
                          fontSize: 13,
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
                <>
                  <MessageText text={displayText} />
                  {isLong && (
                    <Pressable
                      onPress={() => setExpanded((v) => !v)}
                      style={{ marginTop: 4 }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#7C3AED",
                          fontWeight: "600",
                        }}
                      >
                        {expanded ? "Show less" : "Read more"}
                      </Text>
                    </Pressable>
                  )}

                  {/* Employee chips — only for IDs not already @mentioned in the text */}
                  {(() => {
                    const mentionedUsernames = (
                      item.message.match(/@([a-zA-Z0-9._-]+)/g) ?? []
                    ).map((m) => m.slice(1));

                    const unmentionedEmployees = (item.employeeIds ?? [])
                      .map((id) =>
                        employees.find((e) => e.value === String(id)),
                      )
                      .filter(Boolean)
                      .filter(
                        (emp) => !mentionedUsernames.includes(emp!.username),
                      );

                    if (unmentionedEmployees.length === 0) return null;

                    return (
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 6,
                        }}
                      >
                        {unmentionedEmployees.map((emp) => (
                          <View
                            key={emp!.value}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#EDE9FE",
                              borderRadius: 99,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <AppIcon
                              name="person-outline"
                              size={11}
                              color="#7C3AED"
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#7C3AED",
                                fontWeight: "600",
                              }}
                            >
                              @{emp!.username}
                            </Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}

                  {/* Building chips */}
                  {(item.buildingIds ?? []).length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 8,
                      }}
                    >
                      {(item.buildingIds ?? []).map((id) => {
                        const building = user?.buildingList.find(
                          (b) => b.value === String(id),
                        );
                        if (!building) return null;
                        return (
                          <View
                            key={id}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#F0FDF4",
                              borderRadius: 99,
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                            }}
                          >
                            <AppIcon
                              name="business-outline"
                              size={11}
                              color="#16A34A"
                            />
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#16A34A",
                                fontWeight: "600",
                              }}
                            >
                              {building.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Reactions */}
            <ReactionBar
              communicationId={item.id}
              reactions={item.reactions}
              onOpenPicker={() => setShowReactionPicker(true)}
            />

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: "#F1F5F9",
                gap: 16,
              }}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(private)/(tabs)/(updates)/replies",
                    params: {
                      parentItem: JSON.stringify(item),
                    },
                  })
                }
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                <AppIcon
                  name="chatbubble-outline"
                  size={15}
                  color={hasUnseenReplies ? "#7C3AED" : "#64748B"}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: hasUnseenReplies ? "#7C3AED" : "#64748B",
                  }}
                >
                  {item.replies.length > 0
                    ? `${item.replies.length} ${item.replies.length === 1 ? "reply" : "replies"}`
                    : "Reply"}
                </Text>
                {hasUnseenReplies && (
                  <View
                    style={{
                      backgroundColor: "#7C3AED",
                      borderRadius: 99,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 18,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        fontWeight: "700",
                        lineHeight: 14,
                      }}
                    >
                      {unseenReplyCount}
                    </Text>
                  </View>
                )}
              </Pressable>

              {isOwn && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginLeft: "auto",
                  }}
                >
                  <AppIcon
                    name="arrow-back-outline"
                    size={11}
                    color="#CBD5E1"
                  />
                  <Text style={{ fontSize: 11, color: "#CBD5E1" }}>
                    Swipe to delete
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Reaction Picker */}
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

      {/* Replies sheet */}
      {/* <RepliesSheet
        visible={showRepliesSheet}
        parentItem={item}
        onClose={() => setShowRepliesSheet(false)}
      /> */}
    </View>
  );
}
