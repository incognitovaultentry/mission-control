import dynamic from "next/dynamic";

const KanbanBoard = dynamic(() => import("@/components/Kanban"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function Page() {
  return <KanbanBoard />;
}
