# CRM Redesign Plan

## Ziel
Ein cleanes, minimalistisches CRM-Dashboard das zum bestehenden Branding der Hauptseite passt:
- Schwarzer Hintergrund (#000)
- Monochrome Farbpalette (weiß/grau Abstufungen)
- Dezente Borders (border-white/10)
- Subtile Hover-Effekte (bg-white/5)
- Professionell, nicht überladen

---

## Inspiration & Best Practices

Basierend auf Analyse von:
- **marmelab/atomic-crm** - React Admin CRM mit modernem Layout
- **shadcn/ui dashboard-03** - Clean Dashboard mit Tabs und DataTable
- **novu dashboard** - Moderne Komponenten-Struktur

### Bewährte Patterns:
1. **3-Spalten Dashboard Layout** (3-6-3 Grid)
2. **DataTable statt Card-Liste** für bessere Übersicht
3. **Tabs für View-Switching** statt Button-Toggles
4. **Kompakte Metriken-Cards** oben
5. **Skeleton Loading States** für bessere UX

---

## Neue Layout-Struktur

```
┌──────────────────────────────────────────────────────────────┐
│  HEADER                                                       │
│  ┌────────┐  ┌─────────────────────────┐  ┌────────────────┐ │
│  │ SB CRM │  │ Search...               │  │ + New Search   │ │
│  └────────┘  └─────────────────────────┘  └────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  TABS: [ All Leads ]  [ Pipeline ]  [ Won ]  [ Lost ]        │
├──────────────────────────────────────────────────────────────┤
│  METRICS ROW                                                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ Total      │ │ In Progress│ │ Won        │ │ Conversion │ │
│  │ 24         │ │ 8          │ │ 5          │ │ 21%        │ │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  MAIN CONTENT                                                 │
│  ┌────────────────────────────────────┐ ┌──────────────────┐ │
│  │ DATA TABLE                         │ │ SIDEBAR          │ │
│  │                                    │ │                  │ │
│  │ Name      Score  Status   Actions  │ │ Filters          │ │
│  │ ───────────────────────────────── │ │ ☐ New            │ │
│  │ Autoteile   70   New      ...     │ │ ☐ Contacted      │ │
│  │ Kapellchen  30   New      ...     │ │ ☐ Won            │ │
│  │ Scheerenst  40   Called   ...     │ │                  │ │
│  │                                    │ │ Score Range      │ │
│  │                                    │ │ [0] ━━━━━ [100]  │ │
│  │                                    │ │                  │ │
│  └────────────────────────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Komponenten-Plan

### 1. Neue shadcn Komponenten installieren

```bash
npx shadcn@latest add tabs
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dropdown-menu
```

### 2. Komponenten-Struktur

```
src/components/
├── ui/                          # shadcn Basis-Komponenten
│   ├── Table.tsx               ✓ vorhanden
│   ├── Skeleton.tsx            ✓ vorhanden
│   ├── Tabs.tsx                 NEU
│   ├── Card.tsx                 NEU
│   ├── Badge.tsx                NEU
│   └── DropdownMenu.tsx         NEU
│
├── crm/                         # CRM-spezifische Komponenten
│   ├── CRMLayout.tsx            NEU - Haupt-Layout Container
│   ├── CRMHeader.tsx           ✓ überarbeiten
│   ├── CRMTabs.tsx              NEU - Tab Navigation
│   ├── MetricsRow.tsx           NEU - 4 Metriken Cards
│   ├── LeadsTable.tsx           NEU - DataTable für Leads
│   ├── LeadsTableRow.tsx        NEU - Einzelne Tabellenzeile
│   ├── LeadsTableActions.tsx    NEU - Row Actions Dropdown
│   ├── FilterSidebar.tsx       ✓ überarbeiten (kompakter)
│   └── EmptyState.tsx           NEU - Wenn keine Leads
│
├── leads/                       # Lead-Detail Komponenten
│   ├── LeadDetailModal.tsx     ✓ überarbeiten
│   ├── LeadScoreBadge.tsx      ✓ bereits monochrom
│   └── StatusBadge.tsx          NEU - Minimal Badge
```

---

## Detaillierte Komponenten-Specs

### CRMLayout.tsx
```tsx
// Container mit responsivem Grid
<div className="min-h-screen bg-black">
  <CRMHeader />
  <main className="max-w-7xl mx-auto px-4 py-6">
    <CRMTabs />
    <MetricsRow />
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
      <div className="lg:col-span-3">
        <LeadsTable />
      </div>
      <div className="lg:col-span-1">
        <FilterSidebar />
      </div>
    </div>
  </main>
</div>
```

### CRMTabs.tsx
```tsx
// Minimale Tab-Navigation
<Tabs defaultValue="all">
  <TabsList className="bg-white/5 border border-white/10">
    <TabsTrigger value="all">All Leads</TabsTrigger>
    <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
    <TabsTrigger value="won">Won</TabsTrigger>
    <TabsTrigger value="lost">Lost</TabsTrigger>
  </TabsList>
</Tabs>
```

### MetricsRow.tsx
```tsx
// 4 kompakte Stat-Cards
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <MetricCard label="Total Leads" value={24} />
  <MetricCard label="In Progress" value={8} />
  <MetricCard label="Won" value={5} />
  <MetricCard label="Conversion" value="21%" />
</div>

// Einzelne Card:
<div className="bg-white/[0.02] border border-white/10 rounded-lg p-4">
  <p className="text-xs text-gray-500">{label}</p>
  <p className="text-2xl font-medium text-gray-200 mt-1">{value}</p>
</div>
```

### LeadsTable.tsx
```tsx
// Clean DataTable
<Table>
  <TableHeader>
    <TableRow className="border-white/10 hover:bg-transparent">
      <TableHead className="text-gray-500">Name</TableHead>
      <TableHead className="text-gray-500">Location</TableHead>
      <TableHead className="text-gray-500">Score</TableHead>
      <TableHead className="text-gray-500">Status</TableHead>
      <TableHead className="text-gray-500 text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {leads.map(lead => (
      <LeadsTableRow key={lead.id} lead={lead} />
    ))}
  </TableBody>
