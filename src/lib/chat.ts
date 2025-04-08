
import { Message } from '@/components/ChatBubble';

// Sample bot responses
const botResponses = [
  "Hi there! How can I help you today?",
  "That's interesting! Tell me more.",
  "I understand. Is there anything else you'd like to discuss?",
  "Great question! Let me think about that.",
  "I'm here to help with any questions you might have.",
  "Thanks for chatting with me today!",
  "I appreciate your message.",
  "Let me know if you need anything else.",
  "I'm still learning, but I'll do my best to assist you.",
  "That's a good point. I hadn't thought about it that way before."
];

// Generate a random response from the bot
export const getBotResponse = (): string => {
  const randomIndex = Math.floor(Math.random() * botResponses.length);
  return botResponses[randomIndex];
};

// Generate a unique ID for messages
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initial messages for the chat
export const initialMessages: Message[] = [
  {
    id: generateId(),
    content: "Hi there! How can I help you today?",
    sender: 'other',
    timestamp: new Date(Date.now() - 60000)
  }
];
