import React, { useState } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import './Chatbox.css';

function Chatbox({ isSetOpen = false }) {
    const [isOpen, setIsOpen] = useState(isSetOpen);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setIsFullscreen(false);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div className="chatbox-container">
            <ChatButton isOpen={isOpen} onClick={toggleChat} />
            <ChatWindow 
                isOpen={isOpen}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
            />
        </div>
    );
}

export default Chatbox;