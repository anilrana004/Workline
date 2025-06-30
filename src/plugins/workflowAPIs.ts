import express from 'express';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowLogsService } from '../services/WorkflowLogsService';
import { WorkflowNotificationService } from '../services/WorkflowNotificationService';

// Create Express router
export const router = express.Router();

// Middleware to get Payload instance
const getPayload = (req: any) => {
  return req.payload;
};

// Middleware for authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user?.id) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  next();
};

// POST /api/workflows/trigger - Manually trigger workflow on a document
router.post('/trigger', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { documentId, collection, workflowId, action, comment, attachments } = req.body;

    if (!documentId || !collection || !workflowId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: documentId, collection, workflowId, action',
      });
    }

    // Get the document
    const doc = await payload.findByID({
      collection,
      id: documentId,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Get the workflow
    const workflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    const workflowEngine = new WorkflowEngine();
    const logsService = new WorkflowLogsService();
    const notificationService = new WorkflowNotificationService();

    // Get current step
    const currentStepNumber = doc.workflowStatus?.currentStep || 1;
    const currentStep = workflow.steps.find(step => step.stepNumber === currentStepNumber);

    if (!currentStep) {
      return res.status(400).json({
        success: false,
        message: 'No current step found',
      });
    }

    // Validate action permissions
    const canPerformAction = await workflowEngine.validateActionPermissions(
      req.user.id,
      currentStep,
      doc,
      action
    );

    if (!canPerformAction) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
      });
    }

    // Log the action
    const logEntry = await logsService.createLog({
      workflow: workflowId,
      document: {
        collection,
        id: documentId,
        title: doc.title || doc.name || 'Untitled',
      },
      step: {
        stepNumber: currentStepNumber,
        stepName: currentStep.name,
        stepType: currentStep.stepType,
      },
      action,
      user: req.user.id,
      comment,
      attachments,
    }, req);

    // Process the action
    let result;
    if (['approved', 'rejected', 'revision', 'changes', 'conditional'].includes(action)) {
      // Determine next step
      const nextStep = await workflowEngine.determineNextStep(
        doc,
        workflow,
        currentStep,
        action,
        req
      );

      if (nextStep) {
        result = await workflowEngine.moveToNextStep(doc, workflow, nextStep, req);
      } else {
        result = await workflowEngine.completeWorkflow(doc, workflow, action, req);
      }

      // Send notifications
      await notificationService.sendStepNotifications(doc, workflow, currentStep, action, req);
    }

    res.json({
      success: true,
      message: `Workflow action '${action}' processed successfully`,
      data: {
        documentId,
        workflowId,
        action,
        currentStep: currentStepNumber,
        nextStep: result?.nextStep,
        isCompleted: result?.isCompleted,
        logId: logEntry.id,
      },
    });

  } catch (error) {
    console.error('Error triggering workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/status/:docId - Get workflow status for a document
router.get('/status/:docId', async (req, res) => {
  try {
    const payload = getPayload(req);
    const { docId } = req.params;
    const { collection, includeLogs = 'true' } = req.query;

    if (!collection) {
      return res.status(400).json({
        success: false,
        message: 'Collection parameter is required',
      });
    }

    // Get the document
    const doc = await payload.findByID({
      collection: collection as string,
      id: docId,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    if (!doc.workflow) {
      return res.json({
        success: true,
        data: {
          hasWorkflow: false,
          message: 'No workflow assigned to this document',
        },
      });
    }

    // Get workflow details
    const workflow = await payload.findByID({
      collection: 'workflows',
      id: doc.workflow,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Get workflow logs if requested
    let logs = [];
    if (includeLogs === 'true') {
      const logsService = new WorkflowLogsService();
      logs = await logsService.getDocumentLogs(doc.workflow, docId, req);
    }

    // Get current step details
    const currentStepNumber = doc.workflowStatus?.currentStep || 1;
    const currentStep = workflow.steps.find(step => step.stepNumber === currentStepNumber);

    // Calculate progress
    const progress = (currentStepNumber / workflow.steps.length) * 100;

    res.json({
      success: true,
      data: {
        hasWorkflow: true,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          workflowType: workflow.workflowType,
          priority: workflow.priority,
          isActive: workflow.isActive,
          version: workflow.version,
          tags: workflow.tags,
        },
        document: {
          id: doc.id,
          title: doc.title || doc.name || 'Untitled',
          collection: collection as string,
        },
        status: {
          currentStep: currentStepNumber,
          totalSteps: workflow.steps.length,
          progress: Math.round(progress),
          isCompleted: doc.workflowStatus?.isCompleted || false,
          lastUpdated: doc.workflowStatus?.lastUpdated,
          startedAt: doc.workflowStatus?.startedAt,
          completedAt: doc.workflowStatus?.completedAt,
        },
        currentStep: currentStep ? {
          stepNumber: currentStep.stepNumber,
          name: currentStep.name,
          description: currentStep.description,
          stepType: currentStep.stepType,
          assignees: currentStep.assignees,
          isRequired: currentStep.isRequired,
          allowComments: currentStep.allowComments,
          allowAttachments: currentStep.allowAttachments,
          requireComments: currentStep.requireComments,
          sla: currentStep.sla,
          autoApproveIf: currentStep.autoApproveIf,
          notifications: currentStep.notifications,
        } : null,
        logs: logs.slice(-20), // Last 20 logs
        availableActions: currentStep ? ['approved', 'rejected', 'revision', 'changes'] : [],
      },
    });

  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/pending - Get pending actions for current user
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { page = 1, limit = 20, priority, workflowType, collection } = req.query;
    
    const logsService = new WorkflowLogsService();
    const pendingActions = await logsService.getPendingActions(
      req.user.id, 
      req,
      {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        priority: priority as string,
        workflowType: workflowType as string,
        collection: collection as string,
      }
    );

    res.json({
      success: true,
      data: {
        pendingActions: pendingActions.items,
        pagination: pendingActions.pagination,
        count: pendingActions.items.length,
        total: pendingActions.pagination.totalDocs,
      },
    });

  } catch (error) {
    console.error('Error getting pending actions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/assign - Assign workflow to document
router.post('/assign', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { documentId, collection, workflowId, autoStart = true } = req.body;

    if (!documentId || !collection || !workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: documentId, collection, workflowId',
      });
    }

    // Check if workflow exists and is active
    const workflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    });

    if (!workflow || !workflow.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Workflow not found or inactive',
      });
    }

    // Check if document already has a workflow
    const existingDoc = await payload.findByID({
      collection,
      id: documentId,
    });

    if (existingDoc?.workflow) {
      return res.status(400).json({
        success: false,
        message: 'Document already has a workflow assigned',
      });
    }

    const workflowEngine = new WorkflowEngine();

    // Update document with workflow
    const updatedDoc = await payload.update({
      collection,
      id: documentId,
      data: {
        workflow: workflowId,
        workflowStatus: {
          currentStep: 1,
          isCompleted: false,
          lastUpdated: new Date(),
          startedAt: autoStart ? new Date() : null,
        },
      },
    });

    // Start workflow if autoStart is true
    if (autoStart) {
      await workflowEngine.startWorkflow(updatedDoc, workflow, req);
    }

    res.json({
      success: true,
      message: 'Workflow assigned successfully',
      data: {
        documentId,
        workflowId,
        workflowName: workflow.name,
        autoStarted: autoStart,
      },
    });

  } catch (error) {
    console.error('Error assigning workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/:workflowId - Get workflow details
router.get('/:workflowId', async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;

    const workflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      data: workflow,
    });

  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows - List all workflows with filtering
router.get('/', async (req, res) => {
  try {
    const payload = getPayload(req);
    const { 
      page = 1, 
      limit = 20, 
      workflowType, 
      priority, 
      isActive, 
      tags,
      search 
    } = req.query;

    const query: any = {};

    if (workflowType) query.workflowType = { equals: workflowType };
    if (priority) query.priority = { equals: priority };
    if (isActive !== undefined) query.isActive = { equals: isActive === 'true' };
    if (tags) query.tags = { contains: tags };
    if (search) {
      query.or = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const workflows = await payload.find({
      collection: 'workflows',
      where: query,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: '-createdAt',
    });

    res.json({
      success: true,
      data: workflows,
    });

  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const workflowData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const workflow = await payload.create({
      collection: 'workflows',
      data: workflowData,
    });

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      data: workflow,
    });

  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// PUT /api/workflows/:workflowId - Update workflow
router.put('/:workflowId', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;

    const workflow = await payload.update({
      collection: 'workflows',
      id: workflowId,
      data: req.body,
    });

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      data: workflow,
    });

  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// DELETE /api/workflows/:workflowId - Delete workflow
router.delete('/:workflowId', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;

    // Check if workflow is in use
    const logsService = new WorkflowLogsService();
    const activeInstances = await logsService.getActiveWorkflowInstances(workflowId, req);

    if (activeInstances.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete workflow with active instances',
        data: {
          activeInstances: activeInstances.length,
        },
      });
    }

    await payload.delete({
      collection: 'workflows',
      id: workflowId,
    });

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/bulk-assign - Bulk assign workflows
router.post('/bulk-assign', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { documents, workflowId, autoStart = true } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Documents array is required',
      });
    }

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID is required',
      });
    }

    const workflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    });

    if (!workflow || !workflow.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Workflow not found or inactive',
      });
    }

    const workflowEngine = new WorkflowEngine();
    const results = [];

    for (const doc of documents) {
      try {
        const updatedDoc = await payload.update({
          collection: doc.collection,
          id: doc.id,
          data: {
            workflow: workflowId,
            workflowStatus: {
              currentStep: 1,
              isCompleted: false,
              lastUpdated: new Date(),
              startedAt: autoStart ? new Date() : null,
            },
          },
        });

        if (autoStart) {
          await workflowEngine.startWorkflow(updatedDoc, workflow, req);
        }

        results.push({
          documentId: doc.id,
          collection: doc.collection,
          success: true,
        });
      } catch (error) {
        results.push({
          documentId: doc.id,
          collection: doc.collection,
          success: false,
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Bulk assignment completed. ${successCount} successful, ${failureCount} failed.`,
      data: {
        results,
        summary: {
          total: documents.length,
          successful: successCount,
          failed: failureCount,
        },
      },
    });

  } catch (error) {
    console.error('Error bulk assigning workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/:workflowId/clone - Clone workflow
router.post('/:workflowId/clone', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;
    const { name, description, isActive = false } = req.body;

    const originalWorkflow = await payload.findByID({
      collection: 'workflows',
      id: workflowId,
    });

    if (!originalWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    // Create cloned workflow
    const clonedWorkflow = await payload.create({
      collection: 'workflows',
      data: {
        name: name || `${originalWorkflow.name} (Copy)`,
        description: description || originalWorkflow.description,
        workflowType: originalWorkflow.workflowType,
        priority: originalWorkflow.priority,
        isActive,
        applicableCollections: originalWorkflow.applicableCollections,
        triggerConditions: originalWorkflow.triggerConditions,
        steps: originalWorkflow.steps,
        createdBy: req.user.id,
        tags: originalWorkflow.tags,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Workflow cloned successfully',
      data: clonedWorkflow,
    });

  } catch (error) {
    console.error('Error cloning workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/:workflowId/activate - Activate workflow
router.post('/:workflowId/activate', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;

    const workflow = await payload.update({
      collection: 'workflows',
      id: workflowId,
      data: {
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'Workflow activated successfully',
      data: workflow,
    });

  } catch (error) {
    console.error('Error activating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/:workflowId/deactivate - Deactivate workflow
router.post('/:workflowId/deactivate', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId } = req.params;

    const workflow = await payload.update({
      collection: 'workflows',
      id: workflowId,
      data: {
        isActive: false,
      },
    });

    res.json({
      success: true,
      message: 'Workflow deactivated successfully',
      data: workflow,
    });

  } catch (error) {
    console.error('Error deactivating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/sla/overdue - Get overdue SLA items
router.get('/sla/overdue', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { page = 1, limit = 20 } = req.query;

    const logsService = new WorkflowLogsService();
    const overdueItems = await logsService.getOverdueSLAItems({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    }, req);

    res.json({
      success: true,
      data: overdueItems,
    });

  } catch (error) {
    console.error('Error getting overdue SLA items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/sla/escalate - Escalate overdue items
router.post('/sla/escalate', requireAuth, async (req, res) => {
  try {
    const { workflowId, stepNumber, escalationAction } = req.body;

    const logsService = new WorkflowLogsService();
    const notificationService = new WorkflowNotificationService();

    const escalatedItems = await logsService.escalateOverdueItems({
      workflowId,
      stepNumber,
      escalationAction,
    }, req);

    // Send escalation notifications
    for (const item of escalatedItems) {
      await notificationService.sendEscalationNotification(item, escalationAction, req);
    }

    res.json({
      success: true,
      message: `Escalated ${escalatedItems.length} overdue items`,
      data: {
        escalatedCount: escalatedItems.length,
        items: escalatedItems,
      },
    });

  } catch (error) {
    console.error('Error escalating overdue items:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/analytics/overview - Get workflow analytics
router.get('/analytics/overview', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { startDate, endDate, workflowType } = req.query;

    const logsService = new WorkflowLogsService();
    const analytics = await logsService.getWorkflowAnalytics({
      startDate: startDate as string,
      endDate: endDate as string,
      workflowType: workflowType as string,
    }, req);

    res.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('Error getting workflow analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/analytics/performance - Get performance metrics
router.get('/analytics/performance', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId, stepNumber, timeRange = '30d' } = req.query;

    const logsService = new WorkflowLogsService();
    const performance = await logsService.getPerformanceMetrics({
      workflowId: workflowId as string,
      stepNumber: stepNumber ? parseInt(stepNumber as string) : undefined,
      timeRange: timeRange as string,
    }, req);

    res.json({
      success: true,
      data: performance,
    });

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/export - Export workflow data
router.post('/export', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { workflowId, format = 'json', includeLogs = true } = req.body;

    const logsService = new WorkflowLogsService();
    const exportData = await logsService.exportWorkflowData({
      workflowId,
      format,
      includeLogs,
    }, req);

    res.json({
      success: true,
      data: exportData,
    });

  } catch (error) {
    console.error('Error exporting workflow data:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// POST /api/workflows/notifications/test - Test notification settings
router.post('/notifications/test', requireAuth, async (req, res) => {
  try {
    const { notificationType, settings } = req.body;

    const notificationService = new WorkflowNotificationService();
    const result = await notificationService.testNotification(notificationType, settings, req);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error testing notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/templates - Get workflow templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'simple-approval',
        name: 'Simple Approval',
        description: 'Basic two-step approval workflow',
        workflowType: 'approval',
        steps: [
          {
            stepNumber: 1,
            name: 'Manager Review',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['manager'] },
          },
          {
            stepNumber: 2,
            name: 'Final Approval',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['director'] },
          },
        ],
      },
      {
        id: 'content-publication',
        name: 'Content Publication',
        description: 'Multi-step content review and publication',
        workflowType: 'publication',
        steps: [
          {
            stepNumber: 1,
            name: 'Editor Review',
            stepType: 'review',
            assignees: { type: 'role', roles: ['editor'] },
          },
          {
            stepNumber: 2,
            name: 'Legal Review',
            stepType: 'review',
            assignees: { type: 'role', roles: ['legal'] },
          },
          {
            stepNumber: 3,
            name: 'Marketing Approval',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['marketing'] },
          },
          {
            stepNumber: 4,
            name: 'Publish',
            stepType: 'publish',
            assignees: { type: 'role', roles: ['admin'] },
          },
        ],
      },
      {
        id: 'expense-approval',
        name: 'Expense Approval',
        description: 'Tiered expense approval based on amount',
        workflowType: 'expense',
        steps: [
          {
            stepNumber: 1,
            name: 'Manager Review',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['manager'] },
            conditions: [
              { field: 'amount', operator: 'lte', value: '1000' },
            ],
          },
          {
            stepNumber: 2,
            name: 'Director Review',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['director'] },
            conditions: [
              { field: 'amount', operator: 'gt', value: '1000' },
              { field: 'amount', operator: 'lte', value: '10000' },
            ],
          },
          {
            stepNumber: 3,
            name: 'VP Approval',
            stepType: 'approval',
            assignees: { type: 'role', roles: ['vp'] },
            conditions: [
              { field: 'amount', operator: 'gt', value: '10000' },
            ],
          },
        ],
      },
    ];

    res.json({
      success: true,
      data: templates,
    });

  } catch (error) {
    console.error('Error getting workflow templates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/departments - Get all departments
router.get('/departments', async (req, res) => {
  try {
    const departments = [
      { value: 'engineering', label: 'Engineering', color: '#3B82F6' },
      { value: 'marketing', label: 'Marketing', color: '#10B981' },
      { value: 'sales', label: 'Sales', color: '#F59E0B' },
      { value: 'finance', label: 'Finance', color: '#EF4444' },
      { value: 'hr', label: 'HR', color: '#8B5CF6' },
      { value: 'legal', label: 'Legal', color: '#6B7280' },
      { value: 'it', label: 'IT', color: '#059669' },
      { value: 'operations', label: 'Operations', color: '#DC2626' },
      { value: 'product', label: 'Product', color: '#7C3AED' },
      { value: 'design', label: 'Design', color: '#EC4899' },
      { value: 'support', label: 'Customer Support', color: '#F97316' },
      { value: 'rd', label: 'Research & Development', color: '#06B6D4' },
      { value: 'qa', label: 'Quality Assurance', color: '#84CC16' },
      { value: 'compliance', label: 'Compliance', color: '#78716C' },
      { value: 'security', label: 'Security', color: '#DC2626' },
      { value: 'facilities', label: 'Facilities', color: '#A3A3A3' },
      { value: 'procurement', label: 'Procurement', color: '#F472B6' },
      { value: 'other', label: 'Other', color: '#9CA3AF' },
    ];

    res.json({
      success: true,
      data: departments,
    });

  } catch (error) {
    console.error('Error getting departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/users/by-department/:department - Get users by department
router.get('/users/by-department/:department', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { department } = req.params;
    const { role, isActive = true } = req.query;

    const query: any = {
      department: { equals: department },
      isActive: { equals: isActive === 'true' },
    };

    if (role) {
      query.role = { equals: role };
    }

    const users = await payload.find({
      collection: 'users',
      where: query,
      sort: 'name',
    });

    res.json({
      success: true,
      data: users.docs.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        jobTitle: user.jobTitle,
        approvalLimit: user.approvalLimit,
        isActive: user.isActive,
      })),
    });

  } catch (error) {
    console.error('Error getting users by department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/users/by-role/:role - Get users by role
router.get('/users/by-role/:role', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { role } = req.params;
    const { department, isActive = true } = req.query;

    const query: any = {
      role: { equals: role },
      isActive: { equals: isActive === 'true' },
    };

    if (department) {
      query.department = { equals: department };
    }

    const users = await payload.find({
      collection: 'users',
      where: query,
      sort: 'name',
    });

    res.json({
      success: true,
      data: users.docs.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        jobTitle: user.jobTitle,
        approvalLimit: user.approvalLimit,
        isActive: user.isActive,
      })),
    });

  } catch (error) {
    console.error('Error getting users by role:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/users/search - Search users with filters
router.get('/users/search', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { 
      search, 
      department, 
      role, 
      isActive, 
      hasApprovalLimit,
      page = 1, 
      limit = 20 
    } = req.query;

    const query: any = {};

    if (search) {
      query.or = [
        { name: { contains: search } },
        { email: { contains: search } },
        { jobTitle: { contains: search } },
        { subDepartment: { contains: search } },
      ];
    }

    if (department) query.department = { equals: department };
    if (role) query.role = { equals: role };
    if (isActive !== undefined) query.isActive = { equals: isActive === 'true' };
    if (hasApprovalLimit === 'true') query.approvalLimit = { exists: true };

    const users = await payload.find({
      collection: 'users',
      where: query,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sort: 'name',
    });

    res.json({
      success: true,
      data: {
        users: users.docs.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          subDepartment: user.subDepartment,
          jobTitle: user.jobTitle,
          approvalLimit: user.approvalLimit,
          isActive: user.isActive,
          manager: user.manager,
        })),
        pagination: users.pagination,
      },
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/roles - Get all available roles
router.get('/values/roles', async (req, res) => {
  try {
    const roles = [
      { value: 'super_admin', label: 'Super Admin', level: 10 },
      { value: 'admin', label: 'Admin', level: 9 },
      { value: 'c_level', label: 'C-Level', level: 8 },
      { value: 'vp', label: 'VP', level: 7 },
      { value: 'director', label: 'Director', level: 6 },
      { value: 'senior_manager', label: 'Senior Manager', level: 5 },
      { value: 'manager', label: 'Manager', level: 4 },
      { value: 'reviewer', label: 'Reviewer', level: 3 },
      { value: 'editor', label: 'Editor', level: 2 },
      { value: 'author', label: 'Author', level: 1 },
      { value: 'contributor', label: 'Contributor', level: 1 },
      { value: 'user', label: 'User', level: 0 },
    ];

    res.json({
      success: true,
      data: roles,
    });

  } catch (error) {
    console.error('Error getting roles:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/workflow-types - Get all workflow types
router.get('/values/workflow-types', async (req, res) => {
  try {
    const workflowTypes = [
      { value: 'approval', label: 'Approval Workflow', icon: 'check-circle' },
      { value: 'review', label: 'Review Workflow', icon: 'eye' },
      { value: 'publication', label: 'Publication Workflow', icon: 'globe' },
      { value: 'contract', label: 'Contract Workflow', icon: 'file-text' },
      { value: 'expense', label: 'Expense Approval', icon: 'dollar-sign' },
      { value: 'purchase', label: 'Purchase Request', icon: 'shopping-cart' },
      { value: 'hr', label: 'HR Approval', icon: 'users' },
      { value: 'it', label: 'IT Request', icon: 'monitor' },
      { value: 'legal', label: 'Legal Review', icon: 'scale' },
      { value: 'marketing', label: 'Marketing Approval', icon: 'megaphone' },
      { value: 'custom', label: 'Custom Workflow', icon: 'settings' },
    ];

    res.json({
      success: true,
      data: workflowTypes,
    });

  } catch (error) {
    console.error('Error getting workflow types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/priorities - Get all priority levels
router.get('/values/priorities', async (req, res) => {
  try {
    const priorities = [
      { value: 'low', label: 'Low Priority', color: '#10B981', level: 1 },
      { value: 'normal', label: 'Normal Priority', color: '#3B82F6', level: 2 },
      { value: 'high', label: 'High Priority', color: '#F59E0B', level: 3 },
      { value: 'urgent', label: 'Urgent', color: '#EF4444', level: 4 },
      { value: 'critical', label: 'Critical', color: '#DC2626', level: 5 },
    ];

    res.json({
      success: true,
      data: priorities,
    });

  } catch (error) {
    console.error('Error getting priorities:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/step-types - Get all step types
router.get('/values/step-types', async (req, res) => {
  try {
    const stepTypes = [
      { value: 'approval', label: 'Approval', icon: 'check', color: '#10B981' },
      { value: 'review', label: 'Review', icon: 'eye', color: '#3B82F6' },
      { value: 'signoff', label: 'Sign-off', icon: 'pen-tool', color: '#8B5CF6' },
      { value: 'comment', label: 'Comment Only', icon: 'message-circle', color: '#6B7280' },
      { value: 'edit', label: 'Edit', icon: 'edit', color: '#F59E0B' },
      { value: 'publish', label: 'Publish', icon: 'globe', color: '#059669' },
      { value: 'archive', label: 'Archive', icon: 'archive', color: '#78716C' },
      { value: 'delete', label: 'Delete', icon: 'trash-2', color: '#DC2626' },
      { value: 'notify', label: 'Notify', icon: 'bell', color: '#EC4899' },
      { value: 'assign', label: 'Assign', icon: 'user-plus', color: '#7C3AED' },
      { value: 'validate', label: 'Validate', icon: 'shield-check', color: '#84CC16' },
      { value: 'custom', label: 'Custom Action', icon: 'settings', color: '#9CA3AF' },
    ];

    res.json({
      success: true,
      data: stepTypes,
    });

  } catch (error) {
    console.error('Error getting step types:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/operators - Get all condition operators
router.get('/values/operators', async (req, res) => {
  try {
    const operators = [
      { value: 'eq', label: 'Equals', symbol: '=' },
      { value: 'ne', label: 'Not Equals', symbol: '≠' },
      { value: 'gt', label: 'Greater Than', symbol: '>' },
      { value: 'lt', label: 'Less Than', symbol: '<' },
      { value: 'gte', label: 'Greater Than or Equal', symbol: '≥' },
      { value: 'lte', label: 'Less Than or Equal', symbol: '≤' },
      { value: 'contains', label: 'Contains', symbol: '⊃' },
      { value: 'not_contains', label: 'Not Contains', symbol: '⊅' },
      { value: 'starts_with', label: 'Starts With', symbol: '^' },
      { value: 'ends_with', label: 'Ends With', symbol: '$' },
      { value: 'in', label: 'In List', symbol: '∈' },
      { value: 'not_in', label: 'Not In List', symbol: '∉' },
      { value: 'is_empty', label: 'Is Empty', symbol: '∅' },
      { value: 'is_not_empty', label: 'Is Not Empty', symbol: '≠∅' },
      { value: 'is_null', label: 'Is Null', symbol: 'null' },
      { value: 'is_not_null', label: 'Is Not Null', symbol: '≠null' },
    ];

    res.json({
      success: true,
      data: operators,
    });

  } catch (error) {
    console.error('Error getting operators:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/collections - Get all available collections
router.get('/values/collections', async (req, res) => {
  try {
    const collections = [
      { value: 'blogs', label: 'Blogs', icon: 'file-text' },
      { value: 'contracts', label: 'Contracts', icon: 'file-text' },
      { value: 'products', label: 'Products', icon: 'package' },
      { value: 'pages', label: 'Pages', icon: 'file' },
      { value: 'media', label: 'Media', icon: 'image' },
      { value: 'forms', label: 'Forms', icon: 'clipboard-list' },
      { value: 'events', label: 'Events', icon: 'calendar' },
      { value: 'news', label: 'News', icon: 'newspaper' },
      { value: 'documents', label: 'Documents', icon: 'folder' },
      { value: 'all', label: 'All Collections', icon: 'database' },
    ];

    res.json({
      success: true,
      data: collections,
    });

  } catch (error) {
    console.error('Error getting collections:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/values/notification-channels - Get notification channels
router.get('/values/notification-channels', async (req, res) => {
  try {
    const channels = [
      { value: 'email', label: 'Email', icon: 'mail' },
      { value: 'sms', label: 'SMS', icon: 'phone' },
      { value: 'slack', label: 'Slack', icon: 'message-circle' },
      { value: 'teams', label: 'Microsoft Teams', icon: 'users' },
      { value: 'webhook', label: 'Webhook', icon: 'link' },
    ];

    res.json({
      success: true,
      data: channels,
    });

  } catch (error) {
    console.error('Error getting notification channels:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/sub-departments/:department - Get sub-departments by department
router.get('/sub-departments/:department', async (req, res) => {
  try {
    const { department } = req.params;
    
    const subDepartments = {
      engineering: [
        { value: 'frontend', label: 'Frontend Development', icon: 'monitor' },
        { value: 'backend', label: 'Backend Development', icon: 'server' },
        { value: 'fullstack', label: 'Full Stack Development', icon: 'layers' },
        { value: 'devops', label: 'DevOps', icon: 'settings' },
        { value: 'qa_engineering', label: 'QA Engineering', icon: 'check-circle' },
        { value: 'mobile', label: 'Mobile Development', icon: 'smartphone' },
        { value: 'data_engineering', label: 'Data Engineering', icon: 'database' },
        { value: 'ml', label: 'Machine Learning', icon: 'brain' },
        { value: 'security_engineering', label: 'Security Engineering', icon: 'shield' },
        { value: 'infrastructure', label: 'Infrastructure', icon: 'cloud' },
      ],
      marketing: [
        { value: 'digital_marketing', label: 'Digital Marketing', icon: 'globe' },
        { value: 'content_marketing', label: 'Content Marketing', icon: 'edit-3' },
        { value: 'social_media', label: 'Social Media', icon: 'share-2' },
        { value: 'seo_sem', label: 'SEO/SEM', icon: 'search' },
        { value: 'brand_marketing', label: 'Brand Marketing', icon: 'award' },
        { value: 'product_marketing', label: 'Product Marketing', icon: 'package' },
        { value: 'event_marketing', label: 'Event Marketing', icon: 'calendar' },
        { value: 'email_marketing', label: 'Email Marketing', icon: 'mail' },
        { value: 'marketing_analytics', label: 'Marketing Analytics', icon: 'bar-chart-2' },
      ],
      sales: [
        { value: 'inside_sales', label: 'Inside Sales', icon: 'phone' },
        { value: 'outside_sales', label: 'Outside Sales', icon: 'map-pin' },
        { value: 'enterprise_sales', label: 'Enterprise Sales', icon: 'building' },
        { value: 'smb_sales', label: 'SMB Sales', icon: 'briefcase' },
        { value: 'sales_development', label: 'Sales Development', icon: 'target' },
        { value: 'account_management', label: 'Account Management', icon: 'users' },
        { value: 'channel_sales', label: 'Channel Sales', icon: 'share' },
        { value: 'sales_operations', label: 'Sales Operations', icon: 'trending-up' },
        { value: 'sales_enablement', label: 'Sales Enablement', icon: 'book-open' },
      ],
      finance: [
        { value: 'accounting', label: 'Accounting', icon: 'calculator' },
        { value: 'financial_planning', label: 'Financial Planning', icon: 'pie-chart' },
        { value: 'treasury', label: 'Treasury', icon: 'dollar-sign' },
        { value: 'tax', label: 'Tax', icon: 'file-text' },
        { value: 'audit', label: 'Audit', icon: 'search' },
        { value: 'investor_relations', label: 'Investor Relations', icon: 'handshake' },
        { value: 'financial_analysis', label: 'Financial Analysis', icon: 'bar-chart' },
        { value: 'accounts_payable', label: 'Accounts Payable', icon: 'credit-card' },
        { value: 'accounts_receivable', label: 'Accounts Receivable', icon: 'inbox' },
      ],
      hr: [
        { value: 'recruitment', label: 'Recruitment', icon: 'user-plus' },
        { value: 'talent_management', label: 'Talent Management', icon: 'star' },
        { value: 'learning_development', label: 'Learning & Development', icon: 'book' },
        { value: 'compensation_benefits', label: 'Compensation & Benefits', icon: 'gift' },
        { value: 'employee_relations', label: 'Employee Relations', icon: 'heart' },
        { value: 'hr_operations', label: 'HR Operations', icon: 'settings' },
        { value: 'diversity_inclusion', label: 'Diversity & Inclusion', icon: 'users' },
        { value: 'hr_analytics', label: 'HR Analytics', icon: 'trending-up' },
      ],
      legal: [
        { value: 'corporate_law', label: 'Corporate Law', icon: 'building' },
        { value: 'contract_management', label: 'Contract Management', icon: 'file-text' },
        { value: 'compliance', label: 'Compliance', icon: 'check-square' },
        { value: 'intellectual_property', label: 'Intellectual Property', icon: 'lightbulb' },
        { value: 'employment_law', label: 'Employment Law', icon: 'user-check' },
        { value: 'litigation', label: 'Litigation', icon: 'gavel' },
        { value: 'regulatory_affairs', label: 'Regulatory Affairs', icon: 'clipboard' },
      ],
      it: [
        { value: 'it_support', label: 'IT Support', icon: 'help-circle' },
        { value: 'system_admin', label: 'System Administration', icon: 'server' },
        { value: 'network_engineering', label: 'Network Engineering', icon: 'wifi' },
        { value: 'database_admin', label: 'Database Administration', icon: 'database' },
        { value: 'it_security', label: 'IT Security', icon: 'shield' },
        { value: 'it_operations', label: 'IT Operations', icon: 'settings' },
        { value: 'it_project_management', label: 'IT Project Management', icon: 'folder' },
        { value: 'it_architecture', label: 'IT Architecture', icon: 'layout' },
      ],
      operations: [
        { value: 'business_operations', label: 'Business Operations', icon: 'briefcase' },
        { value: 'process_improvement', label: 'Process Improvement', icon: 'refresh-cw' },
        { value: 'supply_chain', label: 'Supply Chain', icon: 'truck' },
        { value: 'logistics', label: 'Logistics', icon: 'package' },
        { value: 'facilities_management', label: 'Facilities Management', icon: 'home' },
        { value: 'vendor_management', label: 'Vendor Management', icon: 'handshake' },
        { value: 'quality_management', label: 'Quality Management', icon: 'award' },
      ],
      product: [
        { value: 'product_management', label: 'Product Management', icon: 'target' },
        { value: 'product_strategy', label: 'Product Strategy', icon: 'compass' },
        { value: 'product_analytics', label: 'Product Analytics', icon: 'bar-chart-2' },
        { value: 'product_operations', label: 'Product Operations', icon: 'settings' },
        { value: 'product_marketing', label: 'Product Marketing', icon: 'megaphone' },
        { value: 'user_research', label: 'User Research', icon: 'search' },
      ],
      design: [
        { value: 'ui_ux_design', label: 'UI/UX Design', icon: 'layout' },
        { value: 'graphic_design', label: 'Graphic Design', icon: 'image' },
        { value: 'visual_design', label: 'Visual Design', icon: 'eye' },
        { value: 'interaction_design', label: 'Interaction Design', icon: 'mouse-pointer' },
        { value: 'design_systems', label: 'Design Systems', icon: 'grid' },
        { value: 'brand_design', label: 'Brand Design', icon: 'award' },
      ],
      support: [
        { value: 'technical_support', label: 'Technical Support', icon: 'tool' },
        { value: 'customer_success', label: 'Customer Success', icon: 'thumbs-up' },
        { value: 'customer_experience', label: 'Customer Experience', icon: 'smile' },
        { value: 'support_operations', label: 'Support Operations', icon: 'settings' },
        { value: 'training', label: 'Training', icon: 'book-open' },
        { value: 'documentation', label: 'Documentation', icon: 'file-text' },
      ],
      rd: [
        { value: 'research', label: 'Research', icon: 'microscope' },
        { value: 'development', label: 'Development', icon: 'code' },
        { value: 'innovation', label: 'Innovation', icon: 'lightbulb' },
        { value: 'prototyping', label: 'Prototyping', icon: 'box' },
        { value: 'technology_research', label: 'Technology Research', icon: 'cpu' },
      ],
      qa: [
        { value: 'quality_assurance', label: 'Quality Assurance', icon: 'check-circle' },
        { value: 'quality_control', label: 'Quality Control', icon: 'shield-check' },
        { value: 'testing', label: 'Testing', icon: 'bug' },
        { value: 'automation_testing', label: 'Automation Testing', icon: 'zap' },
        { value: 'performance_testing', label: 'Performance Testing', icon: 'activity' },
        { value: 'security_testing', label: 'Security Testing', icon: 'lock' },
      ],
      compliance: [
        { value: 'regulatory_compliance', label: 'Regulatory Compliance', icon: 'check-square' },
        { value: 'policy_management', label: 'Policy Management', icon: 'file-text' },
        { value: 'risk_management', label: 'Risk Management', icon: 'alert-triangle' },
        { value: 'audit_compliance', label: 'Audit Compliance', icon: 'search' },
        { value: 'data_privacy', label: 'Data Privacy', icon: 'lock' },
      ],
      security: [
        { value: 'information_security', label: 'Information Security', icon: 'shield' },
        { value: 'cybersecurity', label: 'Cybersecurity', icon: 'lock' },
        { value: 'physical_security', label: 'Physical Security', icon: 'camera' },
        { value: 'security_operations', label: 'Security Operations', icon: 'monitor' },
        { value: 'threat_intelligence', label: 'Threat Intelligence', icon: 'eye' },
        { value: 'incident_response', label: 'Incident Response', icon: 'alert-circle' },
      ],
      facilities: [
        { value: 'facility_management', label: 'Facility Management', icon: 'home' },
        { value: 'maintenance', label: 'Maintenance', icon: 'tool' },
        { value: 'space_planning', label: 'Space Planning', icon: 'map' },
        { value: 'ehs', label: 'Environmental Health & Safety', icon: 'heart' },
      ],
      procurement: [
        { value: 'strategic_sourcing', label: 'Strategic Sourcing', icon: 'search' },
        { value: 'vendor_management_procurement', label: 'Vendor Management', icon: 'handshake' },
        { value: 'contract_management_procurement', label: 'Contract Management', icon: 'file-text' },
        { value: 'procurement_operations', label: 'Procurement Operations', icon: 'settings' },
        { value: 'supplier_relations', label: 'Supplier Relations', icon: 'users' },
      ],
      other: [
        { value: 'general', label: 'General', icon: 'circle' },
        { value: 'administration', label: 'Administration', icon: 'clipboard' },
        { value: 'executive_office', label: 'Executive Office', icon: 'crown' },
        { value: 'special_projects', label: 'Special Projects', icon: 'star' },
      ],
    };

    const subDepts = subDepartments[department as keyof typeof subDepartments] || [];

    res.json({
      success: true,
      data: subDepts,
    });

  } catch (error) {
    console.error('Error getting sub-departments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/users/by-sub-department/:subDepartment - Get users by sub-department
router.get('/users/by-sub-department/:subDepartment', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { subDepartment } = req.params;
    const { department, role, isActive = true } = req.query;

    const query: any = {
      subDepartment: { equals: subDepartment },
      isActive: { equals: isActive === 'true' },
    };

    if (department) {
      query.department = { equals: department };
    }

    if (role) {
      query.role = { equals: role };
    }

    const users = await payload.find({
      collection: 'users',
      where: query,
      sort: 'name',
    });

    res.json({
      success: true,
      data: users.docs.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        jobTitle: user.jobTitle,
        approvalLimit: user.approvalLimit,
        isActive: user.isActive,
      })),
    });

  } catch (error) {
    console.error('Error getting users by sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/users/by-department-and-sub/:department/:subDepartment - Get users by department and sub-department
router.get('/users/by-department-and-sub/:department/:subDepartment', requireAuth, async (req, res) => {
  try {
    const payload = getPayload(req);
    const { department, subDepartment } = req.params;
    const { role, isActive = true } = req.query;

    const query: any = {
      department: { equals: department },
      subDepartment: { equals: subDepartment },
      isActive: { equals: isActive === 'true' },
    };

    if (role) {
      query.role = { equals: role };
    }

    const users = await payload.find({
      collection: 'users',
      where: query,
      sort: 'name',
    });

    res.json({
      success: true,
      data: users.docs.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        subDepartment: user.subDepartment,
        jobTitle: user.jobTitle,
        approvalLimit: user.approvalLimit,
        isActive: user.isActive,
        manager: user.manager,
      })),
    });

  } catch (error) {
    console.error('Error getting users by department and sub-department:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// GET /api/workflows/departments/hierarchy - Get departments with their sub-departments
router.get('/departments/hierarchy', async (req, res) => {
  try {
    const hierarchy = [
      {
        value: 'engineering',
        label: 'Engineering',
        color: '#3B82F6',
        subDepartments: [
          { value: 'frontend', label: 'Frontend Development' },
          { value: 'backend', label: 'Backend Development' },
          { value: 'fullstack', label: 'Full Stack Development' },
          { value: 'devops', label: 'DevOps' },
          { value: 'qa_engineering', label: 'QA Engineering' },
          { value: 'mobile', label: 'Mobile Development' },
          { value: 'data_engineering', label: 'Data Engineering' },
          { value: 'ml', label: 'Machine Learning' },
          { value: 'security_engineering', label: 'Security Engineering' },
          { value: 'infrastructure', label: 'Infrastructure' },
        ],
      },
      {
        value: 'marketing',
        label: 'Marketing',
        color: '#10B981',
        subDepartments: [
          { value: 'digital_marketing', label: 'Digital Marketing' },
          { value: 'content_marketing', label: 'Content Marketing' },
          { value: 'social_media', label: 'Social Media' },
          { value: 'seo_sem', label: 'SEO/SEM' },
          { value: 'brand_marketing', label: 'Brand Marketing' },
          { value: 'product_marketing', label: 'Product Marketing' },
          { value: 'event_marketing', label: 'Event Marketing' },
          { value: 'email_marketing', label: 'Email Marketing' },
          { value: 'marketing_analytics', label: 'Marketing Analytics' },
        ],
      },
      {
        value: 'sales',
        label: 'Sales',
        color: '#F59E0B',
        subDepartments: [
          { value: 'inside_sales', label: 'Inside Sales' },
          { value: 'outside_sales', label: 'Outside Sales' },
          { value: 'enterprise_sales', label: 'Enterprise Sales' },
          { value: 'smb_sales', label: 'SMB Sales' },
          { value: 'sales_development', label: 'Sales Development' },
          { value: 'account_management', label: 'Account Management' },
          { value: 'channel_sales', label: 'Channel Sales' },
          { value: 'sales_operations', label: 'Sales Operations' },
          { value: 'sales_enablement', label: 'Sales Enablement' },
        ],
      },
      {
        value: 'finance',
        label: 'Finance',
        color: '#EF4444',
        subDepartments: [
          { value: 'accounting', label: 'Accounting' },
          { value: 'financial_planning', label: 'Financial Planning' },
          { value: 'treasury', label: 'Treasury' },
          { value: 'tax', label: 'Tax' },
          { value: 'audit', label: 'Audit' },
          { value: 'investor_relations', label: 'Investor Relations' },
          { value: 'financial_analysis', label: 'Financial Analysis' },
          { value: 'accounts_payable', label: 'Accounts Payable' },
          { value: 'accounts_receivable', label: 'Accounts Receivable' },
        ],
      },
      {
        value: 'hr',
        label: 'HR',
        color: '#8B5CF6',
        subDepartments: [
          { value: 'recruitment', label: 'Recruitment' },
          { value: 'talent_management', label: 'Talent Management' },
          { value: 'learning_development', label: 'Learning & Development' },
          { value: 'compensation_benefits', label: 'Compensation & Benefits' },
          { value: 'employee_relations', label: 'Employee Relations' },
          { value: 'hr_operations', label: 'HR Operations' },
          { value: 'diversity_inclusion', label: 'Diversity & Inclusion' },
          { value: 'hr_analytics', label: 'HR Analytics' },
        ],
      },
      {
        value: 'legal',
        label: 'Legal',
        color: '#6B7280',
        subDepartments: [
          { value: 'corporate_law', label: 'Corporate Law' },
          { value: 'contract_management', label: 'Contract Management' },
          { value: 'compliance', label: 'Compliance' },
          { value: 'intellectual_property', label: 'Intellectual Property' },
          { value: 'employment_law', label: 'Employment Law' },
          { value: 'litigation', label: 'Litigation' },
          { value: 'regulatory_affairs', label: 'Regulatory Affairs' },
        ],
      },
      {
        value: 'it',
        label: 'IT',
        color: '#059669',
        subDepartments: [
          { value: 'it_support', label: 'IT Support' },
          { value: 'system_admin', label: 'System Administration' },
          { value: 'network_engineering', label: 'Network Engineering' },
          { value: 'database_admin', label: 'Database Administration' },
          { value: 'it_security', label: 'IT Security' },
          { value: 'it_operations', label: 'IT Operations' },
          { value: 'it_project_management', label: 'IT Project Management' },
          { value: 'it_architecture', label: 'IT Architecture' },
        ],
      },
      {
        value: 'operations',
        label: 'Operations',
        color: '#DC2626',
        subDepartments: [
          { value: 'business_operations', label: 'Business Operations' },
          { value: 'process_improvement', label: 'Process Improvement' },
          { value: 'supply_chain', label: 'Supply Chain' },
          { value: 'logistics', label: 'Logistics' },
          { value: 'facilities_management', label: 'Facilities Management' },
          { value: 'vendor_management', label: 'Vendor Management' },
          { value: 'quality_management', label: 'Quality Management' },
        ],
      },
      {
        value: 'product',
        label: 'Product',
        color: '#7C3AED',
        subDepartments: [
          { value: 'product_management', label: 'Product Management' },
          { value: 'product_strategy', label: 'Product Strategy' },
          { value: 'product_analytics', label: 'Product Analytics' },
          { value: 'product_operations', label: 'Product Operations' },
          { value: 'product_marketing', label: 'Product Marketing' },
          { value: 'user_research', label: 'User Research' },
        ],
      },
      {
        value: 'design',
        label: 'Design',
        color: '#EC4899',
        subDepartments: [
          { value: 'ui_ux_design', label: 'UI/UX Design' },
          { value: 'graphic_design', label: 'Graphic Design' },
          { value: 'visual_design', label: 'Visual Design' },
          { value: 'interaction_design', label: 'Interaction Design' },
          { value: 'design_systems', label: 'Design Systems' },
          { value: 'brand_design', label: 'Brand Design' },
        ],
      },
      {
        value: 'support',
        label: 'Customer Support',
        color: '#F97316',
        subDepartments: [
          { value: 'technical_support', label: 'Technical Support' },
          { value: 'customer_success', label: 'Customer Success' },
          { value: 'customer_experience', label: 'Customer Experience' },
          { value: 'support_operations', label: 'Support Operations' },
          { value: 'training', label: 'Training' },
          { value: 'documentation', label: 'Documentation' },
        ],
      },
      {
        value: 'rd',
        label: 'Research & Development',
        color: '#06B6D4',
        subDepartments: [
          { value: 'research', label: 'Research' },
          { value: 'development', label: 'Development' },
          { value: 'innovation', label: 'Innovation' },
          { value: 'prototyping', label: 'Prototyping' },
          { value: 'technology_research', label: 'Technology Research' },
        ],
      },
      {
        value: 'qa',
        label: 'Quality Assurance',
        color: '#84CC16',
        subDepartments: [
          { value: 'quality_assurance', label: 'Quality Assurance' },
          { value: 'quality_control', label: 'Quality Control' },
          { value: 'testing', label: 'Testing' },
          { value: 'automation_testing', label: 'Automation Testing' },
          { value: 'performance_testing', label: 'Performance Testing' },
          { value: 'security_testing', label: 'Security Testing' },
        ],
      },
      {
        value: 'compliance',
        label: 'Compliance',
        color: '#78716C',
        subDepartments: [
          { value: 'regulatory_compliance', label: 'Regulatory Compliance' },
          { value: 'policy_management', label: 'Policy Management' },
          { value: 'risk_management', label: 'Risk Management' },
          { value: 'audit_compliance', label: 'Audit Compliance' },
          { value: 'data_privacy', label: 'Data Privacy' },
        ],
      },
      {
        value: 'security',
        label: 'Security',
        color: '#DC2626',
        subDepartments: [
          { value: 'information_security', label: 'Information Security' },
          { value: 'cybersecurity', label: 'Cybersecurity' },
          { value: 'physical_security', label: 'Physical Security' },
          { value: 'security_operations', label: 'Security Operations' },
          { value: 'threat_intelligence', label: 'Threat Intelligence' },
          { value: 'incident_response', label: 'Incident Response' },
        ],
      },
      {
        value: 'facilities',
        label: 'Facilities',
        color: '#A3A3A3',
        subDepartments: [
          { value: 'facility_management', label: 'Facility Management' },
          { value: 'maintenance', label: 'Maintenance' },
          { value: 'space_planning', label: 'Space Planning' },
          { value: 'ehs', label: 'Environmental Health & Safety' },
        ],
      },
      {
        value: 'procurement',
        label: 'Procurement',
        color: '#F472B6',
        subDepartments: [
          { value: 'strategic_sourcing', label: 'Strategic Sourcing' },
          { value: 'vendor_management_procurement', label: 'Vendor Management' },
          { value: 'contract_management_procurement', label: 'Contract Management' },
          { value: 'procurement_operations', label: 'Procurement Operations' },
          { value: 'supplier_relations', label: 'Supplier Relations' },
        ],
      },
      {
        value: 'other',
        label: 'Other',
        color: '#9CA3AF',
        subDepartments: [
          { value: 'general', label: 'General' },
          { value: 'administration', label: 'Administration' },
          { value: 'executive_office', label: 'Executive Office' },
          { value: 'special_projects', label: 'Special Projects' },
        ],
      },
    ];

    res.json({
      success: true,
      data: hierarchy,
    });

  } catch (error) {
    console.error('Error getting department hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

export default router; 