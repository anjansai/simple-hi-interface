
import React, { useState } from 'react';
import ChatBubble, { Message } from '@/components/ChatBubble';
import MessageInput from '@/components/MessageInput';
import ChatHeader from '@/components/ChatHeader';
import { getBotResponse, generateId, initialMessages } from '@/lib/chat';
import { useToast } from '@/components/ui/use-toast';

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { toast } = useToast();
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: generateId(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: generateId(),
        content: getBotResponse(),
        sender: 'other',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      toast({
        title: "New Message",
        description: "You received a new message"
      });
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 flex flex-col">
      <div className="flex-1 flex flex-col shadow-lg rounded-lg overflow-hidden">
        <ChatHeader />
        
        <div className="flex-1 p-4 overflow-y-auto bg-background">
          <div className="space-y-4">
            {messages.map(message => (
              <ChatBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default Index;
