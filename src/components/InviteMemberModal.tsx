import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, Loader2 } from "lucide-react";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  existingMemberIds: string[];
}

interface SearchUser {
  id: string;
  full_name: string;
  email: string;
}

const InviteMemberModal = ({ isOpen, onClose, projectId, existingMemberIds }: InviteMemberModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search users query
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ["search-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .not("id", "in", `(${existingMemberIds.join(",")})`)
        .limit(10);

      if (error) throw error;
      return data as SearchUser[];
    },
    enabled: searchQuery.length >= 2 && isOpen,
  });

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: userId,
          role: "member",
        });

      if (error) throw error;
    },
    onSuccess: (_, userId) => {
      const invitedUser = searchResults.find(u => u.id === userId);
      toast({
        title: "User invited successfully",
        description: `${invitedUser?.full_name} has been added to the project.`,
      });
      
      // Invalidate relevant queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      
      // Clear search and close modal
      setSearchQuery("");
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInvite = (userId: string) => {
    inviteMemberMutation.mutate(userId);
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Search for users to invite to your project. They will be added as members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {searchLoading && searchQuery.length >= 2 && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  No users found matching your search.
                </p>
              </div>
            )}

            {searchQuery.length < 2 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search for users.
                </p>
              </div>
            )}

            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm bg-primary/10 text-primary">
                      {user.full_name?.slice(0, 2).toUpperCase() || "UN"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-medium text-foreground">
                      {user.full_name || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleInvite(user.id)}
                  disabled={inviteMemberMutation.isPending}
                  className="shrink-0"
                >
                  {inviteMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberModal;