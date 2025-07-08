import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const NewGroupModal = ({ open, onClose, onGroupCreated }: NewGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
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

  const toggleUserSelection = (user: User) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const createGroup = async () => {
    // Authentication validation
    if (!currentUser?.id) {
      toast.error("You must be logged in to create a group");
      return;
    }
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    // Debug authentication state
    console.log("Creating group - Current user:", currentUser);
    console.log("Auth state - User ID:", currentUser.id);
    
    // Verify session before proceeding
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      toast.error("Your session has expired. Please log in again.");
      return;
    }

    console.log("Session verified - User ID:", session.session.user.id);
    setCreating(true);

    // Create new group conversation
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({
        name: groupName,
        type: "group",
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (conversationError) {
      toast.error("Failed to create group");
      console.error("Conversation error:", conversationError);
      setCreating(false);
      return;
    }

    // Add creator as owner
    const members = [
      {
        conversation_id: conversation.id,
        user_id: currentUser.id,
        role: "owner",
      },
      // Add selected users as members
      ...selectedUsers.map((user) => ({
        conversation_id: conversation.id,
        user_id: user.id,
        role: "member",
      })),
    ];

    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert(members);

    if (membersError) {
      toast.error("Failed to add members to group");
      console.error("Members error:", membersError);
      setCreating(false);
      return;
    }

    toast.success("Group created successfully");
    onGroupCreated(conversation.id);
    onClose();
    
    // Reset form
    setGroupName("");
    setSelectedUsers([]);
    setSearchTerm("");
    setUsers([]);
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
          <DialogTitle>Create New Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div>
              <Label>Selected Members ({selectedUsers.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center bg-muted rounded-full px-3 py-1"
                  >
                    <span className="text-sm">{user.full_name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2 h-4 w-4 p-0"
                      onClick={() => removeSelectedUser(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label>Add Members</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-48">
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
                {users.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => toggleUserSelection(user)}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar>
                        <AvatarFallback>
                          {user.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={createGroup} disabled={creating || !groupName.trim()}>
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewGroupModal;