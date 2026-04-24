"use client";
import React, { useState, useRef, useEffect } from "react";
import { useAppContext } from "@/components/AppProvider";
import { MessageSquare, Hash, Search, Send, Plus, MoreVertical, Building2 } from "lucide-react";
import Image from "next/image";

export default function DiscussionsPage() {
  const { discussions, messages, users, projects, addDiscussion, addMessage } = useAppContext();
  
  // By default select the first discussion, or null if none
  const [activeThreadId, setActiveThreadId] = useState<string | null>(discussions[0]?.id || null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadProjectId, setNewThreadProjectId] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeThreadId]);

  const activeDiscussion = discussions.find(d => d.id === activeThreadId);
  const activeMessages = messages.filter(m => m.discussionId === activeThreadId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const activeProject = projects.find(p => p.id === activeDiscussion?.projectId);

  // We are currently viewing as user 1 for demo purposes
  const currentUser = users[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeThreadId) return;
    addMessage({
      discussionId: activeThreadId,
      authorId: currentUser.id,
      content: newMessage.trim()
    });
    setNewMessage("");
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;
    addDiscussion({
      title: newThreadTitle.trim(),
      projectId: newThreadProjectId || null
    });
    setNewThreadTitle("");
    setNewThreadProjectId("");
    setShowNewThread(false);
    // The newly created discussion will be at the top, but we don't know its ID synchronously easily without restructuring, 
    // so we just let it appear in the list.
  };

  const formatMessageTime = (isoString: string) => {
    const d = new Date(isoString);
    if(isNaN(d.valueOf())) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-display-xl font-display-xl text-on-surface mb-1">Discussions</h2>
          <p className="text-body-md font-body-md text-on-surface-variant">Collaborate and chat with your team.</p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-surface-container-lowest border border-outline-variant/50 rounded-xl ambient-shadow">
        
        {/* Sidebar / Threads List */}
        <div className="w-80 border-r border-outline-variant/30 flex flex-col bg-surface-container-lowest shrink-0">
          <div className="p-4 border-b border-outline-variant/30 shrink-0">
            <button 
              onClick={() => setShowNewThread(true)}
              className="w-full bg-surface text-on-surface border border-outline-variant/50 hover:bg-surface-container-low transition-all duration-200 rounded-lg py-2.5 px-4 mb-4 flex items-center justify-center gap-2 font-label-sm text-label-sm shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus size={16} /> New Thread
            </button>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                type="text" 
                placeholder="Search threads..." 
                className="w-full bg-surface-container-low border border-transparent focus:border-primary/50 focus:bg-surface transition-colors rounded-lg py-2 pl-9 pr-4 outline-none text-body-md placeholder:text-on-surface-variant/70"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {discussions.map(discussion => {
              const proj = projects.find(p => p.id === discussion.projectId);
              const lastMsg = messages.filter(m => m.discussionId === discussion.id).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
              const author = lastMsg ? users.find(u => u.id === lastMsg.authorId) : null;
              
              return (
                <button 
                  key={discussion.id}
                  onClick={() => { setActiveThreadId(discussion.id); setShowNewThread(false); }}
                  className={`w-full text-left p-4 border-b border-outline-variant/10 transition-colors cursor-pointer group ${activeThreadId === discussion.id && !showNewThread ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-surface-container-low border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1 overflow-hidden">
                    <h4 className={`text-body-md font-body-md font-medium truncate pr-2 ${activeThreadId === discussion.id && !showNewThread ? 'text-primary' : 'text-on-surface'}`}>
                      {discussion.title}
                    </h4>
                    {lastMsg && (
                      <span className="text-label-sm font-label-sm text-on-surface-variant shrink-0 mt-0.5">
                        {formatMessageTime(lastMsg.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-outline mb-1.5">
                    {proj ? <><Building2 size={12}/> {proj.name}</> : <><Hash size={12}/> General</>}
                  </div>
                  <p className="text-label-sm font-label-sm text-on-surface-variant truncate">
                    {lastMsg ? <span className="text-on-surface opacity-80">{author?.name.split(' ')[0]}: </span> : ''}
                    {lastMsg ? lastMsg.content : 'No messages yet.'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-surface overflow-hidden relative">
          
          {showNewThread ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface-container-lowest">
               <div className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-xl p-6 ambient-shadow">
                 <h3 className="text-headline-md font-headline-md text-on-surface mb-6 flex items-center gap-2">
                   <MessageSquare size={20} className="text-primary" /> Start a New Thread
                 </h3>
                 <form onSubmit={handleCreateThread}>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Topic / Title</label>
                       <input autoFocus value={newThreadTitle} onChange={e => setNewThreadTitle(e.target.value)} placeholder="e.g. Brainstorming Q4 Goals" className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-4 py-2.5 outline-none focus:border-primary text-body-md transition-colors" required />
                     </div>
                     <div>
                       <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">Associated Project (Optional)</label>
                       <select value={newThreadProjectId} onChange={e => setNewThreadProjectId(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant/50 rounded-lg px-3 py-2.5 outline-none focus:border-primary text-body-md transition-colors cursor-pointer">
                         <option value="">-- General / No Project --</option>
                         {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                     </div>
                   </div>
                   <div className="mt-8 flex justify-end gap-3">
                     <button type="button" onClick={() => setShowNewThread(false)} className="px-4 py-2 rounded-lg text-body-md font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer">Cancel</button>
                     <button type="submit" className="px-4 py-2 rounded-lg text-body-md font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer shadow-sm">Start Discussion</button>
                   </div>
                 </form>
               </div>
            </div>
          ) : activeDiscussion ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md flex justify-between items-center shrink-0 z-10 sticky top-0">
                <div>
                  <h3 className="text-headline-md font-headline-md text-on-surface">{activeDiscussion.title}</h3>
                  <div className="flex items-center gap-2 text-label-sm font-label-sm text-primary mt-1">
                    {activeProject ? <><Building2 size={14}/> {activeProject.name}</> : <><Hash size={14}/> General Discussion</>}
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer">
                  <MoreVertical size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-outline-variant space-y-3">
                    <MessageSquare size={48} className="opacity-20" />
                    <p className="text-body-md">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  activeMessages.map((msg, idx) => {
                    const isCurrentUser = msg.authorId === currentUser.id;
                    const author = users.find(u => u.id === msg.authorId);
                    
                    // Group messages slightly if same user
                    const prevMsg = activeMessages[idx - 1];
                    const isSequential = prevMsg && prevMsg.authorId === msg.authorId && 
                      (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 5 * 60000); // within 5 mins

                    return (
                      <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : ''} ${isSequential ? 'mt-2' : ''}`}>
                        {!isSequential && author ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1 bg-surface-container shadow-sm">
                            <Image src={author.avatar} width={32} height={32} alt={author.name} className="w-full h-full object-cover" unoptimized/>
                          </div>
                        ) : (
                          <div className="w-8 shrink-0"></div>
                        )}
                        
                        <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                          {!isSequential && author && (
                            <div className="flex items-baseline gap-2 mb-1 pl-1 pr-1">
                              <span className="text-label-sm font-label-sm font-medium text-on-surface">{author.name}</span>
                              <span className="text-[10px] text-outline font-medium tracking-wide">{formatMessageTime(msg.timestamp)}</span>
                            </div>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl text-body-md font-body-md leading-relaxed shadow-sm ${
                            isCurrentUser 
                            ? 'bg-primary text-on-primary rounded-tr-sm' 
                            : 'bg-surface-container-lowest border border-outline-variant/50 text-on-surface rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3 relative">
                  <div className="flex-1 bg-surface border border-outline-variant/50 focus-within:border-primary/50 transition-colors rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <textarea 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      className="w-full max-h-32 min-h-[48px] bg-transparent outline-none p-3 text-body-md text-on-surface resize-none"
                      rows={1}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm cursor-pointer"
                  >
                    <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                  </button>
                </form>
                <p className="text-[10px] text-outline text-center mt-2.5">
                  <strong>Return</strong> to send, <strong>Shift + Return</strong> for new line.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-outline-variant">
              <MessageSquare size={48} className="opacity-20 mb-4" />
              <p className="text-body-md">Select a thread to start discussing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
