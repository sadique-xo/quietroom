## 📘 QuietRoom Photo‑Journal PRD

### 1. Executive Summary  
A sacred, minimal digital journal where users upload one photo + reflection per day. It offers a quiet sanctuary for self‑journal and a silent “room” for presence—no feeds, no followers, no AI—just intentional daily ritual.

---

### 2. Purpose & Problem Statement  
People are fatigued by polished, always‑on social media. They seek nothingness, ritual, and presence—a quiet tool to hold memory and meaning without distraction or performance. The problem: existing apps push attention; very few create intentional pause.

**Opportunity**: offer a sanctuary that is light, real, private, and grounding.

---

### 3. Vision & Goals  
- **Vision**: Users establish a simple, daily ritual of presence: one image; one reflection; one quiet moment.  
- **Primary Objective**: Build MVP within two hours; capture feedback within 24 hours.  
- **Success Metrics (MVP phase)**:  
  - Daily retention rate: % users who return the next day  
  - Completion rate: % who upload photo + caption  
  - Time spent in Quiet Room mode (average minutes/session)

---

### 4. Personas & Use Cases  
**Persona**:  
- *Reflective Ritualist*: values simplicity, privacy, and digital minimalism.  
- Uses app each morning or evening to reflect quietly.  
- Prefers web on phone or desktop; might turn into PWA.

**Use Case Examples**:  
1. *Morning upload:* user uploads a sunrise photo, types a brief line, and ends entry.  
2. *Evening reflection:* enters Quiet Room for 5 minutes of breath before the day ends.  
3. *Review archive:* scrolls past entries on `/` feed to revisit past reflections.

---

### 5. Features & Requirements

| Feature                     | Description                                                                 | Priority |
|----------------------------|-----------------------------------------------------------------------------|----------|
| Single daily upload        | Only one entry allowed per calendar day                                     | High     |
| Photo upload & caption     | Via file input + text area, localStorage store                             | High     |
| Entry feed (`/`)           | Scrollable reverse-chronological gallery with date & caption                | High     |
| Quiet Room (`/room`)       | Full-screen, timer optional (5/10/15 min), soft breathing animation         | High     |
| About page (`/about`)      | Explains ethos, privacy, and intent                                         | Medium   |
| Responsive design          | Mobile-first; desktop-ready; future PWA support                            | High     |
| Save only locally          | No accounts; no backend in MVP; future option to sync via Supabase         | High     |
| Constraints                | Only upload, no camera; no social sharing; no likes/follows                 | High     |
| Bottom Nav (4 Icons)       | Home, Quiet Room, Calendar, Profile – always visible at bottom              | High     |
| Home Feed (`/`)            | Personal feed with random inspirational quotes (not public)                 | High     |
| Auth via Email             | Simple email-based sign up & login (no OAuth, no social login)              | High     |

---

### 6. Out‑of‑Scope for MVP  
- Social sharing features (public feeds, friend networks)  
- AI/photo filters or editing  
- OAuth or third-party sign-ins  
- Cloud storage or syncing (for now)  
- Rich commenting or feed interactions

---

### 7. Timeline & Milestones

| Task                             | Owner  | Duration                |
|----------------------------------|--------|-------------------------|
| Scaffold Next.js + Tailwind      | PM/Dev | 15 min                  |
| Implement `/new` entry flow      | Dev    | 45 min                  |
| Build `/` feed listing + quote   | Dev    | 30 min                  |
| Build `/room` quiet timer        | Dev    | 20 min                  |
| Build bottom nav (mobile-first)  | Dev    | 15 min                  |
| Implement basic email auth       | Dev    | 30 min                  |
| Styling & responsive polish      | PM/Dev | 30 min                  |
| Vercel deployment                | Dev    | 10 min                  |

**Total**: ~3 hours for MVP + polish; ready for limited rollout.

---

### 8. Phase-by-Phase Codebase Tasks

#### 🔹 Phase 1 – Setup & Core Layout
- [ ] Scaffold Next.js project with App Router & Tailwind CSS
- [ ] Setup global layout with bottom nav (Home, Room, Calendar, Profile)
- [ ] Create route structure: `/`, `/new`, `/room`, `/calendar`, `/profile`
- [ ] Add responsive layout utilities (mobile-first)

#### 🔹 Phase 2 – Entry Creation & Storage
- [ ] Build `/new` page: file upload + caption textarea
- [ ] Convert uploaded image to Base64 or Blob URL
- [ ] Store entry object in localStorage
- [ ] Restrict one entry per day logic

#### 🔹 Phase 3 – Feed and Quotes
- [ ] Build home feed (`/`) to display saved entries
- [ ] Integrate quote rotation from external admin panel, where admin can update quotes in the db, which will be tagged in label, and accordingly user can choose their type and can get certain quotes form that labels, like tagging.
- [ ] Group entries by day, show in reverse order

#### 🔹 Phase 4 – Quiet Room
- [ ] Build full-screen `/room` with selectable timers (5/10/15 min)
- [ ] Add breathing animation (CSS or Canvas)
- [ ] Add soft background sound toggle (optional)

#### 🔹 Phase 5 – Calendar + Profile Basics
- [ ] Build calendar view to show dates with entries (static data)
- [ ] Build `/profile` page with entry count, reset option
- [ ] Add local export button for all entries (JSON/text)

#### 🔹 Phase 6 – Auth and Final Polish
- [ ] Add email-based sign-up/login (e.g. Clerk/Auth.js)
- [ ] Redirect user after auth; protect private routes
- [ ] Polish styling, animations, font hierarchy
- [ ] Final testing & deploy to Vercel

---

### 9. Open Questions & Decisions  
- Should entries allow editing or deletion? (Yes/No for MVP)  
- How to restrict to one upload per day—strict date logic?  
- What level of onboarding is needed to explain app flow?  
- Visual design: calming palette (e.g. lavender / navy / white) or other?

---

### 10. Risks and Mitigations  
- **Risk**: Users feel limited by only one entry per day.  
  **Mitigation**: Make that constraint clear—rationale in UX and brand messaging.  
- **Risk**: LocalStorage fills up.  
  **Mitigation**: Encourage user to export; or shift to IndexedDB later.  
- **Risk**: Some browsers restrict large base64 storage.  
  **Mitigation**: Use blob URLs or small images (~1 MB max).

---

### 11. Messaging & Launch Narrative  
**Messaging proposition**:  
*“QuietRoom: One sacred photo, one reflection, one silent moment—every day.”*

Simplify your mind. Remember what matters. Slow down.

---

### ✅ Next Steps  
- Finalize open questions  
- Start scaffolding Next.js base with Tailwind + App Router  
- Implement `/`, `/new`, `/room`, `/calendar`, `/profile` screens  
- Add email-based authentication (Clerk/Auth.js/Firebase)  
- Review with beta testers, refine based on emotion + clarity
