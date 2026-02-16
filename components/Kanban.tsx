"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import {
  Plus, X, ArrowLeft, ChevronLeft, ChevronRight,
  Zap, Flag, Tag, User, Trash2, Check,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";

type Status = "open" | "inprogress" | "review" | "done";
type Priority = "low" | "medium" | "high";

const COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: "open",       label: "Open",        color: "border-gray-600/40",   dot: "bg-gray-400" },
  { id: "inprogress", label: "In Progress",  color: "border-blue-500/40",   dot: "bg-blue-400 animate-pulse" },
  { id: "review",     label: "Needs Review", color: "border-amber-500/40",  dot: "bg-amber-400" },
  { id: "done",       label: "Done",         color: "border-emerald-500/40",dot: "bg-emerald-400" },
];

const PRIORITY_STYLES: Record<Priority, { cls: string; label: string }> = {
  low:    { cls: "text-gray-400 bg-gray-500/10 border-gray-500/20",   label: "Low" },
  medium: { cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",   label: "Medium" },
  high:   { cls: "text-red-400 bg-red-500/10 border-red-500/20",      label: "High" },
};

type Card = {
  _id: Id<"kanbanCards">;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assignedAgent?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
};

function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span className={clsx("inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border font-medium", s.cls)}>
      <Flag size={9} />
      {s.label}
    </span>
  );
}

