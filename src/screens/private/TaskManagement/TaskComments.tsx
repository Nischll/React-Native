import {
  useAddComment,
  useDeleteComment,
  useUpdateComment,
} from "@/src/api/taskManagement.api";
import AppIcon from "@/src/components/ui/AppIcon";
import ConfirmModal from "@/src/components/ui/ConfirmModal";
import { useAuth } from "@/src/providers/AuthProvider";
import {
  CommentResponse,
  TaskResponseData,
} from "@/src/types/task-management.types";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { CommentRow } from "./components/CommentRow";

interface Props {
  task: TaskResponseData;
}

export default function TaskComments({ task }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [text, setText] = useState("");
  const [openSwipeId, setOpenSwipeId] = useState<number | null>(null);
  const [editingComment, setEditingComment] = useState<CommentResponse | null>(
    null,
  );
  const [replyingTo, setReplyingTo] = useState<CommentResponse | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const inputRef = useRef<TextInput>(null);

  const { mutate: addComment, isPending: adding } = useAddComment();
  const { mutate: updateComment, isPending: updating } = useUpdateComment(
    editingComment?.id,
  );
  const { mutate: deleteComment, isPending: deleting } = useDeleteComment(
    deleteTargetId ?? undefined,
  );

  const comments = task.commentResponsePojoList ?? [];
  const hasText = text.trim().length > 0;

  const invalidate = () =>
    qc.invalidateQueries({
      predicate: (q) => String(q.queryKey[0]).includes("/task"),
    });

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (editingComment) {
      updateComment(
        {
          message: trimmed,
          messageFrom: user?.userId,
          messageTo: editingComment.messageTo,
          parentId: editingComment.parentId ?? undefined,
          taskId: task.id,
        },
        {
          onSuccess: () => {
            setEditingComment(null);
            setText("");
            invalidate();
          },
        },
      );
      return;
    }

    addComment(
      {
        message: trimmed,
        messageTo: replyingTo ? replyingTo.messageFrom : task.assignedTo,
        taskId: task.id,
        ...(replyingTo && { parentId: replyingTo.id }),
      },
      {
        onSuccess: () => {
          setText("");
          setReplyingTo(null);
          invalidate();
        },
      },
    );
  };

  const handleEdit = (comment: CommentResponse) => {
    setEditingComment(comment);
    setReplyingTo(null);
    setText(comment.message.trim());
    inputRef.current?.focus();
  };

  const handleReply = (comment: CommentResponse) => {
    setReplyingTo(comment);
    setEditingComment(null);
    setText("");
    inputRef.current?.focus();
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    deleteComment(undefined, {
      onSuccess: () => {
        setDeleteTargetId(null);
        setOpenSwipeId(null);
        invalidate();
      },
    });
  };

  const cancelCompose = () => {
    setEditingComment(null);
    setReplyingTo(null);
    setText("");
    Keyboard.dismiss();
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ── Comment list ── */}
      {/* <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          setOpenSwipeId(null);
        }}
      > */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 12, gap: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={() => setOpenSwipeId(null)}
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              task={task}
              taskId={task.id}
              depth={0}
              openSwipeId={openSwipeId}
              onSwipeOpen={setOpenSwipeId}
              onRequestDelete={setDeleteTargetId}
              onEdit={handleEdit}
              onReply={handleReply}
            />
          )}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 48,
              }}
            >
              <AppIcon name="chatbubble-outline" size={40} color="#CBD5E1" />
              <Text style={{ fontSize: 13, color: "#94A3B8", marginTop: 12 }}>
                No comments yet. Start the conversation!
              </Text>
            </View>
          }
        />
      </View>
      {/* </TouchableWithoutFeedback> */}

      {/* ── Context indicator (replying / editing) ── */}
      {(replyingTo || editingComment) && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#F5F3FF",
            borderTopWidth: 1,
            borderTopColor: "#DDD6FE",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: "#7C3AED", fontWeight: "700" }}>
              {editingComment
                ? "Editing comment"
                : `Replying to ${replyingTo?.messageToFullName}`}
            </Text>
            <Text style={{ fontSize: 12, color: "#64748B" }} numberOfLines={1}>
              {editingComment ? editingComment.message : replyingTo?.message}
            </Text>
          </View>
          <Pressable onPress={cancelCompose} hitSlop={8}>
            <AppIcon name="close-outline" size={18} color="#7C3AED" />
          </Pressable>
        </View>
      )}

      {/* ── Pinned composer ── */}
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
          backgroundColor: "#fff",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={setText}
          placeholder={
            editingComment
              ? "Edit comment..."
              : replyingTo
                ? `Reply to ${replyingTo.messageToFullName}...`
                : "Add a comment..."
          }
          placeholderTextColor="#CBD5E1"
          multiline
          style={{
            flex: 1,
            fontSize: 14,
            color: "#1E293B",
            backgroundColor: "#F8FAFC",
            borderWidth: 1,
            borderColor: "#E2E8F0",
            borderRadius: 12,
            padding: 10,
            minHeight: 42,
            maxHeight: 100,
          }}
        />
        <Pressable
          onPress={handleSend}
          disabled={!hasText || adding || updating}
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {adding || updating ? (
            <ActivityIndicator size="small" color="#7C3AED" />
          ) : (
            <AppIcon
              name="send"
              size={18}
              color={hasText ? "#7C3AED" : "#CBD5E1"}
            />
          )}
        </Pressable>
      </View>

      <ConfirmModal
        visible={deleteTargetId !== null}
        title="Delete Comment"
        message="This will permanently delete this comment and all its replies."
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTargetId(null);
          setOpenSwipeId(null);
        }}
      />
    </View>
  );
}
