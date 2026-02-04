import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbox.css';

function ChatWindow({ isOpen, isFullscreen, onToggleFullscreen, onClose }) {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm Corgi 🐕, your personal assistant. How can I help you today?", sender: 'bot', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll when messages change or chat opens
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            const currentTime = new Date();
            const userMessage = {
                id: messages.length + 1,
                text: inputValue,
                sender: 'user',
                timestamp: currentTime
            };

            setMessages(prev => [...prev, userMessage]);
            setInputValue('');
            setIsLoading(true);

            try {
                const aiResponse = await getResponseFromAi(inputValue);
                const botMessage = {
                    id: messages.length + 2,
                    text: aiResponse.choices?.[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.",
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            } catch (error) {
                console.error('Error getting AI response:', error);
                const errorMessage = {
                    id: messages.length + 2,
                    text: `I'm sorry, I'm having trouble connecting right now. Please try again later. ${error}`,
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsLoading(false);
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        }
    };

    async function getResponseFromAi(message) {
        const conversationHistory = messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    {
                        role: "system",
                        content: "Address Yourself as Corgi. You are a helpful (Environmental, Social, and Governance) personal assistant. You help users understand ESG practices, sustainability, and responsible business operations. Keep responses concise, informative, and friendly. Use markdown formatting when appropriate to make responses more readable (bold, lists, etc.)."
                    },
                    ...conversationHistory,
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    }

    const renderMessage = (message) => {
        if (message.sender === 'bot') {
            return (
                <div className="markdown-content">
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p style={{ margin: '0 0 0 0' }}>{children}</p>,
                            ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
                            li: ({ children }) => <li style={{ margin: '4px 0' }}>{children}</li>,
                            strong: ({ children }) => <strong style={{ fontWeight: '600' }}>{children}</strong>,
                            em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                            code: ({ children }) => <code style={{
                                backgroundColor: '#f1f3f4',
                                padding: '2px 4px',
                                borderRadius: '4px',
                                fontSize: '0.9em',
                                fontFamily: 'monospace'
                            }}>{children}</code>,
                            h1: ({ children }) => <h1 style={{ fontSize: '1.2em', margin: '12px 0 8px 0', fontWeight: '600' }}>{children}</h1>,
                            h2: ({ children }) => <h2 style={{ fontSize: '1.1em', margin: '10px 0 6px 0', fontWeight: '600' }}>{children}</h2>,
                            h3: ({ children }) => <h3 style={{ fontSize: '1em', margin: '8px 0 4px 0', fontWeight: '600' }}>{children}</h3>,
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>
                </div>
            );
        }
        return message.text;
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        } else {
            return messageTime.toLocaleDateString() + ' ' + messageTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`chatbox-window ${isOpen ? 'open' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
            <div className="chatbox-header">
                <div className="chatbox-title">
                    <div className="chatbox-avatar overflow-hidden rounded-full bg-white p-1">
                        <img height={30} width={30} src="/assetsv2/corgi.png" alt="Corgi" />
                    </div>
                    <div>
                        <h3>Corgi 🤖</h3>
                        <span className="status mt-1">
                            {isLoading ? 'Typing...' : 'Online'}
                        </span>
                    </div>
                </div>
                <div className="chatbox-controls">
                    <button
                        className="fullscreen-toggle"
                        onClick={onToggleFullscreen}
                        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 3V6M8 6H5M8 6L3 3M16 3V6M16 6H19M16 6L21 3M8 21V18M8 18H5M8 18L3 21M16 21V18M16 18H19M16 18L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M8 21H5C3.89543 21 3 20.1046 3 19V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="chatbox-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message ${message.sender === 'user' ? 'user' : 'bot'}`}
                    >
                        <div className="message-content">
                            {renderMessage(message)}
                        </div>
                        <div className="message-time">
                            {formatTimestamp(message.timestamp)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message bot">
                        <div className="message-content typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                {/* Invisible element to scroll to */}
                <div ref={messagesEndRef} />
            </div>

            <form className="chatbox-input" onSubmit={handleSendMessage}>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={isLoading ? "Please wait..." : "Type your message..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={!isOpen || isLoading}
                />
                <button type="submit" disabled={!inputValue.trim() || !isOpen || isLoading}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </form>
        </div>
    );
}

export default ChatWindow; 