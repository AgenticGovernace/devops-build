import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../App';
import * as aiService from '../services/aiService';

// Mock the provider-neutral AI service
vi.mock('../services/aiService');
const mockedAIService = vi.mocked(aiService);

const mockSchema = {
  description: 'A test schema',
  tables: [
    {
      name: 'users',
      columns: [
        { name: 'id', type: 'integer', isPrimaryKey: true },
        { name: 'name', type: 'varchar' },
      ],
    },
  ],
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    mockedAIService.generateSchema.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockSchema), 100);
      });
    });
    mockedAIService.generateSql.mockResolvedValue(
      'CREATE TABLE users (id integer PRIMARY KEY, name varchar);'
    );
    mockedAIService.generateUserStories.mockResolvedValue('As a user, I can view other users.');
    mockedAIService.generateApiDocs.mockResolvedValue('GET /users');
    mockedAIService.generateTestCases.mockResolvedValue('Feature: Users');
    mockedAIService.generateSampleData.mockResolvedValue('{"users": [{"id": 1, "name": "Alice"}]}');
    mockedAIService.generateVisualization.mockResolvedValue({ spec: {}, sources: [] });
    mockedAIService.generateChartSuggestions.mockResolvedValue(['A bar chart of users']);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should handle the full schema generation workflow', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. User types a prompt
    const promptInput = await screen.findByPlaceholderText(/Type your message/);
    await user.type(promptInput, 'Create a user table');
    await user.click(screen.getByText('Send'));

    // 2. User clicks the "Generate Schema" button
    const generateButton = screen.getByText('Generate Schema');
    await user.click(generateButton);

    // 3. The application shows a loading state
    await waitFor(() => {
      expect(screen.getByText('Generating Initial Schema...')).toBeInTheDocument();
    });

    // 4. The application calls the generateSchema service
    await waitFor(() => {
      expect(mockedAIService.generateSchema).toHaveBeenCalledTimes(1);
    });

    // 5. The application receives a schema and displays it
    await waitFor(() => {
      // The active tab should now be "Refine"
      expect(screen.getByRole('tab', { name: /Refine/i })).toHaveClass('bg-brand-secondary');
    });

    // Check that the schema is displayed
    expect(await screen.findByText('users')).toBeInTheDocument();
    expect(await screen.findByText('id')).toBeInTheDocument();
    expect(await screen.findByText('name')).toBeInTheDocument();
  });

  test('routes generation through the provider selected in the header', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('AI provider'), 'openai');
    const promptInput = await screen.findByPlaceholderText(/Type your message/);
    await user.type(promptInput, 'Create an orders table');
    await user.click(screen.getByText('Send'));
    await user.click(screen.getByText('Generate Schema'));

    await waitFor(() => {
      expect(mockedAIService.generateSchema).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Array),
        'openai'
      );
    });
  });

  test('should handle schema generation with file uploads', async () => {
    const user = userEvent.setup();
    render(<App />);

    // 1. User types a prompt
    const promptInput = await screen.findByPlaceholderText('Type your message or add files...');
    await user.type(promptInput, 'Create a schema from the file');
    await user.click(screen.getByText('Send'));

    // 2. User uploads a file
    const file = new File(['file content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, file);

    // 3. The uploaded file name appears in the UI
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    // 4. User clicks the "Generate Schema" button
    const generateButton = screen.getByText('Generate Schema');
    await user.click(generateButton);

    // 5. The application shows a loading state
    await waitFor(() => {
      expect(screen.getByText('Generating Initial Schema...')).toBeInTheDocument();
    });

    // 6. The application calls the generateSchema service with correct data
    await waitFor(() => {
      expect(mockedAIService.generateSchema).toHaveBeenCalledTimes(1);
      expect(mockedAIService.generateSchema).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', text: 'Create a schema from the file' }),
        ]),
        expect.arrayContaining([
          expect.objectContaining({ name: 'test.txt', content: 'file content' }),
        ]),
        'gemini'
      );
    });

    // 7. The application receives a schema and displays it on the Refine tab
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Refine/i })).toHaveClass('bg-brand-secondary');
    });
    expect(screen.getByText('users')).toBeInTheDocument();
  });
});
