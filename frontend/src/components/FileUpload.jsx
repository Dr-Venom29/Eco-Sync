// File Upload Component with Supabase Storage Integration
import { useState } from 'react'
import { Upload, X, Image as ImageIcon, Video, File } from 'lucide-react'
import { Button } from './ui/button'
import { supabase, storageHelpers } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function FileUpload({ onUploadComplete, maxFiles = 3, accept = 'image/*,video/*' }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [previews, setPreviews] = useState([])
  const { toast } = useToast()

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFiles} files allowed`,
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 10MB)
    const invalidFiles = selectedFiles.filter(file => file.size > 10 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Each file must be under 10MB',
        variant: 'destructive',
      })
      return
    }

    setFiles([...files, ...selectedFiles])
    
    // Generate previews
    selectedFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews(prev => [...prev, { type: 'image', url: e.target.result, name: file.name }])
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('video/')) {
        setPreviews(prev => [...prev, { type: 'video', url: URL.createObjectURL(file), name: file.name }])
      }
    })
  }

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) {
      onUploadComplete([])
      return []
    }

    setUploading(true)
    const uploadedUrls = []

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
        const filePath = `complaint-media/${fileName}`

        const { data, error } = await storageHelpers.uploadFile('complaint-media', filePath, file)

        if (error) throw error

        const publicUrl = storageHelpers.getPublicUrl('complaint-media', filePath)
        uploadedUrls.push(publicUrl)
      }

      toast({
        title: 'Files uploaded successfully',
        description: `${uploadedUrls.length} file(s) uploaded`,
      })

      onUploadComplete(uploadedUrls)
      return uploadedUrls
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      })
      return []
    } finally {
      setUploading(false)
    }
  }

  const getFileIcon = (type) => {
    if (type === 'image') return <ImageIcon className="w-6 h-6" />
    if (type === 'video') return <Video className="w-6 h-6" />
    return <File className="w-6 h-6" />
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer block"
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-400 mt-1">
            PNG, JPG, MP4 up to 10MB ({maxFiles - files.length} remaining)
          </p>
        </label>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {preview.type === 'image' ? (
                  <img src={preview.url} alt={preview.name} className="w-full h-full object-cover" />
                ) : preview.type === 'video' ? (
                  <video src={preview.url} className="w-full h-full object-cover" controls />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {getFileIcon(preview.type)}
                  </div>
                )}
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs text-gray-600 mt-1 truncate">{preview.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hidden Upload Trigger (called by parent) */}
      <div className="hidden">
        <Button onClick={uploadFiles} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}

// Export upload function to be called by parent
export { }
