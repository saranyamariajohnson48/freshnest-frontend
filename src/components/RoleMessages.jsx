import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiMessageSquare, FiSearch, FiSend, FiLoader } from 'react-icons/fi';
import chatService from '../services/chatService';
import useAuth from '../hooks/useAuth';

// Shared lightweight chat component for Supplier/Staff: only talks to Admin
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDay = (d) => {
  const date = new Date(d);
  const today = new Date();
  const diff = (new Date(today.toDateString()) - new Date(date.toDateString())) / 86400000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

export default function RoleMessages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [polling, setPolling] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);
  const pollRef = useRef(null);

  const loadOrCreateWithAdmin = async () => {
    setLoading(true);
    try {
      // Fetch my conversations; prefer the one with admin
      const { conversations } = await chatService.listConversations();
      const adminConvo = (conversations || []).find(c => (c.participants || []).some(p => ['admin', 'Admin'].includes(p.role)));
      if (adminConvo) {
        setConvo(adminConvo);
      } else {
        // Find admin id by trying to start with a dummy; the API requires participantId.
        // Here we will pick the first admin from existing conversations list (none),
        // so we fallback to a simple approach: show an instruction to admin to initiate first.
        // Alternatively, backend could expose an endpoint to fetch an admin user.
        // For now, we gracefully handle no conversation and rely on admin to start.
        setConvo(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!convo) return;
    try {
      const { messages } = await chatService.getMessages(convo._id, { limit: 100 });
      setMessages(messages || []);
      await chatService.markAsRead(convo._id);
      requestAnimationFrame(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrCreateWithAdmin();
  }, []);

  useEffect(() => {
    if (!convo) return;
    loadMessages();
    setPolling(true);
    pollRef.current = setInterval(() => loadMessages(), 5000);
    return () => { setPolling(false); if (pollRef.current) clearInterval(pollRef.current); };
  }, [convo?._id]);

  const handleSend = async () => {
    if (!text.trim() || !convo || sending) return;
    try {
      setSending(true);
      const { message } = await chatService.sendMessage(convo._id, { text: text.trim() });
      setText('');
      setMessages(prev => [...prev, message]);
      await chatService.markAsRead(convo._id);
      requestAnimationFrame(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' }));
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const grouped = useMemo(() => {
    const groups = [];
    let day = '';
    messages.forEach(m => {
      const d = formatDay(m.createdAt);
      if (d !== day) { groups.push({ type: 'day', key: d }); day = d; }
      groups.push({ type: 'msg', data: m });
    });
    return groups;
  }, [messages]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
        <FiMessageSquare className="w-5 h-5 text-emerald-600" />
        <div className="font-semibold text-slate-900">Messages with Admin</div>
        {polling && <FiLoader className="w-4 h-4 ml-1 animate-spin text-slate-500" />}
      </div>

      {!convo && !loading && (
        <div className="p-6 text-center text-slate-600">
          No conversation with Admin yet. Please wait until Admin starts a conversation.
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-slate-500">Loading...</div>
      ) : convo ? (
        <>
          <div ref={scrollerRef} className="h-[55vh] overflow-y-auto p-4 space-y-2 bg-white">
            {grouped.map((g, i) => g.type === 'day' ? (
              <div key={`d-${g.key}-${i}`} className="sticky top-0 z-10 flex justify-center my-2">
                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{g.key}</span>
              </div>
            ) : (
              <div key={g.data._id} className={`flex ${String(g.data.sender?._id || g.data.sender) === String(user?._id) ? 'justify-end' : 'justify-start'} px-1`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${String(g.data.sender?._id || g.data.sender) === String(user?._id) ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                  {g.data.text}
                  <div className={`text-[10px] mt-1 ${String(g.data.sender?._id || g.data.sender) === String(user?._id) ? 'text-white/80' : 'text-gray-500'}`}>{formatTime(g.data.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Type a message to Admin..."
                rows={1}
                className="flex-1 resize-none border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button disabled={sending} onClick={handleSend} className={`px-4 py-2 rounded-lg inline-flex items-center space-x-2 ${sending ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white`}>
                <FiSend className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}