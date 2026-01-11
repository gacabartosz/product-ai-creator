'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from './ui/Button';

interface ImageFile extends File {
  preview?: string;
}

interface ImageUploaderProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUploader({
  onUpload,
  maxFiles = 10,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map(file =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setFiles(prev => {
        const combined = [...prev, ...newFiles].slice(0, maxFiles);
        return combined;
      });
    },
    [maxFiles]
  );

  const removeFile = (index: number) => {
    setFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer',
          'bg-white/30 backdrop-blur-sm',
          isDragActive
            ? 'border-blue-400 bg-blue-50/50'
            : 'border-gray-200 hover:border-gray-300 hover:bg-white/50',
          (disabled || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
            <Upload className="w-6 h-6 text-blue-500" />
          </div>

          {isDragActive ? (
            <p className="text-blue-600 font-medium">Upusc zdjecia tutaj...</p>
          ) : (
            <>
              <p className="text-gray-700 font-medium">
                Przeciagnij zdjecia lub kliknij aby wybrac
              </p>
              <p className="text-sm text-gray-500">
                JPEG, PNG, GIF lub WebP (max {maxFiles} zdjec)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100"
            >
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>

              {/* File info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="truncate">{file.name}</p>
                <p>{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {files.length} {files.length === 1 ? 'zdjecie' : 'zdjec'} gotowych do przeslania
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={disabled}
            >
              Wyczysc
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={disabled}
            >
              Przeslij zdjecia
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
