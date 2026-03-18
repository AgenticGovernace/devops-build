import React, { useState, useRef, useEffect } from 'react';
import type { LayoutTheme, ProjectFile } from '../types';
import { useAppStore } from '../store';
import { downloadFile } from '../utils/download';

const PROJECT_FILE_VERSION = 1;

const themeOptions: { id: LayoutTheme; name: string; icon: React.ReactNode }[] = [
  {
    id: 'Tabs',
    name: 'Tab View',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm0 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"
        />
      </svg>
    ),
  },
  {
    id: 'Wizard',
    name: 'Wizard View',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    ),
  },
  {
    id: 'Grid',
    name: 'Grid View',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z"
        />
      </svg>
    ),
  },
];

/**
 *
 */
export const Header: React.FC = (): JSX.Element => {
  const { state, dispatch } = useAppStore();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isThemeOpen) {
      menuItemsRef.current[0]?.focus();
    }
  }, [isThemeOpen]);

  /**
   *
   */
  const handleReset = (): void => {
    if (window.confirm('Are you sure you want to start over? All your work will be lost.')) {
      dispatch({ type: 'RESET_APP' });
    }
  };

  /**
   *
   */
  const handleThemeChange = (theme: LayoutTheme): void => {
    dispatch({ type: 'SET_LAYOUT_THEME', payload: theme });
    setIsThemeOpen(false);
    menuButtonRef.current?.focus();
  };

  /**
   *
   */
  const handleThemeToggle = (): void => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: newTheme });
  };

  /**
   *
   */
  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      setIsThemeOpen(false);
      menuButtonRef.current?.focus();
      return;
    }

    const focusableElements = menuItemsRef.current.filter(el => el) as HTMLButtonElement[];
    const focusedIndex = focusableElements.findIndex(el => el === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (focusedIndex + 1) % focusableElements.length;
      focusableElements[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex = (focusedIndex - 1 + focusableElements.length) % focusableElements.length;
      focusableElements[nextIndex]?.focus();
    }
  };

  /**
   *
   */
  const handleSaveProject = (): void => {
    const projectData: ProjectFile = {
      version: PROJECT_FILE_VERSION,
      chatHistory: state.chatHistory,
      uploadedFiles: state.uploadedFiles,
      schema: state.schema,
      sampleDataPrompt: state.sampleDataPrompt,
      sampleDataRowCount: state.sampleDataRowCount,
      generatedSampleData: state.generatedSampleData,
      visualizationChatHistory: state.visualizationChatHistory,
      sqlDialect: state.sqlDialect,
    };
    downloadFile(
      JSON.stringify(projectData, null, 2),
      'semantic-loop-project.json',
      'application/json'
    );
    dispatch({
      type: 'ADD_TOAST',
      payload: { message: 'Project saved successfully!', type: 'success' },
    });
  };

  /**
   *
   */
  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    /**
     *
     */
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const projectData = JSON.parse(text) as ProjectFile;

        if (projectData.version !== PROJECT_FILE_VERSION) {
          dispatch({
            type: 'ADD_TOAST',
            payload: {
              message: 'This project file is from a different version and cannot be loaded.',
              type: 'error',
            },
          });
          return;
        }

        if (!projectData.chatHistory || !projectData.schema) {
          dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Invalid project file format.', type: 'error' },
          });
          return;
        }

        if (
          window.confirm('Loading this project will overwrite your current work. Are you sure?')
        ) {
          dispatch({ type: 'LOAD_PROJECT', payload: projectData });
          dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Project loaded successfully!', type: 'success' },
          });
        }
      } catch (error) {
        dispatch({
          type: 'ADD_TOAST',
          payload: { message: 'Failed to read or parse the project file.', type: 'error' },
        });
        console.error('Error loading project file:', error);
      }
    };
    reader.readAsText(file);
    // Reset file input so the same file can be loaded again
    event.target.value = '';
  };

  return (
    <header className="bg-brand-secondary border-b border-brand-border p-4 shadow-md flex-shrink-0">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-brand-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 12"
            />
          </svg>
          <h1 className="text-xl md:text-2xl font-bold text-brand-text-primary tracking-tight">
            Semantic Loop DevOps Demonstrator
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveProject}
            className="px-3 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Save</span>
          </button>
          <label className="px-3 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2 cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            <span>Load</span>
            <input type="file" className="hidden" accept=".json" onChange={handleLoadProject} />
          </label>

          <div className="w-px h-6 bg-brand-border/50 mx-2"></div>

          <button
            onClick={handleThemeToggle}
            className="px-3 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2"
          >
            {state.theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
            <span>{state.theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <div className="relative">
            <button
              ref={menuButtonRef}
              id="theme-menu-button"
              aria-haspopup="true"
              aria-expanded={isThemeOpen}
              aria-controls="theme-menu"
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              className="px-3 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-secondary-hover hover:text-white transition duration-200 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>View</span>
            </button>
            {isThemeOpen && (
              <div
                id="theme-menu"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="theme-menu-button"
                className="absolute right-0 mt-2 w-48 bg-brand-secondary border border-brand-border rounded-md shadow-lg z-20"
                onKeyDown={handleMenuKeyDown}
              >
                {themeOptions.map((option, index) => (
                  <button
                    key={option.id}
                    ref={el => (menuItemsRef.current[index] = el)}
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => handleThemeChange(option.id)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2 text-sm ${state.layoutTheme === option.id ? 'bg-brand-accent text-white' : 'text-brand-text-primary hover:bg-brand-border'}`}
                  >
                    {option.icon}
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-2 bg-brand-border text-brand-text-secondary text-sm font-semibold rounded-md hover:bg-brand-danger hover:text-white transition duration-200 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 9a9 9 0 0 1 9-5.917V1a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v2.083A9.002 9.002 0 0 0 4 9zM20 15a9 9 0 0 1-9 5.917V23a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-2.083A9.002 9.002 0 0 0 20 15z"
              />
            </svg>
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
