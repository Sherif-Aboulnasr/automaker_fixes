# Automaker Codebase Structure Analysis

> A comprehensive reference for understanding the architecture and building a new implementation

## Executive Summary

**Automaker** is an autonomous AI development studio that allows developers to orchestrate AI agents (powered by Claude) to build features autonomously. Developers describe features on a Kanban board, and AI agents automatically implement them in isolated git worktrees.

---

## 1. Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend Framework** | React | 19 | UI components |
| **Desktop Runtime** | Electron | 39.2 | Desktop application |
| **Bundler** | Vite | 6.3 | Build tool & dev server |
| **Routing** | TanStack Router | v1 | File-based routing |
| **Styling** | Tailwind CSS | v4 | Utility-first CSS |
| **State Management** | Zustand | - | Global state store |
| **Backend Framework** | Express.js | 5.2 | HTTP API server |
| **AI Integration** | Claude Agent SDK | 0.1.72 | AI agent execution |
| **Terminal** | node-pty + xterm.js | - | Integrated terminal |
| **Testing** | Vitest + Playwright | - | Unit & E2E tests |

### Monorepo Structure

```
npm workspaces
├── apps/
│   ├── server/     # Express backend (port 3008)
│   └── ui/         # React + Electron frontend (port 3007)
└── libs/
    ├── types/              # Core TypeScript types (foundation)
    ├── platform/           # Path, subprocess, security utilities
    ├── utils/              # Logging, error handling, image processing
    ├── prompts/            # AI prompt templates
    ├── model-resolver/     # Claude model mapping
    ├── dependency-resolver/# Feature dependency graphs
    └── git-utils/          # Git operations wrapper
```

### Dependency Hierarchy

```
@automaker/types (foundation - no dependencies)
         ↓
@automaker/{platform, utils, prompts, model-resolver, dependency-resolver}
         ↓
@automaker/git-utils
         ↓
@automaker/{server, ui}
```

---

## 2. Directory Structure

```
/home/user/automaker_fixes/
├── apps/
│   ├── server/                      # Express backend
│   │   ├── src/
│   │   │   ├── index.ts            # Main entry (~20KB)
│   │   │   ├── routes/             # 23 API route modules
│   │   │   │   ├── agent/          # AI agent execution
│   │   │   │   ├── auto-mode/      # Autonomous feature execution
│   │   │   │   ├── features/       # Feature CRUD
│   │   │   │   ├── fs/             # File system operations
│   │   │   │   ├── git/            # Git operations
│   │   │   │   ├── worktree/       # Git worktree management
│   │   │   │   ├── sessions/       # Chat sessions
│   │   │   │   ├── settings/       # User settings
│   │   │   │   ├── terminal/       # Terminal emulation
│   │   │   │   └── [14 more...]
│   │   │   ├── services/           # Business logic
│   │   │   │   ├── agent-service.ts
│   │   │   │   ├── auto-mode-service.ts
│   │   │   │   ├── feature-loader.ts
│   │   │   │   ├── settings-service.ts
│   │   │   │   └── terminal-service.ts
│   │   │   ├── providers/          # AI model providers
│   │   │   │   └── claude-provider.ts
│   │   │   ├── lib/                # Auth, events, utilities
│   │   │   └── middleware/         # Express middleware
│   │   └── Dockerfile
│   │
│   └── ui/                         # React/Electron frontend
│       ├── src/
│       │   ├── main.ts             # Electron main process
│       │   ├── preload.ts          # Electron preload
│       │   ├── renderer.tsx        # React entry point
│       │   ├── app.tsx             # Root component
│       │   ├── routes/             # TanStack Router pages (15+)
│       │   │   ├── __root.tsx
│       │   │   ├── board.tsx
│       │   │   ├── agent.tsx
│       │   │   ├── settings.tsx
│       │   │   └── [12 more...]
│       │   ├── components/
│       │   │   ├── views/          # Page-level components
│       │   │   │   ├── board-view/ # Kanban (~50 files)
│       │   │   │   ├── graph-view/ # Dependency graph
│       │   │   │   ├── settings-view/
│       │   │   │   └── [15 more views]
│       │   │   ├── ui/             # Reusable components (30+)
│       │   │   ├── layout/         # Sidebar, navigation
│       │   │   └── dialogs/        # Modal dialogs
│       │   ├── store/              # Zustand stores
│       │   │   └── app-store.ts    # Main store (~2700 lines)
│       │   ├── hooks/              # Custom React hooks
│       │   ├── lib/                # Utilities
│       │   │   ├── electron.ts     # IPC bridge (~77KB)
│       │   │   └── http-api-client.ts # HTTP client (~31KB)
│       │   ├── styles/             # Global styles, themes
│       │   │   ├── global.css
│       │   │   └── themes/         # 32 theme files
│       │   └── config/             # Configuration
│       └── Dockerfile
│
├── libs/                           # Shared libraries
│   ├── types/src/index.ts          # Core type definitions
│   ├── platform/src/
│   │   ├── paths.ts                # Directory utilities
│   │   ├── security.ts             # Path validation
│   │   └── secure-fs.ts            # Secure file operations
│   ├── utils/src/
│   │   ├── logger.ts               # Structured logging
│   │   └── error-handler.ts        # Error classification
│   ├── prompts/                    # AI prompt templates
│   ├── model-resolver/             # Model mapping
│   ├── dependency-resolver/        # Topological sorting
│   └── git-utils/                  # Git wrappers
│
├── Configuration Files
│   ├── package.json                # Monorepo workspaces
│   ├── init.mjs                    # Dev launcher script
│   ├── docker-compose.yml          # Container setup
│   ├── vite.config.mts
│   └── tsconfig.json
│
└── docs/                           # Documentation
```

