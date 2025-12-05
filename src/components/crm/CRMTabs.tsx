'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ReactNode } from 'react';

export type TabValue = 'all' | 'pipeline' | 'won' | 'lost';

interface CRMTabsProps {
  activeTab: TabValue;
  onTabChange: (value: TabValue) => void;
  children: ReactNode;
}

export function CRMTabs({ activeTab, onTabChange, children }: CRMTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabValue)}>
      <TabsList className="bg-white/5 border border-white/10 h-10">
        <TabsTrigger
          value="all"
          className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500"
        >
          All Leads
        </TabsTrigger>
        <TabsTrigger
          value="pipeline"
          className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500"
        >
          Pipeline
        </TabsTrigger>
        <TabsTrigger
          value="won"
          className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500"
        >
          Won
        </TabsTrigger>
        <TabsTrigger
          value="lost"
          className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-500"
        >
          Lost
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

export { TabsContent };
