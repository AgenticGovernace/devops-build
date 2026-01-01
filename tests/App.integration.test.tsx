import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import App from '../App';
import * as geminiService from '../services/geminiService';

// Mock the geminiService
vi.mock('../services/geminiService');
const mockedGeminiService = geminiService as jest.Mocked<typeof geminiService>;

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
    mockedGeminiService.generateSchema.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(mockSchema), 100);
      });
    });
    mockedGeminiService.generateSql.mockResolvedValue(
      'CREATE TABLE users (id integer PRIMARY KEY, name varchar);'
    );
    mockedGeminiService.generateUserStories.mockResolvedValue('As a user, I can view other users.');
    mockedGeminiService.generateApiDocs.mockResolvedValue('GET /users');
    mockedGeminiService.generateTestCases.mockResolvedValue('Feature: Users');
    mockedGeminiService.generateSampleData.mockResolvedValue(
      '{"users": [{"id": 1, "name": "Alice"}]}'
    );
    mockedGeminiService.generateVisualization.mockResolvedValue({ spec: {}, sources: [] });
    mockedGeminiService.generateChartSuggestions.mockResolvedValue(['A bar chart of users']);
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
      expect(mockedGeminiService.generateSchema).toHaveBeenCalledTimes(1);
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
      expect(mockedGeminiService.generateSchema).toHaveBeenCalledTimes(1);
      expect(mockedGeminiService.generateSchema).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', text: 'Create a schema from the file' }),
        ]),
        expect.arrayContaining([
          expect.objectContaining({ name: 'test.txt', content: 'file content' }),
        ])
      );
    });

    // 7. The application receives a schema and displays it on the Refine tab
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Refine/i })).toHaveClass('bg-brand-secondary');
    });
    expect(screen.getByText('users')).toBeInTheDocument();
  });
});