---

## 3. Core Domain Entities

### Feature (Central Entity)

```typescript
interface Feature {
  id: string;
  title?: string;
  category: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'verified';

  // Planning
  planningMode: 'skip' | 'lite' | 'spec' | 'full';
  planSpec?: {
    status: 'pending' | 'approved' | 'rejected';
    content: string;
    version: number;
  };

  // Execution
  dependencies: string[];          // Feature IDs this depends on
  branchName?: string;             // Git branch/worktree
  skipTests: boolean;

  // AI Configuration
  model?: string;                  // Claude model to use
  thinkingLevel?: string;          // Extended thinking intensity

  // Content
  imagePaths?: FeatureImagePath[]; // Screenshots/diagrams
  spec?: string;                   // Detailed specification
  error?: string;
  summary?: string;
}
```

### Agent Session

```typescript
interface AgentSession {
  id: string;
  name: string;
  projectPath: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  isArchived: boolean;
  isDirty?: boolean;              // Has unreviewed work
  tags?: string[];
}
```

### Settings (Three-Tier System)

```typescript
// Global: {dataDir}/settings.json
interface GlobalSettings {
  theme: ThemeMode;
  keyboardShortcuts: KeyboardShortcuts;
  aiProfiles: AIProfile[];
  defaultPlanningMode: PlanningMode;
  useWorktrees: boolean;
  // ... UI preferences
}

// Credentials: {dataDir}/credentials.json (separate for security)
interface Credentials {
  anthropicApiKey?: string;
  googleApiKey?: string;
  openaiApiKey?: string;
}

// Project: {projectPath}/.automaker/settings.json
interface ProjectSettings {
  theme?: ThemeMode;              // Override global
  useWorktrees?: boolean;
  // ... project-specific overrides
}
```

### AI Profile

```typescript
interface AIProfile {
  id: string;
  model: 'opus' | 'sonnet' | 'haiku';
  thinkingLevel: 'none' | 'low' | 'medium' | 'high' | 'ultrathink';
  description: string;
}
```

---

## 4. Data Flow Architecture

### Feature Execution Pipeline

```
┌────────────────────────────────────────────────────────────┐
│  1. USER INPUT (Board View)                                │
│     - Add feature with description + images                │
│     - Drag to "In Progress" column                         │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  2. STORAGE (FeatureLoader)                                │
│     - Write: .automaker/features/{id}/feature.json         │
│     - Images: .automaker/features/{id}/images/             │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  3. PLANNING PHASE (AutoModeService)                       │
│     - Analyze project based on planningMode                │
│     - Generate plan with Claude Agent SDK                  │
│     - If requirePlanApproval: await user approval          │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  4. EXECUTION PHASE (Claude Agent)                         │
│     - Create git worktree for isolation                    │
│     - Agent has full tool access:                          │
│       • Read/Write/Edit files                              │
│       • Execute bash commands                              │
│       • Run tests                                          │
│       • Search codebase (Grep/Glob)                        │
│     - Stream progress via WebSocket                        │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  5. VERIFICATION                                           │
│     - Run tests (if enabled)                               │
│     - Display git diff to user                             │
│     - User approves/rejects                                │
└────────────────────┬───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│  6. MERGE & CLEANUP                                        │
│     - Merge worktree → main branch                         │
│     - Delete worktree                                      │
│     - Status → "verified"                                  │
└────────────────────────────────────────────────────────────┘
```

### Real-Time Communication

