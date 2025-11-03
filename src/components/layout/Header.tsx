import React from 'react';
import { Settings } from 'lucide-react';

interface HeaderProps {
    onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }: HeaderProps) => (
    <header className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center">
            <img src="icon.png" alt="ChatSQL Icon" className="w-6 h-6 mr-2" />
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

export default Header;