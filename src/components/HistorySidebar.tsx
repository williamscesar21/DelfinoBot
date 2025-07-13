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
import { useState, useMemo, useEffect } from "react";

import { useChatSlice } from "../store/chatSlice";
import { useAuthSlice } from "../store/authSlice";
import "../styles/components/HistorySidebar.css";

import type { Conversation, Message } from "../types/chat";

type Props = {
  /** Drawer state when viewport < 768 px */
  mobileOpen?: boolean;
  /** Fired when the sidebar must close (tap on ❌ or resize) */
  onClose?: () => void;
};

export default function HistorySidebar({ mobileOpen = false, onClose }: Props) {
  /* ---------- responsive: detect viewport ---------- */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) onClose?.(); // auto-close when back to desktop
    };
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, [onClose]);

  /* ---------- global stores ---------- */
  const {
    conversations,
    currentId,
    selectChat,
    newChat,
    deleteChat,
  } = useChatSlice();
  const { logout } = useAuthSlice();

  /* ---------- local state ---------- */
  const [collapsed, setCollapsed] = useState(false); // desktop only
  const [query, setQuery] = useState("");

  /* ---------- derived ---------- */
  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, query]);

  /* detect if there is already an empty chat */
  const hasEmpty = useMemo(
    () => conversations.some((c) => c.messages.length === 0),
    [conversations]
  );

  const grouped: [string, Conversation[]][] = useMemo(() => {
    const map = new Map<string, Conversation[]>();

    const sorted = [...filtered].sort((a, b) => {
      const tsA = a.messages.length ? a.messages[a.messages.length - 1].timestamp : 0;
      const tsB = b.messages.length ? b.messages[b.messages.length - 1].timestamp : 0;
      return tsB - tsA;
    });

    sorted.forEach((c) => {
      const ts = new Date(
        c.messages.length ? c.messages[c.messages.length - 1].timestamp : Date.now()
      );
      let label = format(ts, "MMM dd");
      if (isToday(ts)) label = "Today";
      else if (isYesterday(ts)) label = "Yesterday";
      (map.get(label) ?? map.set(label, []).get(label)!).push(c);
    });

    return Array.from(map.entries()).sort((a, b) => {
      const toDate = (l: string) =>
        l === "Today"
          ? new Date()
          : l === "Yesterday"
          ? new Date(Date.now() - 86_400_000)
          : new Date(l);
      return toDate(b[0]).getTime() - toDate(a[0]).getTime();
    });
  }, [filtered]);

  const getLast = (arr: Message[]) => arr[arr.length - 1];

  /* ---------- classes ---------- */
  const cls =
    "hsb-sidebar" +
    (isMobile ? " mobile" : "") +
    (isMobile && mobileOpen ? " open" : "") +
    (!isMobile && collapsed ? " collapsed" : "");

  /* ==================== render ==================== */
  return (
    <aside className={cls}>
      {/* close (mobile) */}
      {isMobile && mobileOpen && (
        <button className="hsb-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      )}

      {/* collapse/expand (desktop) */}
      {!isMobile && (
        <button
          className="hsb-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* scrollable content */}
      <div className="hsb-content">
        {/* header */}
        <header className="hsb-header">
          <div className="hsb-brand">
            <span className="hsb-logo">
              <MessageCircle size={16} />
            </span>
            {!collapsed && <h2 className="hsb-title">Delfino Tours II</h2>}
          </div>
        </header>

        {/* search */}
        {!collapsed && (
          <div className="hsb-search">
            <Search size={12} className="hsb-search-ico" />
            <input
              placeholder="Buscar conversaciones…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}

        {/* chat list */}
        <div className="hsb-list">
          {grouped.length === 0 ? (
            !collapsed && (
              <div className="hsb-empty">
                <h4>Sin conversaciones</h4>
                <p>Inicia una conversación para comenzar a chatear.</p>
              </div>
            )
          ) : (
            grouped.map(([label, chats]) => (
              <div key={label}>
                {!collapsed && <div className="hsb-date-label">{label}</div>}

                {chats.map((c) => {
                  const last = getLast(c.messages);
                  return (
                    <div
                      key={c.id}
                      className={
                        "hsb-chat-item" + (c.id === currentId ? " active" : "")
                      }
                      onClick={() => {
                        selectChat(c.id);
                        if (isMobile) onClose?.();
                      }}
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

      {/* footer */}
<div className="hsb-footer">
  <button
    className="hsb-new"
    onClick={() => {
      if (hasEmpty) {
        /* Selecciona el chat vac ío existente */
        const empty = conversations.find((c) => c.messages.length === 0);
        if (empty) selectChat(empty.id);
      } else {
        /* Crea uno nuevo */
        newChat();
      }
    }}
    title={
      hasEmpty
        ? "Ya existe un chat nuevo sin mensajes. Haz clic para abrirlo."
        : "Crear nuevo chat"
    }
  >
    <Plus size={14} />
    {!collapsed && <span>Nuevo chat</span>}
  </button>

  <button
    className="hsb-new"
    style={{ background: "var(--gray-100)", color: "var(--gray-500)" }}
    onClick={logout}
    title="Cerrar sesión"
  >
    <LogOut size={14} />
    {!collapsed && <span>Salir</span>}
  </button>
</div>

    </aside>
  );
}
