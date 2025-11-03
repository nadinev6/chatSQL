import { useState, useEffect, useRef } from 'react';
import { AiService, Config } from '../clients/AiService';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    steps?: { id: number; text: string; status: 'pending' | 'completed' | 'confirmation' | 'error' }[];
    sql?: string;
    requiresConfirmation?: boolean;
    confirmationHandled?: boolean;
}

interface UseChatLogicProps {
    handleToolCall: (toolCall: { name: string; params: any }) => void;
    setActiveRightTab: (tab: string) => void;
    setSql: (sql: string) => void;
    config: Config;
}

export const useChatLogic = ({ handleToolCall, setActiveRightTab, setSql, config }: UseChatLogicProps) => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Welcome to ChatSQL! Describe a database schema you'd like to create. For example: 'A blog with users and posts'.", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleConfirmation = (messageId: number, confirmed: boolean) => {
        const currentMessage = messages.find(m => m.id === messageId);
        if (!currentMessage) return;

        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, confirmationHandled: true } : msg));

        const processId = Date.now();

        if (confirmed) {
            setIsStreaming(true);
            updateAiMessage(messageId, (prevMsg) => ({
                ...prevMsg,
                steps: prevMsg.steps?.map(s => s.status === 'confirmation' ? { ...s, text: "Executing Tool Call...", status: 'completed' } : s)
            }));

            // Execute the tool call with streaming
            handleToolCall({ name: 'execute_sql', params: { sql: currentMessage.sql } });

            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: processId + 2,
                    sender: 'ai',
                    text: "I've sent the execution command. You can monitor the real-time progress in the terminal."
                }]);
                setIsStreaming(false);
            }, 500);

        } else {
            updateAiMessage(messageId, (prevMsg) => ({
                ...prevMsg,
                steps: prevMsg.steps?.map(s => s.status === 'confirmation' ? { ...s, status: 'error', text: 'Design rejected.' } : s)
            }));
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: processId + 1,
                    sender: 'ai',
                    text: "Understood. Please provide more details on what you'd like to change."
                }]);
            }, 500);
        }
    };

    const updateAiMessage = (messageId: number, updateFn: (msg: Message) => Message) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updateFn(msg) : msg));
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { id: Date.now(), text: input, sender: 'user' };
        const aiMessageId = Date.now() + 1;
        const currentInput = input;

        setMessages(prev => [...prev, userMessage, {
            id: aiMessageId,
            text: "Okay, I'm working on that. Here is my plan:",
            sender: 'ai',
            steps: [{ id: 1, text: 'Analyzing Request...', status: 'pending' }],
        }]);
        setInput('');

        try {
            updateAiMessage(aiMessageId, (prevMsg) => ({
                ...prevMsg,
                steps: [
                    { ...prevMsg.steps![0], status: 'completed' },
                    { id: 2, text: 'Designing Schema...', status: 'pending' }
                ]
            }));

            const generatedSql = await AiService.generateSql(currentInput, config);

            setSql(generatedSql);
            setActiveRightTab('sql');

            updateAiMessage(aiMessageId, (prevMsg) => ({
                ...prevMsg,
                text: "I've designed a schema and prepared a tool call to execute the SQL. Does this look correct?",
                sql: generatedSql,
                steps: [
                    { id: 1, text: 'Analyzing Request...', status: 'completed' },
                    { id: 2, text: 'Designing Schema...', status: 'completed' },
                    { id: 3, text: 'Awaiting Confirmation for Tool Call: `execute_sql`', status: 'confirmation' }
                ],
                requiresConfirmation: true,
                confirmationHandled: false,
            }));

        } catch (error) {
            console.error('AI request failed:', error);
            updateAiMessage(aiMessageId, (prevMsg) => ({
                ...prevMsg,
                text: `An error occurred: ${(error as Error).message}`,
                steps: [
                    ...(prevMsg.steps?.map(s => ({...s, status: s.status === 'pending' ? 'error' : s.status })) || []),
                    { id: (prevMsg.steps?.length || 0) + 1, text: 'Error processing request', status: 'error' }
                ],
            }));
        }
    };

    return {
        messages,
        input,
        setInput,
        handleSend,
        handleConfirmation,
        chatEndRef,
        isStreaming
    };
};