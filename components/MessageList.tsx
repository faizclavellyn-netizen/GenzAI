import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '../types';
import { BotAvatar } from './Icons';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

// Bouncing Logo Component for Loading State
const ThinkingIndicator = () => (
  <div className="flex items-center gap-2 py-2 animate-fade-in pl-1">
    <div className="relative">
       <img 
         src="https://img.icons8.com/?size=100&id=9zVjmNkFCnhC&format=png&color=ffffff" 
         className="w-8 h-8 object-contain animate-bounce"
         alt="Thinking..."
       />
       {/* Soft glow/shadow underneath the bounce */}
       <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-purple-500/30 rounded-full blur-[2px] animate-pulse"></div>
    </div>
  </div>
);

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {/* Only show static BotAvatar if we have text (not thinking mode) */}
          {msg.role === 'model' && msg.text && <BotAvatar />}
          
          <div 
            className={`
              max-w-[85%] md:max-w-[75%]
              ${msg.role === 'user' 
                ? 'text-right' // User: Just aligned text
                : 'text-left'} // Model: Standard alignment
            `}
          >
            {msg.role === 'user' ? (
              // User: No bubble, just text
              <div className="flex flex-col items-end gap-2">
                {msg.attachment && (
                  <div className="relative rounded-2xl overflow-hidden mb-1 border border-white/10 shadow-lg max-w-[250px]">
                    <img 
                      src={`data:${msg.attachment.mimeType};base64,${msg.attachment.data}`} 
                      alt="User uploaded" 
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}
                {msg.text && (
                  <p className="text-lg text-neutral-200 leading-relaxed font-light">{msg.text}</p>
                )}
              </div>
            ) : (
              // Model: Markdown with styling
              <div className="rounded-2xl rounded-tl-sm px-0 py-0 text-sm leading-relaxed text-neutral-300">
                {msg.text ? (
                  <ReactMarkdown 
                    className="prose prose-sm prose-invert max-w-none break-words"
                    components={{
                      code({node, inline, className, children, ...props}: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline ? (
                          <div className="relative my-4 rounded-lg overflow-hidden border border-neutral-700/50 bg-neutral-950">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-xs text-neutral-400">
                              <span className="font-mono">{match ? match[1] : 'code'}</span>
                            </div>
                            <div className="overflow-x-auto p-4">
                               <code className={`${className} bg-transparent p-0 text-sm`} {...props}>
                                {children}
                              </code>
                            </div>
                          </div>
                        ) : (
                          <code className={`${className} font-mono text-purple-300 bg-neutral-800 px-1.5 py-0.5 rounded text-[0.9em]`} {...props}>
                            {children}
                          </code>
                        );
                      },
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 my-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      p: ({node, ...props}) => <p className="mb-3 last:mb-0 leading-7 text-neutral-300" {...props} />,
                      a: ({node, ...props}) => <a className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-5 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-4 mb-2" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-purple-500 pl-4 py-1 my-4 bg-neutral-800/30 italic text-neutral-400 rounded-r" {...props} />,
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  // Streaming hasn't started yet or text is empty -> Show Bouncing Logo
                  <ThinkingIndicator />
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Fallback loading state for rare latency cases */}
      {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
        <div className="flex justify-start">
           <ThinkingIndicator />
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
};

export default MessageList;