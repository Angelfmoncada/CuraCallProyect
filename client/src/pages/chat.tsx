import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import { MessageList } from "@/components/chat/MessageList";
import { InputBar } from "@/components/chat/InputBar";
import { useWebLLM } from "@/hooks/useWebLLM";
import { useHistory } from "@/store/history";
import { Button } from "@/components/ui/button";
import type { Message } from "@shared/schema";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { chat, ready } = useWebLLM();
  const { addConversation, currentConversation, setCurrentConversation } = useHistory();

  useEffect(() => {
    // Check for pending message from dashboard
    const pendingMessage = localStorage.getItem('pendingMessage');
    if (pendingMessage) {
      localStorage.removeItem('pendingMessage');
      handleSendMessage(pendingMessage);
    }

    // Load current conversation if exists
    if (currentConversation) {
      setMessages(currentConversation.messages as Message[]);
    }
  }, [currentConversation]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const response = await chat(newMessages.map(m => ({ role: m.role, content: m.content })));
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // Save to history
      if (finalMessages.length === 2) {
        // New conversation
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
        const conversationId = addConversation(title, finalMessages);
        setCurrentConversation(conversationId);
      } else {
        // Update existing conversation
        if (currentConversation) {
          // This would update the conversation in storage
          console.log("Update conversation:", currentConversation.id, finalMessages);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Handle error state
    } finally {
      setIsTyping(false);
    }
  };

  const handleArchiveMessage = (messageId: string) => {
    console.log("Archive message:", messageId);
    // Implement message archiving
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter(m => m.id !== messageId));
  };

  const handleArchiveConversation = () => {
    if (currentConversation) {
      console.log("Archive conversation:", currentConversation.id);
      // Implement conversation archiving
    }
  };

  const handleDeleteConversation = () => {
    if (currentConversation) {
      console.log("Delete conversation:", currentConversation.id);
      setMessages([]);
      setCurrentConversation(null);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl h-full flex flex-col px-6 py-8">
      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-2xl font-semibold">Chat Assistant</h1>
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleArchiveConversation}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="button-archive-conversation"
          >
            <Archive className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDeleteConversation}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            data-testid="button-delete-conversation"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex-1 mb-6"
      >
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onArchiveMessage={handleArchiveMessage}
          onDeleteMessage={handleDeleteMessage}
        />
      </motion.div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InputBar
          onSendMessage={handleSendMessage}
          disabled={!ready || isTyping}
          placeholder="Type your message..."
        />
      </motion.div>
    </div>
  );
}
