'use client';

import { useState, useRef, useEffect } from 'react';
import { useRcon } from '@/hooks/useRcon';
import { Send, Terminal } from 'lucide-react';

const COMMAND_SUGGESTIONS = [
  '/list',
  '/ban',
  '/kick',
  '/tp',
  '/give',
  '/gamemode',
  '/weather',
  '/time',
  '/whitelist',
  '/op',
  '/say',
  '/tps',
  '/version',
  '/save-all',
  '/difficulty',
];

interface ConsoleTerminalProps {
  fullScreen?: boolean;
}

export function ConsoleTerminal({ fullScreen = false }: ConsoleTerminalProps) {
  const { sendCommand, isLoading, history } = useRcon();
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const commandHistory = history.map((h) => h.command);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.startsWith('/') ? input.slice(1) : input;
    setInput('');
    setHistoryIndex(-1);
    setSuggestions([]);

    await sendCommand(command);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setInput(suggestions[0]);
        setSuggestions([]);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setHistoryIndex(-1);

    // Update suggestions
    if (value.startsWith('/')) {
      const matches = COMMAND_SUGGESTIONS.filter((cmd) =>
        cmd.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(matches.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const containerClass = fullScreen
    ? 'h-full'
    : 'bg-card border border-card-border rounded-xl p-6 card-glow';

  return (
    <div className={containerClass}>
      {!fullScreen && (
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5 text-accent-emerald" />
          <h3 className="text-lg font-semibold text-foreground">Console</h3>
        </div>
      )}

      {/* Output area */}
      <div
        ref={outputRef}
        className={`bg-[#0d0d0d] rounded-lg p-4 font-mono text-sm overflow-y-auto mb-4 ${
          fullScreen ? 'h-[calc(100%-80px)]' : 'h-64'
        }`}
      >
        {history.length === 0 ? (
          <p className="text-text-dim">
            Type a command and press Enter. Use / prefix for Minecraft commands.
          </p>
        ) : (
          [...history].reverse().map((item, index) => (
            <div key={index} className="mb-2">
              <div className="flex items-center gap-2">
                <span className="text-accent-emerald">{'>'}</span>
                <span className="text-accent-gold">{item.command}</span>
                <span className="text-text-dim text-xs">
                  {item.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <pre className="text-foreground whitespace-pre-wrap pl-4 mt-1">
                {item.response}
              </pre>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="relative">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 w-full mb-1 bg-card border border-card-border rounded-lg overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setInput(suggestion);
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className={`w-full text-left px-4 py-2 text-sm font-mono hover:bg-card-hover transition-colors ${
                  index === 0 ? 'bg-card-hover' : ''
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-[#0d0d0d] border border-card-border rounded-lg px-4">
            <span className="text-accent-emerald font-mono">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command..."
              className="flex-1 bg-transparent px-2 py-3 text-foreground font-mono text-sm placeholder:text-text-dim focus:outline-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-3 bg-accent-emerald text-background rounded-lg hover:bg-accent-emerald/90 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
