/* src/components/HistorySidebar.tsx
   – Drawer + desktop sidebar con footer sticky y soporte colapsable */

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  MessageCircle,
  Plus,
  Trash2,
  LogOut,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useChatSlice } from "../store/chatSlice";
import { useAuthSlice } from "../store/authSlice";
import "../styles/components/HistorySidebar.css";

import type { Conversation, Message } from "../types/chat";

type Props = {
  /** Drawer en pantallas < 768 px  */
  mobile?: boolean;
  /** Estado abierto (solo móvil)  */
  open?: boolean;
  /** Callback al cerrar (tap en ❌) */
  onClose?: () => void;
};

export default function HistorySidebar({
  mobile = false,
  open = false,
  onClose,
}: Props) {
  /* ---------------- estado global ---------------- */
  const {
    conversations,
    currentId,
    selectChat,
    newChat,
    deleteChat,
  } = useChatSlice();
  const { logout } = useAuthSlice();

  /* ---------------- estado local ---------------- */
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  /* ---------------- filtrar y agrupar ---------------- */
  const filtered = useMemo<Conversation[]>(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const grouped = useMemo<[string, Conversation[]][]>(() => {
    const map = new Map<string, Conversation[]>();
    filtered.forEach((c) => {
      const last = c.messages[c.messages.length - 1];
      const ts =
        last && typeof last.timestamp === "number" && !isNaN(last.timestamp)
          ? new Date(last.timestamp)
          : new Date();

      let label = format(ts, "MMM dd");
      if (isToday(ts)) label = "Today";
      else if (isYesterday(ts)) label = "Yesterday";

      (map.get(label) ?? map.set(label, []).get(label)!).push(c);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const getLast = (msgs: Message[]) => msgs[msgs.length - 1];

  /* ---------------- render ---------------- */
  return (
    <aside
      className={`hsb-sidebar ${mobile ? "mobile" : ""} ${
        open ? "open" : ""
      } ${collapsed && !mobile ? "collapsed" : ""}`}
    >
      {/* ---- Cerrar (solo móvil) ---- */}
      {mobile && (
        <button
          className="hsb-close-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
        >
          <X size={18} />
        </button>
      )}

      {/* ---- Colapsar / expandir (solo desktop) ---- */}
      {!mobile && (
        <button
          className="hsb-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* ---- Contenido scrollable ---- */}
      <div className="hsb-content">
        {/* Header */}
        <header className="hsb-header">
          <div className="hsb-brand">
            <span className="hsb-logo">
              <MessageCircle size={16} />
            </span>
            {!collapsed && <h2 className="hsb-title">Delfino Tours II</h2>}
          </div>
        </header>

        {/* Buscador */}
        {!collapsed && (
          <div className="hsb-search">
            <Search size={12} className="hsb-search-ico" />
            <input
              placeholder="Search chats…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        {/* Lista de chats */}
        <div className="hsb-list">
          {grouped.length === 0 ? (
            <div className="hsb-empty">
              <MessageCircle size={20} />
              <h4>No chats yet</h4>
              <p>Start a conversation to see it here</p>
            </div>
          ) : (
            grouped.map(([label, chats]) => (
              <div key={label}>
                {!collapsed && <div className="hsb-date-label">{label}</div>}

                {chats.map((c) => {
                  const last = getLast(c.messages);
                  return (
                    <div
                      key={c.id}
                      className={`hsb-chat-item ${
                        c.id === currentId ? "active" : ""
                      }`}
                      onClick={() => selectChat(c.id)}
                    >
                      <div className="hsb-chat-line">
                        <span className="hsb-chat-title">
                          {c.title || "Sin título"}
                        </span>
                      </div>

                      {!collapsed && (
                        <div className="hsb-chat-sub">
                          {(last?.role === "user" ? "You: " : "") +
                            (last?.content.slice(0, 40) || "")}
                        </div>
                      )}

                      {!collapsed && (
                        <button
                          className="hsb-trash"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("¿Eliminar chat?")) deleteChat(c.id);
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ---- Footer sticky (siempre visible) ---- */}
      <div className="hsb-footer">
        <button className="hsb-new" onClick={newChat}>
          <Plus size={14} />
          {!collapsed && <span>New Chat</span>}
        </button>

        <button
          className="hsb-new"
          style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
          onClick={logout}
          title="Cerrar sesión"
        >
          <LogOut size={14} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
