import { PayloadRequest } from 'payload/types';

export interface WorkflowLog {
  workflow: string;
  document: {
    collection: string;
    id: string;
    title?: string;
  };
  step: {
    stepNumber: number;
    stepName: string;
    stepType: string;
  };
  action: string;
  user: string;
  timestamp?: Date;
  comment?: string;
  attachments?: string[];
  metadata?: any;
  slaStatus?: {
    isOverdue: boolean;
    overdueHours?: number;
  };
}

export class WorkflowLogsService {
  async createLog(logData: WorkflowLog, req: PayloadRequest): Promise<any> {
    try {
      const log = await req.payload.create({
        collection: 'workflow-logs',
        data: {
          ...logData,
          timestamp: logData.timestamp || new Date(),
        },
      });

      console.log(`Created workflow log: ${log.id}`);
      return log;
    } catch (error) {
      console.error('Error creating workflow log:', error);
      throw error;
    }
  }

  async getStepLogs(
    workflowId: string,
    documentId: string,
    stepNumber: number,
    req: PayloadRequest
  ): Promise<any[]> {
    try {
      const logs = await req.payload.find({
        collection: 'workflow-logs',
        where: {
          and: [
            {
              workflow: {
                equals: workflowId,
              },
            },
            {
              'document.id': {
                equals: documentId,
              },
            },
            {
              'step.stepNumber': {
                equals: stepNumber,
              },
            },
          ],
        },
        sort: 'timestamp',
      });

      return logs.docs;
    } catch (error) {
      console.error('Error fetching step logs:', error);
      return [];
    }
  }

  async getDocumentLogs(
    workflowId: string,
    documentId: string,
    req: PayloadRequest
  ): Promise<any[]> {
    try {
      const logs = await req.payload.find({
        collection: 'workflow-logs',
        where: {
          and: [
            {
              workflow: {
                equals: workflowId,
              },
            },
            {
              'document.id': {
                equals: documentId,
              },
            },
          ],
        },
        sort: 'timestamp',
      });

      return logs.docs;
    } catch (error) {
      console.error('Error fetching document logs:', error);
      return [];
    }
  }

  async getWorkflowLogs(
    workflowId: string,
    req: PayloadRequest
  ): Promise<any[]> {
    try {
      const logs = await req.payload.find({
        collection: 'workflow-logs',
        where: {
          workflow: {
            equals: workflowId,
          },
        },
        sort: '-timestamp',
        limit: 100,
      });

      return logs.docs;
    } catch (error) {
      console.error('Error fetching workflow logs:', error);
      return [];
    }
  }

  async getUserLogs(
    userId: string,
    req: PayloadRequest
  ): Promise<any[]> {
    try {
      const logs = await req.payload.find({
        collection: 'workflow-logs',
        where: {
          user: {
            equals: userId,
          },
        },
        sort: '-timestamp',
        limit: 50,
      });

      return logs.docs;
    } catch (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }
  }

  async getPendingActions(
    userId: string,
    req: PayloadRequest
  ): Promise<any[]> {
    try {
      const user = await req.payload.findByID({
        collection: 'users',
        id: userId,
      });

      if (!user) {
        return [];
      }

      const pendingLogs = await req.payload.find({
        collection: 'workflow-logs',
        where: {
          and: [
            {
              action: {
                equals: 'assigned',
              },
            },
            {
              user: {
                equals: userId,
              },
            },
          ],
        },
        sort: '-timestamp',
      });

      return pendingLogs.docs;
    } catch (error) {
      console.error('Error fetching pending actions:', error);
      return [];
    }
  }

  async checkSLAStatus(
    workflowId: string,
    documentId: string,
    stepNumber: number,
    slaHours: number,
    req: PayloadRequest
  ): Promise<{ isOverdue: boolean; overdueHours: number }> {
    try {
      const stepLogs = await this.getStepLogs(workflowId, documentId, stepNumber, req);
      const assignmentLog = stepLogs.find(log => log.action === 'assigned');

      if (!assignmentLog) {
        return { isOverdue: false, overdueHours: 0 };
      }

      const assignmentTime = new Date(assignmentLog.timestamp);
      const currentTime = new Date();
      const elapsedHours = (currentTime.getTime() - assignmentTime.getTime()) / (1000 * 60 * 60);

      const isOverdue = elapsedHours > slaHours;
      const overdueHours = isOverdue ? elapsedHours - slaHours : 0;

      return { isOverdue, overdueHours };
    } catch (error) {
      console.error('Error checking SLA status:', error);
      return { isOverdue: false, overdueHours: 0 };
    }
  }

  async getActiveWorkflowInstances(req: PayloadRequest): Promise<any[]> {
    console.log('getActiveWorkflowInstances called');
    return [];
  }

  async getOverdueSLAItems(req: PayloadRequest): Promise<any[]> {
    console.log('getOverdueSLAItems called');
    return [];
  }

  async escalateOverdueItems(items: any[], req: PayloadRequest): Promise<void> {
    console.log('escalateOverdueItems called with items:', items);
  }

  async getWorkflowAnalytics(req: PayloadRequest): Promise<any> {
    console.log('getWorkflowAnalytics called');
    return {};
  }

  async getPerformanceMetrics(req: PayloadRequest): Promise<any> {
    console.log('getPerformanceMetrics called');
    return {};
  }

  async exportWorkflowData(format: 'csv' | 'json', req: PayloadRequest): Promise<string> {
    console.log(`exportWorkflowData called with format: ${format}`);
    return `Data export for ${format}`;
  }
} 