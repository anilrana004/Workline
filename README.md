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

## 📋 Sample Workflows

### 1. Blog Publication Workflow
A 3-step workflow for blog post approval:

1. **Content Review** (Reviewer)
   - Review content for quality and accuracy
   - SLA: 24 hours
   - If approved → Manager Approval
   - If rejected → Back to Content Review

2. **Manager Approval** (Manager)
   - Final approval from manager
   - SLA: 48 hours
   - If approved → Admin Sign-off
   - If rejected → Back to Content Review

3. **Admin Sign-off** (Admin)
   - Final sign-off from admin
   - SLA: 72 hours
   - Workflow completes

### 2. Contract Approval Workflow
A conditional workflow based on contract amount:

1. **Initial Review** (Reviewer)
   - Review contract terms
   - SLA: 24 hours
   - Always → Next step

2. **Manager Approval** (Manager) - *Conditional*
   - Only for contracts ≤ $10,000
   - SLA: 48 hours
   - If approved → Legal Review
   - If rejected → Initial Review

3. **Executive Approval** (Admin) - *Conditional*
   - Only for contracts > $10,000
   - SLA: 72 hours
   - If approved → Legal Review
   - If rejected → Initial Review

4. **Legal Review** (Admin)
   - Final legal review
   - SLA: 96 hours
   - Workflow completes

## 🔌 API Endpoints

### Workflow Management APIs

#### POST `/api/workflows/trigger`
Manually trigger workflow actions on a document.

**Request Body:**
```json
{
  "documentId": "64a1b2c3d4e5f6789012345",
  "collection": "blogs",
  "workflowId": "64a1b2c3d4e5f6789012346",
  "action": "approved",
  "comment": "Content looks good!"
}
```

#### GET `/api/workflows/status/:docId`
Get workflow status for a specific document.

**Query Parameters:**
- `collection`: The collection name (e.g., "blogs", "contracts")

**Response:**
```json
{
  "success": true,
  "data": {
    "hasWorkflow": true,
    "workflow": {
      "id": "64a1b2c3d4e5f6789012346",
      "name": "Blog Publication Workflow",
      "isActive": true
    },
    "status": {
      "currentStep": 2,
      "totalSteps": 3,
      "isCompleted": false
    },
    "currentStep": {
      "stepNumber": 2,
      "name": "Manager Approval",
      "stepType": "approval",
      "assignees": {
        "type": "role",
        "roles": ["manager"]
      }
    },
    "logs": [...]
  }
}
```

#### GET `/api/workflows/pending`
Get pending actions for the current user.

#### POST `/api/workflows/assign`
Assign a workflow to a document.

**Request Body:**
```json
{
  "documentId": "64a1b2c3d4e5f6789012345",
  "collection": "blogs",
  "workflowId": "64a1b2c3d4e5f6789012346"
}
```

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   In Vercel dashboard, add your environment variables:
   - `MONGODB_URI`
   - `PAYLOAD_SECRET`
   - `PAYLOAD_PUBLIC_SERVER_URL`

### Deploy to Railway

1. **Connect your repository to Railway**
2. **Set environment variables**
3. **Deploy automatically**

### Deploy to Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-workflow-app
   ```

2. **Add MongoDB addon**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

3. **Set environment variables**
   ```bash
   heroku config:set PAYLOAD_SECRET=your-secret-key
   heroku config:set PAYLOAD_PUBLIC_SERVER_URL=https://your-app.herokuapp.com
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run serve        # Serve production build
npm run seed         # Seed database with sample data
npm run generate:types # Generate TypeScript types
```

### Adding New Collections

To add workflow support to a new collection:

1. **Add workflow fields to collection**
   ```typescript
   {
     name: 'workflow',
     type: 'relationship',
     relationTo: 'workflows',
     required: false,
   },
   {
     name: 'workflowStatus',
     type: 'group',
     fields: [
       {
         name: 'currentStep',
         type: 'number',
         defaultValue: 0,
       },
       {
         name: 'isCompleted',
         type: 'checkbox',
         defaultValue: false,
       },
       {
         name: 'lastUpdated',
         type: 'date',
       },
     ],
     admin: {
       readOnly: true,
     },
   }
   ```

2. **Update workflow plugin**
   Add the collection slug to the `workflowCollections` array in `workflowPlugin.ts`.

3. **Update workflow configuration**
   Add the collection to the `applicableCollections` options in the Workflows collection.

### Customizing Workflow Logic

The workflow system is highly extensible:

- **Custom Conditions**: Extend `WorkflowConditionEvaluator` for complex business logic
- **Custom Actions**: Add new action types in the workflow engine
- **Custom Notifications**: Extend `WorkflowNotificationService` for different notification channels
- **Custom APIs**: Add new endpoints in `workflowAPIs.ts`

## 🧪 Testing

### Manual Testing

1. **Create a workflow** in the Admin UI
2. **Assign it to a document** (Blog or Contract)
3. **Test step transitions** by logging in as different users
4. **Verify audit logs** in the Workflow Logs collection
5. **Test API endpoints** using the provided examples

### API Testing

Use the provided API endpoints to test workflow functionality:

```bash
# Get workflow status
curl "http://localhost:3000/api/workflows/status/DOCUMENT_ID?collection=blogs"

# Trigger workflow action
curl -X POST "http://localhost:3000/api/workflows/trigger" \
  -H "Content-Type: application/json" \
  -d '{"documentId":"DOC_ID","collection":"blogs","workflowId":"WORKFLOW_ID","action":"approved"}'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the Payload CMS documentation: https://payloadcms.com
2. Review the workflow system architecture
3. Check the sample workflows for examples
4. Open an issue in the repository

---

**Built with ❤️ using Payload CMS** 