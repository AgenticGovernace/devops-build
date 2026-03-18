
import React, { useState } from 'react';

interface FeedbackLoopProps {
  content: string;
  title: string;
  onReset: () => void;
}

export const FeedbackLoop: React.FC<FeedbackLoopProps> = ({ content, title, onReset }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-brand-secondary border border-brand-border rounded-lg p-6 shadow-lg animate-fade-in w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-brand-text-primary">{title}</h2>
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-brand-border text-brand-text-secondary font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200"
                >
                    Start Over
                </button>
            </div>
            <p className="text-brand-text-secondary mb-6">
                The refined schema has been used to generate development artifacts. This completes the human-in-the-loop cycle, ensuring AI output is guided and validated.
            </p>
            <div className="relative bg-brand-primary p-4 rounded-md prose prose-invert prose-sm max-w-none">
                 <button
                    onClick={handleCopy}
                    className="absolute top-2 right-2 px-3 py-1 bg-brand-border text-xs font-semibold rounded-md hover:bg-brand-accent hover:text-white transition duration-200 not-prose"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
                <pre className="whitespace-pre-wrap">{content}</pre>
            </div>
        </div>
    );
};
