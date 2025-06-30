import { PayloadRequest } from 'payload/types';
import { WorkflowStep } from './types';

export class WorkflowNotificationService {
  async notifyStepAssignees(
    doc: any,
    workflow: any,
    step: WorkflowStep,
    req: PayloadRequest
  ): Promise<void> {
    try {
      const assignees = await this.getStepAssignees(step, req);
      
      for (const assignee of assignees) {
        await this.sendStepNotification(assignee, doc, workflow, step);
      }
    } catch (error) {
      console.error('Error notifying step assignees:', error);
    }
  }

  async notifyWorkflowCompletion(
    doc: any,
    workflow: any,
    req: PayloadRequest
  ): Promise<void> {
    try {
      // Get the document creator
      const creator = await req.payload.findByID({
        collection: 'users',
        id: doc.createdBy || doc.author,
      });

      if (creator) {
        await this.sendCompletionNotification(creator, doc, workflow);
      }

      // Notify workflow creator
      const workflowCreator = await req.payload.findByID({
        collection: 'users',
        id: workflow.createdBy,
      });

      if (workflowCreator && workflowCreator.id !== creator?.id) {
        await this.sendCompletionNotification(workflowCreator, doc, workflow);
      }
    } catch (error) {
      console.error('Error notifying workflow completion:', error);
    }
  }

  async notifySLAEscalation(
    doc: any,
    workflow: any,
    step: WorkflowStep,
    req: PayloadRequest
  ): Promise<void> {
    try {
      const assignees = await this.getStepAssignees(step, req);
      
      for (const assignee of assignees) {
        await this.sendSLAEscalationNotification(assignee, doc, workflow, step);
      }

      // Also notify managers/admins
      const managers = await this.getManagers(req);
      for (const manager of managers) {
        await this.sendSLAEscalationNotification(manager, doc, workflow, step);
      }
    } catch (error) {
      console.error('Error notifying SLA escalation:', error);
    }
  }

  private async getStepAssignees(step: WorkflowStep, req: PayloadRequest): Promise<any[]> {
    const assignees: any[] = [];

    if (step.assignees.type === 'role') {
      if (step.assignees.roles) {
        for (const role of step.assignees.roles) {
          const users = await req.payload.find({
            collection: 'users',
            where: {
              role: {
                equals: role,
              },
              isActive: {
                equals: true,
              },
            },
          });
          assignees.push(...users.docs);
        }
      }
    } else if (step.assignees.type === 'user') {
      if (step.assignees.users) {
        for (const userId of step.assignees.users) {
          const user = await req.payload.findByID({
            collection: 'users',
            id: userId,
          });
          if (user && user.isActive) {
            assignees.push(user);
          }
        }
      }
    }

    return assignees;
  }

  private async getManagers(req: PayloadRequest): Promise<any[]> {
    try {
      const managers = await req.payload.find({
        collection: 'users',
        where: {
          and: [
            {
              role: {
                in: ['admin', 'manager'],
              },
            },
            {
              isActive: {
                equals: true,
              },
            },
          ],
        },
      });

      return managers.docs;
    } catch (error) {
      console.error('Error fetching managers:', error);
      return [];
    }
  }

  private async sendStepNotification(
    user: any,
    doc: any,
    workflow: any,
    step: WorkflowStep
  ): Promise<void> {
    const subject = `Workflow Assignment: ${step.name}`;
    const message = `
      Hello ${user.name},

      You have been assigned to review the following document:

      Document: ${doc.title || doc.name || 'Untitled'}
      Workflow: ${workflow.name}
      Step: ${step.name}
      Type: ${step.stepType}

      Please log into the system to review and take action.

      Best regards,
      Workflow System
    `;

    await this.sendEmail(user.email, subject, message);
  }

  private async sendCompletionNotification(
    user: any,
    doc: any,
    workflow: any
  ): Promise<void> {
    const subject = `Workflow Completed: ${workflow.name}`;
    const message = `
      Hello ${user.name},

      The workflow "${workflow.name}" has been completed for the following document:

      Document: ${doc.title || doc.name || 'Untitled'}

      The document has been successfully processed through all approval steps.

      Best regards,
      Workflow System
    `;

    await this.sendEmail(user.email, subject, message);
  }

  private async sendSLAEscalationNotification(
    user: any,
    doc: any,
    workflow: any,
    step: WorkflowStep
  ): Promise<void> {
    const subject = `SLA Escalation: ${step.name}`;
    const message = `
      Hello ${user.name},

      This is an SLA escalation notification for the following workflow:

      Document: ${doc.title || doc.name || 'Untitled'}
      Workflow: ${workflow.name}
      Step: ${step.name}
      Type: ${step.stepType}

      The step has exceeded its SLA time limit. Please take immediate action.

      Best regards,
      Workflow System
    `;

    await this.sendEmail(user.email, subject, message);
  }

  private async sendEmail(to: string, subject: string, message: string): Promise<void> {
    // In a real implementation, this would integrate with an email service
    // For now, we'll just log the email
    console.log(`Email to ${to}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log('---');
  }

  public async sendStepNotifications(doc: any, workflow: any, step: WorkflowStep, action: string, req: PayloadRequest): Promise<void> {
    console.log(`sendStepNotifications called for action: ${action}`);
    // This is a placeholder. In a real implementation, you would have logic
    // to send different notifications based on the action (e.g., approved, rejected).
    await this.notifyStepAssignees(doc, workflow, step, req);
  }

  public async sendEscalationNotification(item: any, req: PayloadRequest): Promise<void> {
    console.log('sendEscalationNotification called for item:', item);
    // Placeholder for sending a single escalation notice
  }

  public async testNotification(user: any, req: PayloadRequest): Promise<void> {
    console.log('testNotification called for user:', user);
    await this.sendEmail(user.email, 'Test Notification', 'This is a test notification from the Workflow System.');
  }
} 