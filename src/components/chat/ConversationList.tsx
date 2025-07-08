import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Conversation {
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

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
}

const ConversationList = ({ onSelectConversation, onNewChat, onNewGroup }: ConversationListProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    subscribeToConversations();
  }, []);

  const fetchConversations = async () => {
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
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          fetchConversations();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }
    const otherMember = conversation.members?.find(
      (member) => member.user_id !== user?.id
    );
    return otherMember?.user?.full_name || "Unknown User";
  };

  const getConversationSubtext = (conversation: Conversation) => {
    if (conversation.lastMessage) {
      const prefix = conversation.type === "group" && conversation.lastMessage.sender 
        ? `${conversation.lastMessage.sender.full_name}: ` 
        : "";
      
      if (conversation.lastMessage.content) {
        return `${prefix}${conversation.lastMessage.content}`;
      } else if (conversation.lastMessage.file_name) {
        return `${prefix}📎 ${conversation.lastMessage.file_name}`;
      }
    }
    return "No messages yet";
  };

  const filteredConversations = conversations.filter((conv) =>
    getConversationName(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Chat</h2>
          <div className="flex space-x-2">
            <Button size="sm" onClick={onNewChat}>
              <MessageCircle className="h-4 w-4 mr-2" />
              New Chat
            </Button>
            <Button size="sm" variant="outline" onClick={onNewGroup}>
              <Users className="h-4 w-4 mr-2" />
              New Group
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No conversations found</p>
              <Button onClick={onNewChat}>Start your first chat</Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onSelectConversation(conversation)}
              >
                <Avatar>
                  <AvatarFallback>
                    {conversation.type === "group" ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      getConversationName(conversation).charAt(0).toUpperCase()
                    )}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground truncate">
                      {getConversationName(conversation)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(conversation.lastMessage.sent_at), "MMM d")}
                        </span>
                      )}
                      {conversation.unreadCount! > 0 && (
                        <Badge variant="default" className="text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {getConversationSubtext(conversation)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ConversationList;