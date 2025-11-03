import React from 'react';
import { CornerDownLeft } from 'lucide-react';
import ChainOfThoughtLog from './ChainOfThoughtLog';
import { useChatLogic } from '../../hooks/useChatLogic';
import { Config } from '../../clients/AiService';

interface ChatPanelProps {
    handleToolCall: (toolCall: { name: string; params: any }) => void;
    setActiveRightTab: (tab: string) => void;
    setSql: (sql: string) => void;
    config: Config;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ handleToolCall, setActiveRightTab, setSql, config }: ChatPanelProps) => {
    const { messages, input, setInput, handleSend, handleConfirmation, chatEndRef, isStreaming } = useChatLogic({
        handleToolCall,
        setActiveRightTab,
        setSql,
        config
    });

    return (
        <div className="bg-gray-800 rounded-lg flex flex-col h-full">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Chat</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                        <div className={`p-3 rounded-lg max-w-2xl ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            <p>{msg.text}</p>
                            {msg.steps && <ChainOfThoughtLog steps={msg.steps} />}
                            {msg.requiresConfirmation && !msg.confirmationHandled && (
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleConfirmation(msg.id, true)} className="px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-md">Yes, proceed</button>
                                    <button onClick={() => handleConfirmation(msg.id, false)} className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md">No, revise</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center bg-gray-900 rounded-lg">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Describe your database schema..."
                        className="flex-1 bg-transparent p-3 focus:outline-none"
                        disabled={isStreaming}
                    />
                    <button
                        onClick={handleSend}
                        className={`p-3 ${isStreaming ? 'text-gray-600' : 'text-gray-400 hover:text-white'}`}
                        aria-label="Send message"
                        disabled={isStreaming}
                    >
                        <CornerDownLeft className="w-5 h-5" />
                    </button>
                </div>
                {isStreaming && (
                    <div className="mt-2 text-xs text-blue-400 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border border-blue-400 border-t-transparent mr-2"></div>
                        Streaming database operations...
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPanel;