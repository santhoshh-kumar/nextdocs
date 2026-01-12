import Editor from '@/components/Editor';

export default async function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-zinc-950 text-white">
      {/* Main Workspace Area (Sidebars + Editor) */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 hidden md:block">
          <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Explorer</h2>
            {/* File Tree will go here */}
          </div>
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col relative h-full">
          <div className="flex-1 relative">
            <Editor roomId={roomId} />
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-64 border-l border-zinc-800 bg-zinc-900/50 hidden lg:block">
           <div className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Communication</h2>
          </div>
        </aside>
      </div>

       {/* Overall Bottom Bar */}
      <footer className="h-9 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-medium text-zinc-300">{roomId}</span>
        </div>

        <button className="flex items-center gap-2 text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1 rounded-md border border-zinc-700">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </footer>
    </div>
  );
}
