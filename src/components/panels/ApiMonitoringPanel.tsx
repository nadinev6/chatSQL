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
    const [eventLog, setEventLog] = React.useState<Array<{time: string, event: string, message: string}>>([
        { time: '14:32:10', event: 'Response Handling', message: 'Result cached successfully.' },
        { time: '14:32:09', event: 'Execute Query', message: 'Query sent to Live API.' },
        { time: '14:32:08', event: 'Route Decision', message: 'API is live, routing to Live API.' },
        { time: '14:32:08', event: 'API Health Check', message: 'CoinGecko is available (200 OK).' },
    ]);

    // Real API monitoring functionality
    const checkApiHealth = async (url: string): Promise<{ status: string; responseTime?: number; error?: string }> => {
        const startTime = Date.now();
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ChatSQL-API-Monitor/1.0'
                },
                // Add timeout
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
                return { status: 'Live', responseTime };
            } else if (response.status === 429) {
                return { status: 'Rate-Limited', responseTime };
            } else {
                return { status: 'Offline', responseTime, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    return { status: 'Offline', responseTime, error: 'Timeout' };
                }
                return { status: 'Offline', responseTime, error: error.message };
            }
            return { status: 'Offline', responseTime, error: 'Unknown error' };
        }
    };

    const addEventLog = (event: string, message: string) => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        setEventLog((prev: Array<{time: string, event: string, message: string}>) => [{
            time,
            event,
            message
        }, ...prev.slice(0, 9)]); // Keep only last 10 events
    };

    // Monitor APIs periodically
    React.useEffect(() => {
        const monitorAPIs = async () => {
            for (const endpoint of endpoints) {
                try {
                    const result = await checkApiHealth(endpoint.url);
                    addEventLog('API Health Check', `${getHostname(endpoint.url)}: ${result.status}${result.responseTime ? ` (${result.responseTime}ms)` : ''}${result.error ? ` - ${result.error}` : ''}`);
                } catch (error) {
                    addEventLog('API Health Check', `${getHostname(endpoint.url)}: Failed to check`);
                }
            }
        };

        // Initial check
        if (endpoints.length > 0) {
            monitorAPIs();
        }

        // Set up periodic monitoring every 30 seconds
        const interval = setInterval(() => {
            if (endpoints.length > 0) {
                monitorAPIs();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [endpoints]);

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
                {eventLog.map((log: {time: string, event: string, message: string}, index: number) => (
                    <p key={index}><span className="text-gray-500">{log.time}</span> <span className="text-blue-400">{log.event}:</span> <span className="text-gray-300">{log.message}</span></p>
                ))}
            </div>
        </div>
    );
};

export default ApiMonitoringPanel;