```
┌─────────────────┐     HTTP POST      ┌─────────────────┐
│   React UI      │ ──────────────────▶│  Express Server │
│   (port 3007)   │                    │  (port 3008)    │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  WebSocket /api/events               │ EventEmitter
         │◀─────────────────────────────────────│
         │                                      │
         │  Real-time updates:                  │ Services emit events:
         │  - Tool usage                        │ - AgentService
         │  - File changes                      │ - AutoModeService
         │  - Progress                          │ - TerminalService
         │  - Errors                            │
         ▼                                      ▼
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Zustand AppStore                        │
│                    (apps/ui/src/store/)                     │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  - projects[], currentProject                               │
│  - features[], featuresByProject                            │
│  - theme, sidebarOpen, currentView                          │
│  - chatSessions[], autoModeState                            │
│  - aiProfiles[], keyboardShortcuts                          │
│  - worktreesByProject[]                                     │
├─────────────────────────────────────────────────────────────┤
│  Actions (100+):                                            │
│  - updateFeature(), loadFeatures()                          │
│  - startFeature(), stopFeature()                            │
│  - setTheme(), setCurrentProject()                          │
│  - addChatSession(), updateSession()                        │
├─────────────────────────────────────────────────────────────┤
│  Persistence:                                               │
│  - localStorage key: 'automaker-storage'                    │
│  - Version migration support                                │
│  - Custom merge for settings                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Backend Architecture

### API Routes (23 Modules)

| Route Group | Endpoints | Purpose |
|-------------|-----------|---------|
| `/api/agent/*` | start, send, history, stop, clear | Chat with AI |
| `/api/auto-mode/*` | run-feature, status, verify, stop, resume | Autonomous execution |
| `/api/features/*` | list, get, create, update, delete | Feature CRUD |
| `/api/sessions/*` | CRUD, archive/unarchive | Chat session management |
| `/api/fs/*` | read, write, mkdir, readdir, delete | File operations |
| `/api/git/*` | diffs, file-diff | Git diff viewing |
| `/api/worktree/*` | create, status, commit, push, create-pr | Worktree management |
| `/api/terminal/*` | auth, sessions CRUD, resize, WebSocket | Terminal emulation |
| `/api/settings/*` | global, credentials, project | Settings management |
| `/api/models/*` | available, providers | Model configuration |
| `/api/github/*` | check-remote, issues, prs | GitHub integration |
| `/api/health` | basic, detailed | Health checks |

### Key Services

```typescript
// AgentService - Manages AI conversations
class AgentService {
  sessions: Map<string, AgentSession>;
  startConversation(sessionId, projectPath): void;
  sendMessage(sessionId, message): AsyncGenerator<ProviderMessage>;
  getHistory(sessionId): ConversationMessage[];
}

// AutoModeService - Autonomous feature execution
class AutoModeService {
  runningFeatures: Map<string, FeatureExecution>;
  executeFeature(featureId, options): void;
  stopFeature(featureId): void;
  getStatus(featureId): FeatureStatus;
}

// FeatureLoader - Feature persistence
class FeatureLoader {
  loadFeatures(projectPath): Feature[];
  saveFeature(projectPath, feature): void;
  deleteFeature(projectPath, featureId): void;
}

// SettingsService - Configuration persistence
class SettingsService {
  getGlobalSettings(): GlobalSettings;
  getCredentials(): Credentials;
  getProjectSettings(projectPath): ProjectSettings;
  saveSettings(type, settings): void;
}

// TerminalService - PTY management
class TerminalService {
  sessions: Map<string, PtySession>;
  createSession(projectPath): string;
  write(sessionId, data): void;
  resize(sessionId, cols, rows): void;
}
```

### Claude Agent SDK Integration

```typescript
// Provider configuration
const sdkOptions = {
  model: "claude-opus-4-5-20251101",
  maxTurns: 20,
  cwd: worktreePath,
  allowedTools: ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "WebSearch", "WebFetch"],
  permissionMode: "acceptEdits",
  sandbox: {
    enabled: true,
    autoAllowBashIfSandboxed: true
  }
};

// Supported models
const CLAUDE_MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-5-20250929',
  opus: 'claude-opus-4-5-20251101'
};
```

### WebSocket Communication

```typescript
// Two WebSocket endpoints:

// 1. Events WebSocket: /api/events
// - Broadcasts all agent events to connected clients
// - Event types: assistant, tool_use, tool_result, error, done
ws.on('connection', (socket) => {
  eventEmitter.on('agent-event', (event) => {
    socket.send(JSON.stringify(event));
  });
});

// 2. Terminal WebSocket: /api/terminal/ws
// - Real-time terminal I/O
// - Messages: input, resize, ping
ws.on('message', (msg) => {
  const { type, data } = JSON.parse(msg);
  if (type === 'input') terminalService.write(sessionId, data);
  if (type === 'resize') terminalService.resize(sessionId, data.cols, data.rows);
});
```

---

## 6. Frontend Architecture

### Component Hierarchy

```
App
├── RouterProvider (TanStack)
│   └── RootLayout
│       ├── FileBrowserProvider (Context)
│       │   └── RootLayoutContent
│       │       ├── Sidebar
│       │       │   ├── ProjectSelectorWithOptions
│       │       │   ├── SidebarNavigation (links to all views)
│       │       │   └── SidebarFooter
│       │       ├── Main Content (Outlet)
│       │       │   └── [Current View]
│       │       └── StreamerPanel (optional)
│       └── Toaster (notifications)
```

### Main Views (15+)

| View | Route | Description |
|------|-------|-------------|
| BoardView | `/board` | Kanban board + graph view |
| AgentView | `/agent` | Chat interface with AI |
| SettingsView | `/settings` | Configuration panels |
| TerminalView | `/terminal` | Integrated terminal |
| ProfilesView | `/profiles` | AI profile management |
| ContextView | `/context` | Project context files |
| SpecView | `/spec` | App specification editor |
| WikiView | `/wiki` | Project documentation |
| SetupView | `/setup` | First-run wizard |
| GraphView | `/board?mode=graph` | Dependency visualization |

### Custom Hooks (50+)

```typescript
// Global hooks
useAutoMode()              // Feature execution orchestration
useKeyboardShortcuts()     // Global keyboard handling
useElectronAgent()         // IPC communication
useMessageQueue()          // Message buffering

// Board-specific hooks
useBoardFeatures()         // Feature loading/persistence
useBoardDragDrop()         // Drag-and-drop logic
useBoardActions()          // Feature CRUD operations
useFollowUpState()         // Follow-up dialog state

// Sidebar hooks
useNavigation()            // Route navigation
useProjectPicker()         // Project selection
useRunningAgents()         // Monitor active tasks
useThemePreview()          // Theme hover preview

// Settings hooks
useCliStatus()             // CLI installation status
useSettingsMigration()     // localStorage → file migration
```

### UI Components

```
components/ui/           # Radix UI-based primitives
├── button.tsx          # Button with variants (CVA)
├── dialog.tsx          # Modal dialogs
├── dropdown-menu.tsx   # Dropdown menus
├── input.tsx           # Form inputs
├── card.tsx            # Content cards
├── badge.tsx           # Status badges
├── tabs.tsx            # Tab navigation
├── command.tsx         # Command palette
├── sheet.tsx           # Side panels
└── [20+ more...]

External Libraries:
├── @radix-ui/*         # Primitive components
├── @xyflow/react       # Graph visualization
├── @dnd-kit/*          # Drag and drop
├── @uiw/react-codemirror # Code editing
├── @xterm/*            # Terminal emulation
├── lucide-react        # Icons
├── sonner              # Toast notifications
└── react-markdown      # Markdown rendering
```

### Theming System

```css
/* 32 themes: 16 dark + 16 light */
Dark: dark, retro, dracula, nord, monokai, tokyonight,
      solarized, gruvbox, catppuccin, onedark, synthwave,
      red, sunset, gray, forest, ocean

