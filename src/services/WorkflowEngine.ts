import { PayloadRequest } from 'payload/types';
import { WorkflowLogsService } from './WorkflowLogsService';
import { WorkflowNotificationService } from './WorkflowNotificationService';
import { DatabaseWorkflow } from './types';

export class WorkflowEngine {
  private logsService: WorkflowLogsService;
  private notificationService: WorkflowNotificationService;

  constructor() {
    this.logsService = new WorkflowLogsService();
    this.notificationService = new WorkflowNotificationService();
  }

  async startWorkflow(doc: any, workflow: DatabaseWorkflow, req: PayloadRequest): Promise<void> {
    console.log(`Starting workflow: ${workflow.name} for document: ${doc.id}`);

    // Log workflow start
    await this.logsService.createLog({
      workflow: workflow.id,
      document: {
        collection: req.collection?.config.slug || 'unknown',
        id: doc.id,
        title: doc.title || doc.name || 'Untitled',
      },
      step: {
        stepNumber: 1,
        stepName: workflow.steps?.[0]?.name || 'Start',
        stepType: workflow.steps?.[0]?.stepType || 'approval',
      },
      action: 'started',
      user: req.user?.id || 'system',
      comment: 'Workflow started automatically',
    }, req);

    // Update document with workflow status
    await req.payload.update({
      collection: req.collection?.config.slug || 'unknown',
      id: doc.id,
      data: {
        workflowStatus: {
          currentStep: 1,
          isCompleted: false,
          lastUpdated: new Date(),
        },
      },
    });

    // Notify assignees of first step
    const firstStep = workflow.steps?.[0];
    if (firstStep) {
      await this.notificationService.notifyStepAssignees(
        doc,
        workflow,
        firstStep,
        req
      );
    }
  }

  async processStep(doc: any, workflow: DatabaseWorkflow, step: any, req: PayloadRequest): Promise<void> {
    console.log(`Processing step: ${step.name} for document: ${doc.id}`);

    // Check if step is already completed
    const existingLogs = await this.logsService.getStepLogs(
      workflow.id,
      doc.id,
      step.stepNumber,
      req
    );

    const hasApproval = existingLogs.some((log: any) => log.action === 'approved');
    const hasRejection = existingLogs.some((log: any) => log.action === 'rejected');

    if (hasApproval || hasRejection) {
      console.log(`Step ${step.name} already processed`);
      return;
    }

    // Log step assignment
    await this.logsService.createLog({
      workflow: workflow.id,
      document: {
        collection: req.collection?.config.slug || 'unknown',
        id: doc.id,
        title: doc.title || doc.name || 'Untitled',
      },
      step: {
        stepNumber: step.stepNumber,
        stepName: step.name,
        stepType: step.stepType,
      },
      action: 'assigned',
      user: req.user?.id || 'system',
      comment: `Step assigned to ${step.assignees?.type === 'role' ? 'roles' : 'users'}`,
    }, req);

    // Notify assignees
    await this.notificationService.notifyStepAssignees(
      doc,
      workflow,
      step,
      req
    );
  }

  async determineNextStep(
    doc: any,
    workflow: DatabaseWorkflow,
    currentStep: any,
    req: PayloadRequest
  ): Promise<any | null> {
    // Get the latest action for current step
    const stepLogs = await this.logsService.getStepLogs(
      workflow.id,
      doc.id,
      currentStep.stepNumber,
      req
    );

    const latestAction = stepLogs[stepLogs.length - 1];
    if (!latestAction) {
      return null;
    }

    // Check next steps based on action
    if (currentStep.nextSteps) {
      for (const nextStepConfig of currentStep.nextSteps) {
        if (nextStepConfig.condition === latestAction.action || nextStepConfig.condition === 'always') {
          const nextStep = workflow.steps?.find((step: any) => step.stepNumber === nextStepConfig.nextStepNumber);
          if (nextStep) {
            return nextStep;
          }
        }
      }
    }

    // Default: go to next sequential step
    const nextStepNumber = currentStep.stepNumber + 1;
    const nextStep = workflow.steps?.find((step: any) => step.stepNumber === nextStepNumber);
    
    return nextStep || null;
  }

  async moveToNextStep(
    doc: any,
    workflow: DatabaseWorkflow,
    nextStep: any,
    req: PayloadRequest
  ): Promise<void> {
    console.log(`Moving to next step: ${nextStep.name}`);

    // Update document workflow status
    await req.payload.update({
      collection: req.collection?.config.slug || 'unknown',
      id: doc.id,
      data: {
        workflowStatus: {
          currentStep: nextStep.stepNumber,
          isCompleted: false,
          lastUpdated: new Date(),
        },
      },
    });

    // Log step transition
    await this.logsService.createLog({
      workflow: workflow.id,
      document: {
        collection: req.collection?.config.slug || 'unknown',
        id: doc.id,
        title: doc.title || doc.name || 'Untitled',
      },
      step: {
        stepNumber: nextStep.stepNumber,
        stepName: nextStep.name,
        stepType: nextStep.stepType,
      },
      action: 'assigned',
      user: req.user?.id || 'system',
      comment: `Moved to step: ${nextStep.name}`,
    }, req);

    // Notify new step assignees
    await this.notificationService.notifyStepAssignees(
      doc,
      workflow,
      nextStep,
      req
    );
  }

  async completeWorkflow(doc: any, workflow: DatabaseWorkflow, req: PayloadRequest): Promise<void> {
    console.log(`Completing workflow: ${workflow.name} for document: ${doc.id}`);

    // Update document workflow status
    await req.payload.update({
      collection: req.collection?.config.slug || 'unknown',
      id: doc.id,
      data: {
        workflowStatus: {
          currentStep: workflow.steps?.length || 0,
          isCompleted: true,
          lastUpdated: new Date(),
        },
      },
    });

    // Log workflow completion
    await this.logsService.createLog({
      workflow: workflow.id,
      document: {
        collection: req.collection?.config.slug || 'unknown',
        id: doc.id,
        title: doc.title || doc.name || 'Untitled',
      },
      step: {
        stepNumber: workflow.steps?.length || 0,
        stepName: workflow.steps?.[workflow.steps.length - 1]?.name || 'Final',
        stepType: workflow.steps?.[workflow.steps.length - 1]?.stepType || 'approval',
      },
      action: 'completed',
      user: req.user?.id || 'system',
      comment: 'Workflow completed successfully',
    }, req);

    // Send completion notification
    await this.notificationService.notifyWorkflowCompletion(doc, workflow, req);
  }
} 