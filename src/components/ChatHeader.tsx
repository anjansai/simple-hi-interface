
import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatHeader: React.FC = () => {
  return (
    <div className="flex items-center gap-3 p-4 border-b bg-card rounded-t-lg">
      <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
        <MessageCircle size={20} />
      </div>
      <div>
        <h2 className="font-medium text-lg">Chat Assistant</h2>
        <p className="text-sm text-muted-foreground">Online</p>
      </div>
    </div>
  );
};

export default ChatHeader;
