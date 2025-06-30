import express, { Router, Request, Response, NextFunction } from 'express';
import { PayloadRequest } from 'payload/types';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowLogsService } from '../services/WorkflowLogsService';
import { WorkflowNotificationService } from '../services/WorkflowNotificationService';
import { DatabaseWorkflow } from '../services/types';

export const router: Router = express.Router();

// Middleware for authentication
// Payload's own middleware (initialized in server.ts) handles attaching the user.
// We just need to check for its existence.
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const payloadReq = req as PayloadRequest;
  if (!payloadReq.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.',
    });
  }
  next();
};

// POST /api/workflows/trigger - Manually trigger workflow on a document
router.post('/trigger', requireAuth, async (req: Request, res: Response) => {
  const payloadReq = req as PayloadRequest;
  try {
    const { documentId, collection, workflowId, action, comment, attachments } = payloadReq.body;

    if (!documentId || !collection || !workflowId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: documentId, collection, workflowId, action',
      });
    }

    const doc = await payloadReq.payload.findByID({ collection, id: documentId });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const workflow = await payloadReq.payload.findByID({ collection: 'workflows', id: workflowId }) as unknown as DatabaseWorkflow;
    if (!workflow) {
      return res.status(404).json({ success: false, message: 'Workflow not found' });
    }

    const workflowEngine = new WorkflowEngine();
    const logsService = new WorkflowLogsService();
    const notificationService = new WorkflowNotificationService();

    const currentStepNumber = (doc.workflowStatus as any)?.currentStep || 1;
    const currentStep = workflow.steps.find((step: any) => step.stepNumber === currentStepNumber);

    if (!currentStep) {
      return res.status(400).json({ success: false, message: 'No current step found in workflow' });
    }

    const canPerformAction = await workflowEngine.validateActionPermissions(payloadReq.user.id, currentStep, doc, action);
    if (!canPerformAction) {
      return res.status(403).json({ success: false, message: 'You do not have permission to perform this action' });
    }

    const logEntry = await logsService.createLog({
      workflow: workflowId,
      document: { collection, id: documentId, title: (doc as any).title || (doc as any).name || 'Untitled' },
      step: { stepNumber: currentStepNumber, stepName: currentStep.name, stepType: currentStep.stepType },
      action,
      user: payloadReq.user.id,
      comment,
      attachments,
    }, payloadReq);

    const nextStep = await workflowEngine.determineNextStep(doc, workflow, currentStep, action, payloadReq);
    
    let result;
    if (nextStep) {
      result = await workflowEngine.moveToNextStep(doc, workflow, nextStep, payloadReq);
    } else {
      result = await workflowEngine.completeWorkflow(doc, workflow, action, payloadReq);
    }
    
    await notificationService.sendStepNotifications(doc, workflow, currentStep, action, payloadReq);

    res.json({
      success: true,
      message: `Workflow action '${action}' processed successfully`,
      data: {
        logId: logEntry.id,
        ...result,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error triggering workflow:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: message });
  }
});

// GET /api/workflows/status/:docId - Get workflow status for a document
router.get('/status/:docId', requireAuth, async (req: Request, res: Response) => {
  const payloadReq = req as PayloadRequest;
  try {
    const { docId } = payloadReq.params;
    const { collection } = payloadReq.query;

    if (!collection) {
      return res.status(400).json({ success: false, message: 'Collection parameter is required' });
    }

    const doc = await payloadReq.payload.findByID({ collection: collection as string, id: docId });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    res.json({ success: true, data: (doc as any).workflowStatus || { message: "No workflow status found." } });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error fetching status for docId ${req.params.docId}:`, error);
    res.status(500).json({ success: false, message: 'Internal server error', error: message });
  }
});

// GET /api/workflows/analytics/performance - Get performance metrics
router.get('/analytics/performance', requireAuth, async (req: Request, res: Response) => {
    const payloadReq = req as PayloadRequest;
    try {
        const logsService = new WorkflowLogsService();
        const metrics = await logsService.getPerformanceMetrics(payloadReq);
        res.json({ success: true, data: metrics });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ success: false, message, error: message });
    }
});

// A catch-all for any other routes to avoid 404s while fixing
router.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
});

export default router; 