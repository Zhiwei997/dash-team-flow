import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Users, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useConversations, Conversation as ConversationType } from "@/hooks/useConversations";

type Conversation = ConversationType;

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  selectedConversationId?: string;
}

const ConversationList = ({ onSelectConversation, onNewChat, onNewGroup, selectedConversationId }: ConversationListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { conversations, loading } = useConversations();

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

  // Data is provided by useConversations hook


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-2xl font-bold text-foreground mb-4">Chat</h1>
      </div>

      {/* Top Controls */}
      <div className="p-4 border-b border-border">
        <div className="flex space-x-2 mb-4">
          <Button size="sm" onClick={onNewChat} className="flex-1">
            <MessageCircle className="h-4 w-4 mr-2" />
            New Chat
          </Button>
          <Button size="sm" variant="outline" onClick={onNewGroup} className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            New Group
          </Button>
        </div>

        {/* Search Bar */}
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

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No conversations found</p>
              <Button onClick={onNewChat}>
                Start your first chat
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center space-x-3 p-3 mx-1 mb-2 rounded-xl cursor-pointer transition-all duration-200 ${selectedConversationId === conversation.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50"
                  }`}
                onClick={() => onSelectConversation(conversation)}
              >
                {/* Profile Picture/Initial */}
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm font-medium">
                      {conversation.type === "group" ? (
                        <Users className="h-6 w-6" />
                      ) : (
                        getConversationName(conversation).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unreadCount! > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate text-sm">
                      {getConversationName(conversation)}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {format(new Date(conversation.lastMessage.sent_at), "MMM d")}
                      </span>
                    )}
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