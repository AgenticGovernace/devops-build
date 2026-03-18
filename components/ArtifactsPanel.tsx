import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import DOMPurify from 'dompurify';
import type { SQLDialect } from '../types';
import { Loader } from './Loader';
import { useAppStore, isOperationLoading, isAnyLoading } from '../store';
import {
  generateSql,
  generateUserStories,
  generateApiDocs,
  generateTestCases,
} from '../services/geminiService';
import { downloadFile, downloadAllAsCsv } from '../utils/download';

// Component for collapsible user stories
/**
 *
 */
const CollapsibleStory: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <details className="mb-2 bg-brand-primary/50 border border-brand-border rounded-md open:shadow-lg">
      <summary className="p-3 cursor-pointer font-semibold text-brand-text-primary hover:bg-brand-border/50 rounded-t-md list-none flex items-center gap-2">
        <svg
          className="w-4 h-4 transform transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 5l7 7-7 7"
          ></path>
        </svg>
        {title}
      </summary>
      <div
        className="p-4 border-t border-brand-border prose prose-invert prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </details>
  );
};

/**
 *
 */
const Placeholder: React.FC<{ text: string }> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center text-brand-text-secondary text-center p-4">
    <p>{text}</p>
  </div>
);

/**
 *
 */
export const ArtifactsPanel: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const {
    schema,
    loadingStates,
    generatedSql,
    generatedUserStories,
    generatedApiDocs,
    generatedTestCases,
    sqlDialect,
  } = state;
  const [activeArtifactTab, setActiveArtifactTab] = useState<'SQL' | 'STORIES' | 'API' | 'TESTS'>(
    'SQL'
  );

  // Granular loading states for each artifact type
  const isLoadingSql = isOperationLoading(loadingStates, 'sql');
  const isLoadingStories = isOperationLoading(loadingStates, 'stories');
  const isLoadingApiDocs = isOperationLoading(loadingStates, 'apiDocs');
  const isLoadingTestCases = isOperationLoading(loadingStates, 'testCases');
  const isAnyArtifactLoading =
    isLoadingSql || isLoadingStories || isLoadingApiDocs || isLoadingTestCases;

  const userStories =
    generatedUserStories
      ?.split('### ')
      .filter(s => s.trim() !== '')
      .map(story => {
        const [title, ...contentParts] = story.split('\n');
        const content = contentParts.join('\n');
        return { title, content };
      }) || [];

  /**
   *
   */
  const handleGenerateSql = async (): Promise<void> => {
    if (!schema) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sql', isLoading: true } });
    dispatch({ type: 'SET_GENERATED_SQL', payload: null });
    try {
      const sql = await generateSql(schema, sqlDialect);
      dispatch({ type: 'SET_GENERATED_SQL', payload: sql });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate SQL: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sql', isLoading: false } });
    }
  };

  /**
   *
   */
  const handleGenerateUserStories = async (): Promise<void> => {
    if (!schema) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'stories', isLoading: true } });
    dispatch({ type: 'SET_GENERATED_STORIES', payload: null });
    try {
      const stories = await generateUserStories(schema);
      dispatch({ type: 'SET_GENERATED_STORIES', payload: stories });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate user stories: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'stories', isLoading: false } });
    }
  };

  /**
   *
   */
  const handleGenerateApiDocs = async (): Promise<void> => {
    if (!schema) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'apiDocs', isLoading: true } });
    dispatch({ type: 'SET_GENERATED_DOCS', payload: null });
    try {
      const docs = await generateApiDocs(schema);
      dispatch({ type: 'SET_GENERATED_DOCS', payload: docs });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate API docs: ${error}` });
    } finally {
      dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'apiDocs', isLoading: false } });
    }
  };

  /**
   *
   */
  const handleGenerateTestCases = async (): Promise<void> => {
    if (!schema) return;
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'testCases', isLoading: true } });
    dispatch({ type: 'SET_GENERATED_TESTS', payload: null });
    try {
      const tests = await generateTestCases(schema);
      dispatch({ type: 'SET_GENERATED_TESTS', payload: tests });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate test cases: ${error}` });
    } finally {
      dispatch({
        type: 'SET_LOADING_STATE',
        payload: { operation: 'testCases', isLoading: false },
      });
    }
  };

  /**
   *
   */
  const handleExportAllAsCsv = async (): Promise<void> => {
    if (!state.generatedSampleData) return;
    await downloadAllAsCsv(state.generatedSampleData, 'sample-data.zip');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="col-span-2">
          <select
            value={sqlDialect}
            onChange={e =>
              dispatch({ type: 'SET_SQL_DIALECT', payload: e.target.value as SQLDialect })
            }
            className="w-full bg-brand-primary border border-brand-border rounded-md px-2 py-2 text-sm"
          >
            <option>PostgreSQL</option>
            <option>MySQL</option>
          </select>
        </div>
        <button
          onClick={handleGenerateSql}
          disabled={isLoadingSql}
          className="px-4 py-2 bg-green-600/20 border border-green-500 text-green-300 font-semibold rounded-md hover:bg-green-600/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingSql ? '...' : 'Generate SQL'}
        </button>
        <button
          onClick={handleGenerateUserStories}
          disabled={isLoadingStories}
          className="px-4 py-2 bg-sky-600/20 border border-sky-500 text-sky-300 font-semibold rounded-md hover:bg-sky-600/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingStories ? '...' : 'Generate Stories'}
        </button>
        <button
          onClick={handleGenerateApiDocs}
          disabled={isLoadingApiDocs}
          className="px-4 py-2 bg-purple-600/20 border border-purple-500 text-purple-300 font-semibold rounded-md hover:bg-purple-600/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingApiDocs ? '...' : 'Generate API Docs'}
        </button>
        <button
          onClick={handleGenerateTestCases}
          disabled={isLoadingTestCases}
          className="px-4 py-2 bg-orange-600/20 border border-orange-500 text-orange-300 font-semibold rounded-md hover:bg-orange-600/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingTestCases ? '...' : 'Generate Tests'}
        </button>
        <div className="col-span-2">
          <button
            onClick={handleExportAllAsCsv}
            disabled={!state.generatedSampleData}
            className="w-full px-4 py-2 bg-blue-600/20 border border-blue-500 text-blue-300 font-semibold rounded-md hover:bg-blue-600/40 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export All as CSV
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-brand-primary border border-brand-border rounded-md p-1">
        {isAnyArtifactLoading &&
        !generatedSql &&
        !generatedUserStories &&
        !generatedApiDocs &&
        !generatedTestCases ? (
          <Loader text="Generating artifact..." />
        ) : !generatedSql && !generatedUserStories && !generatedApiDocs && !generatedTestCases ? (
          <Placeholder text="Generated artifacts will appear here." />
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex border-b border-brand-border overflow-x-auto">
              <button
                onClick={() => setActiveArtifactTab('SQL')}
                disabled={!generatedSql}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeArtifactTab === 'SQL' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'} disabled:text-brand-border`}
              >
                SQL
              </button>
              <button
                onClick={() => setActiveArtifactTab('STORIES')}
                disabled={!generatedUserStories}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeArtifactTab === 'STORIES' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'} disabled:text-brand-border`}
              >
                User Stories
              </button>
              <button
                onClick={() => setActiveArtifactTab('API')}
                disabled={!generatedApiDocs}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeArtifactTab === 'API' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'} disabled:text-brand-border`}
              >
                API Docs
              </button>
              <button
                onClick={() => setActiveArtifactTab('TESTS')}
                disabled={!generatedTestCases}
                className={`px-4 py-2 text-sm font-semibold whitespace-nowrap ${activeArtifactTab === 'TESTS' ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-brand-text-secondary'} disabled:text-brand-border`}
              >
                Test Cases
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto relative p-2">
              {activeArtifactTab === 'SQL' && generatedSql && (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedSql || '')}
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadFile(generatedSql || '', 'schema.sql', 'application/sql')
                      }
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Export
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="sql"
                    style={vscDarkPlus}
                    customStyle={{ background: 'transparent', margin: 0, padding: '1rem 0' }}
                  >
                    {generatedSql}
                  </SyntaxHighlighter>
                </>
              )}
              {activeArtifactTab === 'STORIES' && generatedUserStories && (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedUserStories || '')}
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadFile(generatedUserStories || '', 'stories.md', 'text/markdown')
                      }
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Export
                    </button>
                  </div>
                  <div className="p-2">
                    {userStories.map((story, i) => (
                      <CollapsibleStory key={i} title={story.title} content={story.content} />
                    ))}
                  </div>
                </>
              )}
              {activeArtifactTab === 'API' && generatedApiDocs && (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedApiDocs || '')}
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadFile(generatedApiDocs || '', 'api-docs.md', 'text/markdown')
                      }
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Export
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="markdown"
                    style={vscDarkPlus}
                    customStyle={{ background: 'transparent', margin: 0, padding: '1rem 0' }}
                  >
                    {generatedApiDocs}
                  </SyntaxHighlighter>
                </>
              )}
              {activeArtifactTab === 'TESTS' && generatedTestCases && (
                <>
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedTestCases || '')}
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() =>
                        downloadFile(generatedTestCases || '', 'tests.feature', 'text/plain')
                      }
                      className="px-2 py-1 bg-brand-border text-xs rounded"
                    >
                      Export
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="gherkin"
                    style={vscDarkPlus}
                    customStyle={{ background: 'transparent', margin: 0, padding: '1rem 0' }}
                  >
                    {generatedTestCases}
                  </SyntaxHighlighter>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
