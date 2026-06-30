import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bill Detail',
  description: 'View bill details',
};

/**
 * Bill Detail Page
 * TODO: Implement bill detail from features/billing
 */
export default function BillDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bill Detail</h1>
      {/* TODO: <BillSummary /> */}
      {/* TODO: <BillLineItems /> */}
      {/* TODO: <BillActions /> */}
    </div>
  );
}
