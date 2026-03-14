import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Image, X, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  path: string;
}

export function DocumentUploader() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);

    const uploadedFiles: UploadedFile[] = [];

    for (const file of Array.from(e.target.files)) {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) {
        toast.error(`${file.name}: Only images and PDFs are supported`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Max file size is 10MB`);
        continue;
      }

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('assignments').upload(path, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(path);

      uploadedFiles.push({
        name: file.name,
        url: urlData.publicUrl,
        type: file.type,
        path,
      });
    }

    if (uploadedFiles.length > 0) {
      setFiles(prev => [...prev, ...uploadedFiles]);
      toast.success(`${uploadedFiles.length} file(s) uploaded`);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [user]);

  const handleDelete = useCallback(async (file: UploadedFile) => {
    const { error } = await supabase.storage.from('assignments').remove([file.path]);
    if (error) {
      toast.error('Failed to delete file');
      return;
    }
    setFiles(prev => prev.filter(f => f.path !== file.path));
    if (previewUrl === file.url) setPreviewUrl(null);
    toast.success('File deleted');
  }, [previewUrl]);

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="text-lg">📎</span>
          Assignment Materials
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="border-border text-foreground text-xs"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {files.length === 0 ? (
        <div
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            Drop images or PDFs here, or click to browse
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Max 10MB per file</p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map(file => (
            <div key={file.path} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 group">
              {file.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
              )}
              <span className="text-xs text-foreground truncate flex-1">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setPreviewUrl(previewUrl === file.url ? null : file.url)}
              >
                <Eye className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                onClick={() => handleDelete(file)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {previewUrl && (
        <div className="mt-3 relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80 z-10"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
          {previewUrl.endsWith('.pdf') ? (
            <iframe src={previewUrl} className="w-full h-64 rounded-md border border-border" />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full rounded-md border border-border max-h-64 object-contain" />
          )}
        </div>
      )}
    </div>
  );
}
