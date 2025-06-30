export interface WorkflowStep {
  stepNumber: number;
  name: string;
  description?: string;
  stepType: 'approval' | 'review' | 'signoff' | 'comment';
  assignees: {
    type: 'role' | 'user';
    roles?: string[];
    users?: string[];
  };
  conditions?: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
  sla?: {
    enabled: boolean;
    hours?: number;
  };
  nextSteps?: Array<{
    condition: 'approved' | 'rejected' | 'always';
    nextStepNumber: number;
  }>;
  isRequired: boolean;
  allowComments: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  applicableCollections: string[];
  steps: WorkflowStep[];
  createdBy: string;
}

// Type for database workflow objects
export interface DatabaseWorkflow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  applicableCollections: string[];
  steps: any[];
  createdBy: string;
  [key: string]: any; // Allow additional properties
} 