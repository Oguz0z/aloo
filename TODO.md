# CRM Upgrade Plan

## Status: Sprint 4 abgeschlossen

---

## Sprint 2: Erweiterte Filter & Sortierung ✅

- [x] Filter-Sidebar Komponente (`src/components/crm/FilterSidebar.tsx`)
- [x] Multi-Status Filter (Checkboxen statt Dropdown)
- [x] Score Range Slider (0-100)
- [x] Industry Multi-Select Filter
- [x] Follow-up Filter (Heute fällig, Überfällig, Diese Woche)
- [x] Sortierung Dropdown (Score, Datum, Name, Follow-up)
- [x] API erweitern für komplexe Queries (`/api/leads`)

---

## Sprint 3: Kanban Board ✅

- [x] `@hello-pangea/dnd` installieren
- [x] KanbanBoard Komponente (`src/components/crm/KanbanBoard.tsx`)
- [x] KanbanColumn Komponente (`src/components/crm/KanbanColumn.tsx`)
- [x] KanbanCard Komponente (`src/components/crm/KanbanCard.tsx`)
- [x] Drag & Drop Status-Update
- [x] View Toggle funktional machen (Liste ↔ Kanban)
- [x] View-Präferenz im LocalStorage speichern

---

## Sprint 4: Tags System ✅

- [x] Tag Model in Prisma Schema hinzufügen
- [x] Migration ausführen
- [x] Tags API erstellen (`/api/tags` - CRUD, `/api/leads/[id]/tags`)
- [x] Tag-Manager UI (erstellen/bearbeiten/löschen)
- [x] Tags auf Lead-Karten anzeigen (Kanban + Tabelle)
- [x] Filter nach Tags in Sidebar

---

## Sprint 5: Tasks & Follow-ups

- [ ] Task Model in Prisma Schema hinzufügen
- [ ] Migration ausführen
- [ ] Tasks API erstellen (`/api/tasks` - CRUD)
- [ ] Task-Liste UI im CRM
- [ ] "Heute fällig" Widget im Header
- [ ] Quick Add Task aus Lead-Detail Modal
- [ ] Task-Completion mit Animation

**Schema:**
```prisma
model Task {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId      String?
  lead        Lead?     @relation(fields: [leadId], references: [id], onDelete: SetNull)

  title       String
  description String?
  type        TaskType  @default(follow_up)
  dueDate     DateTime
  dueTime     String?
  completed   Boolean   @default(false)
  completedAt DateTime?
  priority    Priority  @default(medium)

  createdAt   DateTime  @default(now())
}

enum TaskType {
  call
  email
  meeting
  follow_up
  other
}

enum Priority {
  low
  medium
  high
  urgent
}
```

---

## Sprint 6: Activity Timeline

- [ ] Activity Model in Prisma Schema hinzufügen
- [ ] Migration ausführen
- [ ] Auto-Logging bei Status-Änderung implementieren
- [ ] Auto-Logging bei Notiz-Änderung
- [ ] Timeline Tab im Lead-Detail Modal
- [ ] Filterbare Activity-Ansicht

**Schema:**
```prisma
model Activity {
  id        String       @id @default(cuid())
  userId    String
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  leadId    String
  lead      Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)

  type      ActivityType
  title     String
  details   Json?

  createdAt DateTime     @default(now())
}

enum ActivityType {
  status_change
  note_added
  contact_logged
  task_completed
  lead_created
  follow_up_set
}
```

---

## Sprint 7: Bulk Actions & Export

- [ ] Checkbox-Select für Leads in Liste
- [ ] "Select All" Checkbox
- [ ] Bulk Status-Änderung
- [ ] Bulk Tags hinzufügen
- [ ] Bulk Delete (mit Bestätigung)
- [ ] CSV Export (alle Leads)
- [ ] CSV Export (gefilterte Auswahl)
- [ ] Feld-Auswahl für Export

---

## Kritische Dateien

**Neue Komponenten:**
- `src/components/crm/FilterSidebar.tsx`
- `src/components/crm/KanbanBoard.tsx`
- `src/components/crm/KanbanColumn.tsx`
- `src/components/crm/KanbanCard.tsx`
- `src/components/crm/TagManager.tsx`
- `src/components/crm/TaskWidget.tsx`
- `src/components/crm/ActivityTimeline.tsx`
- `src/components/crm/BulkActions.tsx`

**Neue API Routes:**
- `src/app/api/tags/route.ts`
- `src/app/api/tasks/route.ts`

**Zu ändern:**
- `prisma/schema.prisma` - Tag, Task, Activity Models
- `src/types/index.ts` - Neue Types
- `src/lib/constants.ts` - Task Types, Priorities
- `src/app/api/leads/route.ts` - Erweiterte Filter-Query
- `src/app/crm/page.tsx` - Neue Features integrieren

---

## Abhängigkeiten

- `@hello-pangea/dnd` - Drag & Drop für Kanban (Sprint 3)
