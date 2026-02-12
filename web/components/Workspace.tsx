'use client';

import Editor from './Editor';

export default function Workspace() {
  return (
    <main className="flex-1 overflow-auto bg-background text-foreground">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Editor />
      </div>
    </main>
  );
}
