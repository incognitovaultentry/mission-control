import dynamic from "next/dynamic";

const OrgChart = dynamic(() => import("@/components/OrgChart"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function Page() {
  return <OrgChart />;
}
