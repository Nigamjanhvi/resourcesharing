import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatSidebar, MessageBubble, TypingIndicator } from '../components/chat/index';
import { useMessages } from '../hooks';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { joinConversation, leaveConversation, onMessage, emitTyping, onTyping } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [inputMsg, setInputMsg] = useState('');
  const [typingUser, setTypingUser] = useState(null);
  const { messages, addMessage, sendMessage, isLoading: msgsLoading } = useMessages(conversationId);

  // New conversation state
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/messages/conversations');
        setConversations(data.data.conversations);
      } catch { }
      finally { setLoadingConvs(false); }
    };
    load();
  }, [conversationId]);

 useEffect(() => {
  if (!conversationId) return;

  joinConversation(conversationId);

  const unsub = onMessage((msg) => addMessage(msg));

  const unsubTyping = onTyping(({ userId: uid, isTyping: t }) => {
    if (uid !== user?._id) setTypingUser(t ? uid : null);
  });

  return () => {
    leaveConversation(conversationId);
    unsub?.();
    unsubTyping?.();
  };
}, [conversationId, joinConversation, leaveConversation, onMessage, onTyping, addMessage, user?._id]);
  // Search users for new conversation
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.data.users.filter(u => u._id !== user?._id));
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleSend = async () => {
    if (!inputMsg.trim()) return;
    const msg = inputMsg;
    setInputMsg('');
    emitTyping(conversationId, false);
    const result = await sendMessage(msg);
    if (!result.success) toast.error('Failed to send message');
  };

  const startConversation = async (recipientId, recipientName) => {
    try {
      const { data } = await api.post('/messages', {
        recipientId,
        content: `Hi ${recipientName}! 👋`,
      });
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      navigate(`/messages/${data.data.conversationId}`);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const activeConv = conversations.find((c) => c._id === conversationId);
  const other = activeConv?.otherParticipant;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 120px)', minHeight: 500 }}>
      <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '16px 0 0 16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 15, fontFamily: "'Syne', sans-serif" }}>Messages</span>
          <button onClick={() => setShowNewChat(true)} style={{
            background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', border: 'none',
            borderRadius: 8, padding: '5px 10px', color: '#fff', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          }}>+ New</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <ChatSidebar conversations={conversations} isLoading={loadingConvs} />
        </div>
      </div>
      <div style={{ background: '#0F172A', border: '1px solid #334155', borderLeft: 'none', borderRadius: '0 16px 16px 0', display: 'flex', flexDirection: 'column' }}>
        {conversationId && other ? (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>
                {other.firstName?.charAt(0)}{other.lastName?.charAt(0)}
              </div>
              <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>{other.firstName} {other.lastName}</div>
            </div>
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {msgsLoading
                ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>
                : messages.map((msg) => <MessageBubble key={msg._id} message={msg} isOwn={msg.sender?._id === user?._id || msg.sender === user?._id} />)
              }
              {typingUser && <TypingIndicator name={other.firstName} />}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', display: 'flex', gap: 10 }}>
              <input value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder="Type a message..." style={{ flex: 1, background: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif" }} />
              <button onClick={handleSend} style={{ background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', border: 'none', borderRadius: 12, padding: '10px 16px', color: '#fff', cursor: 'pointer', fontSize: 18 }}>➤</button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>💬</div>
            <p>Select a conversation or start a new one</p>
            <button onClick={() => setShowNewChat(true)} style={{
              marginTop: 12, background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', border: 'none',
              borderRadius: 12, padding: '10px 20px', color: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            }}>Start New Conversation</button>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {showNewChat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNewChat(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 16, padding: 24, width: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#F1F5F9', fontFamily: "'Syne', sans-serif", fontSize: 18, margin: '0 0 16px' }}>New Conversation</h3>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name..."
              autoFocus
              style={{ width: '100%', background: '#0F172A', border: '1px solid #334155', borderRadius: 10, padding: '10px 14px', color: '#F1F5F9', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', marginBottom: 12 }}
            />
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 300 }}>
              {searching && <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>Searching...</div>}
              {!searching && searchQuery && searchResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>No users found</div>
              )}
              {searchResults.map((u) => (
                <div key={u._id} onClick={() => startConversation(u._id, u.firstName)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(14,165,233,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                  </div>
                  <div>
                    <div style={{ color: '#F1F5F9', fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                    <div style={{ color: '#64748B', fontSize: 12 }}>🏫 {u.university || 'University'}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNewChat(false)} style={{
              marginTop: 12, background: 'transparent', border: '1px solid #334155',
              borderRadius: 10, padding: '8px', color: '#94A3B8', cursor: 'pointer',
              fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
