
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

import { Settings, Database, Terminal, Bot, Code, Share2, CornerDownLeft, Clipboard, X, Activity, Play, KeyRound, Link2, Loader, CheckCircle2, HelpCircle, XCircle, Download, Server, Wifi, WifiOff } from 'lucide-react';


// --- Mock MCP Client ---
// Simulates a client connecting to a Tiger Data MCP server via SSE
class MCPClient {
    // Fix: Declare class properties for MCPClient to resolve TypeScript errors about missing properties.
    isConnected: boolean;
    config: any;
    onStatusChange: ((status: string) => void) | null;
    onTerminalOutput: ((message: string) => void) | null;

    constructor() {
        this.isConnected = false;
        this.config = {};
        this.onStatusChange = null;
        this.onTerminalOutput = null;
    }

    connect(config, onStatusChange, onTerminalOutput) {
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.onTerminalOutput = onTerminalOutput;

        this.onStatusChange('connecting');
        this._log('Attempting to connect via MCP...');
        
        setTimeout(() => {
            if (this.config.mcpApiKey && this.config.mcpProjectId && this.config.mcpServiceId) {
                this.isConnected = true;
                this.onStatusChange('connected');
                this._log('MCP connection successful. Ready for real-time commands.');
            } else {
                this.isConnected = false;
                this.onStatusChange('disconnected');
                this._log('MCP connection failed. Missing required API Key, Project ID, or Service ID.');
            }
        }, 2000);
    }

    disconnect() {
        this.isConnected = false;
        if(this.onStatusChange) this.onStatusChange('disconnected');
        this._log('MCP client disconnected.');
    }

    executeCommand(command, params) {
        if (!this.isConnected) {
            this._log('Error: MCP client is not connected.');
            return;
        }

        this._log(`> ${command}`);
        
        if (command === 'db:push') {
            const terminalMessages = [
                'Receiving `db:push` command via MCP...',
                'Authenticating with Tiger Data...',
                'Beginning real-time schema migration...',
                ...params.sql.split('\n').filter(line => line.toUpperCase().includes('CREATE TABLE')).map(line => `${line.trim()}... OK`),
                'Migration complete. Schema is live.'
            ];

            let i = 0;
            const interval = setInterval(() => {
                if (i < terminalMessages.length) {
                    this._log(terminalMessages[i]);
                    i++;
                } else {
                    clearInterval(interval);
                }
            }, 500);
        }
    }

    _log(message) {
        if (this.onTerminalOutput) {
            this.onTerminalOutput(`[MCP] ${message}`);
        }
    }
}

const Header = ({ onSettingsClick }) => (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center">
            <Bot className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">ChatSQL</h1>
        </div>
        <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">API: <span className="text-green-400">Live</span></span>
            <span className="text-sm text-gray-400">Tiger Data: <span className="text-green-400">Live</span></span>
            <button onClick={onSettingsClick} className="p-2 rounded-md hover:bg-gray-700" aria-label="Open settings">
                <Settings className="w-5 h-5" />
            </button>
        </div>
    </header>
);

