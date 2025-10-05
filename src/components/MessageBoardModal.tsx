import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Send, MessageSquare, Trash2, Image as ImageIcon, X, Upload, AlertCircle } from "lucide-react";
import { useProjectMessages, useSendProjectMessage, useDeleteProjectMessage } from "@/hooks/useProjectMessages";
import { useProjectMembers } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { useDropzone } from "react-dropzone";
import { formatFileSize } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MessageBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projectName?: string;
}

interface ImageFile {
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
};

const MessageBoardModal = ({ open, onOpenChange, projectId, projectName }: MessageBoardModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const { data: messages = [], isLoading } = useProjectMessages(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const sendMessageMutation = useSendProjectMessage();
  const deleteMessageMutation = useDeleteProjectMessage();

  // Check if current user is project owner
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === 'owner';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const newFiles = acceptedFiles.map(file => {
      const error = file.size > MAX_FILE_SIZE ? `Image exceeds 10MB limit` : undefined;
      const preview = URL.createObjectURL(file);

      return {
        file,
        preview,
        progress: 0,
        error,
      };
    });

    setImageFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: true,
    disabled: !projectId || sendMessageMutation.isPending || isUploadingImages,
    // Prevent opening the file dialog when clicking inside the message box
    noClick: true,
    noKeyboard: true,
  });

  const removeImage = (index: number) => {
    const fileToRemove = imageFiles[index];
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllImages = () => {
    imageFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setImageFiles([]);
  };

  const uploadImages = async (): Promise<string[]> => {
    const validFiles = imageFiles.filter(f => !f.error);
    if (validFiles.length === 0 || !user || !projectId) return [];

    setIsUploadingImages(true);
    const uploadedPaths: string[] = [];

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const imageFile = validFiles[i];
        const fileIndex = imageFiles.findIndex(f => f === imageFile);

        // Update progress
        setImageFiles(prev => prev.map((file, idx) =>
          idx === fileIndex ? { ...file, progress: (i / validFiles.length) * 100 } : file
        ));

        const fileId = crypto.randomUUID();
        const fileName = imageFile.file.name;
        const filePath = `${projectId}/${user.id}/${fileId}-${fileName}`;

        // Upload to storage
        const { data: storageData, error: storageError } = await supabase.storage
          .from("project-messages")
          .upload(filePath, imageFile.file);

        if (storageError) throw storageError;

        uploadedPaths.push(filePath);

        // Update progress to 100%
        setImageFiles(prev => prev.map((file, idx) =>
          idx === fileIndex ? { ...file, progress: 100 } : file
        ));
      }

      return uploadedPaths;
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!projectId || (!newMessage.trim() && imageFiles.length === 0)) return;

    try {
      let imagePaths: string[] = [];

      // Upload images if any are selected
      if (imageFiles.length > 0) {
        imagePaths = await uploadImages();
      }

      await sendMessageMutation.mutateAsync({
        projectId,
        content: newMessage.trim() || "", // Allow empty content if images are present
        imageUrls: imagePaths.length > 0 ? imagePaths : undefined,
      });

      // Clear form after successful send
      setNewMessage("");
      removeAllImages();
    } catch (error) {
      // Error handling is done in the mutation and upload function
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

  const canDeleteMessage = (message: { user_id: string }) => {
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
                      {message.content && (
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      )}
                      {message.image_urls && message.image_urls.length > 0 && (
                        <div className="mt-2">
                          {message.image_urls.length === 1 ? (
                            <img
                              src={message.image_urls[0]}
                              alt="Message attachment"
                              className="max-w-full max-h-64 object-contain rounded-lg border"
                              loading="lazy"
                            />
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {message.image_urls.map((imageUrl, index) => (
                                <img
                                  key={index}
                                  src={imageUrl}
                                  alt={`Message attachment ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border"
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
            <div className="space-y-3">
              {/* Selected Images Preview */}
              {imageFiles.length > 0 && (
                <div className="border rounded-lg p-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Selected Images ({imageFiles.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeAllImages}
                      disabled={isUploadingImages}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {imageFiles.map((imageFile, index) => (
                      <div key={index} className="relative">
                        {imageFile.error ? (
                          <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="h-3 w-3 text-destructive flex-shrink-0" />
                            <span className="text-xs text-destructive truncate">{imageFile.error}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="ml-auto h-5 w-5 p-0 flex-shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <img
                              src={imageFile.preview}
                              alt={`Selected image ${index + 1}`}
                              className="w-full h-24 object-cover rounded border"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 h-5 w-5 p-0 bg-background/80 hover:bg-background"
                              disabled={isUploadingImages}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {isUploadingImages && (
                              <div className="absolute bottom-1 left-1 right-1">
                                <Progress value={imageFile.progress} className="h-1" />
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs px-1 py-0">
                            {formatFileSize(imageFile.file.size)}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {imageFile.file.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {isUploadingImages && (
                    <div className="space-y-1 mt-2">
                      <p className="text-xs text-muted-foreground text-center">
                        Uploading {imageFiles.filter(f => !f.error).length} image{imageFiles.filter(f => !f.error).length !== 1 ? 's' : ''}...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Message Input with Drag and Drop */}
              <div
                {...getRootProps()}
                className={`
                  border rounded-lg p-3 transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border'}
                  ${!projectId || sendMessageMutation.isPending || isUploadingImages ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
                `}
              >
                <input {...getInputProps()} />
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isDragActive ? "Drop images here..." : "Type your message... (Press Enter to send, Shift+Enter for new line)"}
                    className="flex-1 min-h-[80px] resize-none border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={!projectId || sendMessageMutation.isPending || isUploadingImages}
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                        input?.click();
                      }}
                      disabled={!projectId || sendMessageMutation.isPending || isUploadingImages}
                      className="h-8 w-8 p-0"
                      title="Add images"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendMessage();
                      }}
                      disabled={!projectId || (!newMessage.trim() && imageFiles.length === 0) || sendMessageMutation.isPending || isUploadingImages}
                      size="sm"
                      className="h-8 w-8 p-0"
                      title={imageFiles.length > 0 && !newMessage.trim() ? "Send images" : "Send message"}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {isDragActive && (
                  <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-primary font-medium">Drop images here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageBoardModal;