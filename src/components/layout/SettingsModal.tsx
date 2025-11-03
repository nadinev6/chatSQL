import React, { useState } from 'react';
import { X, Wifi, WifiOff, Loader } from 'lucide-react';
import MCPClient from '../../clients/MCPClient';
import { Config } from '../../clients/AiService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mcpClient: MCPClient;
    config: Config;
    setConfig: React.Dispatch<React.SetStateAction<Config>>;
    mcpStatus: string;
    setMcpStatus: React.Dispatch<React.SetStateAction<string>>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, mcpClient, config, setConfig, mcpStatus, setMcpStatus }: SettingsModalProps) => {
    const [activeTab, setActiveTab] = useState('database');
    const [newEndpoint, setNewEndpoint] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleAddEndpoint = () => {
        if (newEndpoint.trim()) {
            try {
                // Basic URL validation
                new URL(newEndpoint);
                setConfig(prev => ({
                    ...prev,
                    apiEndpoints: [...prev.apiEndpoints, { id: Date.now(), url: newEndpoint }]
                }));
                setNewEndpoint('');
            } catch (error) {
                alert("Please enter a valid URL.");
            }
        }
    };

    const handleRemoveEndpoint = (id: number) => {
        setConfig(prev => ({
            ...prev,
            apiEndpoints: prev.apiEndpoints.filter(ep => ep.id !== id)
        }));
    };

    const handleConnect = () => {
        if (mcpClient.isConnected) {
            mcpClient.disconnect();
        } else {
            mcpClient.connect(config, setMcpStatus, (msg: string) => {});
        }
    };

    const statusInfo = {
        disconnected: { text: "Disconnected", color: "red", icon: <WifiOff className="w-4 h-4 mr-2" /> },
        connecting: { text: "Connecting...", color: "yellow", icon: <Loader className="w-4 h-4 mr-2 animate-spin" /> },
        connected: { text: "Connected", color: "green", icon: <Wifi className="w-4 h-4 mr-2" /> }
    };
    const currentStatus = statusInfo[mcpStatus as keyof typeof statusInfo];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-700">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 className="text-xl font-semibold">Settings</h2>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex">
                    <div className="w-1/3 border-r border-gray-700 p-4">
                        <nav className="flex flex-col space-y-2">
                            <button onClick={() => setActiveTab('database')} className={`text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'database' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Database</button>
                            <button onClick={() => setActiveTab('mcp')} className={`text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'mcp' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>MCP Configuration</button>
                            <button onClick={() => setActiveTab('api')} className={`text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'api' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>API Endpoints</button>
                        </nav>
                    </div>
                    <div className="w-2/3 p-6">
                        {activeTab === 'database' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Connection Details</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">AI Provider</label>
                                        <select name="aiProvider" value={config.aiProvider} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                            <option>Google Gemini</option>
                                            <option>OpenAI</option>
                                        </select>
                                    </div>
                                    {config.aiProvider === 'Google Gemini' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">Google Gemini API Key</label>
                                            <input type="password" name="geminiApiKey" value={config.geminiApiKey} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your Gemini API key" />
                                        </div>
                                    )}
                                    {config.aiProvider === 'OpenAI' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400">OpenAI API Key</label>
                                            <input type="password" name="openAiApiKey" value={config.openAiApiKey} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your OpenAI API key" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Primary DB Connection String</label>
                                        <input type="password" name="connectionString" value={config.connectionString} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="postgresql://user:pass@host:port/db" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'mcp' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">TigerData MCP Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Tiger Data API Key</label>
                                        <input type="password" name="mcpApiKey" value={config.mcpApiKey} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Tiger Data Project ID</label>
                                        <input type="text" name="mcpProjectId" value={config.mcpProjectId} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400">Tiger Data Service ID</label>
                                        <input type="text" name="mcpServiceId" value={config.mcpServiceId} onChange={handleInputChange} className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-700">
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Connection Status</label>
                                    <div className={`flex items-center p-2 rounded bg-gray-900 text-${currentStatus.color}-400`}>
                                        {currentStatus.icon}
                                        <span>{currentStatus.text}</span>
                                    </div>
                                    <button
                                        onClick={handleConnect}
                                        className={`w-full mt-4 py-2 px-4 rounded-md font-semibold text-white transition-colors ${
                                            mcpClient.isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    >
                                        {mcpClient.isConnected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'api' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">API Endpoint Monitoring</h3>
                                <div className="flex mb-4">
                                    <input
                                        type="text"
                                        value={newEndpoint}
                                        onChange={(e) => setNewEndpoint(e.target.value)}
                                        placeholder="https://api.example.com/health"
                                        className="flex-1 bg-gray-900 text-white p-2 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button onClick={handleAddEndpoint} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-r-md text-sm">Add</button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {config.apiEndpoints.map(ep => (
                                        <div key={ep.id} className="flex items-center justify-between bg-gray-900 p-2 rounded-md">
                                            <span className="text-sm truncate">{ep.url}</span>
                                            <button onClick={() => handleRemoveEndpoint(ep.id)} className="text-gray-500 hover:text-red-400 p-1">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {config.apiEndpoints.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No endpoints added.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-md">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;