import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare, Trash2 } from "lucide-react";
import { useProjectMessages, useSendProjectMessage, useDeleteProjectMessage } from "@/hooks/useProjectMessages";
import { useProjectMembers } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface MessageBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projectName?: string;
}

const MessageBoardModal = ({ open, onOpenChange, projectId, projectName }: MessageBoardModalProps) => {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const { data: messages = [], isLoading } = useProjectMessages(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const sendMessageMutation = useSendProjectMessage();
  const deleteMessageMutation = useDeleteProjectMessage();

  // Check if current user is project owner
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  const handleSendMessage = async () => {
    if (!projectId || !newMessage.trim()) return;

    try {
      await sendMessageMutation.mutateAsync({
        projectId,
        content: newMessage,
      });
      setNewMessage("");
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (messageId: string, projectId: string) => {
    try {
      await deleteMessageMutation.mutateAsync({
        messageId,
        projectId
      });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const canDeleteMessage = (message: any) => {
    return user && (message.user_id === user.id || isOwner);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Board
            {projectName && <span className="text-muted-foreground">- {projectName}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages List */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Be the first to start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="text-xs">
                        {message.user?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {message.user?.full_name || "Unknown User"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                    {canDeleteMessage(message) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the message.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteMessage(message.id, message.project_id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t pt-4 mt-4">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="flex-1 min-h-[80px] resize-none"
                disabled={!projectId || sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!projectId || !newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageBoardModal;