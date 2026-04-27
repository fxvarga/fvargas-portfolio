import { ModuleNavBar } from '@/components/ModuleNavBar';
import { PageShell } from '@/components/PageShell';
import { PageHeader } from '@/components/PageHeader';
import { PrintTab } from '@/features/print-book/PrintTab';

export function MemoryBookPage() {
  return (
    <PageShell>
      <PageHeader title="Books" />
      <ModuleNavBar activeSlug="memory-book" />
      <PrintTab />
    </PageShell>
  );
}
