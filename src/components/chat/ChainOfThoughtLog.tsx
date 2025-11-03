import React from 'react';
import { Loader, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

interface Step {
    id: number;
    text: string;
    status: 'pending' | 'completed' | 'confirmation' | 'error';
}

interface ChainOfThoughtLogProps {
    steps: Step[];
}

const ChainOfThoughtLog: React.FC<ChainOfThoughtLogProps> = ({ steps }: ChainOfThoughtLogProps) => {
    const getStatusIcon = (status: string) => {
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

export default ChainOfThoughtLog;