import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ExternalLink,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  File,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
  useProjectFiles, 
  useUploadProjectFile, 
  useDeleteProjectFile, 
  useDownloadProjectFile,
  useUpdateProjectFile,
  type ProjectFile 
} from "@/hooks/useProjectFiles";
import { useAuth } from "@/hooks/useAuth";
import { useProject } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { UploadFilesModal } from "./UploadFilesModal";

interface DocsFilesModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface EditFileDialogProps {
  file: ProjectFile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Pick<ProjectFile, 'name' | 'description'>>) => void;
}

const EditFileDialog: React.FC<EditFileDialogProps> = ({ file, isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  React.useEffect(() => {
    if (file) {
      setName(file.name);
      setDescription(file.description || "");
    }
  }, [file]);

  const handleSave = () => {
    onSave({ name, description });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fileName">File Name</Label>
            <Input
              id="fileName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>
          <div>
            <Label htmlFor="fileDescription">Description</Label>
            <Textarea
              id="fileDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter file description (optional)"
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <File className="h-4 w-4" />;
  
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-4 w-4" />;
  if (mimeType.includes('text/') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
  
  return <File className="h-4 w-4" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const getFileType = (mimeType: string | null, fileName: string) => {
  if (mimeType) return mimeType;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? `.${extension}` : 'Unknown';
};

export const DocsFilesModal: React.FC<DocsFilesModalProps> = ({ projectId, isOpen, onClose }) => {
  const { user } = useAuth();
  const { data: project } = useProject(projectId);
  const { data: files = [], isLoading } = useProjectFiles(projectId);
  const uploadMutation = useUploadProjectFile();
  const deleteMutation = useDeleteProjectFile();
  const downloadMutation = useDownloadProjectFile();
  const updateMutation = useUpdateProjectFile();

  const [deleteFileId, setDeleteFileId] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<ProjectFile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const fileToDelete = files.find(f => f.id === deleteFileId);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    for (const file of Array.from(selectedFiles)) {
      uploadMutation.mutate({
        file,
        projectId,
      });
    }

    // Clear the input
    event.target.value = '';
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;
    
    deleteMutation.mutate({
      fileId: fileToDelete.id,
      filePath: fileToDelete.path,
    });
    setDeleteFileId(null);
  };

  const handleDownload = (file: ProjectFile) => {
    downloadMutation.mutate({
      filePath: file.path,
      fileName: file.name,
    });
  };

  const handleEdit = (file: ProjectFile) => {
    setEditFile(file);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updates: Partial<Pick<ProjectFile, 'name' | 'description'>>) => {
    if (!editFile) return;
    
    updateMutation.mutate({
      fileId: editFile.id,
      updates,
    });
  };

  const openFile = async (file: ProjectFile) => {
    try {
      const { data } = await supabase.storage
        .from('project-files')
        .createSignedUrl(file.path, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const canEditOrDelete = (file: ProjectFile) => {
    return file.created_by === user?.id || project?.created_by === user?.id;
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Docs & Files – {project?.project_name || 'Project'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading files...</div>
              </div>
            ) : files.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No files uploaded yet</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Uploader</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file.mime_type)}
                          <button
                            onClick={() => openFile(file)}
                            className="text-primary hover:underline text-left"
                          >
                            {file.name}
                          </button>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getFileType(file.mime_type, file.name)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {file.description ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[200px] truncate">
                                {file.description}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{file.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {file.uploader?.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {formatFileSize(file.size)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {canEditOrDelete(file) && (
                              <>
                                <DropdownMenuItem onClick={() => handleEdit(file)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeleteFileId(file.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => setIsUploadModalOpen(true)}
                  disabled={uploadMutation.isPending}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFileId} onOpenChange={() => setDeleteFileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit File Dialog */}
      <EditFileDialog
        file={editFile}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditFile(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Upload Files Modal */}
      <UploadFilesModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        defaultProjectId={projectId}
      />
    </TooltipProvider>
  );
};