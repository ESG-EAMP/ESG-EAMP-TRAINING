import React, { useState, useRef, useEffect } from 'react';
import Title from '../../layouts/Title/Title';

function UserChatbot() {
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'bot',
            text: 'Hello! How can I help you today?',
            time: '',
            avatar: '/assetsv2/avatar-bot.svg'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Sample bot responses
    const botResponses = [
        "I understand. Can you tell me more about your issue?",
        "Thanks for sharing that information.",
        "I'll do my best to assist you with that.",
        "Have you tried checking our FAQ List for this issue?",
        "You can go to our Feedback page for more help.",
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // Add user message
        const newUserMessage = {
            id: messages.length + 1,
            sender: 'user',
            text: inputMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatar: '/assetsv2/avatar-default.svg'
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');

        // Simulate bot response after a delay
        setTimeout(() => {
            const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
            const newBotMessage = {
                id: messages.length + 2,
                sender: 'bot',
                text: randomResponse,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                avatar: '/assetsv2/avatar-bot.svg'
            };
            setMessages(prev => [...prev, newBotMessage]);
        }, 1000);
    };

    return (
        <div className="container-fluid">
            <Title title="Chat Support" breadcrumb={[["Support", "/support"], "Chat Support"]} />
            <div className="row">
                <div className="col-xxl-12 col-xl-12">
                    <div className="card h-100 overflow-hidden ">
                        <div className="card-header border-bottom">
                            <div className="d-flex align-items-center gap-2">
                                <div className="d-flex align-items-start me-auto">
                                    <img
                                        src="/assetsv2/avatar-bot.svg"
                                        className="me-1 rounded"
                                        height={36}
                                        alt="Support Bot"
                                    />
                                    <div>
                                        <h5 className="mt-0  font-15">
                                            <span className="text-reset">Support Bot</span>
                                        </h5>
                                        <p className="mt-1 lh-1  text-muted font-12">
                                            <small className="mdi mdi-circle text-success" /> Online
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="card-body p-0 pt-3">
                            <ul className="conversation-list px-3 chat-conversation" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {messages.map((message) => (
                                    <li key={message.id} className={`clearfix ${message.sender === 'user' ? 'odd' : ''}`}>
                                        <div className="chat-avatar">
                                            <img
                                                src={message.avatar}
                                                className="rounded"
                                                alt={message.sender === 'user' ? 'You' : 'Support Bot'}
                                            />
                                            <i>{message.time}</i>
                                        </div>
                                        <div className="conversation-text">
                                            <div className="ctext-wrap">
                                                <i>{message.sender === 'user' ? 'You' : 'Support Bot'}</i>
                                                <p>{message.text}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                <div ref={messagesEndRef} />
                            </ul>
                        </div>
                        
                        <div className="card-body bg-light mt-2">
                            <form onSubmit={handleSubmit} className="needs-validation" noValidate>
                                <div className="d-flex align-items-start">
                                    <div className="w-100">
                                        <input
                                            type="text"
                                            className="form-control border-0"
                                            placeholder="Type your message..."
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="btn-group ms-2">
                                        <button type="submit" className="btn btn-success chat-send">
                                            <i className="fa-regular fa-paper-plane" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserChatbot;