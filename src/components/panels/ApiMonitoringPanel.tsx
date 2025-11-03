import React from 'react';

interface ApiEndpoint {
    id: number;
    url: string;
    status?: string;
}

interface ApiMonitoringPanelProps {
    endpoints: ApiEndpoint[];
}

const ApiMonitoringPanel: React.FC<ApiMonitoringPanelProps> = ({ endpoints }: ApiMonitoringPanelProps) => {
    const eventLog = [
        { time: '14:32:10', event: 'Response Handling', message: 'Result cached successfully.' },
        { time: '14:32:09', event: 'Execute Query', message: 'Query sent to Live API.' },
        { time: '14:32:08', event: 'Route Decision', message: 'API is live, routing to Live API.' },
        { time: '14:32:08', event: 'API Health Check', message: 'CoinGecko is available (200 OK).' },
    ];

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'Live': return 'text-green-400';
            case 'Rate-Limited': return 'text-yellow-400';
            case 'Offline': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getHostname = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

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

export default ApiMonitoringPanel;