const ChainOfThoughtLog = ({ steps }) => {
    const getStatusIcon = (status) => {
        switch (status) {
            case 'pending': return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'confirmation': return <HelpCircle className="w-4 h-4 text-yellow-400" />;
            case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
            default: return null;
        }
    };

    return (
        <div className="mt-3 border-t border-gray-600 pt-3">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Chain of Thought</h4>
            <ul className="space-y-2">
                {steps.map(step => (
                    <li key={step.id} className="flex items-center text-sm text-gray-300">
                        {getStatusIcon(step.status)}
                        <span className="ml-2">{step.text}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


const ChatPanel = ({ handleToolCall, setActiveRightTab, setSql, config }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Welcome to ChatSQL! Describe a database schema you'd like to create. For example: 'A blog with users and posts'.", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleConfirmation = (messageId, confirmed) => {
        const currentMessage = messages.find(m => m.id === messageId);
        if (!currentMessage) return;

        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, confirmationHandled: true } : msg));

        const processId = Date.now();
        
        if (confirmed) {
            updateAiMessage(messageId, (prevMsg) => ({
                ...prevMsg,
                steps: prevMsg.steps.map(s => s.status === 'confirmation' ? { ...s, text: "Executing Tool Call...", status: 'completed' } : s)
            }));
            
            // Execute the tool call
            handleToolCall({ name: 'execute_sql', params: { sql: currentMessage.sql } });
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: processId + 2,
                    sender: 'ai',
                    text: "I've sent the execution command. You can monitor the progress in the terminal."
                }]);
            }, 500);

        } else {
             updateAiMessage(messageId, (prevMsg) => ({
                ...prevMsg,
                steps: prevMsg.steps.map(s => s.status === 'confirmation' ? { ...s, status: 'error', text: 'Design rejected.' } : s)
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


    const updateAiMessage = (messageId, updateFn) => {
        setMessages(prev => prev.map(msg => msg.id === messageId ? updateFn(msg) : msg));
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now(), text: input, sender: 'user' };
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
            let generatedSql;

            updateAiMessage(aiMessageId, (prevMsg) => ({
                ...prevMsg,
                steps: [
                    { ...prevMsg.steps[0], status: 'completed' },
                    { id: 2, text: 'Designing Schema...', status: 'pending' }
                ]
            }));

            const systemInstruction = "You are a database expert called ChatSQL. Your goal is to help users design database schemas. The user will describe a schema in plain English. You will generate the corresponding SQL CREATE TABLE statements. You must respond with a function call to a tool named 'execute_sql'. The 'sql' parameter of this function should contain the generated SQL script.";
            
            if (config.aiProvider === 'OpenAI') {
                if (!config.openAiApiKey) throw new Error("OpenAI API key is not set. Please configure it in the settings.");

                const executeSqlToolOpenAI = {
                    name: 'execute_sql',
                    description: 'Executes a SQL script to create a database schema.',
                    parameters: {
                        type: 'object',
                        properties: {
                            sql: {
                                type: 'string',
                                description: 'The SQL script to execute.'
                            }
                        },
                        required: ['sql']
                    }
                };
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.openAiApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4-turbo-preview',
                        messages: [
                            { role: 'system', content: systemInstruction },
                            { role: 'user', content: currentInput }
                        ],
                        tools: [{ type: 'function', function: executeSqlToolOpenAI }],
                        tool_choice: { type: 'function', function: { name: 'execute_sql' } }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'OpenAI API request failed');
                }

                const data = await response.json();
                const toolCall = data.choices[0]?.message?.tool_calls?.[0];
                if (toolCall && toolCall.function.name === 'execute_sql') {
                    const args = JSON.parse(toolCall.function.arguments);
                    generatedSql = args.sql;
                } else {
                    throw new Error("Did not receive the expected tool call from OpenAI.");
                }
            } else { // Google Gemini
                if (!config.geminiApiKey) throw new Error("Google Gemini API key is not set. Please configure it in the settings.");
                
                const executeSqlToolGemini = {
                    name: 'execute_sql',
                    description: 'Executes a SQL script to create a database schema.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            sql: {
                                type: Type.STRING,
                                description: 'The SQL script to execute.'
                            }
                        },
                        required: ['sql']
                    }
                };

                const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: currentInput,
                    config: {
                      systemInstruction: systemInstruction,
                      tools: [{ functionDeclarations: [executeSqlToolGemini] }],
                    },
                });

                const functionCall = response.functionCalls?.[0];
                if (!functionCall || functionCall.name !== 'execute_sql' || !functionCall.args.sql) {
                    throw new Error("Did not receive the expected tool call from Gemini.");
                }
                generatedSql = functionCall.args.sql;
            }

            if (!generatedSql) {
                throw new Error("Failed to generate SQL from the AI response.");
            }

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
                text: `An error occurred: ${error.message}`,
                steps: [
                    ...prevMsg.steps.map(s => ({...s, status: s.status === 'pending' ? 'error' : s.status })),
                    { id: prevMsg.steps.length + 1, text: 'Error processing request', status: 'error' }
                ],
            }));
        }
    };


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
                    />
                    <button onClick={handleSend} className="p-3 text-gray-400 hover:text-white" aria-label="Send message">
                        <CornerDownLeft className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

