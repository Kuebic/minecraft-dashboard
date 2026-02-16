'use client';

import { useState, useCallback } from 'react';

interface UseRconReturn {
  sendCommand: (command: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  lastResponse: string | null;
  history: Array<{ command: string; response: string; timestamp: Date }>;
}

export function useRcon(): UseRconReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [history, setHistory] = useState<
    Array<{ command: string; response: string; timestamp: Date }>
  >([]);

  const sendCommand = useCallback(async (command: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rcon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command }),
      });

      const data = await response.json();

      if (!data.success) {
        const errorMsg = data.error || 'Command failed';
        setError(errorMsg);
        setLastResponse(null);

        setHistory((prev) => [
          { command, response: `Error: ${errorMsg}`, timestamp: new Date() },
          ...prev,
        ].slice(0, 100));

        return `Error: ${errorMsg}`;
      }

      const responseText = data.response || 'Command executed';
      setLastResponse(responseText);

      setHistory((prev) => [
        { command, response: responseText, timestamp: new Date() },
        ...prev,
      ].slice(0, 100));

      return responseText;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      setLastResponse(null);

      setHistory((prev) => [
        { command, response: `Error: ${errorMsg}`, timestamp: new Date() },
        ...prev,
      ].slice(0, 100));

      return `Error: ${errorMsg}`;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendCommand, isLoading, error, lastResponse, history };
}