function CardModal({
  card,
  onClose,
}: {
  card: Card;
  onClose: () => void;
}) {
  const moveCard = useMutation(api.kanban.moveCard);
  const updateCard = useMutation(api.kanban.updateCard);
  const deleteCard = useMutation(api.kanban.deleteCard);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentColIdx = COLUMNS.findIndex((c) => c.id === card.status);

  const handleMove = async (status: Status) => {
    await moveCard({ id: card._id, status });
    onClose();
  };

  const handleSave = async () => {
    await updateCard({ id: card._id, title, description, priority });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteCard({ id: card._id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0d0d14] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#1e1e2e]">
          <div className="flex items-start justify-between gap-3">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-blue-500/50"
                autoFocus
              />
            ) : (
              <h2 className="text-base font-semibold flex-1">{card.title}</h2>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-white mt-0.5 flex-shrink-0 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {/* Column badge */}
            <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#1a1a28] px-2 py-0.5 rounded-full border border-[#2a2a3e]">
              <span className={clsx("w-1.5 h-1.5 rounded-full", COLUMNS[currentColIdx]?.dot)} />
              {COLUMNS[currentColIdx]?.label}
            </span>
            {editing ? (
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="bg-[#1a1a28] border border-[#2a2a3e] rounded px-2 py-0.5 text-xs text-gray-300 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            ) : (
              <PriorityBadge priority={card.priority} />
            )}
            {card.assignedAgent && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                <User size={9} />
                {card.assignedAgent}
              </span>
            )}
            {card.tags?.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="px-5 py-4">
          {editing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={4}
              className="w-full bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          ) : (
            <p className="text-sm text-gray-400 leading-relaxed min-h-[60px]">
              {card.description || <span className="text-gray-600 italic">No description</span>}
            </p>
          )}
          <div className="text-xs text-gray-600 mt-3">
            Updated {formatDistanceToNow(card.updatedAt, { addSuffix: true })} · Created {formatDistanceToNow(card.createdAt, { addSuffix: true })}
          </div>
        </div>

        {/* Move between columns */}
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-500 mb-2">Move to</p>
          <div className="flex gap-2 flex-wrap">
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => handleMove(col.id)}
                disabled={col.id === card.status}
                className={clsx(
                  "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
                  col.id === card.status
                    ? "border-[#2a2a3e] text-gray-600 cursor-default"
                    : "border-[#2a2a3e] text-gray-300 hover:border-[#3a3a5e] hover:bg-[#1a1a28] cursor-pointer"
                )}
              >
                <span className={clsx("w-1.5 h-1.5 rounded-full", col.dot)} />
                {col.label}
                {col.id === card.status && <Check size={10} className="text-gray-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-3 border-t border-[#1e1e2e] flex items-center justify-between">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400">Sure?</span>
              <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded transition-colors">
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          )}
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Save
                </button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="text-xs text-gray-300 hover:text-white border border-[#2a2a3e] hover:border-[#3a3a5e] px-3 py-1.5 rounded-lg transition-colors">
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddCardModal({
  defaultStatus,
  onClose,
}: {
  defaultStatus: Status;
  onClose: () => void;
}) {
  const createCard = useMutation(api.kanban.createCard);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    await createCard({ title: title.trim(), description: description.trim() || undefined, priority, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0d0d14] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#1e1e2e] flex items-center justify-between">
          <h3 className="font-semibold text-sm">New Card</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={15} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details..."
              rows={3}
              className="w-full bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
              >
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-[#1a1a28] border border-[#2a2a3e] rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-[#1e1e2e] flex justify-end gap-2">
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            {loading ? "Creating..." : "Create Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({
  col,
  cards,
  onCardClick,
  onAddCard,
}: {
  col: typeof COLUMNS[number];
  cards: Card[];
  onCardClick: (card: Card) => void;
  onAddCard: (status: Status) => void;
}) {
  return (
    <div className="flex flex-col min-w-[260px] flex-1">
      {/* Column header */}
      <div className={clsx("flex items-center justify-between mb-3 pb-3 border-b", col.color)}>
        <div className="flex items-center gap-2">
          <span className={clsx("w-2 h-2 rounded-full", col.dot)} />
          <span className="text-sm font-medium text-gray-200">{col.label}</span>
          <span className="text-xs text-gray-600 bg-[#1a1a28] px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
        <button
          onClick={() => onAddCard(col.id)}
          className="text-gray-600 hover:text-gray-300 transition-colors p-0.5 rounded hover:bg-[#1a1a28]"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-2 flex-1">
        {cards.length === 0 && (
          <div
            onClick={() => onAddCard(col.id)}
            className="border border-dashed border-[#1e1e2e] rounded-xl p-4 text-center text-xs text-gray-700 hover:text-gray-500 hover:border-[#2a2a3e] cursor-pointer transition-all"
          >
            + Add card
          </div>
        )}
        {cards.map((card) => (
          <div
            key={card._id}
            onClick={() => onCardClick(card)}
            className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-3.5 cursor-pointer hover:border-[#2a2a3e] hover:bg-[#13131c] transition-all group"
          >
            <p className="text-sm text-gray-200 font-medium leading-snug mb-2.5 group-hover:text-white transition-colors">
              {card.title}
            </p>
            {card.description && (
              <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <PriorityBadge priority={card.priority} />
                {card.assignedAgent && (
                  <span className="inline-flex items-center gap-1 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                    <User size={9} />
                    {card.assignedAgent}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-700 flex-shrink-0">
                {formatDistanceToNow(card.updatedAt, { addSuffix: true })}
              </span>
            </div>
            {card.tags && card.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {card.tags.map((tag) => (
                  <span key={tag} className="text-xs text-gray-500 bg-gray-500/10 border border-gray-500/20 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const cards = useQuery(api.kanban.listCards);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<Status | null>(null);

  const columnCards = (status: Status): Card[] =>
    (cards ?? []).filter((c) => c.status === status) as Card[];

  const totalCards = cards?.length ?? 0;
  const doneCards = cards?.filter((c) => c.status === "done").length ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1e1e2e] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0f]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-2 font-bold text-base">
            <Zap className="text-yellow-400" size={16} />
            Kanban Board
          </div>
          {totalCards > 0 && (
            <span className="text-xs text-gray-500">
              {doneCards}/{totalCards} done
            </span>
          )}
        </div>
        <button
          onClick={() => setAddingToColumn("open")}
          className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} />
          New Card
        </button>
      </nav>

      {/* Board */}
      <div className="flex-1 px-6 py-6 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4" style={{ minWidth: "100%" }}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              col={col}
              cards={columnCards(col.id)}
              onCardClick={setSelectedCard}
              onAddCard={setAddingToColumn}
            />
          ))}
        </div>
      </div>

      {/* Modals */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
      {addingToColumn && (
        <AddCardModal
          defaultStatus={addingToColumn}
          onClose={() => setAddingToColumn(null)}
        />
      )}
    </div>
  );
}
