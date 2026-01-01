/**
 * @fileoverview Main application component with three layout modes and workflow orchestration.
 *
 * Implements the core application UI with:
 * - Three layout themes: Tabs (horizontal navigation), Wizard (step-by-step), Grid (dashboard)
 * - Workflow stages: Schema generation → Refinement → Data generation → Artifact export
 * - State-driven tab enabling based on workflow progression
 * - Sample data generation with customizable row counts and criteria
 *
 * @module App
 * @category Components
 */

import React, { Suspense, useEffect } from 'react';
import { Header } from './components/Header';
import { StepIndicator } from './components/StepIndicator';
import { generateSampleData, generateChartSuggestions } from './services/geminiService';
import { Loader } from './components/Loader';
import { AppProvider, useAppStore, isOperationLoading, isAnyLoading } from './store';
import type { AppTab } from './types';
import { ToastContainer } from './components/ToastContainer';

const PromptWorkspace = React.lazy(() =>
  import('./components/PromptWorkspace').then(module => ({ default: module.PromptWorkspace }))
);
const SchemaVisualizer = React.lazy(() =>
  import('./components/SchemaVisualizer').then(module => ({ default: module.SchemaVisualizer }))
);
const DataVisualizer = React.lazy(() =>
  import('./components/DataVisualizer').then(module => ({ default: module.DataVisualizer }))
);
const ArtifactsPanel = React.lazy(() =>
  import('./components/ArtifactsPanel').then(module => ({ default: module.ArtifactsPanel }))
);

/**
 *
 */
