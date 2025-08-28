import { motion } from "framer-motion";
import { Archive, Trash2 } from "lucide-react";
import { useHistory } from "@/store/history";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function History() {
  const { conversations, deleteConversation, archiveConversation, setCurrentConversation } = useHistory();
  const [, setLocation] = useLocation();

  const handleConversationClick = (conversationId: string) => {
    setCurrentConversation(conversationId);
    setLocation('/chat');
  };

  const handleArchive = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    archiveConversation(conversationId);
  };

  const handleDelete = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    deleteConversation(conversationId);
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold mb-6"
      >
        Conversation History
      </motion.h1>
      
      {conversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-muted-foreground">No conversations yet. Start chatting to see your history here.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation, index) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => handleConversationClick(conversation.id)}
              data-testid={`conversation-${conversation.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-2">{conversation.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {conversation.messages.length > 0 
                      ? (conversation.messages[0] as any).content.slice(0, 100) + '...'
                      : 'Empty conversation'
                    }
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(conversation.createdAt)}</span>
                    <span>{conversation.messages.length} messages</span>
                    {conversation.archived && (
                      <span className="px-2 py-1 bg-muted rounded-full">Archived</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleArchive(e, conversation.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    data-testid={`button-archive-${conversation.id}`}
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleDelete(e, conversation.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    data-testid={`button-delete-${conversation.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
