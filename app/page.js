'use client';
import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';

export default function Page() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]); 
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4'); 
  const typingTimeoutRef = useRef(null); 
  const messagesEndRef = useRef(null);

  const TYPE_DELAY = 30; 

  /**
   * Simulates a typing effect by displaying the response character by character.
   * @param {string} plainText - The plain text to display.
   * @param {number} messageIndex - The index of the message being typed.
   */
  const typeWriter = (plainText, messageIndex) => {
    setMessages((prev) =>
      prev.map((msg, idx) =>
        idx === messageIndex ? { ...msg, text: '' } : msg
      )
    );
    setIsTyping(true);

    let currentIndex = 0;

    const typeNextChar = () => {
      if (currentIndex < plainText.length) {
        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === messageIndex
              ? { ...msg, text: msg.text + plainText[currentIndex] }
              : msg
          )
        );
        currentIndex += 1;
        typingTimeoutRef.current = setTimeout(typeNextChar, TYPE_DELAY);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      setError('Please enter a message.');
      return;
    }

    try {
      setError(null);
      setIsTyping(true);

      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: prompt.trim(), timestamp: new Date() },
      ]);
      const currentMessageIndex = messages.length;

      setPrompt('');

      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim(), model: selectedModel }), // Include selected model
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      const sanitizedHTML = DOMPurify.sanitize(data.text, {
        ALLOWED_TAGS: [
          'p',
          'strong',
          'em',
          'ul',
          'li',
          'br',
          'a',
          'span',
          'div',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style'],
      });

      const plainText = sanitizedHTML.replace(/<[^>]+>/g, '');

      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: '', timestamp: new Date() },
      ]);

      typeWriter(plainText, currentMessageIndex);
    } catch (err) {
      console.error('Error generating text:', err);
      setError(err.message || 'Something went wrong');
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="flex flex-col w-full max-w-2xl bg-white rounded-3xl shadow-lg overflow-hidden dark:bg-gray-800">
        {/* Header */}
        <div className="bg-indigo-600 p-4">
          <h1 className="text-2xl font-bold text-white text-center">
            Demo Chatbot
          </h1>
        </div>

        {/* Model Selection */}
        <div className="p-4 bg-white dark:bg-gray-800 flex items-center space-x-4">
          <label htmlFor="model-select" className="text-gray-700 dark:text-gray-200 font-medium">
            Select Model:
          </label>
          <select
            id="model-select"
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-4o-mini">GPT-4o-mini</option>
            <option value="o1">O1</option>
          </select>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-700">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex mb-4 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg shadow ${
                  msg.sender === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none dark:bg-gray-600 dark:text-gray-200'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <span className="text-xs text-gray-500 mt-1 block text-right">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-gray-800 flex items-center space-x-4">
          <textarea
            rows={1}
            className="flex-1 resize-none p-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            placeholder="Type your message..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleGenerateText();
              }
            }}
          />
          <button
            className={`flex-shrink-0 bg-indigo-600 dark:bg-indigo-700 text-white p-3 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition ${
              isTyping ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleGenerateText}
            disabled={isTyping}
            aria-label="Send Message"
          >
            {isTyping ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
            ) : (
              <svg
                className="h-5 w-5 transform rotate-45"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-200 text-red-700 dark:text-red-800 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* CSS for Blinking Cursor (if needed) */}
      <style jsx>{`
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }

        .animate-blink {
          animation: blink 1s step-start infinite;
        }
      `}</style>
    </div>
  );
}
