import { PageHeader } from "@/components/shell/page-header";
import { DocumentsClient } from "@/components/clinic/documents-client";

export default function DocumentsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Document Management"
        subtitle="Connect cloud storage and browse clinic documents in one place"
      />
      <DocumentsClient />
    </div>
  );
}
