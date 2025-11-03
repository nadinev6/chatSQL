import React from 'react';
import { Clipboard, Play, Download } from 'lucide-react';
import VisualSchemaViewer from '../panels/VisualSchemaViewer';
import ApiMonitoringPanel from '../panels/ApiMonitoringPanel';
import { Config } from '../../clients/AiService';

interface TabbedPanelProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    sql: string;
    setSql: (sql: string) => void;
    apiEndpoints: Config['apiEndpoints'];
}

const TabbedPanel: React.FC<TabbedPanelProps> = ({ activeTab, setActiveTab, sql, setSql, apiEndpoints }: TabbedPanelProps) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(sql);
    };

    const handleExecute = () => {
        alert("Execution functionality needs to be connected to a backend.");
    };

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

export default TabbedPanel;