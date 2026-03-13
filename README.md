# BuildFlow – Developer Project Planner for VS Code

BuildFlow is a **lightweight project planning and task management extension for Visual Studio Code** designed specifically for developers.

Instead of using external tools like Trello, Notion, or Jira, BuildFlow allows you to **plan and manage your development workflow directly inside your editor**.

It provides a structured system based on:

* **Projects**
* **Categories**
* **Tasks**
* **Gameplan Steps**

Everything is **stored locally**, keeping your data private and your workflow fast.

---

# ✨ Features

## 📁 Project-Based Planning

Organize your work into multiple projects.

Example:

```
Capsule Encryption System
Sudoku Solver
Video Generator AI
```

Each project contains categories and tasks that help structure development work.

---

## 📂 Categories

Group tasks by technical area.

Examples:

```
Backend
Frontend
AI/ML
Infrastructure
Testing
Deployment
```

This makes it easier to manage complex projects.

---

## ✅ Tasks

Tasks represent actual development work.

Examples:

```
Implement JWT authentication
Create PostgreSQL schema
Add Redis caching
Design UI layout
```

Each task can include:

* status
* priority
* description
* deadlines
* notes

---

## 🧠 Gameplan Steps

Break tasks into actionable steps.

Example:

```
Task: Implement JWT Authentication

Gameplan:
1. Define JWT payload
2. Implement token signing
3. Add Redis validation
4. Write authentication middleware
```

This helps developers turn ideas into clear execution plans.

---

## 📊 Progress Tracking

Tasks show completion progress automatically.

Example:

```
JWT Authentication [2/4]
```

Meaning **2 out of 4 steps are completed**.

---

## 🔥 Priority Levels

Tasks can have priority indicators:

```
🔥 Critical
⚡ High
• Normal
```

---

## 📅 Deadlines

Add due dates to tasks.

Example:

```
Finish API authentication (Due: Friday)
```

---

## 📝 Task Notes

Add extra information or reminders to tasks.

Example:

```
Use RS256 instead of HS256
Store blacklist tokens in Redis
```

---

## 🔗 File Linking

Tasks can link to specific code locations.

Example:

```
Fix bug in auth.ts:88
```

Clicking the task opens the file directly.

---

## 🖱 Create Tasks From Code

Right click on a line of code and create a task referencing that location.

Example:

```
Task: Fix null pointer issue
File: auth.ts
Line: 88
```

---

# 📌 Sidebar Interface

BuildFlow integrates directly into the **VS Code sidebar**.

Example view:

```
BUILDFLOW

📁 Capsule System
   📂 Backend
      ☐ JWT Authentication
         ☐ Design token structure
         ☐ Implement signing
         ☐ Add Redis validation

      ☐ File Encryption Module

   📂 Frontend
      ☐ Capsule Viewer UI
```

Tasks can be:

* checked
* edited
* expanded
* reorganized

---

# 💾 Local Storage

All data is stored locally inside the workspace.

Default file:

```
.vscode/buildflow.json
```

Benefits:

* no cloud accounts
* full privacy
* fast performance
* optional version control

---

# ⚙ Commands

BuildFlow adds several commands to the **Command Palette**.

### Project Commands

```
BuildFlow: Create Project
BuildFlow: Delete Project
BuildFlow: Rename Project
```

### Category Commands

```
BuildFlow: Add Category
BuildFlow: Remove Category
```

### Task Commands

```
BuildFlow: Add Task
BuildFlow: Edit Task
BuildFlow: Delete Task
BuildFlow: Toggle Task Status
```

### Gameplan Commands

```
BuildFlow: Add Gameplan Step
BuildFlow: Complete Step
BuildFlow: Remove Step
```

---

# 🧱 Data Structure

Example `buildflow.json`:

```json
{
  "projects": [
    {
      "id": "p1",
      "name": "Capsule System",
      "categories": [
        {
          "id": "c1",
          "name": "Backend",
          "tasks": [
            {
              "id": "t1",
              "title": "JWT Authentication",
              "status": "TODO",
              "priority": "HIGH",
              "gameplan": [
                { "step": "Design token structure", "completed": false },
                { "step": "Implement signing", "completed": false },
                { "step": "Add Redis validation", "completed": false }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

# 🎯 Why BuildFlow?

Most TODO extensions are simple checkbox lists.

BuildFlow provides a **developer-focused planning structure**.

| Feature           | BuildFlow | Typical TODO Extensions |
| ----------------- | --------- | ----------------------- |
| Project hierarchy | ✔         | ✘                       |
| Task breakdown    | ✔         | Limited                 |
| Gameplan steps    | ✔         | ✘                       |
| Code linking      | ✔         | Rare                    |
| Local storage     | ✔         | Often cloud             |

---

# 🚀 Future Features

Planned improvements may include:

### Kanban Board Mode

```
TODO | IN PROGRESS | DONE
```

### Project Timeline / Roadmap

Visual progress tracking across tasks.

### Markdown Export

Export tasks as:

```
README.md
Development logs
Project documentation
```

### Git Integration

Link tasks with commits or issues.

### AI Planning Assistance

Automatically generate:

* task breakdowns
* development plans
* implementation suggestions

---

# 👨‍💻 Philosophy

BuildFlow follows one core idea:

> **Keep planning close to the code.**

Developers shouldn't need to leave their editor to organize their work.

BuildFlow brings **project planning directly into VS Code**.

---

# 📜 License

MIT License

---

# ⭐ Contributing

Contributions are welcome!

If you have ideas for improvements, feel free to:

* open an issue
* submit a pull request
* suggest features

---

# 🔧 Author

Created to help developers **plan, build, and ship better software directly inside VS Code**.