const TabButton: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  isDisabled: boolean;
  isCompleted: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, isDisabled, isCompleted, onClick }): JSX.Element => {
  const baseClasses =
    'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent';
  const disabledClasses = 'text-brand-text-secondary/50 cursor-not-allowed';
  const activeClasses = 'bg-brand-secondary text-brand-accent border-b-2 border-brand-accent';
  const inactiveClasses =
    'text-brand-text-secondary hover:bg-brand-secondary/50 hover:text-brand-text-primary';

  const stateClasses = isDisabled ? disabledClasses : isActive ? activeClasses : inactiveClasses;

  return (
    <button
      role="tab"
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${stateClasses}`}
    >
      {isCompleted && !isActive ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-brand-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
};

/**
 *
 */
const Panel: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({
  title,
  children,
  className = '',
}): JSX.Element => (
  <div
    className={`bg-brand-secondary border border-brand-border rounded-lg shadow-lg flex flex-col h-full min-h-[300px] ${className}`}
  >
    <h2 className="text-base font-bold p-3 border-b border-brand-border flex-shrink-0 text-brand-text-primary">
      {title}
    </h2>
    <div className="p-4 flex-1 overflow-y-auto min-h-0">{children}</div>
  </div>
);

/**
 *
 */
const Placeholder: React.FC<{ text: string }> = ({ text }): JSX.Element => (
  <div className="w-full h-full flex items-center justify-center text-brand-text-secondary text-center p-4">
    <p className="text-sm">{text}</p>
  </div>
);

/**
 *
 */
const AppContent: React.FC = (): JSX.Element => {
  const { state, dispatch } = useAppStore();
  const {
    schema,
    loadingStates,
    error,
    generatedSampleData,
    sampleDataPrompt,
    sampleDataRowCount,
    activeTab,
    layoutTheme,
    theme,
  } = state;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Loading states for different operations
  const isLoadingSchema = isOperationLoading(loadingStates, 'schema');
  const isLoadingSampleData = isOperationLoading(loadingStates, 'sampleData');
  const isAnythingLoading = isAnyLoading(loadingStates);

  /**
   *
   */
  const setActiveTab = (tab: AppTab): void => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });

  /**
   *
   */
  const handleGenerateSampleData = async (): Promise<void> => {
    if (!schema) return;
    const fullPrompt = `Generate about ${sampleDataRowCount} rows. ${sampleDataPrompt}`;
    dispatch({ type: 'SET_LOADING_STATE', payload: { operation: 'sampleData', isLoading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: null });

    try {
      const data = await generateSampleData(schema, fullPrompt);
      const suggestions = await generateChartSuggestions(schema, data);
      dispatch({ type: 'SET_GENERATED_SAMPLE_DATA', payload: data });
      dispatch({ type: 'SET_CHART_SUGGESTIONS', payload: suggestions });
      dispatch({ type: 'SET_ACTIVE_TAB', payload: 'Data' });
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate sample data: ${error}` });
    } finally {
      dispatch({
        type: 'SET_LOADING_STATE',
        payload: { operation: 'sampleData', isLoading: false },
      });
    }
  };

  /**
   *
   */
  const handleRowCountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (value === '') {
      dispatch({ type: 'SET_SAMPLE_DATA_ROW_COUNT', payload: '' });
      return;
    }
    let numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    numValue = Math.max(1, Math.min(1000, numValue));
    dispatch({ type: 'SET_SAMPLE_DATA_ROW_COUNT', payload: String(numValue) });
  };

  const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'Schema',
      label: 'Schema',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: 'Refine',
      label: 'Refine',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z"
          />
        </svg>
      ),
    },
    {
      id: 'Data',
      label: 'Data',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
      ),
    },
    {
      id: 'Export',
      label: 'Export',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
  ];

  /**
   *
   */
  const renderContentForTab = (tab: AppTab): React.ReactNode => {
    switch (tab) {
      case 'Schema':
        return <PromptWorkspace />;
      case 'Refine':
        return schema ? <SchemaVisualizer /> : null;
      case 'Data':
        if (!generatedSampleData) {
          return (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-brand-text-primary mb-4">
                Generate Sample Data
              </h2>
              <p className="text-brand-text-secondary mb-6 text-base">
                Describe criteria for sample data generation. This will be used to create realistic
                entries for your tables and power the data visualizer.
              </p>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <label
                    className="text-sm font-semibold text-brand-text-secondary mb-2 block"
                    htmlFor="data-prompt"
                  >
                    Prompt
                  </label>
                  <textarea
                    id="data-prompt"
                    value={sampleDataPrompt}
                    onChange={e =>
                      dispatch({ type: 'SET_SAMPLE_DATA_PROMPT', payload: e.target.value })
                    }
                    className="w-full h-28 p-3 bg-brand-primary border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 text-brand-text-primary placeholder-brand-text-secondary"
                    placeholder="e.g., users with realistic names..."
                    disabled={isLoadingSampleData}
                  />
                </div>
                <div className="w-full md:w-auto">
                  <label
                    className="text-sm font-semibold text-brand-text-secondary mb-2 block"
                    htmlFor="row-count"
                  >
                    Rows (approx.)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="row-count"
                      type="number"
                      value={sampleDataRowCount}
                      onChange={handleRowCountChange}
                      min="1"
                      max="1000"
                      className="w-24 p-2 bg-brand-primary border border-brand-border rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 text-brand-text-primary placeholder-brand-text-secondary"
                      disabled={isLoadingSampleData}
                    />
                    {['10', '50', '100'].map(val => (
                      <button
                        key={val}
                        onClick={() =>
                          dispatch({ type: 'SET_SAMPLE_DATA_ROW_COUNT', payload: val })
                        }
                        disabled={isLoadingSampleData}
                        className={`px-3 py-2 text-sm rounded-md transition-colors ${sampleDataRowCount === val ? 'bg-brand-accent text-white' : 'bg-brand-secondary border border-brand-border text-brand-text-secondary hover:bg-brand-border'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGenerateSampleData}
                  disabled={isLoadingSampleData || !sampleDataPrompt.trim()}
                  className="px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-md hover:bg-brand-accent-hover disabled:bg-brand-border disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isLoadingSampleData ? (
                    <Loader text="Generating..." />
                  ) : (
                    <>
                      Generate Data{' '}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        }
        return <DataVisualizer />;
      case 'Export':
        return <ArtifactsPanel />;
      default:
        return null;
    }
  };

  /**
   *
   */
  const renderTabsLayout = (): JSX.Element => (
    <div className="flex-grow flex flex-col container mx-auto p-4 md:px-8">
      <div className="flex-shrink-0 border-b border-brand-border mb-6">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
          {TABS.map(tab => (
            <TabButton
              key={tab.id}
              label={tab.label}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              isDisabled={!schema && tab.id !== 'Schema'}
              isCompleted={
                (tab.id === 'Schema' && !!schema) ||
                (tab.id === 'Refine' && !!schema) ||
                (tab.id === 'Data' && !!generatedSampleData)
              }
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>
      </div>

      <div className="flex-1 min-h-0 bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 overflow-y-auto">
        <Suspense fallback={<Loader text="Loading..." />}>
          {isLoadingSchema && !schema && activeTab === 'Schema' ? (
            <div className="flex justify-center items-center h-full">
              <Loader text="Generating Initial Schema..." />
            </div>
          ) : (
            renderContentForTab(activeTab)
          )}
        </Suspense>
      </div>
    </div>
  );

  /**
   *
   */
  const renderWizardLayout = (): JSX.Element => {
    const stepMap: Record<AppTab, number> = { Schema: 1, Refine: 2, Data: 3, Export: 4 };
    const currentStep = stepMap[activeTab];

    const wizardNav = (
      <div className="flex justify-between mt-6">
        <button
          onClick={(): void => {
            if (activeTab === 'Refine') setActiveTab('Schema');
            if (activeTab === 'Data') setActiveTab('Refine');
            if (activeTab === 'Export') setActiveTab('Data');
          }}
          disabled={activeTab === 'Schema'}
          className="px-6 py-2.5 bg-brand-border text-brand-text-secondary font-semibold rounded-md hover:bg-brand-secondary-hover disabled:bg-brand-border disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Back
        </button>

        {activeTab !== 'Schema' &&
          activeTab !== 'Export' &&
          (activeTab !== 'Data' || !!generatedSampleData) && (
            <button
              onClick={(): void => {
                if (activeTab === 'Refine') setActiveTab('Data');
                if (activeTab === 'Data') setActiveTab('Export');
              }}
              disabled={!schema || (activeTab === 'Data' && !generatedSampleData)}
              className="px-6 py-2.5 bg-brand-accent text-white font-semibold rounded-md hover:bg-brand-accent-hover disabled:bg-brand-border disabled:cursor-not-allowed transition-all duration-200"
            >
              Next
            </button>
          )}
      </div>
    );

    return (
      <div className="flex-grow flex flex-col container mx-auto p-4 md:px-8">
        <div className="mb-6">
          <StepIndicator currentStep={currentStep} />
        </div>
        <div className="flex-1 min-h-0 bg-brand-secondary border border-brand-border rounded-lg shadow-lg p-6 overflow-y-auto">
          <Suspense fallback={<Loader text="Loading..." />}>
            {renderContentForTab(activeTab)}
          </Suspense>
        </div>
        {wizardNav}
      </div>
    );
  };

  /**
   *
   */
  const renderGridLayout = (): JSX.Element => {
    const dataGenerationArea = schema ? (
      renderContentForTab('Data')
    ) : (
      <Placeholder text="Generate a schema to create sample data." />
    );

    return (
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 min-h-0">
        <Panel title="1. Describe Schema">
          <Suspense fallback={<Loader text="Loading..." />}>
            {renderContentForTab('Schema')}
          </Suspense>
        </Panel>
        <Panel title="2. Visualize & Refine Schema">
          <Suspense fallback={<Loader text="Loading..." />}>
            {schema ? (
              <SchemaVisualizer />
            ) : (
              <Placeholder text="Your generated schema will appear here." />
            )}
          </Suspense>
        </Panel>
        <Panel title="3. Generate & Visualize Data">
          <Suspense fallback={<Loader text="Loading..." />}>{dataGenerationArea}</Suspense>
        </Panel>
        <Panel title="4. Export Artifacts">
          <Suspense fallback={<Loader text="Loading..." />}>
            {schema ? (
              renderContentForTab('Export')
            ) : (
              <Placeholder text="Generate a schema to export artifacts." />
            )}
          </Suspense>
        </Panel>
      </div>
    );
  };

  /**
   *
   */
  const renderActiveLayout = (): JSX.Element => {
    switch (layoutTheme) {
      case 'Grid':
        return renderGridLayout();
      case 'Wizard':
        return renderWizardLayout();
      case 'Tabs':
      default:
        return renderTabsLayout();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-primary">
      <Header />
      <main className="flex-grow flex flex-col">{renderActiveLayout()}</main>
      <ToastContainer />
    </div>
  );
};

/**
 *
 */
const App: React.FC = (): JSX.Element => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
