'use client';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r flex-shrink-0 bg-sidebar text-sidebar-foreground border-border">
      {/* Placeholder for document list - will be implemented in PRIVATE phase */}
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Local</h2>
      </div>
    </aside>
  );
}
