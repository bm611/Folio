export interface Template {
  id: string
  name: string
  description: string
  icon: string
  tags: string[]
  content: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Structured agenda, attendees, and action items',
    icon: 'Meeting',
    tags: ['meeting'],
    content: `## Meeting Notes

### Date

### Attendees
-

### Agenda
-

### Discussion


### Action Items
- [ ]

### Next Steps

`,
  },
  {
    id: 'interview-prep',
    name: 'Interview Prep',
    description: 'Company research, questions, and STAR stories',
    icon: 'Briefcase',
    tags: ['interview', 'career'],
    content: `## Interview Preparation

### Company
- **Industry:**
- **Size:**
- **Mission:**

### Role Research
- **Key Responsibilities:**
- **Required Skills:**

### My Questions
1.
2.
3.

### STAR Stories

#### Situation 1:
- **Situation:**
- **Task:**
- **Action:**
- **Result:**

#### Situation 2:
- **Situation:**
- **Task:**
- **Action:**
- **Result:**

### Notes

`,
  },
  {
    id: 'habit-tracker',
    name: 'Habit Tracker',
    description: 'Weekly habit tracking with checkboxes',
    icon: 'Checkbox',
    tags: ['habit', 'health'],
    content: `## Habit Tracker

### Week of

| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|-------|-----|-----|-----|-----|-----|-----|-----|
|       |  ☐  |  ☐  |  ☐  |  ☐  |  ☐  |  ☐  |  ☐  |

### Goals This Week

### Reflections

`,
  },
  {
    id: 'project-planning',
    name: 'Project Planning',
    description: 'Overview, milestones, tasks, and timeline',
    icon: 'Folder',
    tags: ['project', 'planning'],
    content: `## Project Name

### Overview
- **Description:**
- **Objective:**
- **Stakeholders:**

### Milestones
- [ ]

### Tasks

#### Phase 1:
- [ ]

#### Phase 2:
- [ ]

### Timeline

### Resources

### Risks & Mitigation

### Notes

`,
  },
  {
    id: 'daily-note',
    name: 'Daily Note',
    description: 'Journal, todos, and ideas for today',
    icon: 'Calendar',
    tags: ['daily'],
    content: `## Daily Note

### Date

### Journal
-

### To-Dos
- [ ]

### Ideas & Notes
-

### Grateful for

`,
  },
  {
    id: 'quick-note',
    name: 'Quick Note',
    description: 'Simple blank note for fast capture',
    icon: 'File',
    tags: [],
    content: `## 

`,
  },
]
