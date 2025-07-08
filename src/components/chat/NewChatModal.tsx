import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
  onChatCreated: (conversationId: string) => void;
}

const NewChatModal = ({ open, onClose, onChatCreated }: NewChatModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user: currentUser } = useAuth();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .neq("id", currentUser?.id)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error("Error searching users:", error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const createPrivateChat = async (userId: string) => {
    // Authentication validation
    if (!currentUser?.id) {
      toast.error("You must be logged in to create a chat");
      return;
    }

    // Debug authentication state
    console.log("Creating chat - Current user:", currentUser);
    console.log("Auth state - User ID:", currentUser.id);
    
    // Verify and refresh session before proceeding
    let session = await supabase.auth.getSession();
    if (!session.data.session) {
      console.log("No session found, attempting refresh...");
      const refreshResult = await supabase.auth.refreshSession();
      if (!refreshResult.data.session) {
        toast.error("Your session has expired. Please log in again.");
        return;
      }
      session = refreshResult;
    }

    console.log("Session verified - User ID:", session.data.session.user.id);
    setCreating(true);

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from("conversation_members")
      .select(`
        conversation_id,
        conversation:conversations!inner(type)
      `)
      .eq("user_id", currentUser.id)
      .eq("conversation.type", "private");

    if (existingConversation) {
      for (const member of existingConversation) {
        const { data: otherMember } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", member.conversation_id)
          .eq("user_id", userId);

        if (otherMember && otherMember.length > 0) {
          // Conversation already exists
          onChatCreated(member.conversation_id);
          onClose();
          setCreating(false);
          return;
        }
      }
    }

    // Create new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        type: "private",
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (conversationError) {
      toast.error("Failed to create conversation");
      console.error("Conversation error:", conversationError);
      setCreating(false);
      return;
    }

    // Add both users as members
    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert([
        {
          conversation_id: conversation.id,
          user_id: currentUser.id,
          role: "owner",
        },
        {
          conversation_id: conversation.id,
          user_id: userId,
          role: "member",
        },
      ]);

    if (membersError) {
      toast.error("Failed to add members to conversation");
      console.error("Members error:", membersError);
      setCreating(false);
      return;
    }

    toast.success("Chat created successfully");
    onChatCreated(conversation.id);
    onClose();
    setCreating(false);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    searchUsers(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Searching...</p>
              </div>
            ) : users.length === 0 && searchTerm ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createPrivateChat(user.id)}
                      disabled={creating}
                    >
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatModal;