# Dynamic Workflow Management System for Payload CMS

A comprehensive workflow management system built on Payload CMS that allows users to create, assign, and track multi-stage approval workflows for any collection dynamically via the Admin UI.

## 🎯 Features

### ✅ Core Workflow Engine
- **Dynamic Workflow Creation**: Create workflows with unlimited steps via Admin UI
- **Flexible Assignment**: Assign steps to user roles or specific users
- **Conditional Logic**: Support for field-based conditions (e.g., amount > 10000)
- **Step Types**: Approval, Review, Sign-off, and Comment-only steps
- **Automatic Triggering**: Workflows trigger automatically on document save/update
- **Collection Agnostic**: Works with any Payload collection (Blog, Product, Contract, etc.)

### ✅ Advanced Features
- **Conditional Branching**: Support for conditional branching between steps based on outcomes
- **SLA Management**: Set time limits per step with automatic escalation
- **Audit Trail**: Immutable logging of all workflow actions
- **Email Notifications**: Automated email notifications (simulated with console logs)
- **REST APIs**: Custom endpoints for workflow management

### ✅ Admin UI Integration
- **Workflow Progress Display**: Real-time workflow status in document edit views
- **Inline Actions**: Approve/reject/comment directly from the admin interface
- **Workflow Logs**: Complete audit trail with user actions and timestamps
- **Dynamic Assignment**: Role-based and user-specific assignments

## 🏗️ Architecture

### File Structure
```
src/
├── collections/           # Payload collections
│   ├── Users.ts          # User management with roles
│   ├── Blogs.ts          # Sample blog collection
│   ├── Contracts.ts      # Sample contract collection
│   ├── Workflows.ts      # Workflow definitions
│   └── WorkflowLogs.ts   # Immutable audit trail
├── services/             # Core business logic
│   ├── WorkflowEngine.ts           # Main workflow execution engine
│   ├── WorkflowConditionEvaluator.ts # Dynamic condition evaluation
│   ├── WorkflowLogsService.ts      # Audit trail management
│   └── WorkflowNotificationService.ts # Email notifications
├── plugins/              # Payload plugins
│   ├── workflowPlugin.ts # Main workflow plugin
│   └── workflowAPIs.ts   # REST API endpoints
├── payload.config.ts     # Payload CMS configuration
├── server.ts            # Express server setup
└── seed.ts              # Database seeding
```

### Core Components

#### 1. Workflow Engine (`WorkflowEngine.ts`)
- Handles workflow execution logic
- Manages step transitions and branching
- Coordinates with other services

#### 2. Condition Evaluator (`WorkflowConditionEvaluator.ts`)
- Evaluates dynamic conditions against document fields
- Supports multiple operators (eq, gt, lt, contains, etc.)
- Handles different data types automatically

#### 3. Audit Trail (`WorkflowLogsService.ts`)
- Immutable logging of all workflow actions
- Tracks user actions, timestamps, and comments
- Supports SLA monitoring and escalation

#### 4. Notification Service (`WorkflowNotificationService.ts`)
- Sends email notifications for workflow events
- Handles SLA escalation alerts
- Supports role-based and user-specific notifications

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd workflow-payload-cms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/workflow-payload-cms
   
   # Payload
   PAYLOAD_SECRET=your-super-secret-key-here
   PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
   
   # Admin credentials
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   
   # Reviewer credentials
   REVIEWER_EMAIL=reviewer@example.com
   REVIEWER_PASSWORD=reviewer123
   ```

4. **Start MongoDB** (if using local instance)
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Windows
   net start MongoDB
   
   # Linux
   sudo systemctl start mongod
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Admin UI: http://localhost:3000/admin
   - API: http://localhost:3000/api

### Demo Credentials

After running the seed script, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Reviewer | reviewer@example.com | reviewer123 |
| Manager | manager@example.com | manager123 |
| Author | author@example.com | author123 |

## 🌐 Deploying to Render

Render is the recommended platform for hosting this Payload CMS project.

### 1. Push your code to GitHub
- Make sure your latest code is on GitHub.

### 2. Create a new Web Service on Render
- Go to [https://dashboard.render.com/](https://dashboard.render.com/)
- Click **New +** → **Web Service**
- Connect your GitHub and select your repository

### 3. Configure the service
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment:** Node
- **Add all environment variables** from your `.env` file in the Render dashboard

### 4. Deploy
- Click **Create Web Service**
- Render will build and deploy your app
- You'll get a public URL (e.g., `https://your-app-name.onrender.com`)

### 5. Access your app
- Admin UI: `https://your-app-name.onrender.com/admin`
- API: `https://your-app-name.onrender.com/api`
- Payload Admin URL: https://workline-xrj0.onrender.com/admin

---

**Note:** Vercel is not recommended for Payload CMS backend hosting. Use Render or another Node.js-friendly host for best results.

---

**Built with ❤️ using Payload CMS**