</Table>
```

### LeadsTableRow.tsx
```tsx
// Kompakte Tabellenzeile
<TableRow className="border-white/10 hover:bg-white/[0.02]">
  <TableCell>
    <div>
      <p className="text-gray-200 font-medium">{lead.name}</p>
      <p className="text-gray-500 text-sm">{lead.phone || 'No phone'}</p>
    </div>
  </TableCell>
  <TableCell className="text-gray-400">{lead.city}</TableCell>
  <TableCell>
    <span className="font-mono text-gray-300">{lead.score}</span>
  </TableCell>
  <TableCell>
    <StatusBadge status={lead.status} />
  </TableCell>
  <TableCell className="text-right">
    <LeadsTableActions lead={lead} />
  </TableCell>
</TableRow>
```

### StatusBadge.tsx
```tsx
// Minimales Status Badge
const statusStyles = {
  new: 'text-gray-400',
  contacted: 'text-gray-300',
  called: 'text-gray-300',
  proposal_sent: 'text-gray-200',
  negotiating: 'text-gray-200',
  won: 'text-green-400',
  lost: 'text-gray-600',
};

<span className={`text-xs ${statusStyles[status]}`}>
  {statusLabel}
</span>
```

### FilterSidebar.tsx (überarbeitet)
```tsx
// Kompaktere Filter ohne bunte Dots
<aside className="space-y-6">
  {/* Status Filter */}
  <div>
    <h3 className="text-sm font-medium text-gray-300 mb-3">Status</h3>
    <div className="space-y-2">
      {statuses.map(status => (
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" className="..." />
          {status.label}
        </label>
      ))}
    </div>
  </div>

  {/* Score Range */}
  <div>
    <h3 className="text-sm font-medium text-gray-300 mb-3">Score</h3>
    <input type="range" className="w-full" />
  </div>
</aside>
```

---

## Design Tokens

### Farben (Monochrom)
```css
--bg-primary: #000000;
--bg-card: rgba(255, 255, 255, 0.02);
--bg-hover: rgba(255, 255, 255, 0.05);
--border: rgba(255, 255, 255, 0.1);
--border-hover: rgba(255, 255, 255, 0.2);

--text-primary: #e5e7eb;    /* gray-200 */
--text-secondary: #9ca3af;  /* gray-400 */
--text-muted: #6b7280;      /* gray-500 */
--text-disabled: #4b5563;   /* gray-600 */

--accent-success: #4ade80;  /* green-400 - nur für "Won" */
```

### Spacing
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
```

### Border Radius
```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
```

---

## Implementierungs-Reihenfolge

### Phase 1: Basis-Setup
1. [ ] shadcn Komponenten installieren (tabs, card, badge, dropdown-menu)
2. [ ] Design Tokens in globals.css definieren
3. [ ] Bestehende UI-Komponenten ans Dark Theme anpassen

### Phase 2: Layout-Struktur
4. [ ] CRMLayout.tsx erstellen
5. [ ] CRMHeader.tsx vereinfachen (weniger Elemente)
6. [ ] CRMTabs.tsx erstellen
7. [ ] MetricsRow.tsx erstellen

### Phase 3: DataTable
8. [ ] LeadsTable.tsx erstellen
9. [ ] LeadsTableRow.tsx erstellen
10. [ ] LeadsTableActions.tsx (Dropdown mit Edit, Delete, etc.)
11. [ ] StatusBadge.tsx (minimal)

### Phase 4: Sidebar & Filter
12. [ ] FilterSidebar.tsx überarbeiten (kompakter, cleaner)
13. [ ] EmptyState.tsx für leere Tabelle

### Phase 5: Details & Polish
14. [ ] LeadDetailModal.tsx überarbeiten
15. [ ] Loading States mit Skeleton
16. [ ] Keyboard Navigation
17. [ ] Mobile Responsiveness testen

### Phase 6: Cleanup
18. [ ] Alte Komponenten entfernen (LeadsList.tsx cards)
19. [ ] Unused Code entfernen
20. [ ] Lint & Typecheck

---

## Migration der CRM-Seite

### Aktuell: `/src/app/crm/page.tsx`
- Card-basierte Lead-Liste
- Sidebar mit bunten Filter-Dots
- View-Toggle Buttons

### Neu: `/src/app/crm/page.tsx`
```tsx
export default function CRMPage() {
  return (
    <CRMLayout>
      <CRMHeader />
      <CRMTabs>
        <TabsContent value="all">
          <MetricsRow stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
            <div className="lg:col-span-3">
              <LeadsTable leads={filteredLeads} />
            </div>
            <div className="lg:col-span-1">
              <FilterSidebar />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="pipeline">
          <KanbanBoard /> {/* Existing Kanban */}
        </TabsContent>
      </CRMTabs>
    </CRMLayout>
  );
}
```

---

## Nicht im Scope (für später)

- Charts/Grafiken
- Activity Log
- Bulk Actions (Multi-Select)
- Export-Funktion
- Advanced Search mit Autocomplete
- Keyboard Shortcuts

---

## Referenz-Screenshots

### Ziel-Ästhetik:
- Linear.app Dashboard
- Vercel Dashboard
- Raycast Interface
- GitHub Dark Mode

Alle nutzen:
- Sehr dunkle Hintergründe
- Subtile Borders
- Monochrome Farbpalette
- Viel Whitespace
- Clean Typography
