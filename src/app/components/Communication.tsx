import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Search, Send, Smile, Paperclip, Check, CheckCheck, X, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase, isConnected } from '../utils/supabase/client';

// ─── TYPES ───────────────────────────────────────────────────────────────────

type UserRole = 'farmer' | 'buyer';
type View = 'role' | 'users' | 'chat';

interface MockUser {
  id: string;
  name: string;
  role: UserRole;
  location: string;
  emoji: string;
  detail: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

// ─── MOCK USERS (fallback when Supabase not connected) ────────────────────────

const MOCK_USERS: MockUser[] = [
  { id: 'mock-001', name: 'Arun Kumar',     role: 'farmer', location: 'Thanjavur, TN',     emoji: '👨‍🌾', detail: 'Rice, Sugarcane'        },
  { id: 'mock-002', name: 'Priya Devi',     role: 'farmer', location: 'Coimbatore, TN',    emoji: '👩‍🌾', detail: 'Cotton, Maize'           },
  { id: 'mock-003', name: 'Ravi Sharma',    role: 'buyer',  location: 'Chennai, TN',        emoji: '🛒',   detail: 'Agro Foods Ltd'          },
  { id: 'mock-004', name: 'Suresh Patel',   role: 'farmer', location: 'Nashik, MH',         emoji: '👨‍🌾', detail: 'Grapes, Onion'           },
  { id: 'mock-005', name: 'Meena Reddy',    role: 'buyer',  location: 'Hyderabad, TS',      emoji: '🛒',   detail: 'FreshMart Pvt. Ltd'      },
  { id: 'mock-006', name: 'Vijay Singh',    role: 'farmer', location: 'Ludhiana, PB',       emoji: '👨‍🌾', detail: 'Wheat, Rice'             },
  { id: 'mock-007', name: 'Kavitha Nair',   role: 'buyer',  location: 'Kochi, KL',          emoji: '🛒',   detail: 'Kerala Agro Exports'     },
  { id: 'mock-008', name: 'Mohan Das',      role: 'farmer', location: 'Bhopal, MP',         emoji: '👨‍🌾', detail: 'Soybean, Wheat'          },
  { id: 'mock-009', name: 'Anita Verma',    role: 'buyer',  location: 'Mumbai, MH',         emoji: '🛒',   detail: 'City Grocery Chain'      },
  { id: 'mock-010', name: 'Ramesh Babu',    role: 'farmer', location: 'Guntur, AP',         emoji: '👨‍🌾', detail: 'Chilli, Cotton'          },
  { id: 'mock-011', name: 'Sunita Kaur',    role: 'buyer',  location: 'Delhi, DL',          emoji: '🛒',   detail: 'National Agri Traders'   },
  { id: 'mock-012', name: 'Kartik Nayak',   role: 'farmer', location: 'Cuttack, OD',        emoji: '👨‍🌾', detail: 'Rice, Potato'            },
];

const ONLINE_IDS = new Set(['mock-001', 'mock-003', 'mock-007', 'mock-010']);

// ─── AUTO-REPLY MESSAGES (mock mode only) ────────────────────────────────────

const FARMER_REPLIES = [
  'Hello! Good to hear from you.',
  'My crops are growing well this season 🌾',
  'I am using drip irrigation — very efficient!',
  'Have you tried organic fertilizer? Works great.',
  'When are you planning to harvest?',
  'The weather has been perfect for farming lately.',
  'Which variety of seeds are you using this year?',
  'I got a really good price at the local market.',
  'Let us connect at the next farming expo!',
  'The soil analysis report looks very promising.',
  'I need to check the market prices today.',
  'My yield this season is much better than last year!',
];

const BUYER_REPLIES = [
  'Hello! I am looking for quality produce.',
  'What is your asking price per quintal?',
  'Can you supply 10 tonnes this season?',
  'Our standards require Grade A produce only.',
  'I can arrange pickup directly from your farm.',
  'Do you have cold storage available?',
  'We are looking for reliable long-term suppliers.',
  'Let us discuss the contract terms in detail.',
  'What is the moisture content of your grain?',
  'Can you send a sample first?',
  'We pay within 7 days of delivery.',
  'Do you have an export license?',
];

// ─── EMOJI PICKER DATA ───────────────────────────────────────────────────────

const QUICK_EMOJIS = ['👍', '❤️', '😊', '🙏', '👌', '🌾', '🌱', '🚜', '💰', '📦', '✅', '🤝', '😄', '👏', '🎉'];

// ─── STORAGE HELPERS (mock mode) ─────────────────────────────────────────────

const STORAGE_KEY = 'farmvision_chat_v1';

function loadMessages(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch {}
}

function getConversation(myId: string, otherId: string, all: Message[]): Message[] {
  return all
    .filter(m => (m.senderId === myId && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === myId))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function getUnreadCount(myId: string, fromId: string, all: Message[]): number {
  return all.filter(m => m.senderId === fromId && m.receiverId === myId && !m.isRead).length;
}

function markConversationRead(myId: string, otherId: string, all: Message[]): Message[] {
  return all.map(m =>
    m.senderId === otherId && m.receiverId === myId && !m.isRead ? { ...m, isRead: true } : m
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

function formatLastSeen(iso: string): string {
  try {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return formatTime(iso);
  } catch { return ''; }
}

function getLastMessage(myId: string, otherId: string, all: Message[]): Message | null {
  const conv = getConversation(myId, otherId, all);
  return conv.length > 0 ? conv[conv.length - 1] : null;
}

// ─── SUPABASE ADAPTERS ────────────────────────────────────────────────────────

function adaptUser(row: Record<string, unknown>): MockUser {
  const role = row.role === 'buyer' ? 'buyer' : 'farmer';
  return {
    id: row.email as string,
    name: (row.full_name as string) ?? (row.email as string),
    role: role as UserRole,
    location: (row.location as string) ?? 'India',
    emoji: role === 'buyer' ? '🛒' : '👨‍🌾',
    detail: (row.detail as string) ?? (role === 'buyer' ? 'Buyer' : 'Farmer'),
  };
}

function adaptMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    receiverId: row.receiver_id as string,
    message: row.message as string,
    createdAt: row.created_at as string,
    isRead: row.is_read as boolean,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export function Communication() {
  const { user } = useAuth();
  // Use email as stable cross-browser identifier when Supabase is connected
  const myId = (isConnected ? (user?.email ?? null) : null) ?? user?.id ?? 'guest-user';
  const myName = (user?.user_metadata?.full_name as string | undefined) ?? 'FarmVision User';

  const [view, setView]                 = useState<View>('role');
  const [myRole, setMyRole]             = useState<UserRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [allMessages, setAllMessages]   = useState<Message[]>(() => isConnected ? [] : loadMessages());
  const [chatUsers, setChatUsers]       = useState<MockUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [newMessage, setNewMessage]     = useState('');
  const [search, setSearch]             = useState('');
  const [showEmoji, setShowEmoji]       = useState(false);
  const [isTyping, setIsTyping]         = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realtimeRef    = useRef<any>(null);

  // ── Supabase: register current user + load user list ──────────────────────
  useEffect(() => {
    if (!isConnected || !supabase || view !== 'users' || !myRole) return;

    setUsersLoading(true);

    (async () => {
      // Upsert current user into chat_users
      await supabase
        .from('chat_users')
        .upsert(
          { email: myId, full_name: myName, role: myRole, last_seen: new Date().toISOString() },
          { onConflict: 'email' }
        );

      // Load all other registered users
      const { data: users } = await supabase
        .from('chat_users')
        .select('*')
        .neq('email', myId)
        .order('last_seen', { ascending: false });

      setChatUsers(users?.map(r => adaptUser(r as Record<string, unknown>)) ?? []);

      // Load all messages where I am sender or receiver
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
        .order('created_at', { ascending: true });

      setAllMessages(msgs?.map(r => adaptMessage(r as Record<string, unknown>)) ?? []);
      setUsersLoading(false);
    })();

    // Subscribe: detect new users registering in real time
    const usersChannel = supabase
      .channel('farmvision-chat-users')
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'chat_users' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new as Record<string, unknown>;
          if (row.email !== myId) {
            setChatUsers(prev =>
              prev.find(u => u.id === row.email) ? prev : [adaptUser(row), ...prev]
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(usersChannel); };
  }, [view, myRole, myId, myName]);

  // ── Supabase: realtime messages subscription while in chat view ───────────
  useEffect(() => {
    if (!isConnected || !supabase || view !== 'chat' || !selectedUser) return;

    // Mark already-received messages as read
    supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', selectedUser.id)
      .eq('receiver_id', myId)
      .eq('is_read', false);

    setAllMessages(prev => markConversationRead(myId, selectedUser.id, prev));

    const channelName = `farmvision-msgs-${[myId, selectedUser.id].sort().join('__')}`;
    const channel = supabase
      .channel(channelName)
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${myId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const msg = adaptMessage(payload.new as Record<string, unknown>);
          if (msg.senderId === selectedUser.id) {
            setAllMessages(prev =>
              prev.find(m => m.id === msg.id) ? prev : [...prev, { ...msg, isRead: true }]
            );
            supabase?.from('messages').update({ is_read: true }).eq('id', msg.id);
          }
        }
      )
      .on(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'postgres_changes' as any,
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = adaptMessage(payload.new as Record<string, unknown>);
          setAllMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      realtimeRef.current = null;
    };
  }, [view, selectedUser, myId]);

  // ── Mock mode: sync to localStorage ──────────────────────────────────────
  useEffect(() => {
    if (!isConnected) saveMessages(allMessages);
  }, [allMessages]);

  // ── Auto-scroll to bottom on new messages ─────────────────────────────────
  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, view]);

  // ── Mock mode: poll for messages every 2s ─────────────────────────────────
  useEffect(() => {
    if (isConnected || view !== 'chat' || !selectedUser) return;
    const interval = setInterval(() => { setAllMessages(loadMessages()); }, 2000);
    return () => clearInterval(interval);
  }, [view, selectedUser]);

  // ── Mock mode: mark messages read when opening chat ───────────────────────
  useEffect(() => {
    if (!isConnected && view === 'chat' && selectedUser) {
      setAllMessages(prev => markConversationRead(myId, selectedUser.id, prev));
    }
  }, [view, selectedUser, myId]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function selectRole(role: UserRole) {
    setMyRole(role);
    setView('users');
  }

  function openChat(u: MockUser) {
    setSelectedUser(u);
    setView('chat');
    setSearch('');
    setShowEmoji(false);
  }

  function backToUsers() {
    setSelectedUser(null);
    setView('users');
    setNewMessage('');
    setShowEmoji(false);
    if (realtimeRef.current && supabase) {
      supabase.removeChannel(realtimeRef.current);
      realtimeRef.current = null;
    }
  }

  function backToRole() {
    setView('role');
    setMyRole(null);
    setSelectedUser(null);
    setSearch('');
  }

  const sendMessage = useCallback(async () => {
    const text = newMessage.trim();
    if (!text || !selectedUser) return;

    setNewMessage('');
    setShowEmoji(false);
    inputRef.current?.focus();

    if (isConnected && supabase) {
      // Optimistic update
      const optimisticId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: Message = {
        id: optimisticId,
        senderId: myId,
        receiverId: selectedUser.id,
        message: text,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setAllMessages(prev => [...prev, optimistic]);

      const { data } = await supabase
        .from('messages')
        .insert({ sender_id: myId, receiver_id: selectedUser.id, message: text, is_read: false })
        .select()
        .single();

      if (data) {
        setAllMessages(prev =>
          prev.map(m => m.id === optimisticId ? adaptMessage(data as Record<string, unknown>) : m)
        );
      }
    } else {
      // Mock mode: localStorage + simulated auto-reply
      const msg: Message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        senderId: myId,
        receiverId: selectedUser.id,
        message: text,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setAllMessages(prev => [...prev, msg]);

      const delay = 1500 + Math.random() * 2000;
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replyPool = selectedUser.role === 'farmer' ? FARMER_REPLIES : BUYER_REPLIES;
        const replyText = replyPool[Math.floor(Math.random() * replyPool.length)];
        const reply: Message = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          senderId: selectedUser.id,
          receiverId: myId,
          message: replyText,
          createdAt: new Date().toISOString(),
          isRead: true,
        };
        setAllMessages(prev => {
          const updated = [...prev, reply];
          saveMessages(updated);
          return updated;
        });
      }, delay);
    }
  }, [newMessage, selectedUser, myId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function appendEmoji(emoji: string) {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const displayUsers = isConnected ? chatUsers : MOCK_USERS;
  const onlineSet    = isConnected ? new Set<string>() : ONLINE_IDS;

  const filteredUsers = displayUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase()) ||
    u.detail.toLowerCase().includes(search.toLowerCase())
  );

  const conversation = selectedUser ? getConversation(myId, selectedUser.id, allMessages) : [];

  // ── ROLE SELECTION VIEW ────────────────────────────────────────────────────

  if (view === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Link to="/" className="text-white hover:text-green-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">💬 Communication</h1>
              <p className="text-sm text-green-100">Connect with farmers and buyers</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6 pb-24">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you?</h2>
            <p className="text-gray-500 mb-8 text-sm max-w-xs mx-auto">
              Choose your role to find and connect with the right people on FarmVision.
            </p>

            <div className="grid grid-cols-1 gap-4 max-w-xs mx-auto">
              <button
                onClick={() => selectRole('farmer')}
                className="bg-white rounded-xl border-2 border-gray-100 hover:border-green-500 shadow-sm hover:shadow-md p-6 flex flex-col items-center gap-3 transition-all group"
              >
                <span className="text-5xl">👨‍🌾</span>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">I am a Farmer</p>
                  <p className="text-sm text-gray-500 mt-1">Connect with buyers and fellow farmers</p>
                </div>
                <span className="bg-green-600 text-white text-sm font-semibold px-5 py-2 rounded-full group-hover:bg-green-700 transition-colors">
                  Continue →
                </span>
              </button>

              <button
                onClick={() => selectRole('buyer')}
                className="bg-white rounded-xl border-2 border-gray-100 hover:border-amber-400 shadow-sm hover:shadow-md p-6 flex flex-col items-center gap-3 transition-all group"
              >
                <span className="text-5xl">🛒</span>
                <div className="text-center">
                  <p className="font-bold text-gray-900 text-lg">I am a Buyer</p>
                  <p className="text-sm text-gray-500 mt-1">Source produce directly from farmers</p>
                </div>
                <span className="bg-amber-500 text-white text-sm font-semibold px-5 py-2 rounded-full group-hover:bg-amber-600 transition-colors">
                  Continue →
                </span>
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-6 max-w-xs mx-auto">
              This only sets your communication view. Your account and login remain unchanged.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── USER LIST VIEW ─────────────────────────────────────────────────────────

  if (view === 'users') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <button onClick={backToRole} className="text-white hover:text-green-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">💬 Communication</h1>
              <p className="text-sm text-green-100">
                {myRole === 'farmer' ? '👨‍🌾 Viewing as Farmer' : '🛒 Viewing as Buyer'}
              </p>
            </div>
            <button
              onClick={backToRole}
              className="text-xs bg-green-500 hover:bg-green-400 text-white px-2.5 py-1 rounded-full transition-colors"
            >
              Switch Role
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4 pb-24">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, location or crop..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-2 mb-4 text-xs">
            <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              👨‍🌾 {displayUsers.filter(u => u.role === 'farmer').length} Farmers
            </span>
            <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              🛒 {displayUsers.filter(u => u.role === 'buyer').length} Buyers
            </span>
            <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
              🟢 {onlineSet.size} Online
            </span>
          </div>

          {/* Loading spinner */}
          {usersLoading && (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          )}

          {/* User cards */}
          {!usersLoading && (
            <div className="grid gap-3">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 font-medium">No users found</p>
                  <p className="text-sm text-gray-400">
                    {isConnected && displayUsers.length === 0
                      ? 'No other users yet — share FarmVision and ask them to open Communication!'
                      : 'Try a different search term'}
                  </p>
                </div>
              ) : (
                filteredUsers.map(u => {
                  const unread  = getUnreadCount(myId, u.id, allMessages);
                  const lastMsg = getLastMessage(myId, u.id, allMessages);
                  const online  = onlineSet.has(u.id);
                  return (
                    <div key={u.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${u.role === 'farmer' ? 'bg-green-100' : 'bg-amber-100'}`}>
                          {u.emoji}
                        </div>
                        {online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-bold text-gray-900 truncate">{u.name}</p>
                          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${u.role === 'farmer' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {u.role === 'farmer' ? 'Farmer' : 'Buyer'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">📍 {u.location}</p>
                        {lastMsg ? (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {lastMsg.senderId === myId ? '✓ You: ' : ''}{lastMsg.message}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {u.role === 'farmer' ? `🌱 ${u.detail}` : `🏢 ${u.detail}`}
                          </p>
                        )}
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {lastMsg && (
                          <p className="text-xs text-gray-400">{formatLastSeen(lastMsg.createdAt)}</p>
                        )}
                        {unread > 0 && (
                          <span className="bg-green-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                        <button
                          onClick={() => openChat(u)}
                          className="bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          💬 Chat
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CHAT VIEW ──────────────────────────────────────────────────────────────

  if (view === 'chat' && selectedUser) {
    const online = onlineSet.has(selectedUser.id);

    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Chat header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sticky top-0 z-10 shadow-lg flex-shrink-0">
          <div className="max-w-6xl mx-auto flex items-center gap-3">
            <button onClick={backToUsers} className="text-white hover:text-green-200 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* User info */}
            <div className="relative flex-shrink-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${selectedUser.role === 'farmer' ? 'bg-green-500' : 'bg-amber-500'}`}>
                {selectedUser.emoji}
              </div>
              {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-300 rounded-full border-2 border-green-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{selectedUser.name}</p>
              <p className="text-xs text-green-100">
                {isTyping ? (
                  <span className="text-green-200">typing...</span>
                ) : online ? (
                  '🟢 Online'
                ) : (
                  `📍 ${selectedUser.location}`
                )}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="text-xs text-green-200 capitalize">{selectedUser.role}</p>
              <p className="text-xs text-green-100 truncate max-w-[100px]">{selectedUser.detail}</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 pb-2 max-w-6xl w-full mx-auto" style={{ minHeight: 0 }}>
          {conversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-4xl mb-3">{selectedUser.emoji}</div>
              <p className="font-semibold text-gray-700">{selectedUser.name}</p>
              <p className="text-sm text-gray-500 mt-1">📍 {selectedUser.location}</p>
              <p className="text-xs text-gray-400 mt-4 max-w-xs">
                Start a conversation! Say hello or ask about their{' '}
                {selectedUser.role === 'farmer' ? 'crops' : 'requirements'}.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversation.map((msg, i) => {
                const isMine   = msg.senderId === myId;
                const prevMsg  = i > 0 ? conversation[i - 1] : null;
                const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="bg-white text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm border border-gray-100">
                          {new Date(msg.createdAt).toDateString() === new Date().toDateString()
                            ? 'Today'
                            : new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-auto mb-1 bg-green-100">
                          {selectedUser.emoji}
                        </div>
                      )}
                      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                          isMine
                            ? 'bg-green-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md border border-gray-100'
                        }`}>
                          {msg.message}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-xs text-gray-400">{formatTime(msg.createdAt)}</span>
                          {isMine && (
                            msg.isRead
                              ? <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                              : <Check className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator (mock mode only) */}
              {isTyping && (
                <div className="flex justify-start mb-1">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mr-2 bg-green-100">
                    {selectedUser.emoji}
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Emoji picker */}
        {showEmoji && (
          <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0 max-w-6xl w-full mx-auto">
            <div className="flex flex-wrap gap-2">
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => appendEmoji(e)}
                  className="text-xl hover:scale-125 transition-transform active:scale-110 p-0.5">
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0 max-w-6xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmoji(s => !s)}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${showEmoji ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              aria-label="Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            <button
              onClick={() => {}}
              className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Attach image"
              title="Image attachment (available in connected mode)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedUser.name}...`}
              className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800 placeholder-gray-400"
            />

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                newMessage.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
