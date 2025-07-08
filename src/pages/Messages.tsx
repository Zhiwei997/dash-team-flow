import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import ConversationList from "@/components/chat/ConversationList";
import ChatInterface from "@/components/chat/ChatInterface";
import NewChatModal from "@/components/chat/NewChatModal";
import NewGroupModal from "@/components/chat/NewGroupModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  id: string;
  name: string | null;
  type: string;
  members?: {
    user_id: string;
    role: string;
    user?: {
      full_name: string;
      email: string;
    };
  }[];
}

const Messages = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const { user } = useAuth();

  const handleSelectConversation = async (conversation: Conversation) => {
    // Fetch full conversation details with members
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversation.id)
      .single();

    if (error) {
      console.error("Error fetching conversation details:", error);
      return;
    }

    // Fetch members separately
    const { data: membersData } = await supabase
      .from("conversation_members")
      .select("user_id, role")
      .eq("conversation_id", conversation.id);

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

    setSelectedConversation({
      ...data,
      members: membersWithUsers,
    });
  };

  const handleChatCreated = async (conversationId: string) => {
    // Fetch the new conversation and select it
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching new conversation:", error);
      return;
    }

    // Fetch members separately
    const { data: membersData } = await supabase
      .from("conversation_members")
      .select("user_id, role")
      .eq("conversation_id", conversationId);

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

    setSelectedConversation({
      ...data,
      members: membersWithUsers,
    });
    setShowNewChatModal(false);
    setShowNewGroupModal(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900">
      <Navigation />
      <div className="h-[calc(100vh-73px)] flex">
        {/* Left Panel - Conversation List */}
        <div className="w-80 border-r border-zinc-700">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            onNewChat={() => setShowNewChatModal(true)}
            onNewGroup={() => setShowNewGroupModal(true)}
            selectedConversationId={selectedConversation?.id}
          />
        </div>
        
        {/* Right Panel - Chat Interface or Welcome */}
        <div className="flex-1">
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center bg-zinc-900">
              <h2 className="text-xl font-semibold text-zinc-200 mb-2">Select a conversation</h2>
              <p className="text-zinc-400">Choose a contact from the list to start chatting</p>
            </div>
          )}
        </div>
      </div>

      <NewChatModal
        open={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onChatCreated={handleChatCreated}
      />

      <NewGroupModal
        open={showNewGroupModal}
        onClose={() => setShowNewGroupModal(false)}
        onGroupCreated={handleChatCreated}
      />
    </div>
  );
};

export default Messages;