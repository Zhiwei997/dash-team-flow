import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "./useAuth";

export interface Conversation {
  id: string;
  name: string | null;
  type: string;
  updated_at: string;
  members?: {
    user_id: string;
    role: string;
    user?: {
      full_name: string;
      email: string;
    };
  }[];
  lastMessage?: {
    content: string | null;
    file_name: string | null;
    sent_at: string;
    sender?: {
      full_name: string;
    };
  };
  unreadCount?: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;

    // 1) Fetch conversations with embedded members and the latest message metadata
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        members:conversation_members(user_id, role),
        last_message:messages!messages_conversation_id_fkey(content, file_name, sent_at, sender_id) 
      `)
      .order("updated_at", { ascending: false })
      // limit the embedded last_message to 1 per conversation ordered by sent_at desc
      .limit(1, { foreignTable: "messages" })
      .order("sent_at", { ascending: false, foreignTable: "messages" });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    type RawMember = { user_id: string; role: string };
    type RawLastMessage = { content: string | null; file_name: string | null; sent_at: string; sender_id: string };
    type RawConversation = {
      id: string;
      name: string | null;
      type: string;
      updated_at: string;
      members?: RawMember[];
      // Supabase embed on array relation returns an array
      last_message?: RawLastMessage[] | null;
    };

    const conversationsRaw: RawConversation[] = (data as unknown as RawConversation[]) || [];

    // 2) Collect all user ids we need details for (members and last message senders)
    const memberUserIds = new Set<string>();
    const senderIds = new Set<string>();
    for (const conv of conversationsRaw) {
      (conv.members || []).forEach((m: RawMember) => memberUserIds.add(m.user_id));
      const lm = Array.isArray(conv.last_message) ? conv.last_message?.[0] : undefined;
      if (lm?.sender_id) senderIds.add(lm.sender_id);
    }
    const allUserIds = Array.from(new Set<string>([...memberUserIds, ...senderIds]));

    // 3) Batch fetch user info once
    let usersById: Record<string, { full_name: string; email?: string } | undefined> = {};
    if (allUserIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", allUserIds);
      if (!usersError && usersData) {
        usersById = usersData.reduce<Record<string, { full_name: string; email?: string }>>((acc, u: { id: string; full_name: string; email: string }) => {
          acc[u.id] = { full_name: u.full_name, email: u.email };
          return acc;
        }, {});
      }
    }

    // 4) Fetch unread counts via RPC (server-side aggregation)
    const unreadByConversation: Record<string, number> = {};
    {
      const { data: unreadCounts, error: unreadErr } = await supabase
        .rpc('get_unread_counts', { p_user_id: user.id });
      if (!unreadErr && unreadCounts) {
        for (const row of unreadCounts) {
          unreadByConversation[row.conversation_id] = row.unread_count || 0;
        }
      }
    }

    // 5) Assemble final shape with member.user and lastMessage.sender hydrated
    const conversationsWithDetails: Conversation[] = conversationsRaw.map((conv) => {
      const lmArr = Array.isArray(conv.last_message) ? conv.last_message : [];
      const lm = lmArr?.[0];
      const lastMessage = lm
        ? {
          content: lm.content ?? null,
          file_name: lm.file_name ?? null,
          sent_at: lm.sent_at,
          sender: lm.sender_id ? { full_name: usersById[lm.sender_id]?.full_name ?? "" } : undefined,
        }
        : undefined;

      const members: NonNullable<Conversation["members"]> = (conv.members || []).map((m: RawMember) => ({
        user_id: m.user_id,
        role: m.role,
        user: usersById[m.user_id]
          ? { full_name: usersById[m.user_id]!.full_name, email: usersById[m.user_id]!.email }
          : undefined,
      }));

      return {
        id: conv.id,
        name: conv.name,
        type: conv.type,
        updated_at: conv.updated_at,
        members,
        lastMessage,
        unreadCount: unreadByConversation[conv.id] || 0,
      };
    });

    setConversations(conversationsWithDetails);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading };
};

export default useConversations;