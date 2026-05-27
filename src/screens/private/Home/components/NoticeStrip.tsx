import {
  useDeleteNotice,
  useEditNotice,
  useGetNotice,
  usePostNotice,
} from "@/src/api/dashboard.api";
import { SkeletonCard } from "@/src/components/feedback/SkeletonCard";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import { Notice } from "@/src/types/dashboard.types";
import { timeAgo } from "@/src/utils/timeAgo";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export function NoticeStrip() {
  const { user } = useAuth();
  const isAdmin = user?.roleList?.some(
    (r) => r.code === "SuperAdmin" || r.code === "Admin",
  );

  const { data: noticeData, isLoading, refetch } = useGetNotice(1, 5);
  const notices = noticeData?.data?.data ?? [];
  const unseenNoticeCount = noticeData?.data?.unseenCount ?? 0;

  const [composing, setComposing] = useState(false);
  const [composeText, setComposeText] = useState("");

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editText, setEditText] = useState("");

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const { mutate: postNotice, isPending: posting } = usePostNotice();
  const { mutate: editNotice, isPending: editing } = useEditNotice(
    editingNotice?.id,
  );
  const { mutate: deleteNotice, isPending: deleting } = useDeleteNotice(
    deleteTargetId ?? undefined,
  );

  const handlePost = () => {
    const trimmed = composeText.trim();
    if (!trimmed) return;
    postNotice(
      { message: trimmed },
      {
        onSuccess: () => {
          setComposeText("");
          setComposing(false);
          refetch();
        },
      },
    );
  };

  const handleEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || !editingNotice) return;
    editNotice(
      { message: trimmed },
      {
        onSuccess: () => {
          setEditingNotice(null);
          setEditText("");
          refetch();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteNotice(undefined, {
      onSuccess: () => {
        setDeleteTargetId(null);
        refetch();
      },
    });
  };

  if (isLoading) {
    return (
      <View style={{ paddingHorizontal: 14, marginTop: 14 }}>
        <View
          style={{
            backgroundColor: "#FEF9ED",
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: "#FAC775",
            padding: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                backgroundColor: "#FAC775",
              }}
            />
            <View
              style={{
                width: 60,
                height: 10,
                borderRadius: 4,
                backgroundColor: "#FAC775",
              }}
            />
          </View>
          {[1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (!isAdmin && notices.length === 0) return null;

  return (
    <ScrollView
      keyboardShouldPersistTaps="always"
      style={{ paddingHorizontal: 14, marginTop: 14 }}
    >
      <View
        style={{
          backgroundColor: "#FEF9ED",
          borderRadius: 14,
          borderWidth: 0.5,
          borderColor: "#FAC775",
          padding: 12,
        }}
      >
        {/* Strip header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 10,
          }}
        >
          <AppIcon name="megaphone-outline" size={14} color="#BA7517" />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: "#BA7517",
              letterSpacing: 0.4,
            }}
          >
            NOTICES
          </Text>

          {unseenNoticeCount > 0 && (
            <View
              style={{
                backgroundColor: "#FAC775",
                borderRadius: 99,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{ fontSize: 10, fontWeight: "700", color: "#633806" }}
              >
                {unseenNoticeCount} new
              </Text>
            </View>
          )}

          {/* Post button — admin only */}
          {isAdmin && (
            <Pressable
              onPress={() => setComposing((v) => !v)}
              style={{
                marginLeft: "auto",
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: composing ? "#FAC775" : "#BA7517",
                borderRadius: 99,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <AppIcon
                name={composing ? "close" : "add"}
                size={12}
                color="#fff"
              />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff" }}>
                {composing ? "Cancel" : "Post"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Compose box */}
        {composing && isAdmin && (
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "#FAC775",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <TextInput
              value={composeText}
              onChangeText={setComposeText}
              placeholder="Write a notice..."
              placeholderTextColor="#CBD5E1"
              multiline
              autoFocus
              style={{
                fontSize: 14,
                color: "#1E293B",
                minHeight: 60,
                maxHeight: 120,
              }}
            />
            <Pressable
              onPress={handlePost}
              disabled={!composeText.trim() || posting}
              style={{
                alignSelf: "flex-end",
                marginTop: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor:
                  !composeText.trim() || posting ? "#E2E8F0" : "#BA7517",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 6,
              }}
            >
              {posting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <AppIcon
                  name="send"
                  size={13}
                  color={!composeText.trim() ? "#94A3B8" : "#fff"}
                />
              )}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: !composeText.trim() || posting ? "#94A3B8" : "#fff",
                }}
              >
                {posting ? "Posting…" : "Post"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Notice list */}
        {notices.length === 0 && !composing ? (
          <Text
            style={{
              fontSize: 13,
              color: "#BA7517",
              textAlign: "center",
              paddingVertical: 8,
            }}
          >
            No notices yet.
          </Text>
        ) : (
          <View style={{ gap: 8 }}>
            {notices.map((notice) => (
              <View
                key={notice.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 10,
                  borderWidth: 0.5,
                  borderColor: "#FAC775",
                  padding: 10,
                }}
              >
                {/* Edit mode */}
                {editingNotice?.id === notice.id ? (
                  <View>
                    <TextInput
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      style={{
                        fontSize: 14,
                        color: "#1E293B",
                        minHeight: 50,
                        maxHeight: 120,
                        borderBottomWidth: 1,
                        borderBottomColor: "#FAC775",
                        paddingBottom: 6,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "flex-end",
                        gap: 12,
                        marginTop: 8,
                      }}
                    >
                      <Pressable
                        onPress={() => {
                          setEditingNotice(null);
                          setEditText("");
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
                      <Pressable onPress={handleEdit} disabled={editing}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#BA7517",
                            fontWeight: "700",
                          }}
                        >
                          {editing ? "Saving…" : "Save"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  /* Display mode */
                  <>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "500",
                          color: "#1E293B",
                          flex: 1,
                        }}
                      >
                        {notice.message}
                      </Text>

                      {/* Admin actions */}
                      {isAdmin && (
                        <View
                          style={{
                            flexDirection: "row",
                            gap: 10,
                            paddingTop: 2,
                          }}
                        >
                          <Pressable
                            onPress={() => {
                              setEditingNotice(notice);
                              setEditText(notice.message);
                            }}
                            hitSlop={8}
                          >
                            <AppIcon
                              name="pencil-outline"
                              size={14}
                              color="#BA7517"
                            />
                          </Pressable>
                          <Pressable
                            onPress={() => setDeleteTargetId(notice.id)}
                            hitSlop={8}
                          >
                            <AppIcon
                              name="trash-outline"
                              size={14}
                              color="#EF4444"
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>

                    <Text
                      style={{ fontSize: 11, color: "#BA7517", marginTop: 6 }}
                    >
                      {notice.createdByFullName} · {timeAgo(notice.createdDate)}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Delete confirm modal */}
      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete Notice"
        message="This will permanently delete this notice."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </ScrollView>
  );
}
