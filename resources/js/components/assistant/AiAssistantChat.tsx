import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { initialAssistantMessages, mockAssistantReply, type ChatMessage } from '@/data/mock';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useEffect, useRef, useState } from 'react';
import remarkGfm from 'remark-gfm';
import { Send, Sparkles } from 'lucide-react';

type AiAssistantChatProps = {
    embedded?: boolean;
};

function TypingBubble() {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                        style={{ animationDelay: `${i * 150}ms` }}
                    />
                ))}
            </span>
            Jade is typing…
        </div>
    );
}

function AiAssistantChat({ embedded = false }: AiAssistantChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>(initialAssistantMessages);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = (event: React.FormEvent) => {
        event.preventDefault();
        const text = input.trim();
        if (!text || isTyping) return;

        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date() },
        ]);
        setInput('');
        setIsTyping(true);

        window.setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: mockAssistantReply(text),
                    timestamp: new Date(),
                },
            ]);
            setIsTyping(false);
        }, 900);
    };

    return (
        <div className={cn('flex flex-col gap-3', embedded ? 'h-80' : 'h-[60vh]')}>
            <div ref={scrollRef} className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                {messages.map((message) =>
                    message.role === 'user' ? (
                        <div key={message.id} className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-jade px-4 py-2.5 text-sm text-jade-foreground">
                                {message.content}
                            </div>
                        </div>
                    ) : (
                        <div key={message.id} className="flex items-start gap-3">
                            <Avatar className="mt-0.5">
                                <AvatarFallback className="bg-jade text-jade-foreground">
                                    <Sparkles className="size-4" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-2.5">
                                <div className="typeset-docs [--typeset-size:14px]">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ),
                )}
                {isTyping && <TypingBubble />}
            </div>

            <form onSubmit={handleSend} className="flex items-center gap-2">
                <Input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask Jade about sales, inventory, products…"
                    className="h-10 rounded-full px-4 shadow-none"
                />
                <Button
                    type="submit"
                    size="icon"
                    className="size-10 shrink-0 rounded-full bg-jade text-jade-foreground hover:bg-jade/90"
                    disabled={!input.trim() || isTyping}
                >
                    <Send className="size-4" />
                </Button>
            </form>
        </div>
    );
}

export default AiAssistantChat;
