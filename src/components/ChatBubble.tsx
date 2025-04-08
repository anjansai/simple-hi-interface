
import React from 'react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(message.timestamp);

  return (
    <div className={cn(
      "message-bubble mb-2",
      isUser ? "message-bubble-right ml-auto" : "message-bubble-left"
    )}>
      <div className={cn(
        "px-4 py-2 rounded-2xl",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-secondary text-secondary-foreground"
      )}>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
      <div className={cn(
        "text-xs mt-1",
        isUser ? "text-right text-muted-foreground" : "text-left text-muted-foreground"
      )}>
        {formattedTime}
      </div>
    </div>
  );
};

export default ChatBubble;
