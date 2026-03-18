import React, { useState } from 'react';
import type { UploadedFile } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  uploadedFiles: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

/**
 *
 */
export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  uploadedFiles,
  onFilesChange,
}): JSX.Element => {
  const [message, setMessage] = useState('');

  /**
   *
   */
  const handleFileChange = (selectedFiles: FileList | null): void => {
    if (!selectedFiles) return;

    const newFiles: UploadedFile[] = [];
    const filePromises: Promise<void>[] = [];

    Array.from(selectedFiles).forEach(file => {
      if (
        file.type === 'text/plain' ||
        file.type === 'text/markdown' ||
        file.type === 'application/json'
      ) {
        const promise = new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          /**
           *
           */
          reader.onload = e => {
            newFiles.push({ name: file.name, content: e.target?.result as string });
            resolve();
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
        filePromises.push(promise);
      } else {
        alert(
          `File type not supported for: ${file.name}. Only .txt, .md, and .json are supported.`
        );
      }
    });

    Promise.all(filePromises).then(() => {
      onFilesChange([...uploadedFiles, ...newFiles]);
    });
  };

  /**
   *
   */
  const removeFile = (index: number): void => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  /**
   *
   */
  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (message.trim() || uploadedFiles.length > 0) {
      onSendMessage(message);
      setMessage('');
      // Clearing files after send is handled by the parent component
    }
  };

  return (
    <div className="p-2 border-t border-brand-border">
      {uploadedFiles.length > 0 && (
        <div className="px-2 pt-2 pb-1">
          <p className="text-xs text-brand-text-secondary mb-2">Attached files:</p>
          <ul className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <li
                key={index}
                className="text-xs text-brand-text-primary bg-brand-border/50 p-1.5 rounded-md flex items-center gap-2"
              >
                <span className="truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-600 flex-shrink-0 font-bold"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <label className="p-2 text-brand-text-secondary hover:text-brand-accent cursor-pointer rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
          <input
            type="file"
            className="hidden"
            multiple
            onChange={e => handleFileChange(e.target.files)}
            accept=".txt,.md,.json"
            data-testid="file-input"
          />
        </label>
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="w-full p-2 bg-brand-primary border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none text-brand-text-primary"
          placeholder="Type your message or add files..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-brand-accent text-white rounded-md hover:bg-brand-accent-hover disabled:opacity-50"
          disabled={isLoading || (!message.trim() && uploadedFiles.length === 0)}
        >
          Send
        </button>
      </form>
    </div>
  );
};
