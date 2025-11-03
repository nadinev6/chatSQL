// --- Real MCP Client ---
// Uses the actual MCP SDK to communicate with MCP servers
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

interface Config {
    mcpApiKey?: string;
    mcpProjectId?: string;
    mcpServiceId?: string;
    connectionString?: string;
}

class MCPClient {
    isConnected: boolean;
    config: Config;
    onStatusChange: ((status: string) => void) | null;
    onTerminalOutput: ((message: string) => void) | null;
    private client: Client | null;
    private transport: StdioClientTransport | SSEClientTransport | null;

    constructor() {
        this.isConnected = false;
        this.config = {};
        this.onStatusChange = null;
        this.onTerminalOutput = null;
        this.client = null;
        this.transport = null;
    }

    async connect(config: Config, onStatusChange: (status: string) => void, onTerminalOutput: (message: string) => void) {
        this.config = config;
        this.onStatusChange = onStatusChange;
        this.onTerminalOutput = onTerminalOutput;

        this.onStatusChange('connecting');
        this._log('Attempting to connect to MCP server...');

        try {
            // Create MCP client and transport
            this.client = new Client(
                {
                    name: "chatsql-client",
                    version: "0.1.0",
                },
                {
                    capabilities: {
                        tools: {},
                        sampling: {},
                    },
                }
            );

            // Use SSE transport for real-time streaming communication
            // For Tiger Data MCP server, this would be their SSE endpoint
            this.transport = new SSEClientTransport(
                new URL("http://localhost:3001/sse") // Local MCP server endpoint
            );

            await this.client.connect(this.transport);

            this.isConnected = true;
            this.onStatusChange('connected');
            this._log('MCP connection successful. Real-time streaming enabled.');
        } catch (error) {
            // Fallback to stdio transport if SSE fails
            this._log('SSE connection failed, falling back to stdio transport...');
            try {
                this.transport = new StdioClientTransport({
                    command: "node",
                    args: ["database-server/build/index.js"],
                    env: {
                        DATABASE_URL: config.connectionString || '',
                    },
                });

                await this.client!.connect(this.transport);
                this.isConnected = true;
                this.onStatusChange('connected');
                this._log('MCP connection successful via stdio fallback.');
            } catch (fallbackError) {
                this.isConnected = false;
                this.onStatusChange('disconnected');
                this._log(`MCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    disconnect() {
        this.isConnected = false;
        if (this.client && this.transport) {
            try {
                this.client.close();
            } catch (error) {
                console.error('Error closing MCP client:', error);
            }
        }
        if (this.onStatusChange) this.onStatusChange('disconnected');
        this._log('MCP client disconnected.');
    }

    async executeCommand(command: string, params: any) {
        if (!this.isConnected || !this.client) {
            this._log('Error: MCP client is not connected.');
            return;
        }

        try {
            this._log(`> ${command}`);

            if (command === 'db:push') {
                // Use the MCP tool to execute database push with streaming
                const result = await this.client.callTool({
                    name: "db_push",
                    arguments: {
                        sql: params.sql,
                        connectionString: this.config.connectionString,
                    },
                });

                // Handle streaming result
                if (result && typeof result === 'object' && 'content' in result) {
                    const response = result as any;
                    if (response.content && response.content[0] && response.content[0].type === 'text') {
                        this._log(response.content[0].text);
                    }
                }
            } else if (command === 'execute_sql') {
                // Use the MCP tool to execute general SQL with streaming
                const result = await this.client.callTool({
                    name: "execute_sql",
                    arguments: {
                        sql: params.sql,
                        connectionString: this.config.connectionString,
                    },
                });

                // Handle streaming result
                if (result && typeof result === 'object' && 'content' in result) {
                    const response = result as any;
                    if (response.content && response.content[0] && response.content[0].type === 'text') {
                        this._log(response.content[0].text);
                    }
                }
            }
        } catch (error) {
            this._log(`Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    _log(message: string) {
        if (this.onTerminalOutput) {
            this.onTerminalOutput(`[MCP] ${message}`);
        }
    }
}

export default MCPClient;