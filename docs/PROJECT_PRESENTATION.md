# Task Management System
## Project Presentation

---

## 1. Project Overview

### Purpose
A web-based task management system for organizations with role-based access control.

### Key Features
- **User Authentication** - Secure login/signup with email
- **Role-Based Access** - Admin, Department Head, Employee roles
- **Task Management** - Create, assign, track, and complete tasks
- **Project Organization** - Group tasks into projects
- **Dashboard Analytics** - View task statistics and progress

### Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + Shadcn/UI |
| State | React Context + TanStack Query |
| Backend | Lovable Cloud (Supabase) |
| Database | PostgreSQL |
| Auth | Supabase Auth |

---

## 2. Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                       │
├─────────────────────────────────────────────────────────────┤
│  Pages           │  Components        │  Hooks              │
│  ├── Auth        │  ├── AppLayout     │  ├── useAuth        │
│  ├── Dashboard   │  ├── TaskCard      │  ├── useTasks       │
│  ├── Projects    │  ├── TaskDialog    │  └── useProjects    │
│  └── Users       │  └── ProjectCard   │                     │
├─────────────────────────────────────────────────────────────┤
│                    CONTEXT (AuthContext)                    │
│         Manages user session, profile, and role             │
├─────────────────────────────────────────────────────────────┤
│                   SUPABASE CLIENT                           │
│              API calls to backend services                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Lovable Cloud)                  │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Database (PostgreSQL)  │  RLS Policies  │
│  ├── Sign Up     │  ├── profiles           │  Role-based    │
│  ├── Sign In     │  ├── tasks              │  access        │
│  └── Sign Out    │  ├── projects           │  control       │
│                  │  └── user_roles         │                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │    tasks     │       │   projects   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ assigned_to  │       │ id (PK)      │
│ email        │       │ created_by   │──────►│ name         │
│ full_name    │       │ project_id   │───────│ description  │
│ created_at   │       │ title        │       │ created_by   │
│ updated_at   │       │ description  │       │ created_at   │
└──────────────┘       │ priority     │       │ updated_at   │
       ▲               │ status       │       └──────────────┘
       │               │ due_date     │
┌──────────────┐       │ completed_at │
│  user_roles  │       │ created_at   │
├──────────────┤       │ updated_at   │
│ id (PK)      │       └──────────────┘
│ user_id (FK) │
│ role (enum)  │
└──────────────┘

Role Types: 'admin' | 'department_head' | 'employee'
Priority:   'low' | 'medium' | 'high'
Status:     'pending' | 'in_progress' | 'completed'
```

---

## 4. Authentication Flow

```
User Opens App
      │
      ▼
┌─────────────┐    No     ┌─────────────┐
│  Logged In? │──────────►│  Auth Page  │
└─────────────┘           └─────────────┘
      │ Yes                     │
      ▼                         ▼
┌─────────────┐           ┌─────────────┐
│  Dashboard  │◄──────────│ Login/Signup│
└─────────────┘  Success  └─────────────┘
```

### Key Code: AuthContext

```typescript
// src/contexts/AuthContext.tsx

