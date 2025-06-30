import React, { useState, useEffect } from 'react';
import { useField } from 'payload/components/forms';
import './WorkflowStatus.scss';

declare global {
  interface Window {
    location: {
      pathname: string;
      reload(): void;
    };
  }
}

interface WorkflowStep {
  stepNumber: number;
  name: string;
  stepType: string;
  assignees: {
    type: 'role' | 'user';
    roles?: string[];
    users?: string[];
  };
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  isActive: boolean;
}

interface WorkflowLog {
  id: string;
  step: {
    stepNumber: number;
    stepName: string;
    stepType: string;
  };
  action: string;
  user: {
    name: string;
  };
  comment?: string;
  timestamp: string;
}

const WorkflowStatus: React.FC = () => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { value: workflowId } = useField<string>({ path: 'workflow' });
  const { value: workflowStatus } = useField<any>({ path: 'workflowStatus' });

  useEffect(() => {
    const fetchWorkflowData = async () => {
      if (!workflowId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch workflow details
        const workflowResponse = await fetch(`/api/workflows/${workflowId}`);
        if (workflowResponse.ok) {
          const data = await workflowResponse.json();
          setWorkflow(data as Workflow);
        }

        // Fetch workflow logs
        const logsResponse = await fetch(`/api/workflow-logs?workflow=${workflowId}`);
        if (logsResponse.ok) {
          const logsData = await logsResponse.json();
          setLogs(logsData.docs || []);
        }
      } catch (err) {
        setError('Failed to fetch workflow data');
        console.error('Error fetching workflow data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflowData();
  }, [workflowId]);

  const handleStepAction = async (action: string, stepNumber: number) => {
    try {
      const response = await fetch('/api/workflow-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          stepNumber,
          documentId: window.location.pathname.split('/').pop(),
          collection: window.location.pathname.split('/')[2],
          workflowId: workflow?.id,
        }),
      });

      if (response.ok) {
        // Reload the page to show updated status
        window.location.reload();
      } else {
        setError('Failed to perform action');
      }
    } catch (err) {
      setError('Failed to perform action');
      console.error('Error performing action:', err);
    }
  };

  if (loading) {
    return <div className="workflow-status-loading">Loading workflow status...</div>;
  }

  if (error) {
    return <div className="workflow-status-error">Error: {error}</div>;
  }

  if (!workflow || !workflowStatus) {
    return <div className="workflow-status-none">No workflow assigned</div>;
  }

  const currentStep = workflow.steps.find(step => step.stepNumber === workflowStatus.currentStep);
  const isCompleted = workflowStatus.isCompleted;

  return (
    <div className="workflow-status">
      <div className="workflow-header">
        <h3>Workflow: {workflow.name}</h3>
        <div className={`workflow-status-badge ${isCompleted ? 'completed' : 'active'}`}>
          {isCompleted ? 'Completed' : 'Active'}
        </div>
      </div>

      <div className="workflow-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(workflowStatus.currentStep / workflow.steps.length) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Step {workflowStatus.currentStep} of {workflow.steps.length}
        </div>
      </div>

      {currentStep && !isCompleted && (
        <div className="current-step">
          <h4>Current Step: {currentStep.name}</h4>
          <p>Type: {currentStep.stepType}</p>
          <p>Assignees: {currentStep.assignees.type === 'role' ? 'Roles' : 'Users'}</p>
          
          <div className="step-actions">
            <button
              className="action-button approve"
              onClick={() => handleStepAction('approve', currentStep.stepNumber)}
            >
              Approve
            </button>
            <button
              className="action-button reject"
              onClick={() => handleStepAction('reject', currentStep.stepNumber)}
            >
              Reject
            </button>
            <button
              className="action-button comment"
              onClick={() => handleStepAction('comment', currentStep.stepNumber)}
            >
              Add Comment
            </button>
          </div>
        </div>
      )}

      <div className="workflow-logs">
        <h4>Activity Log</h4>
        <div className="logs-list">
          {logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-header">
                <span className="log-action">{log.action}</span>
                <span className="log-step">{log.step.stepName}</span>
                <span className="log-user">{log.user.name}</span>
                <span className="log-time">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
              {log.comment && (
                <div className="log-comment">{log.comment}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStatus; 