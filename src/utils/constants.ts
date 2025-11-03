// Initial messages
export const INITIAL_MESSAGES = [
    { id: 1, text: "Welcome to ChatSQL! Describe a database schema you'd like to create. For example: 'A blog with users and posts'.", sender: 'ai' as const }
];

// Status definitions
export const STATUS_INFO = {
    disconnected: { text: "Disconnected", color: "red", icon: "WifiOff" },
    connecting: { text: "Connecting...", color: "yellow", icon: "Loader" },
    connected: { text: "Connected", color: "green", icon: "Wifi" }
};

// Event log mock data
export const EVENT_LOG = [
    { time: '14:32:10', event: 'Response Handling', message: 'Result cached successfully.' },
    { time: '14:32:09', event: 'Execute Query', message: 'Query sent to Live API.' },
    { time: '14:32:08', event: 'Route Decision', message: 'API is live, routing to Live API.' },
    { time: '14:32:08', event: 'API Health Check', message: 'CoinGecko is available (200 OK).' },
];