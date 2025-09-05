import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Users, MessageCircle } from "lucide-react";
import { Job } from "@/hooks/useJobs";
import { toast } from "@/hooks/use-toast";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ShareJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

export const ShareJobModal = ({ isOpen, onClose, job }: ShareJobModalProps) => {
  const [shareType, setShareType] = useState<"existing" | "search">("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState(`Check out this job opportunity: ${job.title}`);
  const { conversations, loading: loadingConversations } = useConversations();
  const { user } = useAuth();

  // Mock data for existing chats
  const existingChats = conversations.map((conversation) => ({
    id: conversation.id,
    name: conversation.name || conversation.members.find((member) => member.user_id !== user.id)?.user?.full_name || "Unknown User",
    type: conversation.type,
    members: conversation.members?.length || 0,
  }));

  const handleShare = async (chatId: string, chatName: string) => {
    const messageContent = `${message}\n\n ${window.location.origin}/jobs/${job.id}`;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: chatId,
        content: messageContent,
        sender_id: user.id,
      });
    // In a real implementation, this would send the message to the selected chat
    toast({
      title: "Job Shared",
      description: `Job shared to ${chatName} successfully.`,
    });
    onClose();
  };

  const handleSearchShare = () => {
    if (!searchQuery.trim()) return;

    // In a real implementation, this would search for users and send the message
    toast({
      title: "Job Shared",
      description: `Job shared to ${searchQuery} successfully.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Job to Chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <h4 className="font-medium">{job.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {job.description}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {job.required_people} {job.required_people === 1 ? 'person' : 'people'} needed
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    by {job.publisher_name}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Options */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={shareType === "existing" ? "default" : "outline"}
                onClick={() => setShareType("existing")}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Existing Chats
              </Button>
              <Button
                variant={shareType === "search" ? "default" : "outline"}
                onClick={() => setShareType("search")}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                Search User
              </Button>
            </div>

            {shareType === "existing" ? (
              <div className="space-y-2">
                <Label>Select a chat:</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {existingChats.map((chat) => (
                    <Card key={chat.id} className="cursor-pointer hover:bg-accent">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              {chat.type === "group" ? (
                                <Users className="h-4 w-4" />
                              ) : (
                                <MessageCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{chat.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {chat.type === "group" ? `${chat.members} members` : "Direct message"}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleShare(chat.id, chat.name)}
                          >
                            Share
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search by name or email:</Label>
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter name or email..."
                  />
                </div>
                <Button
                  onClick={handleSearchShare}
                  disabled={!searchQuery.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            )}
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional):</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a custom message..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};