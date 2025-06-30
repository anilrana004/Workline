import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, useField } from 'payload/components/forms';
import { Banner, Button } from 'payload/components';
import './WorkflowStatus.scss';

interface Log { id: string; user: { name: string }; action: string; step: { name: string }; timestamp: string; comment?: string; }
interface PaginatedDocs<T> { docs: T[]; }
interface ApiResponse { success: boolean; message?: string; }
interface AnyDoc { id: string; workflow?: string; collection?: string; [key: string]: any; }

const baseClass = 'workflow-status';

const WorkflowStatus: React.FC = () => {
  const { t } = useTranslation('workflow');
  const { getData } = useForm();
  const { value: workflowStatus } = useField<any>({ path: 'workflowStatus' });

  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doc = getData() as AnyDoc;

  const fetchLogs = async () => {
    if (!doc.id || !doc.workflow) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workflow-logs?where[document.id][equals]=${doc.id}&depth=1`);
      const data = await response.json() as PaginatedDocs<Log>;
      if (data?.docs && Array.isArray(data.docs)) {
        setLogs(data.docs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [doc.id, doc.workflow]);

  const handleAction = async (action: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: doc.id,
          collection: doc.collection,
          workflowId: doc.workflow,
          action: action,
        }),
      });
      const data = await response.json() as ApiResponse;
      if (!data.success) {
        throw new Error(data.message || 'Action failed');
      }
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!doc.workflow) return <Banner>{t('no_workflow_assigned')}</Banner>;

  return (
    <div className={baseClass}>
      <h4>{t('workflow_status')}</h4>
      {error && <Banner type="error">{error}</Banner>}
      {isLoading && <div>{t('loading')}</div>}
      
      <div className={`${baseClass}__summary`}>
        <p><strong>{t('current_step')}:</strong> {workflowStatus?.currentStep?.name || t('not_started')}</p>
      </div>

      <div className={`${baseClass}__actions`}>
        <h5>{t('available_actions')}</h5>
        <Button onClick={() => handleAction('approved')}>{t('approve')}</Button>
        <Button buttonStyle="secondary" onClick={() => handleAction('rejected')}>{t('reject')}</Button>
      </div>

      <div className={`${baseClass}__logs`}>
        <h5>{t('history')}</h5>
        <ul>
          {logs.map((log) => (
            <li key={log.id}>
              {new Date(log.timestamp).toLocaleString()}: {log.user.name} {log.action} step "{log.step.name}"
              {log.comment && <span> - "{log.comment}"</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WorkflowStatus; 