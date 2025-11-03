import { useState } from 'react';
import MCPClient from '../clients/MCPClient';

export const useMcpClient = () => {
    const [mcpClient] = useState(() => new MCPClient());
    const [mcpStatus, setMcpStatus] = useState('disconnected');

    const connectMcp = (config: any) => {
        mcpClient.connect(config, setMcpStatus, (msg: string) => {
            // Handle terminal output if needed
        });
    };

    const disconnectMcp = () => {
        mcpClient.disconnect();
    };

    const executeCommand = (command: string, params: any) => {
        mcpClient.executeCommand(command, params);
    };

    return {
        mcpClient,
        mcpStatus,
        setMcpStatus,
        connectMcp,
        disconnectMcp,
        executeCommand
    };
};