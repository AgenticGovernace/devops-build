import React, { useState, useEffect, useRef } from 'react';
import vegaEmbed from 'vega-embed';
import type { ChatMessage } from '../types';
import { Loader } from './Loader';
import { useAppStore, isOperationLoading } from '../store';
import { generateVisualization, generateChartSuggestions } from '../services/geminiService';
import { downloadFile, jsonToCsv } from '../utils/download';

/**
 *
 */
export const DataVisualizer: React.FC = (): JSX.Element | null => {
  const { state, dispatch } = useAppStore();
  const {
    generatedSampleData: sampleData,
    visualizationSpec,
    visualizationSources,
    chartSuggestions,
    visualizationChatHistory,
    loadingStates,
    error,
    schema,
  } = state;
  const isLoading = isOperationLoading(loadingStates, 'visualization');
  const [message, setMessage] = useState('');
  const chartContainer = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visualizationSpec && chartContainer.current) {
      chartContainer.current.innerHTML = '';
      vegaEmbed(chartContainer.current, visualizationSpec as any, {
        actions: true,
        theme: 'dark',
      }).catch(console.error);
    }
  }, [visualizationSpec]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visualizationChatHistory]);

  /**
   *
   */
  const handleGenerateVisualization = async (history: ChatMessage[]): Promise<void> => {
    if (!schema || !sampleData) return;
    dispatch({
      type: 'SET_LOADING_STATE',
      payload: { operation: 'visualization', isLoading: true },
    });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: null });

    try {
      const { spec, sources } = await generateVisualization(schema, sampleData, history);
      const suggestions = await generateChartSuggestions(schema, sampleData, spec);
      dispatch({ type: 'SET_VISUALIZATION_SPEC', payload: spec });
      dispatch({ type: 'SET_VISUALIZATION_SOURCES', payload: sources ?? null });
      dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: suggestions });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate visualization: ${error}` });
    } finally {
      dispatch({
        type: 'SET_LOADING_STATE',
        payload: { operation: 'visualization', isLoading: false },
      });
    }
  };

  /**
   *
   */
  const handleSubmitPrompt = (promptText: string): void => {
    if (!promptText.trim() || isLoading) return;
    const newHistory = [...visualizationChatHistory, { role: 'user' as const, text: promptText }];
    dispatch({ type: 'SET_VISUALIZATION_CHAT_HISTORY', payload: newHistory });
    handleGenerateVisualization(newHistory);
    setMessage('');
  };

  /**
   *
   */
  const handleFormSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    handleSubmitPrompt(message);
  };

  if (!sampleData) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left: Chat & Data */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-grow flex flex-col border border-brand-border rounded-md">
          <div className="flex-shrink-0 flex justify-between items-center p-2 border-b border-brand-border">
            <h4 className="font-semibold text-sm text-brand-text-primary pl-2">
              Chart Conversation
            </h4>
            <button
              onClick={() => dispatch({ type: 'SET_VISUALIZATION_CHAT_HISTORY', payload: [] })}
              className="px-2 py-1 text-xs text-brand-text-secondary hover:text-brand-accent rounded-md"
              aria-label="Clear chart conversation history"
            >
              Clear
            </button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto bg-brand-primary/50">
            {visualizationChatHistory.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-brand-accent text-white' : 'bg-brand-border text-brand-text-primary'}`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && visualizationSpec === null && <Loader text="Generating Chart..." />}
            <div ref={chatEndRef} />
          </div>
          <div className="p-2 border-t border-brand-border flex-shrink-0">
            {chartSuggestions && chartSuggestions.length > 0 && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-brand-text-secondary mr-2">Suggestions:</span>
                {chartSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSubmitPrompt(suggestion)}
                    disabled={isLoading}
                    className="px-3 py-1 bg-brand-border text-xs text-left font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={suggestion}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleFormSubmit} className="flex items-center">
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full p-2 bg-brand-primary border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none text-brand-text-primary"
                placeholder="Describe the chart you want..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="ml-2 px-4 py-2 bg-brand-accent text-white rounded-md hover:bg-brand-accent-hover disabled:opacity-50"
                disabled={!message.trim() || isLoading}
              >
                {isLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>
        {error && <p className="text-brand-danger mt-2 text-sm flex-shrink-0">{error}</p>}
      </div>

      {/* Right: Visualization */}
      <div className="lg:w-1/2 flex-shrink-0 flex flex-col gap-2">
        <div className="flex-1 bg-brand-primary p-4 rounded-md border border-brand-border flex items-center justify-center min-h-0">
          {isLoading && !visualizationSpec && <Loader text="Generating Chart..." />}
          {!isLoading && !visualizationSpec && (
            <p className="text-brand-text-secondary text-center">
              Your generated chart will appear here.
            </p>
          )}
          <div ref={chartContainer} className="w-full h-full"></div>
        </div>
        {visualizationSources && visualizationSources.length > 0 && (
          <div className="flex-shrink-0 p-2 bg-brand-primary border border-brand-border rounded-md">
            <h4 className="text-xs font-bold text-brand-text-secondary uppercase tracking-wider mb-2">
              Sources
            </h4>
            <ul className="space-y-1 max-h-24 overflow-y-auto">
              {visualizationSources.map((source, index) => (
                <li key={index} className="text-xs">
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:underline truncate block"
                    title={source.title}
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex-shrink-0 flex items-center justify-end gap-2">
          <button
            onClick={() =>
              downloadFile(
                JSON.stringify(visualizationSpec, null, 2),
                'visualization.vl.json',
                'application/json'
              )
            }
            disabled={!visualizationSpec}
            className="px-3 py-1 bg-brand-border text-xs font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200 disabled:opacity-50"
          >
            Export Vega-Lite JSON
          </button>
          <button
            onClick={() => downloadFile(jsonToCsv(sampleData), 'sample-data.csv', 'text/csv')}
            disabled={!sampleData}
            className="px-3 py-1 bg-brand-border text-xs font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200 disabled:opacity-50"
          >
            Export Data as CSV
          </button>
        </div>
      </div>
    </div>
  );
};
