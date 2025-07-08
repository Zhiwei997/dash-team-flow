import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Paperclip, Send, Download, FileText, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  sent_at: string;
  sender_id: string;
  sender?: {
    full_name: string;
    email: string;
  };
  read_receipts?: {
    user_id: string;
    read_at: string;
  }[];
}

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

interface ChatInterfaceProps {
  conversation: Conversation;
  onBack: () => void;
}

const ChatInterface = ({ conversation, onBack }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversation?.id) {
      fetchMessages();
      subscribeToMessages();
      markMessagesAsRead();
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!conversation?.id) return;

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        read_receipts:message_read_receipts(user_id, read_at)
      `)
      .eq("conversation_id", conversation.id)
      .order("sent_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    // Fetch sender details separately
    const messagesWithSenders = await Promise.all(
      (data || []).map(async (message) => {
        const { data: senderData } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", message.sender_id)
          .single();

        return {
          ...message,
          sender: senderData,
        };
      })
    );

    setMessages(messagesWithSenders);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_read_receipts",
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markMessagesAsRead = async () => {
    if (!conversation?.id || !user?.id) return;

    const { data: unreadMessages } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversation.id)
      .neq("sender_id", user.id);

    if (!unreadMessages?.length) return;

    const readReceipts = unreadMessages.map((message) => ({
      message_id: message.id,
      user_id: user.id,
    }));

    await supabase
      .from("message_read_receipts")
      .upsert(readReceipts, { onConflict: "message_id,user_id" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation?.id || !user?.id) return;

    setLoading(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content: newMessage,
    });

    if (error) {
      toast.error("Failed to send message");
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!conversation?.id || !user?.id) return;

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Failed to upload file");
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("chat-files")
      .getPublicUrl(fileName);

    const { error: messageError } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    });

    if (messageError) {
      toast.error("Failed to send file");
      console.error("Message error:", messageError);
    }

    setUploading(false);
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_id === user?.id) {
      const totalMembers = conversation.members?.length || 0;
      const readCount = message.read_receipts?.length || 0;
      
      // Subtract 1 for the sender themselves
      if (readCount >= totalMembers - 1) {
        return <span className="text-xs text-green-400 flex items-center">✔️ Read</span>;
      } else {
        return <span className="text-xs text-yellow-400 flex items-center">⏳ Unread</span>;
      }
    }
    return null;
  };

  const isImageFile = (fileType: string | null) => {
    return fileType?.startsWith("image/");
  };

  const getDisplayName = () => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }
    const otherMember = conversation.members?.find(
      (member) => member.user_id !== user?.id
    );
    return otherMember?.user?.full_name || "Chat";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border p-4 bg-card/50">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-muted">
            ← Back
          </Button>
          <div>
            <h2 className="font-semibold text-foreground">{getDisplayName()}</h2>
            {conversation.type === "group" && (
              <p className="text-sm text-muted-foreground">
                {conversation.members?.length} members
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_id === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-xl p-3 ${
                  message.sender_id === user?.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.sender_id !== user?.id && conversation.type === "group" && (
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    {message.sender?.full_name}
                  </p>
                )}
                
                {message.content && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                )}
                
                {message.file_url && (
                  <div className="mt-2">
                    {isImageFile(message.file_type) ? (
                      <img
                        src={message.file_url}
                        alt={message.file_name || "Image"}
                        className="max-w-full h-auto rounded-lg cursor-pointer border border-border"
                        onClick={() => window.open(message.file_url!, "_blank")}
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg border border-border">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm flex-1 text-foreground">{message.file_name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(message.file_url!, "_blank")}
                          className="h-8 w-8 p-0 hover:bg-muted"
                        >
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className={`${message.sender_id === user?.id ? 'opacity-70' : 'text-muted-foreground'}`}>
                    {format(new Date(message.sent_at), "HH:mm")}
                  </span>
                  {getMessageStatus(message)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card/30">
        <div className="flex items-end space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 w-10 p-0 hover:bg-muted rounded-xl"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={loading || uploading}
              className="rounded-xl resize-none min-h-[40px]"
            />
          </div>
          <Button 
            onClick={sendMessage} 
            disabled={loading || uploading || !newMessage.trim()}
            className="h-10 w-10 p-0 rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {uploading && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></div>
            Uploading file...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;