Light: light, cream, solarizedlight, github, paper, rose,
       mint, lavender, sand, sky, peach, snow, sepia,
       gruvboxlight, nordlight, blossom

/* Applied via CSS custom properties */
:root {
  --color-background: ...;
  --color-foreground: ...;
  --color-primary: ...;
  --color-accent: ...;
  /* 50+ tokens */
}

/* Theme class on <html> element */
document.documentElement.className = theme;
```

---

## 7. Project Data Structure

### Per-Project Storage

```
{projectPath}/.automaker/
├── features/                    # Feature data
│   └── {featureId}/
│       ├── feature.json        # Feature metadata
│       └── images/             # Screenshots/diagrams
├── images/                     # Project-level images
├── board/                      # Board customization
├── context/                    # Context files for AI
├── worktrees/                  # Git worktree info
├── app_spec.txt               # Project specification
├── settings.json              # Project overrides
└── active-branches.json       # Branch tracking
```

### Global Storage

```
{dataDir}/
├── settings.json              # User preferences
├── credentials.json           # API keys (separate)
├── window-bounds.json         # Electron window state
└── agent-sessions/            # Chat histories
```

---

## 8. Security Model

### Path Validation

```typescript
// Centralized in @automaker/platform/security.ts
function validatePath(path: string): boolean {
  // 1. Check against ALLOWED_ROOT_DIRECTORY
  // 2. Prevent path traversal (../)
  // 3. DATA_DIR always allowed
  return isAllowed;
}