const ApiMonitoringPanel = ({ endpoints }) => {
    const eventLog = [
        { time: '14:32:10', event: 'Response Handling', message: 'Result cached successfully.' },
        { time: '14:32:09', event: 'Execute Query', message: 'Query sent to Live API.' },
        { time: '14:32:08', event: 'Route Decision', message: 'API is live, routing to Live API.' },
        { time: '14:32:08', event: 'API Health Check', message: 'CoinGecko is available (200 OK).' },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Live': return 'text-green-400';
            case 'Rate-Limited': return 'text-yellow-400';
            case 'Offline': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };
    
    const getHostname = (url) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    return (
        <div className="p-4 text-sm font-mono h-full flex flex-col">
            <h3 className="text-lg font-sans font-semibold mb-2 text-white">Monitored Endpoints</h3>
             <div className="space-y-3 overflow-y-auto mb-4 flex-1">
                {endpoints.map(api => (
                    <div key={api.id} className="bg-gray-900 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white font-sans">{getHostname(api.url)}</p>
                                <p className="text-gray-400 text-xs">{api.url}</p>
                            </div>
                            <div className="flex items-center">
                                <span className={`font-bold mr-4 ${getStatusColor(api.status || 'Pending')}`}>
                                    ● {api.status || 'Pending'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                 {endpoints.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                        <p>No API endpoints configured.</p>
                        <p className="text-xs">Add endpoints in the Settings menu.</p>
                    </div>
                 )}
            </div>

            <h3 className="text-lg font-sans font-semibold mt-2 mb-2 text-white">Event Log</h3>
            <div className="bg-gray-900 p-3 rounded-lg overflow-y-auto flex-1">
                {eventLog.map((log, index) => (
                    <p key={index}><span className="text-gray-500">{log.time}</span> <span className="text-blue-400">{log.event}:</span> <span className="text-gray-300">{log.message}</span></p>
                ))}
            </div>
        </div>
    );
};

const Table = React.forwardRef(({ table, style }, ref) => (
    <div ref={ref} className="bg-gray-800 rounded-lg shadow-lg absolute border border-gray-700" style={style}>
        <div className="bg-gray-900 px-4 py-2 rounded-t-lg">
            <h4 className="font-bold text-white">{table.name}</h4>
        </div>
        <ul className="p-4 space-y-2">
            {table.columns.map(col => (
                <li key={col.name} className="flex items-center">
                    {col.pk && <KeyRound className="w-4 h-4 text-yellow-400 mr-2" />}
                    {col.fk && <Link2 className="w-4 h-4 text-blue-400 mr-2" />}
                    <span className={!col.pk && !col.fk ? 'ml-6' : ''}>{col.name}</span>
                    <span className="text-gray-500 ml-auto">{col.type}</span>
                </li>
            ))}
        </ul>
    </div>
));


const VisualSchemaViewer = ({ sql }) => {
    // This is a mock parser. A real implementation would need a robust SQL parser.
    const parseSchema = (sqlString) => {
        if (!sqlString) return { tables: [], relations: [] };
        const tables = [];
        const relations = [];

        const tableRegex = /CREATE TABLE\s+(\w+)\s+\(([^;]+)\);/gis;
        let match;
        while ((match = tableRegex.exec(sqlString)) !== null) {
            const tableName = match[1];
            const columnsStr = match[2];
            const columns = columnsStr.trim().split('\n').map(line => {
                const trimmedLine = line.trim().replace(/,$/, '');
                const parts = trimmedLine.split(/\s+/);
                const name = parts[0];
                const type = parts[1];
                const pk = trimmedLine.toUpperCase().includes('PRIMARY KEY');
                const fk = trimmedLine.toUpperCase().includes('REFERENCES');
                if (fk) {
                    const refMatch = /REFERENCES\s+(\w+)\((\w+)\)/i.exec(trimmedLine);
                    if (refMatch) {
                        relations.push({ fromTable: tableName, fromColumn: name, toTable: refMatch[1], toColumn: refMatch[2] });
                    }
                }
                return { name, type, pk, fk };
            });
            tables.push({ id: tables.length, name: tableName, columns });
        }
        return { tables, relations };
    };

    const { tables, relations } = parseSchema(sql);
    const tableRefs = useRef({});

    const [positions, setPositions] = useState({});
    const [lines, setLines] = useState([]);

    useEffect(() => {
        const initialPositions = {};
        tables.forEach((table, i) => {
            initialPositions[table.name] = { x: (i % 3) * 300 + 50, y: Math.floor(i / 3) * 250 + 50 };
        });
        setPositions(initialPositions);
        tableRefs.current = tables.reduce((acc, table) => {
            acc[table.name] = React.createRef();
            return acc;
        }, {});
    }, [sql]); // Rerun layout when SQL changes

    useEffect(() => {
        if (Object.keys(positions).length === 0) return;
        const newLines = relations.map((rel, i) => {
            const fromTable = tableRefs.current[rel.fromTable]?.current;
            const toTable = tableRefs.current[rel.toTable]?.current;
            if (fromTable && toTable) {
                const fromPos = positions[rel.fromTable];
                const toPos = positions[rel.toTable];
                return {
                    x1: fromPos.x + fromTable.offsetWidth / 2,
                    y1: fromPos.y + fromTable.offsetHeight / 2,
                    x2: toPos.x + toTable.offsetWidth / 2,
                    y2: toPos.y + toTable.offsetHeight / 2,
                };
            }
            return null;
        }).filter(Boolean);
        setLines(newLines);
    }, [positions, relations, tables]);


    if (tables.length === 0) {
        return <div className="p-4 text-gray-400">No schema to display. Generate one from the chat.</div>
    }

    return (
        <div className="relative w-full h-full overflow-auto bg-gray-900 rounded-b-lg">
            <svg className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }}>
                {lines.map((line, i) => (
                     <path
                        key={i}
                        d={`M ${line.x1} ${line.y1} C ${line.x1 + 50} ${line.y1}, ${line.x2 - 50} ${line.y2}, ${line.x2} ${line.y2}`}
                        stroke="#4a5568"
                        strokeWidth="2"
                        fill="none"
                    />
                ))}
            </svg>
            {tables.map(table => (
                 <Table
                    key={table.id}
                    ref={tableRefs.current[table.name]}
                    table={table}
                    style={{
                        left: `${positions[table.name]?.x || 0}px`,
                        top: `${positions[table.name]?.y || 0}px`,
                        zIndex: 1,
                        cursor: 'grab'
                    }}
                />
            ))}
        </div>
    );
};


const TabbedSqlSchemaPanel = ({ activeTab, setActiveTab, sql, setSql, apiEndpoints }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(sql);
    };

    const handleExecute = () => {
        alert("Execution functionality needs to be connected to a backend.");
    }
    
    const handleDownload = () => {
        const blob = new Blob([sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'schema.sql';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="bg-gray-800 rounded-lg flex flex-col h-full">
            <div className="flex border-b border-gray-700">
                <button onClick={() => setActiveTab('sql')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'sql' ? 'bg-gray-800 border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    SQL Editor
                </button>
                <button onClick={() => setActiveTab('schema')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'schema' ? 'bg-gray-800 border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    Schema Viewer
                </button>
                <button onClick={() => setActiveTab('api')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'api' ? 'bg-gray-800 border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                    API Monitoring
                </button>
                <div className="flex-grow"></div>
                {activeTab === 'sql' && (
                    <div className="flex items-center px-2 space-x-1">
                        <button onClick={handleDownload} className="p-2 text-gray-400 rounded-md hover:bg-gray-700" aria-label="Download SQL">
                           <Download className="w-4 h-4" />
                        </button>
                         <button onClick={handleCopy} className="p-2 text-gray-400 rounded-md hover:bg-gray-700" aria-label="Copy SQL">
                           <Clipboard className="w-4 h-4" />
                        </button>
                        <button onClick={handleExecute} className="p-2 text-gray-400 rounded-md hover:bg-gray-700" aria-label="Execute SQL">
                           <Play className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto">
                {activeTab === 'sql' && (
                    <textarea
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        className="w-full h-full bg-gray-900 text-white font-mono p-4 text-sm focus:outline-none resize-none"
                        placeholder="-- SQL will be generated here..."
                    />
                )}
                {activeTab === 'schema' && <VisualSchemaViewer sql={sql} />}
                {activeTab === 'api' && <ApiMonitoringPanel endpoints={apiEndpoints} />}
            </div>
        </div>
    );
};

const TerminalPanel = ({ output, onCommand }) => {
    const [input, setInput] = useState('');
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && input.trim()) {
            onCommand(input);
            setInput('');
        }
    };

    return (
        <div className="bg-black rounded-lg flex flex-col h-full font-mono text-sm">
            <div className="bg-gray-800 p-2 rounded-t-lg flex items-center">
                <Terminal className="w-4 h-4 mr-2" />
                <span>Terminal</span>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-gray-300">
                {output.map((line, i) => <p key={i} className="whitespace-pre-wrap">{line}</p>)}
                <div ref={endRef} />
                 <div className="flex items-center">
                    <span className="text-green-400 mr-2">{'>'}</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent focus:outline-none"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
};

const SettingsModal = ({ isOpen, onClose, mcpClient, config, setConfig, mcpStatus, setMcpStatus }) => {
    const [activeTab, setActiveTab] = useState('database');
    const [newEndpoint, setNewEndpoint] = useState('');

    if (!isOpen) return null;

    const handleInputChange = (e) => {
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
    
    const handleRemoveEndpoint = (id) => {
        setConfig(prev => ({
            ...prev,
            apiEndpoints: prev.apiEndpoints.filter(ep => ep.id !== id)
        }));
    };
    
    const handleConnect = () => {
        if (mcpClient.isConnected) {
            mcpClient.disconnect();
        } else {
            mcpClient.connect(config, setMcpStatus, (msg) => {}); // Terminal output handled elsewhere
        }
    };
    
    const statusInfo = {
        disconnected: { text: "Disconnected", color: "red", icon: <WifiOff className="w-4 h-4 mr-2" /> },
        connecting: { text: "Connecting...", color: "yellow", icon: <Loader className="w-4 h-4 mr-2 animate-spin" /> },
        connected: { text: "Connected", color: "green", icon: <Wifi className="w-4 h-4 mr-2" /> }
    };
    const currentStatus = statusInfo[mcpStatus];


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

const App = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState('sql');
    const [sql, setSql] = useState('');
    const [terminalOutput, setTerminalOutput] = useState(['Welcome to the MCP Terminal.']);
    const [config, setConfig] = useState({
        aiProvider: 'Google Gemini',
        geminiApiKey: '',
        openAiApiKey: '',
        connectionString: '',
        mcpApiKey: '',
        mcpProjectId: '',
        mcpServiceId: '',