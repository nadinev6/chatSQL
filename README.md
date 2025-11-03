# ChatSQL

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4479A1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white)](https://openai.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

ChatSQL is an AI-powered, web-based tool that allows users to design database schemas using natural language. It provides an interactive chat interface to describe the desired schema, which is then converted into SQL `CREATE TABLE` statements. The application features a visual schema viewer, a SQL editor, and a real-time terminal for deploying changes via the Model Context Protocol (MCP) to Tiger Data's PostgreSQL platform.

## ✨ Features

*   **Natural Language to SQL**: Describe your database needs in plain English (e.g., "a blog with users and posts") and get a complete SQL schema.
*   **Interactive Chat**: A familiar chat interface powered by either Google Gemini or OpenAI models.
*   **Tool Calling**: The AI uses function calling to propose a SQL script, which requires user confirmation before execution.
*   **Visual Schema Viewer**: See a graphical representation of your generated schema, including tables and their relationships.
*   **SQL Editor**: View, edit, copy, or download the generated SQL script.
*   **Real-time Streaming Terminal**: Executes database operations directly on Tiger Data's PostgreSQL platform via MCP, with live streaming updates and progress indicators.
*   **Configurable**: Easily switch between AI providers (Google Gemini, OpenAI) and configure API keys through the settings panel.
*   **API Monitoring**: A dedicated panel to add and monitor the status of external API endpoints (mocked).

## 🚀 Getting Started

This project is a single-page application built with React and Tailwind CSS, designed to run directly in a browser that supports ES modules.

### Prerequisites

You will need an API key from either Google (for the Gemini model) or OpenAI to use the core functionality.

### Running the Application

1.  Open the `index.html` file in a modern web browser.
2.  The application will load and you will be greeted by the ChatSQL interface.
3.  Click the **Settings** icon (⚙️) in the top-right corner.
4.  Navigate to the **Database** tab.
5.  Select your preferred **AI Provider** (Google Gemini or OpenAI).
6.  Enter your corresponding API key in the input field.
7.  (Optional) Configure the MCP settings under the **MCP Configuration** tab to simulate the database push functionality.
8.  Save your changes and close the settings modal.
9.  You can now start describing your desired database schema in the chat input!

## 🛠️ Tech Stack

*   **Frontend**: React.js
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **AI**:
    *   Google Gemini API (`@google/genai`)
    *   OpenAI API
*   **Database Integration**:
    *   Model Context Protocol (MCP) SDK (`@modelcontextprotocol/sdk`)
    *   SSE (Server-Sent Events) transport for real-time streaming
    *   Live database operations via Tiger Data PostgreSQL

    ## 🔄 Application Flow
    
    ```
    User Input → Chat Interface
        ↓
    AI Provider (Gemini/OpenAI) → SQL Generation
        ↓
    MCP Tools → SSE Transport → Tiger Data PostgreSQL (Streaming Execution)
        ↓
    Real-time Updates → Chat Interface (Live Database Operations + Schema Visualization)
    ```


## 📁 Project Structure

```
src/
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   └── ChainOfThoughtLog.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── SettingsModal.tsx
│   │   └── TabbedPanel.tsx
│   ├── panels/
│   │   ├── TerminalPanel.tsx
│   │   ├── ApiMonitoringPanel.tsx
│   │   └── VisualSchemaViewer.tsx
│   └── App.tsx
├── hooks/
│   ├── useChatLogic.ts
│   └── useMcpClient.ts
├── clients/
│   ├── MCPClient.ts
│   └── AiService.ts
├── utils/
│   ├── constants.ts
│   └── sqlParser.ts
└── index.tsx
database-server/
├── src/
│   └── index.ts
├── package.json
├── tsconfig.json
└── build/
    └── index.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Ready to build your database?** Choose your AI provider, describe your requirements in natural language, and let ChatSQL generate production-ready SQL schemas! 🚀