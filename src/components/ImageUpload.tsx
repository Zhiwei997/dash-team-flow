import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    X,
    Image as ImageIcon,
    AlertCircle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { formatFileSize } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
    onImagesUploaded: (imageUrls: string[]) => void;
    onImagesRemoved: () => void;
    projectId: string;
    disabled?: boolean;
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

export const ImageUpload: React.FC<ImageUploadProps> = ({
    onImagesUploaded,
    onImagesRemoved,
    projectId,
    disabled = false
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);

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
        disabled: disabled || isUploading,
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
        onImagesRemoved();
    };

    const uploadImages = async () => {
        const validFiles = imageFiles.filter(f => !f.error);
        if (validFiles.length === 0 || !user) return;

        setIsUploading(true);
        const uploadedUrls: string[] = [];

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
                const filePath = `message-images/${projectId}/${user.id}/${fileId}-${fileName}`;

                // Upload to storage
                const { data: storageData, error: storageError } = await supabase.storage
                    .from("project-files")
                    .upload(filePath, imageFile.file);

                if (storageError) throw storageError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from("project-files")
                    .getPublicUrl(filePath);

                if (!urlData.publicUrl) throw new Error("Failed to get public URL");

                uploadedUrls.push(urlData.publicUrl);

                // Update progress to 100%
                setImageFiles(prev => prev.map((file, idx) =>
                    idx === fileIndex ? { ...file, progress: 100 } : file
                ));
            }

            onImagesUploaded(uploadedUrls);

            toast({
                title: "Images uploaded",
                description: `Successfully uploaded ${uploadedUrls.length} image${uploadedUrls.length !== 1 ? 's' : ''}.`,
            });
        } catch (error) {
            toast({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload images",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const validFiles = imageFiles.filter(f => !f.error);
    const canUpload = validFiles.length > 0 && !isUploading;

    return (
        <div className="space-y-3">
            {imageFiles.length === 0 ? (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
                >
                    <input {...getInputProps()} />
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {isDragActive ? 'Drop images here' : 'Click or drag to upload images'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, GIF, WebP up to 10MB each
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Image Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        {imageFiles.map((imageFile, index) => (
                            <div key={index} className="space-y-2">
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
                                    <div className="relative">
                                        <img
                                            src={imageFile.preview}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 h-5 w-5 p-0 bg-background/80 hover:bg-background"
                                            disabled={isUploading}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                        {isUploading && (
                                            <div className="absolute bottom-1 left-1 right-1">
                                                <Progress value={imageFile.progress} className="h-1" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center gap-1">
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

                    {/* Upload Controls */}
                    <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {validFiles.length} image{validFiles.length !== 1 ? 's' : ''} selected
                            </span>
                            {imageFiles.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={removeAllImages}
                                    disabled={isUploading}
                                    className="h-6 px-2 text-xs"
                                >
                                    Clear all
                                </Button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                                    input?.click();
                                }}
                                disabled={disabled || isUploading}
                                className="h-7 px-3 text-xs"
                            >
                                Add more
                            </Button>
                            <Button
                                onClick={uploadImages}
                                disabled={!canUpload}
                                size="sm"
                                className="h-7 px-3"
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Upload {validFiles.length}
                            </Button>
                        </div>
                    </div>

                    {isUploading && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground text-center">
                                Uploading {validFiles.length} image{validFiles.length !== 1 ? 's' : ''}...
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
