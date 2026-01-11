'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
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

  // Notify parent when files change
  useEffect(() => {
    onUpload(files);
  }, [files, onUpload]);

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
      {/* Dropzone - Enhanced Glass Effect */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer',
          'bg-gradient-to-b from-white/50 to-white/30',
          'backdrop-blur-xl',
          isDragActive
            ? 'border-blue-400 bg-blue-50/60 scale-[1.02] shadow-lg shadow-blue-500/10'
            : 'border-white/60 hover:border-white/80 hover:bg-white/50 hover:shadow-lg',
          (disabled || files.length >= maxFiles) && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          boxShadow: isDragActive
            ? '0 8px 32px rgba(0, 122, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
            : '0 4px 24px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
        }}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
            'bg-gradient-to-br from-blue-400/20 to-blue-600/20',
            'backdrop-blur-sm border border-blue-200/50',
            isDragActive && 'scale-110 from-blue-400/30 to-blue-600/30'
          )}>
            <Upload className={cn(
              'w-7 h-7 text-blue-500 transition-transform duration-300',
              isDragActive && 'scale-110'
            )} />
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

      {/* Preview grid - Enhanced with glassmorphism */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative group aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
              style={{
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
              }}
            >
              {file.preview ? (
                <Image
                  src={file.preview}
                  alt={file.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {/* Remove button - Glass effect */}
              <button
                onClick={() => removeFile(index)}
                className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-black/40 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/60 hover:scale-110"
              >
                <X className="w-4 h-4" />
              </button>

              {/* File info - Glass overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-white/70">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear button */}
      {files.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {files.length} {files.length === 1 ? 'zdjęcie' : 'zdjęć'} wybranych
          </p>
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={disabled}
          >
            Wyczyść
          </Button>
        </div>
      )}
    </div>
  );
}
