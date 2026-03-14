import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileText, Image, X, Eye, Trash2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { DocumentViewer } from '@/components/DocumentViewer';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  path: string;
}

export function DocumentUploader() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewerFile, setViewerFile] = useState<UploadedFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved documents on mount
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('user_documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) {
        setFiles(data.map((d: any) => ({
          id: d.id,
          name: d.file_name,
          url: d.file_url,
          type: d.file_type,
          path: d.file_path,
        })));
      }
    };
    load();
  }, [user]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    setUploading(true);

    for (const file of Array.from(e.target.files)) {
      const isValid = file.type.startsWith('image/') || file.type === 'application/pdf';
      if (!isValid) { toast.error(`${file.name}: Only images and PDFs supported`); continue; }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: Max 10MB`); continue; }

      const ext = file.name.split('.').pop();
      const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('assignments').upload(storagePath, file);
      if (uploadError) { toast.error(`Upload failed: ${file.name}`); continue; }

      const { data: urlData } = supabase.storage.from('assignments').getPublicUrl(storagePath);

      const { data: doc, error: dbError } = await supabase
        .from('user_documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: storagePath,
          file_type: file.type,
          file_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (dbError) { toast.error(`Failed to save ${file.name}`); continue; }

      setFiles(prev => [{
        id: doc.id,
        name: doc.file_name,
        url: doc.file_url,
        type: doc.file_type,
        path: doc.file_path,
      }, ...prev]);
    }

    toast.success('Upload complete');
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [user]);

  const handleDelete = useCallback(async (file: UploadedFile) => {
    await supabase.storage.from('assignments').remove([file.path]);
    await supabase.from('user_documents').delete().eq('id', file.id);
    setFiles(prev => prev.filter(f => f.id !== file.id));
    if (viewerFile?.id === file.id) setViewerFile(null);
    toast.success('File deleted');
  }, [viewerFile]);

  return (
    <>
      <div className="glass rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="text-lg">📎</span>
            My Documents
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
            <p className="text-xs text-muted-foreground">Drop images or PDFs here</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Max 10MB per file</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map(file => (
              <div key={file.id} className="flex items-center gap-2 p-2 rounded-md bg-secondary/50 group">
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
                  onClick={() => setViewerFile(file)}
                  title="Open fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
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
      </div>

      {viewerFile && (
        <DocumentViewer
          url={viewerFile.url}
          name={viewerFile.name}
          type={viewerFile.type}
          onClose={() => setViewerFile(null)}
        />
      )}
    </>
  );
}
