import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FiMessageSquare, FiSend, FiUsers, FiTruck, FiSearch, FiLoader } from 'react-icons/fi';
import chatService from '../services/chatService';
import staffService from '../services/staffService';
import supplierService from '../services/supplierService';
import { useToastContext } from '../contexts/ToastContext';
import useAuth from '../hooks/useAuth';

// Small helpers
const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDay = (d) => {
  const date = new Date(d);
  const today = new Date();
  const diff = (new Date(today.toDateString()) - new Date(date.toDateString())) / 86400000;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

const Avatar = ({ name = '', role = '', color = 'bg-emerald-600' }) => {
  const initials = name.trim().split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U';
  const roleColor = role === 'staff' ? 'bg-blue-100 text-blue-700' : role === 'supplier' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700';
  return (
    <div className="flex items-center space-x-2">
      <div className={`w-9 h-9 rounded-full ${color} text-white grid place-items-center text-sm font-semibold`}>{initials}</div>
      {role && <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleColor}`}>{role}</span>}
    </div>
  );
};

const AdminMessages = () => {
  const { user } = useAuth();
  const { error } = useToastContext();

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [composerText, setComposerText] = useState('');
  const [search, setSearch] = useState('');
  const [polling, setPolling] = useState(false);
  const [sending, setSending] = useState(false);
  const pollRef = useRef(null);
  const scrollerRef = useRef(null);

  // Load initial conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const { conversations } = await chatService.listConversations();
      setConversations(conversations || []);
    } catch (e) {
      console.error(e);
      error(e.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const { messages } = await chatService.getMessages(conversationId, { limit: 100 });
      setMessages(messages || []);
      await chatService.markAsRead(conversationId);
      // scroll to bottom
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadConversations();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Start/stop polling when a conversation is selected
  useEffect(() => {
    if (!selectedConvo) return;

    // Initial load
    loadMessages(selectedConvo._id);

    // Poll every 5s
    setPolling(true);
    pollRef.current = setInterval(() => {
      loadMessages(selectedConvo._id);
    }, 5000);

    return () => {
      setPolling(false);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConvo?._id]);

  const handleSend = async () => {
    const text = composerText.trim();
    if (!text || !selectedConvo || sending) return;
    try {
      setSending(true);
      const { message } = await chatService.sendMessage(selectedConvo._id, { text });
      setComposerText('');
      setMessages(prev => [...prev, message]);
      await chatService.markAsRead(selectedConvo._id);
      await loadConversations();
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (e) {
      error(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;
    const s = search.toLowerCase();
    return conversations.filter(c => {
      const others = (c.participants || []).filter(p => String(p._id) !== String(user?._id));
      const name = others.map(o => o.fullName || o.email).join(' ');
      return name.toLowerCase().includes(s);
    });
  }, [search, conversations, user]);

  // Group messages by day for clearer reading
  const grouped = useMemo(() => {
    const groups = [];
    let currentDay = '';
    messages.forEach(m => {
      const day = formatDay(m.createdAt);
      if (day !== currentDay) {
        groups.push({ type: 'day', key: day });
        currentDay = day;
      }
      groups.push({ type: 'msg', data: m });
    });
    return groups;
  }, [messages]);

  // Start a new conversation with a staff or supplier
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState('staff');
  const [pickerList, setPickerList] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const openPicker = async (tab) => {
    setPickerOpen(true);
    setPickerTab(tab);
    setPickerLoading(true);
    try {
      if (tab === 'staff') {
        const data = await staffService.getAllStaff({ limit: 100 });
        setPickerList((data?.data?.staff || data?.staff || []));
      } else {
        const data = await supplierService.getAllSuppliers({ status: 'active', limit: 100, role: 'supplier' });
        setPickerList((data?.users || []));
      }
    } catch (e) {
      console.error(e);
      error('Failed to load list');
    } finally {
      setPickerLoading(false);
    }
  };

  const startConversation = async (participantId) => {
    try {
      const { conversation } = await chatService.startConversation(participantId);
      setPickerOpen(false);
      await loadConversations();
      setSelectedConvo(conversation);
    } catch (e) {
      error(e.message || 'Failed to start conversation');
    }
  };

  const otherOf = (c) => (c?.participants || []).find(p => String(p._id) !== String(user?._id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations list */}
      <div className="bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden lg:col-span-1">
        <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FiMessageSquare className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            <div className="space-x-2">
              <button onClick={() => openPicker('staff')} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 inline-flex items-center space-x-1">
                <FiUsers className="w-4 h-4" />
                <span>New Staff</span>
              </button>
              <button onClick={() => openPicker('supplier')} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 inline-flex items-center space-x-1">
                <FiTruck className="w-4 h-4" />
                <span>New Supplier</span>
              </button>
            </div>
          </div>
          <div className="relative mt-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : (
            filteredConversations.map(c => {
              const other = otherOf(c);
              const active = selectedConvo && c._id === selectedConvo._id;
              return (
                <button key={c._id} onClick={() => setSelectedConvo(c)} className={`w-full text-left p-3 hover:bg-gray-50 ${active ? 'bg-gray-50' : ''}`}>
                  <div className="flex items-center space-x-3">
                    <Avatar name={other?.fullName || other?.email} role={other?.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900 truncate">{other?.fullName || other?.email}</div>
                        <div className="text-[10px] text-gray-400 ml-2 shrink-0">{c.updatedAt && new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="text-xs text-gray-500 truncate">{c.lastMessage?.text || 'No messages yet'}</div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden lg:col-span-2 flex flex-col min-h-[70vh]">
        {!selectedConvo ? (
          <div className="flex-1 grid place-items-center text-gray-500">
            <div className="text-center">
              <FiMessageSquare className="w-10 h-10 mx-auto mb-2" />
              <div>Select a conversation to start chatting</div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b bg-gradient-to-r from-white to-emerald-50">
              {(() => {
                const other = otherOf(selectedConvo);
                return (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar name={other?.fullName || other?.email} role={other?.role} />
                      <div>
                        <div className="font-semibold text-gray-900">{other?.fullName || other?.email}</div>
                        <div className="text-xs text-gray-500">{other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : ''} • Polling every 5s {polling ? <FiLoader className="inline w-3 h-3 animate-spin ml-1" /> : null}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div ref={scrollerRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
              {grouped.map((g, idx) => {
                if (g.type === 'day') {
                  return (
                    <div key={`day-${g.key}-${idx}`} className="sticky top-0 z-10 flex justify-center my-2">
                      <span className="text-[11px] font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                        {g.key}
                      </span>
                    </div>
                  );
                }
                const m = g.data;
                const mine = String(m.sender) === String(user?._id) || String(m.sender?._id) === String(user?._id);
                return (
                  <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} px-1`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow ${mine ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                      {m.text && <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>}
                      <div className={`text-[10px] mt-1 ${mine ? 'text-white/80' : 'text-gray-500'}`}>{formatTime(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t bg-white">
              <div className="flex items-end space-x-2">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Write a message..."
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
        )}
      </div>

      {/* New conversation picker */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
          <div className="bg-white rounded-xl border border-gray-200 w-[90vw] max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="w-5 h-5" />
                <div className="font-semibold">Start a conversation</div>
              </div>
              <button onClick={() => setPickerOpen(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="flex items-center space-x-2 mb-3">
              <button onClick={() => openPicker('staff')} className={`px-3 py-1.5 border rounded-lg text-sm ${pickerTab==='staff'?'bg-gray-100':''}`}>
                <FiUsers className="inline w-4 h-4 mr-1"/> Staff
              </button>
              <button onClick={() => openPicker('supplier')} className={`px-3 py-1.5 border rounded-lg text-sm ${pickerTab==='supplier'?'bg-gray-100':''}`}>
                <FiTruck className="inline w-4 h-4 mr-1"/> Supplier
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto divide-y">
              {pickerLoading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : (
                pickerList.map(item => (
                  <button key={item._id || item.id} onClick={() => startConversation(item._id || item.id)} className="w-full text-left p-3 hover:bg-gray-50">
                    <div className="font-medium">{item.fullName || item.name || item.email}</div>
                    <div className="text-xs text-gray-500">{item.email || ''}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;