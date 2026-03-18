import React, { useRef, useEffect } from 'react';
import type { UploadedFile } from '../types';
import { useAppStore, isOperationLoading } from '../store';
import { generateSchema } from '../services/geminiService';
import { ChatInput } from './ChatInput';

/**
 *
 */
export const PromptWorkspace: React.FC = (): JSX.Element => {
  const { state, dispatch } = useAppStore();
  const { chatHistory, uploadedFiles, loadingStates, error } = state;
  const isLoading = isOperationLoading(loadingStates, 'schema');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  /**
   *
   */
  const handleSendMessage = (message: string): void => {
    if (message.trim()) {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'user', text: message } });
    }
  };

  /**
   *
   */
  const handleFilesChange = (files: UploadedFile[]): void => {
    dispatch({ type: 'SET_UPLOADED_FILES', payload: files });
  };

  /**
   *
   */
  const handleSubmit = async (): Promise<void> => {
    if (isLoading) return;

    if (chatHistory.filter(m => m.role === 'user').length === 0 && uploadedFiles.length === 0) {
      alert('Please enter a prompt or upload a file before generating the schema.');
      return;
    }

    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'schema', isLoading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    // Reset other state when generating new schema
    dispatch({ type: 'SET_SCHEMA', payload: null });
    dispatch({ type: 'SET_GENERATED_SQL', payload: null });
    dispatch({ type: 'SET_GENERATED_STORIES', payload: null });
    dispatch({ type: 'SET_GENERATED_DOCS', payload: null });
    dispatch({ type: 'SET_GENERATED_TESTS', payload: null });
    dispatch({ type: 'SET_GENERATED_SAMPLE_DATA', payload: null });
    dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: null });

    try {
      const newSchema = await generateSchema(chatHistory, uploadedFiles);
      dispatch({ type: 'SET_SCHEMA', payload: newSchema });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'Refine' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate schema: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'schema', isLoading: false } });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-1">Describe Your Schema</h2>
        <p className="text-brand-text-secondary mb-6">
          Describe the schema you need in conversation, or upload files for context. When you're
          ready, click Generate.
        </p>
      </div>

      <div className="flex-1 flex flex-col border border-brand-border rounded-md bg-brand-primary min-h-0">
        {/* Top Bar: Conversation Controls */}
        <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-brand-border">
          <h4 className="font-semibold text-sm text-brand-text-primary pl-2">Conversation</h4>
          <div>
            <button
              onClick={() => dispatch({ type: 'SET_UPLOADED_FILES', payload: [] })}
              className="px-2 py-1 text-xs text-brand-text-secondary hover:text-brand-accent rounded-md"
              aria-label="Clear uploaded files"
              disabled={uploadedFiles.length === 0}
            >
              Clear Files
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_CHAT_HISTORY', payload: [] })}
              className="px-2 py-1 text-xs text-brand-text-secondary hover:text-brand-accent rounded-md"
              aria-label="Clear chat history"
              disabled={chatHistory.length === 0}
            >
              Clear Chat
            </button>
          </div>
        </div>

        {/* Middle: Chat History */}
        <div className="flex-grow p-4 overflow-y-auto bg-brand-primary/50">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <span
                className={`inline-block px-4 py-2 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-border text-brand-text-primary'}`}
              >
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom: Input and Actions */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            uploadedFiles={uploadedFiles}
            onFilesChange={handleFilesChange}
          />
          <div className="p-4 border-t border-brand-border">
            {error && <p className="text-brand-danger mb-2 text-sm text-center">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full px-6 py-3 bg-brand-accent text-white font-semibold rounded-md hover:bg-brand-accent-hover disabled:bg-brand-border disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Generate Schema</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
