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

    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        members:conversation_members(user_id, role)
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Fetch members with user details and conversation details
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv) => {
        // Get members with user details
        const { data: membersData } = await supabase
          .from("conversation_members")
          .select("user_id, role")
          .eq("conversation_id", conv.id);

        const membersWithUsers = await Promise.all(
          (membersData || []).map(async (member) => {
            const { data: userData } = await supabase
              .from("users")
              .select("full_name, email")
              .eq("id", member.user_id)
              .single();

            return {
              ...member,
              user: userData,
            };
          })
        );

        // Get last message
        const { data: lastMessageData } = await supabase
          .from("messages")
          .select("content, file_name, sent_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("sent_at", { ascending: false })
          .limit(1);

        let lastMessageWithSender = null;
        if (lastMessageData?.[0]) {
          const { data: senderData } = await supabase
            .from("users")
            .select("full_name")
            .eq("id", lastMessageData[0].sender_id)
            .single();

          lastMessageWithSender = {
            ...lastMessageData[0],
            sender: senderData,
          };
        }

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("conversation_id", conv.id)
          .neq("sender_id", user.id)
          .not("id", "in", `(
            SELECT message_id FROM message_read_receipts 
            WHERE user_id = '${user.id}'
          )`);

        return {
          ...conv,
          members: membersWithUsers,
          lastMessage: lastMessageWithSender,
          unreadCount: unreadCount || 0,
        };
      })
    );

    setConversations(conversationsWithDetails);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return { conversations, loading };
};

export default useConversations;