// Wrapped file operations in @automaker/platform/secure-fs.ts
const secureFs = {
  readFile: (path) => { validatePath(path); return fs.readFile(path); },
  writeFile: (path, data) => { validatePath(path); return fs.writeFile(path, data); },
  // ...
};
```

### Authentication

```typescript
// Optional API key auth (apps/server/src/lib/auth.ts)
if (process.env.AUTOMAKER_API_KEY) {
  // Require X-API-Key header
  app.use(authMiddleware);
}

// Terminal password protection
if (process.env.TERMINAL_PASSWORD) {
  // Validate token on WebSocket connection
}
```

### Claude SDK Sandbox

```typescript
// Agent runs in sandbox with restricted access
sandbox: {
  enabled: true,
  autoAllowBashIfSandboxed: true
}
// Agent can only access files within cwd (worktree)
```

---

## 9. Key Patterns & Practices

### Patterns Used

| Pattern | Implementation |
|---------|----------------|
| **Monorepo** | npm workspaces with shared libs |
| **Provider Factory** | AI model abstraction |
| **Event Emitter** | Real-time updates |
| **Repository Pattern** | FeatureLoader, SettingsService |
| **Compound Components** | Dialog + Hook pattern |
| **File-based Routing** | TanStack Router |
| **State Slices** | Zustand store organization |

### Anti-Patterns Observed

| Issue | Location | Description |
|-------|----------|-------------|
| Monolithic store | `app-store.ts` (2700 lines) | Single store with 100+ actions |
| Large files | `index.ts` (20KB), `board-view.tsx` (46KB) | Poor separation of concerns |
| No database | File-based JSON | Limited querying, race conditions |
| Tight coupling | IPC bridge (77KB) | Electron deeply coupled to UI |
| Plain text secrets | `credentials.json` | No encryption at rest |

---

## 10. Build & Development

### Development Commands

```bash
npm run dev:electron      # Desktop app with hot reload
npm run dev:web          # Browser-only mode
npm run dev:server       # Backend only
npm run dev:full         # Both server and web
```

### Production Builds

```bash
npm run build:electron       # All platforms
npm run build:electron:mac   # macOS (DMG + ZIP)
npm run build:electron:win   # Windows (NSIS)
npm run build:electron:linux # Linux (AppImage + DEB)
```

### Docker

```yaml
# docker-compose.yml
services:
  ui:
    build: ./apps/ui
    ports: ["3007:3007"]
  server:
    build: ./apps/server
    ports: ["3008:3008"]
    volumes:
      - automaker-data:/app/data
```

---

## 11. Key Files Reference

| File | Size | Purpose |
|------|------|---------|
| `apps/server/src/index.ts` | ~20KB | Server entry, route registration |
| `apps/ui/src/store/app-store.ts` | ~2700 lines | Main Zustand store |
| `apps/ui/src/lib/electron.ts` | ~77KB | Electron IPC bridge |
| `apps/ui/src/lib/http-api-client.ts` | ~31KB | HTTP API client |
| `apps/ui/src/components/views/board-view/*` | ~50 files | Kanban implementation |
| `apps/server/src/services/auto-mode-service.ts` | - | Feature execution engine |
| `libs/types/src/index.ts` | - | Core type definitions |

---

## 12. Recommended Improvements for New Implementation

### Architecture

1. **Split the monolithic store** into domain-specific slices (features, settings, sessions)
2. **Add a proper database** (SQLite, PostgreSQL) for features and sessions
3. **Decouple Electron** from core UI logic for better web compatibility
4. **Use a proper state machine** for feature execution states

### Security

1. **Encrypt credentials** at rest using OS keychain or encryption
2. **Add rate limiting** on API endpoints
3. **Implement proper authentication** (JWT, OAuth) instead of simple API keys

### Code Organization

1. **Break up large files** into focused modules
2. **Extract business logic** from UI components into services
3. **Add proper error boundaries** and error handling
4. **Implement proper logging** with levels and persistence

### Developer Experience

1. **Add API documentation** (OpenAPI/Swagger)
2. **Improve type safety** with stricter TypeScript config
3. **Add comprehensive tests** (current coverage appears minimal)
4. **Create proper CI/CD pipelines**

---

*This analysis was generated to serve as a reference for building a new implementation. Focus on the architectural patterns while avoiding the anti-patterns noted above.*
