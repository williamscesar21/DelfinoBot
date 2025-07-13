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

import type { Conversation } from "../types/chat";

type Props = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export default function HistorySidebar({
  mobileOpen = false,
  onClose,
}: Props) {
  /* responsive */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) onClose?.();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [onClose]);

  const {
    conversations,
    currentId,
    selectChat,
    newChat,
    deleteChat,
  } = useChatSlice();
  const { logout } = useAuthSlice();

  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");

  /* filtrar por título */
  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(q)
    );
  }, [conversations, query]);

  /* existe ya un chat sin mensajes? */
  const hasEmpty = useMemo(
    () => conversations.some((c) => c.messages.length === 0),
    [conversations]
  );

  /* agrupar por fecha */
  const grouped = useMemo<[string, Conversation[]][]>(() => {
    const groups: Record<string, Conversation[]> = {};
    filtered.forEach((c) => {
      const ts =
        c.messages.length > 0
          ? c.messages[c.messages.length - 1].timestamp
          : Date.now();
      let label = format(new Date(ts), "MMM dd");
      if (isToday(ts)) label = "Today";
      else if (isYesterday(ts)) label = "Yesterday";

      if (!groups[label]) groups[label] = [];
      groups[label].push(c);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      const toDate = (l: string) =>
        l === "Today"
          ? new Date()
          : l === "Yesterday"
          ? new Date(Date.now() - 86_400_000)
          : new Date(l);
      return toDate(b).getTime() - toDate(a).getTime();
    });
  }, [filtered]);

  /* clases dinámicas */
  const cls =
    "hsb-sidebar" +
    (isMobile ? " mobile" : "") +
    (isMobile && mobileOpen ? " open" : "") +
    (!isMobile && collapsed ? " collapsed" : "");

  return (
    <aside className={cls}>
      {/* cierre (móvil) */}
      {isMobile && mobileOpen && (
        <button className="hsb-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      )}

      {/* colapsar / expandir (desktop) */}
      {!isMobile && (
        <button
          className="hsb-collapse-btn"
          onClick={() => setCollapsed((c) => !c)}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      <div className="hsb-content">
        <header className="hsb-header">
          <div className="hsb-brand">
            <span className="hsb-logo">
              <MessageCircle size={16} />
            </span>
            {!collapsed && <h2 className="hsb-title">Delfino Tours II</h2>}
          </div>
        </header>

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

        <div className="hsb-list">
          {grouped.length === 0 && !collapsed ? (
            <div className="hsb-empty">
              <h4>Sin conversaciones</h4>
              <p>Inicia una conversación para comenzar a chatear.</p>
            </div>
          ) : (
            grouped.map(([label, chats]) => (
              <div key={label}>
                {!collapsed && (
                  <div className="hsb-date-label">{label}</div>
                )}
                {chats.map((c) => {
                  const last =
                    c.messages.length > 0
                      ? c.messages[c.messages.length - 1]
                      : undefined;
                  return (
                    <div
                      key={c.id}
                      className={
                        "hsb-chat-item" +
                        (c.id === currentId ? " active" : "")
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
                      {!collapsed && last && (
                        <div className="hsb-chat-sub">
                          {(last.role === "user" ? "You: " : "") +
                            last.content.slice(0, 40)}
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

      <div className="hsb-footer">
        <button
          className="hsb-new"
          onClick={() => {
            if (hasEmpty) {
              const empty = conversations.find((c) => c.messages.length === 0);
              empty && selectChat(empty.id);
            } else {
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
