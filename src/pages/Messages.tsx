import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  // Auto-select conversation from URL parameter
  useEffect(() => {
    const conversationId = searchParams.get('conversation');
    if (conversationId && user && !selectedConversation) {
      // Load the conversation from the URL parameter
      loadConversationById(conversationId);
    }
  }, [searchParams, user, selectedConversation]);

  const loadConversationById = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error || !data) {
        console.error("Error fetching conversation:", error);
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
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  // Authentication guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">Please log in to access chat</p>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="h-[calc(100vh-200px)] flex rounded-lg border border-border overflow-hidden">
          {/* Left Panel - Conversation List */}
          <div className="w-80 border-r border-border bg-card">
            <ConversationList
              onSelectConversation={handleSelectConversation}
              onNewChat={() => setShowNewChatModal(true)}
              onNewGroup={() => setShowNewGroupModal(true)}
              selectedConversationId={selectedConversation?.id}
            />
          </div>
          
          {/* Right Panel - Chat Interface or Welcome */}
          <div className="flex-1 bg-background">
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                onBack={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">Select a conversation</h2>
                <p className="text-muted-foreground">Choose a contact from the list to start chatting</p>
              </div>
            )}
          </div>
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