import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM | ALOO',
  description: 'Manage your leads and sales pipeline',
};

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
