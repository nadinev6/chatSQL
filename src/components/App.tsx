import React, { useState } from 'react';
import Header from './layout/Header';
import ChatPanel from './chat/ChatPanel';
import TabbedPanel from './layout/TabbedPanel';
import TerminalPanel from './panels/TerminalPanel';
import SettingsModal from './layout/SettingsModal';
import { useMcpClient } from '../hooks/useMcpClient';
import { Config } from '../clients/AiService';

const App: React.FC = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState('sql');
    const [sql, setSql] = useState('');
    const [terminalOutput, setTerminalOutput] = useState(['Welcome to the MCP Terminal.']);
    const [config, setConfig] = useState<Config>({
        aiProvider: 'Google Gemini',
        geminiApiKey: '',
        openAiApiKey: '',
        connectionString: '',
        mcpApiKey: '',
        mcpProjectId: '',
        mcpServiceId: '',
        apiEndpoints: []
    });

    const { mcpClient, mcpStatus, setMcpStatus } = useMcpClient();

    const handleToolCall = (toolCall: { name: string; params: any }) => {
        if (toolCall.name === 'execute_sql') {
            // Simulate MCP command execution
            mcpClient.executeCommand('db:push', toolCall.params);
            setTerminalOutput(prev => [...prev, `Executing: db:push with SQL: ${toolCall.params.sql.substring(0, 50)}...`]);
        }
    };

    const handleTerminalCommand = (command: string) => {
        setTerminalOutput(prev => [...prev, `> ${command}`]);
        // Handle terminal commands if needed
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            <Header onSettingsClick={() => setIsSettingsOpen(true)} />
            <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 p-4">
                    <ChatPanel
                        handleToolCall={handleToolCall}
                        setActiveRightTab={setActiveRightTab}
                        setSql={setSql}
                        config={config}
                    />
                </div>
                <div className="w-1/2 flex flex-col">
                    <div className="flex-1 p-4">
                        <TabbedPanel
                            activeTab={activeRightTab}
                            setActiveTab={setActiveRightTab}
                            sql={sql}
                            setSql={setSql}
                            apiEndpoints={config.apiEndpoints}
                        />
                    </div>
                    <div className="p-4">
                        <TerminalPanel output={terminalOutput} onCommand={handleTerminalCommand} />
                    </div>
                </div>
            </div>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                mcpClient={mcpClient}
                config={config}
                setConfig={setConfig}
                mcpStatus={mcpStatus}
                setMcpStatus={setMcpStatus}
            />
        </div>
    );
};

export default App;