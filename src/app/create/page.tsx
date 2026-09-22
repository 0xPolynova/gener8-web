import { Suspense } from "react";
import { CreateWorkspace } from "@/components/create/CreateWorkspace";

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading workspace…</p>}>
      <CreateWorkspace />
    </Suspense>
  );
}
