import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface TerminalPanelProps {
    output: string[];
    onCommand: (command: string) => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ output, onCommand }: TerminalPanelProps) => {
    const [input, setInput] = useState('');
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

export default TerminalPanel;