import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormState, useField } from 'payload/components/forms';
import { Banner, Button } from 'payload/components';
import './WorkflowStatus.scss';

// Basic types - consider moving to a central types file
interface WorkflowLog {
  id: string;
  action: string;
  user: { name: string };
  comment?: string;
  timestamp: string;
  step: { name: string };
}

const WorkflowStatusPill = ({ status }: { status: string }) => {
    // A simple component to render a status pill
    return <span className={`status-pill status-${status}`}>{status}</span>;
}

const baseClass = 'workflow-status';

const WorkflowStatus: React.FC = () => {
  const { t } = useTranslation('workflow');
  const { initialData } = useFormState();
  const { value: workflowStatus } = useField<any>({ path: 'workflowStatus' });
  
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!initialData?.id || !initialData?.workflow) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/workflow-logs?where[document.id][equals]=${initialData.id}&depth=1`
        );
        const data = await response.json();
        if (data.docs) {
          setLogs(data.docs);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [initialData]);

  const handleAction = async (action: string) => {
    if (typeof window === 'undefined') return;
    const comment = window.prompt(t('add_comment_prompt'));

    setIsLoading(true);
    try {
      const response = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: initialData.id,
          collection: initialData.collection,
          workflowId: initialData.workflow,
          action,
          comment,
        }),
      });
      const data = await response.json();
      if (data.success) {
        alert(t('action_success'));
        window.location.reload();
      } else {
        throw new Error(data.message || t('action_failed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialData?.workflow) {
    return <Banner>{t('no_workflow_assigned')}</Banner>;
  }

  if (isLoading) return <div>{t('loading')}</div>;
  if (error) return <Banner type="error">{error}</Banner>;

  return (
    <div className={baseClass}>
      <h4>{t('workflow_status')}</h4>
      <div className={`${baseClass}__summary`}>
        <p><strong>{t('current_status')}:</strong> <WorkflowStatusPill status={(workflowStatus as any)?.status || 'unknown'} /></p>
        <p><strong>{t('current_step')}:</strong> {(workflowStatus as any)?.currentStep?.name || t('not_started')}</p>
        <p><strong>{t('last_updated')}:</strong> {new Date((workflowStatus as any)?.lastUpdated).toLocaleString()}</p>
      </div>

      <div className={`${baseClass}__actions`}>
        <h5>{t('available_actions')}</h5>
        <Button onClick={() => handleAction('approved')}>{t('approve')}</Button>
        <Button buttonStyle="secondary" onClick={() => handleAction('rejected')}>{t('reject')}</Button>
      </div>

      <div className={`${baseClass}__logs`}>
        <h5>{t('history')}</h5>
        {logs.length > 0 ? (
          <ul>
            {logs.map((log) => (
              <li key={log.id}>
                <strong>{new Date(log.timestamp).toLocaleString()}:</strong> {log.user.name}{' '}
                <em>{log.action}</em> on step "{log.step.name}"
                {log.comment && <p><strong>{t('comment')}:</strong> {log.comment}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p>{t('no_history_available')}</p>
        )}
      </div>
    </div>
  );
};

export default WorkflowStatus; 