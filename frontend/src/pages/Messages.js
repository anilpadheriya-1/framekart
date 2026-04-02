import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, MessageSquare, User } from "lucide-react";
import { messagesAPI } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

export default function Messages() {
  const { convId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();
  const pollRef = useRef();

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await messagesAPI.listConversations();
      setConversations(data);
      if (convId && !activeConv) {
        const found = data.find((c) => c.id === convId);
        if (found) setActiveConv(found);
      }
    } catch {}
  }, [convId, activeConv]);

  const loadMessages = useCallback(async (conv) => {
    if (!conv) return;
    try {
      const { data } = await messagesAPI.getMessages(conv.id);
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {}
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (convId && conversations.length) {
      const found = conversations.find((c) => c.id === convId);
      if (found && found.id !== activeConv?.id) {
        setActiveConv(found);
        loadMessages(found);
      }
    }
  }, [convId, conversations]);

  useEffect(() => {
    if (!activeConv) return;
    loadMessages(activeConv);
    pollRef.current = setInterval(() => loadMessages(activeConv), 30000);
    return () => clearInterval(pollRef.current);
  }, [activeConv, loadMessages]);

  const selectConv = (conv) => {
    setActiveConv(conv);
    navigate(`/messages/${conv.id}`);
    loadMessages(conv);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      await messagesAPI.send({ conversation_id: activeConv.id, content: input.trim() });
      setInput("");
      await loadMessages(activeConv);
      loadConversations();
    } catch {} finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-6 py-0 sm:py-8">
      <div className="flex h-[calc(100vh-64px)] sm:h-[80vh] sm:rounded-3xl overflow-hidden border-0 sm:border border-zinc-800 bg-zinc-900">
        {/* Sidebar */}
        <div className={`w-full sm:w-80 border-r border-zinc-800 flex flex-col ${activeConv ? "hidden sm:flex" : "flex"}`}>
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-display font-bold text-zinc-100">Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 p-6 text-center">
                <MessageSquare size={40} className="mb-3 opacity-30" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : conversations.map((conv) => {
              const other = conv.other_user;
              const unread = conv.unread?.[user.id] || 0;
              return (
                <button key={conv.id} onClick={() => selectConv(conv)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-all text-left
                    ${activeConv?.id === conv.id ? "bg-zinc-800/80" : ""}`}>
                  {other?.avatar
                    ? <img src={other.avatar} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-emerald-400 font-bold text-sm">{other?.name?.[0]?.toUpperCase() || "?"}</span>
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-zinc-200 truncate">{other?.name || "Unknown"}</span>
                      <span className="text-xs text-zinc-600 flex-shrink-0">{timeAgo(conv.updated_at)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-zinc-500 truncate">{conv.last_message || "Start a conversation"}</span>
                      {unread > 0 && (
                        <span className="w-5 h-5 bg-emerald-500 rounded-full text-[10px] font-bold text-black flex items-center justify-center flex-shrink-0 ml-1">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!activeConv ? "hidden sm:flex" : "flex"}`}>
          {activeConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b border-zinc-800">
                <button onClick={() => { setActiveConv(null); navigate("/messages"); }}
                  className="sm:hidden p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800">
                  ←
                </button>
                {activeConv.other_user?.avatar
                  ? <img src={activeConv.other_user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <User size={16} className="text-emerald-400" />
                    </div>
                }
                <div>
                  <div className="font-semibold text-zinc-100 text-sm">{activeConv.other_user?.name}</div>
                  <div className="text-xs text-zinc-500">Active</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-zinc-600 text-sm py-8">No messages yet. Say hello!</div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={isMine ? "msg-bubble-sent" : "msg-bubble-recv"}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-emerald-400/60 text-right" : "text-zinc-500"}`}>
                          {timeAgo(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={send} className="p-4 border-t border-zinc-800 flex gap-3">
                <input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="input-base flex-1 text-sm" />
                <button type="submit" disabled={!input.trim() || sending}
                  className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
              <MessageSquare size={48} className="mb-4 opacity-20" />
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
