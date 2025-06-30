import { CollectionConfig } from 'payload/types';

export const WorkflowLogs: CollectionConfig = {
  slug: 'workflow-logs',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['workflow', 'document', 'action', 'user', 'timestamp'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => false, // Immutable
    delete: () => false, // Immutable
  },
  fields: [
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: 'workflows',
      required: true,
    },
    {
      name: 'document',
      type: 'group',
      fields: [
        {
          name: 'collection',
          type: 'text',
          required: true,
        },
        {
          name: 'id',
          type: 'text',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: false,
        },
      ],
    },
    {
      name: 'step',
      type: 'group',
      fields: [
        {
          name: 'stepNumber',
          type: 'number',
          required: true,
        },
        {
          name: 'stepName',
          type: 'text',
          required: true,
        },
        {
          name: 'stepType',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Approval',
              value: 'approval',
            },
            {
              label: 'Review',
              value: 'review',
            },
            {
              label: 'Sign-off',
              value: 'signoff',
            },
            {
              label: 'Comment Only',
              value: 'comment',
            },
          ],
        },
      ],
    },
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Started',
          value: 'started',
        },
        {
          label: 'Assigned',
          value: 'assigned',
        },
        {
          label: 'Approved',
          value: 'approved',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Commented',
          value: 'commented',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Escalated',
          value: 'escalated',
        },
        {
          label: 'Skipped',
          value: 'skipped',
        },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      defaultValue: () => new Date(),
    },
    {
      name: 'comment',
      type: 'textarea',
      required: false,
    },
    {
      name: 'metadata',
      type: 'json',
      required: false,
      admin: {
        description: 'Additional data about the action',
      },
    },
    {
      name: 'slaStatus',
      type: 'group',
      fields: [
        {
          name: 'isOverdue',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'overdueHours',
          type: 'number',
          required: false,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Ensure timestamp is set
        if (!data.timestamp) {
          data.timestamp = new Date();
        }
        return data;
      },
    ],
  },
}; 