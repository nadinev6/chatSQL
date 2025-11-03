import { GoogleGenAI, Type } from "@google/genai";

export interface Config {
    aiProvider: string;
    geminiApiKey: string;
    openAiApiKey: string;
    connectionString: string;
    mcpApiKey: string;
    mcpProjectId: string;
    mcpServiceId: string;
    apiEndpoints: { id: number; url: string; status?: string }[];
}

export class AiService {
    static async generateSql(input: string, config: Config): Promise<string> {
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
                        { role: 'user', content: input }
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
                return args.sql;
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
                contents: input,
                config: {
                  systemInstruction: systemInstruction,
                  tools: [{ functionDeclarations: [executeSqlToolGemini] }],
                },
            });

            const functionCall = response.functionCalls?.[0];
            if (!functionCall || functionCall.name !== 'execute_sql' || !functionCall.args.sql) {
                throw new Error("Did not receive the expected tool call from Gemini.");
            }
            return functionCall.args.sql;
        }
    }
}