// Listen for authentication state changes
useEffect(() => {
  // Set up listener for login/logout events
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile and role from database
        await fetchUserData(session.user.id);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

---

## 5. Role-Based Access Control

### Permission Matrix

| Feature | Employee | Dept. Head | Admin |
|---------|----------|------------|-------|
| View assigned tasks | ✓ | ✓ | ✓ |
| Complete tasks | ✓ | ✓ | ✓ |
| View all tasks | ✗ | ✓ | ✓ |
| Create tasks | ✗ | ✓ | ✓ |
| Create projects | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |

### Key Code: Role Check Function (SQL)

```sql
-- Database function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Key Code: RLS Policy Example

```sql
-- Only assigned users, dept heads, or admins can view tasks
CREATE POLICY "Users can view assigned tasks or if manager/admin"
ON public.tasks FOR SELECT
USING (
  (assigned_to = auth.uid()) OR 
  has_role(auth.uid(), 'department_head') OR 
  has_role(auth.uid(), 'admin')
);
```

---

## 6. Task Management Hook

### Key Code: useTasks Hook

```typescript
// src/hooks/useTasks.ts

export function useTasks() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const { user, isAdmin, isDepartmentHead } = useAuth();

  // Fetch all data in parallel for performance
  const fetchData = async () => {
    const [tasksRes, projectsRes, usersRes] = await Promise.all([
      supabase.from('tasks').select('*'),
      supabase.from('projects').select('*'),
      supabase.from('profiles').select('*')
    ]);

    // Combine tasks with related data
    const tasksWithRelations = tasksRes.data.map(task => ({
      ...task,
      project: projectsRes.data.find(p => p.id === task.project_id),
      assigned_user: usersRes.data.find(u => u.id === task.assigned_to),
    }));
    
    setTasks(tasksWithRelations);
  };

  // Create new task
  const createTask = async (taskData: Partial<Task>) => {
    await supabase.from('tasks').insert({
      ...taskData,
      created_by: user?.id,
    });
    await fetchData(); // Refresh list
  };

  return {
    tasks,
    createTask,
    canManageTasks: isAdmin || isDepartmentHead,
  };
}
```

---

## 7. Component Architecture

### TaskCard Component

```typescript
// src/components/tasks/TaskCard.tsx

// Priority colors for visual indication
const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function TaskCard({ task, onComplete, onClick }) {
  return (
    <Card onClick={onClick}>
      {/* Completion checkbox */}
      <Checkbox
        checked={task.status === 'completed'}
        onCheckedChange={(checked) => onComplete(task.id, checked)}
      />
      
      {/* Task details */}
      <h3>{task.title}</h3>
      <Badge className={PRIORITY_COLORS[task.priority]}>
        {task.priority}
      </Badge>
      
      {/* Project and assignee info */}
      {task.project && <span>{task.project.name}</span>}
      {task.assigned_user && (
        <Avatar>{getInitials(task.assigned_user.full_name)}</Avatar>
      )}
    </Card>
  );
}
```

---

## 8. Protected Routes

### Key Code: Route Protection

```typescript
// src/App.tsx

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Render protected content
  return <>{children}</>;
}

// Usage in routes
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

---

## 9. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT                          │
│                 (Dashboard, Projects)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOM HOOKS                             │
│              (useTasks, useProjects, useAuth)               │
│                                                             │
│  • Manage state                                             │
│  • Handle API calls                                         │
│  • Transform data                                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE CLIENT                           │
│                                                             │
│  supabase.from('tasks').select('*')                         │
│  supabase.from('tasks').insert({...})                       │
│  supabase.auth.signInWithPassword({...})                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  LOVABLE CLOUD BACKEND                      │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Auth     │  │  Database   │  │ RLS Policies│         │
│  │   Service   │  │ (PostgreSQL)│  │  (Security) │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Key Features Summary

### ✅ Authentication
- Email/password login and signup
- Session persistence
- Automatic profile creation

### ✅ Role-Based Access
- Three distinct roles with different permissions
- Server-side enforcement via RLS policies
- Secure role checking functions

### ✅ Task Management
- CRUD operations for tasks
- Priority levels (low, medium, high)
- Status tracking (pending, in_progress, completed)
- Due date management

### ✅ Project Organization
- Group related tasks
- Task count per project
- Project-level views

### ✅ User Interface
- Clean, professional design
- Responsive layout
- Real-time updates
- Toast notifications

---

## 11. Security Features

| Feature | Implementation |
|---------|----------------|
| Authentication | Supabase Auth with secure tokens |
| Authorization | Row-Level Security (RLS) policies |
| Role Storage | Separate user_roles table (prevents escalation) |
| Role Checking | Security Definer functions |
| Data Access | Per-user filtering via RLS |
| API Security | Anon key + RLS combination |

---

## Questions?

### Resources
- **Documentation**: `/docs/` folder
- **Source Code**: `src/` directory
- **Database Schema**: Lovable Cloud dashboard

### Contact
Project maintained via Lovable platform.
