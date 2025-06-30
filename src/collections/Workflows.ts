import { CollectionConfig } from 'payload/types';

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
    {
      name: 'workflowType',
      type: 'select',
      required: true,
      defaultValue: 'approval',
      options: [
        {
          label: 'Approval Workflow',
          value: 'approval',
        },
        {
          label: 'Review Workflow',
          value: 'review',
        },
        {
          label: 'Publication Workflow',
          value: 'publication',
        },
        {
          label: 'Contract Workflow',
          value: 'contract',
        },
        {
          label: 'Expense Approval',
          value: 'expense',
        },
        {
          label: 'Purchase Request',
          value: 'purchase',
        },
        {
          label: 'HR Approval',
          value: 'hr',
        },
        {
          label: 'IT Request',
          value: 'it',
        },
        {
          label: 'Legal Review',
          value: 'legal',
        },
        {
          label: 'Marketing Approval',
          value: 'marketing',
        },
        {
          label: 'Custom Workflow',
          value: 'custom',
        },
      ],
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'normal',
      options: [
        {
          label: 'Low Priority',
          value: 'low',
        },
        {
          label: 'Normal Priority',
          value: 'normal',
        },
        {
          label: 'High Priority',
          value: 'high',
        },
        {
          label: 'Urgent',
          value: 'urgent',
        },
        {
          label: 'Critical',
          value: 'critical',
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'applicableCollections',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        {
          label: 'Blogs',
          value: 'blogs',
        },
        {
          label: 'Contracts',
          value: 'contracts',
        },
        {
          label: 'Products',
          value: 'products',
        },
        {
          label: 'Pages',
          value: 'pages',
        },
        {
          label: 'Media',
          value: 'media',
        },
        {
          label: 'Forms',
          value: 'forms',
        },
        {
          label: 'Events',
          value: 'events',
        },
        {
          label: 'News',
          value: 'news',
        },
        {
          label: 'Documents',
          value: 'documents',
        },
        {
          label: 'All Collections',
          value: 'all',
        },
      ],
    },
    {
      name: 'triggerConditions',
      type: 'array',
      fields: [
        {
          name: 'field',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Document Status',
              value: 'status',
            },
            {
              label: 'Document Type',
              value: 'type',
            },
            {
              label: 'Amount/Value',
              value: 'amount',
            },
            {
              label: 'Category',
              value: 'category',
            },
            {
              label: 'Department',
              value: 'department',
            },
            {
              label: 'Created By',
              value: 'createdBy',
            },
            {
              label: 'Tags',
              value: 'tags',
            },
            {
              label: 'Custom Field',
              value: 'custom',
            },
          ],
        },
        {
          name: 'customField',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData) => siblingData?.field === 'custom',
            description: 'Enter custom field name',
          },
        },
        {
          name: 'operator',
          type: 'select',
          required: true,
          options: [
            {
              label: 'Equals',
              value: 'eq',
            },
            {
              label: 'Not Equals',
              value: 'ne',
            },
            {
              label: 'Greater Than',
              value: 'gt',
            },
            {
              label: 'Less Than',
              value: 'lt',
            },
            {
              label: 'Greater Than or Equal',
              value: 'gte',
            },
            {
              label: 'Less Than or Equal',
              value: 'lte',
            },
            {
              label: 'Contains',
              value: 'contains',
            },
            {
              label: 'Not Contains',
              value: 'not_contains',
            },
            {
              label: 'Starts With',
              value: 'starts_with',
            },
            {
              label: 'Ends With',
              value: 'ends_with',
            },
            {
              label: 'In List',
              value: 'in',
            },
            {
              label: 'Not In List',
              value: 'not_in',
            },
            {
              label: 'Is Empty',
              value: 'is_empty',
            },
            {
              label: 'Is Not Empty',
              value: 'is_not_empty',
            },
          ],
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          admin: {
            description: 'Value to compare against',
          },
        },
        {
          name: 'multipleValues',
          type: 'array',
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
          admin: {
            condition: (data, siblingData) => ['in', 'not_in'].includes(siblingData?.operator),
            description: 'Add multiple values for "In List" or "Not In List" operators',
          },
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'stepNumber',
          type: 'number',
          required: true,
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: false,
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
            {
              label: 'Edit',
              value: 'edit',
            },
            {
              label: 'Publish',
              value: 'publish',
            },
            {
              label: 'Archive',
              value: 'archive',
            },
            {
              label: 'Delete',
              value: 'delete',
            },
            {
              label: 'Notify',
              value: 'notify',
            },
            {
              label: 'Assign',
              value: 'assign',
            },
            {
              label: 'Validate',
              value: 'validate',
            },
            {
              label: 'Custom Action',
              value: 'custom',
            },
          ],
        },
        {
          name: 'customAction',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData) => siblingData?.stepType === 'custom',
            description: 'Enter custom action name',
          },
        },
        {
          name: 'assignees',
          type: 'group',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: 'role',
              options: [
                {
                  label: 'Role-based',
                  value: 'role',
                },
                {
                  label: 'Specific User',
                  value: 'user',
                },
                {
                  label: 'Department',
                  value: 'department',
                },
                {
                  label: 'Manager',
                  value: 'manager',
                },
                {
                  label: 'Creator',
                  value: 'creator',
                },
                {
                  label: 'Previous Approver',
                  value: 'previous_approver',
                },
                {
                  label: 'Dynamic Assignment',
                  value: 'dynamic',
                },
              ],
            },
            {
              name: 'roles',
              type: 'select',
              hasMany: true,
              required: false,
              options: [
                {
                  label: 'Super Admin',
                  value: 'super_admin',
                },
                {
                  label: 'Admin',
                  value: 'admin',
                },
                {
                  label: 'Manager',
                  value: 'manager',
                },
                {
                  label: 'Senior Manager',
                  value: 'senior_manager',
                },
                {
                  label: 'Director',
                  value: 'director',
                },
                {
                  label: 'VP',
                  value: 'vp',
                },
                {
                  label: 'C-Level',
                  value: 'c_level',
                },
                {
                  label: 'Reviewer',
                  value: 'reviewer',
                },
                {
                  label: 'Editor',
                  value: 'editor',
                },
                {
                  label: 'Author',
                  value: 'author',
                },
                {
                  label: 'Contributor',
                  value: 'contributor',
                },
                {
                  label: 'Legal Team',
                  value: 'legal',
                },
                {
                  label: 'Finance Team',
                  value: 'finance',
                },
                {
                  label: 'HR Team',
                  value: 'hr',
                },
                {
                  label: 'IT Team',
                  value: 'it',
                },
                {
                  label: 'Marketing Team',
                  value: 'marketing',
                },
                {
                  label: 'Sales Team',
                  value: 'sales',
                },
                {
                  label: 'Operations Team',
                  value: 'operations',
                },
                {
                  label: 'Quality Assurance',
                  value: 'qa',
                },
                {
                  label: 'Compliance Team',
                  value: 'compliance',
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'role',
              },
            },
            {
              name: 'users',
              type: 'relationship',
              relationTo: 'users',
              hasMany: true,
              required: false,
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'user',
              },
            },
            {
              name: 'departments',
              type: 'select',
              hasMany: true,
              required: false,
              options: [
                {
                  label: 'Engineering',
                  value: 'engineering',
                },
                {
                  label: 'Marketing',
                  value: 'marketing',
                },
                {
                  label: 'Sales',
                  value: 'sales',
                },
                {
                  label: 'Finance',
                  value: 'finance',
                },
                {
                  label: 'HR',
                  value: 'hr',
                },
                {
                  label: 'Legal',
                  value: 'legal',
                },
                {
                  label: 'IT',
                  value: 'it',
                },
                {
                  label: 'Operations',
                  value: 'operations',
                },
                {
                  label: 'Product',
                  value: 'product',
                },
                {
                  label: 'Design',
                  value: 'design',
                },
                {
                  label: 'Customer Support',
                  value: 'support',
                },
                {
                  label: 'Research & Development',
                  value: 'rd',
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'department',
              },
            },
            {
              name: 'dynamicRules',
              type: 'array',
              fields: [
                {
                  name: 'condition',
                  type: 'select',
                  required: true,
                  options: [
                    {
                      label: 'If amount > $10,000',
                      value: 'amount_high',
                    },
                    {
                      label: 'If amount > $50,000',
                      value: 'amount_very_high',
                    },
                    {
                      label: 'If department is Legal',
                      value: 'legal_dept',
                    },
                    {
                      label: 'If document type is Contract',
                      value: 'contract_type',
                    },
                    {
                      label: 'If priority is High',
                      value: 'high_priority',
                    },
                    {
                      label: 'If created by C-Level',
                      value: 'c_level_creator',
                    },
                  ],
                },
                {
                  name: 'assignTo',
                  type: 'select',
                  required: true,
                  options: [
                    {
                      label: 'Manager',
                      value: 'manager',
                    },
                    {
                      label: 'Director',
                      value: 'director',
                    },
                    {
                      label: 'VP',
                      value: 'vp',
                    },
                    {
                      label: 'C-Level',
                      value: 'c_level',
                    },
                    {
                      label: 'Legal Team',
                      value: 'legal',
                    },
                    {
                      label: 'Finance Team',
                      value: 'finance',
                    },
                  ],
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.type === 'dynamic',
              },
            },
          ],
        },
        {
          name: 'conditions',
          type: 'array',
          fields: [
            {
              name: 'field',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Document Status',
                  value: 'status',
                },
                {
                  label: 'Document Type',
                  value: 'type',
                },
                {
                  label: 'Amount/Value',
                  value: 'amount',
                },
                {
                  label: 'Category',
                  value: 'category',
                },
                {
                  label: 'Department',
                  value: 'department',
                },
                {
                  label: 'Priority',
                  value: 'priority',
                },
                {
                  label: 'Created Date',
                  value: 'createdAt',
                },
                {
                  label: 'Updated Date',
                  value: 'updatedAt',
                },
                {
                  label: 'Created By',
                  value: 'createdBy',
                },
                {
                  label: 'Tags',
                  value: 'tags',
                },
                {
                  label: 'Custom Field',
                  value: 'custom',
                },
              ],
            },
            {
              name: 'customField',
              type: 'text',
              required: false,
              admin: {
                condition: (data, siblingData) => siblingData?.field === 'custom',
                description: 'Enter custom field name',
              },
            },
            {
              name: 'operator',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Equals',
                  value: 'eq',
                },
                {
                  label: 'Not Equals',
                  value: 'ne',
                },
                {
                  label: 'Greater Than',
                  value: 'gt',
                },
                {
                  label: 'Less Than',
                  value: 'lt',
                },
                {
                  label: 'Greater Than or Equal',
                  value: 'gte',
                },
                {
                  label: 'Less Than or Equal',
                  value: 'lte',
                },
                {
                  label: 'Contains',
                  value: 'contains',
                },
                {
                  label: 'Not Contains',
                  value: 'not_contains',
                },
                {
                  label: 'Starts With',
                  value: 'starts_with',
                },
                {
                  label: 'Ends With',
                  value: 'ends_with',
                },
                {
                  label: 'In List',
                  value: 'in',
                },
                {
                  label: 'Not In List',
                  value: 'not_in',
                },
                {
                  label: 'Is Empty',
                  value: 'is_empty',
                },
                {
                  label: 'Is Not Empty',
                  value: 'is_not_empty',
                },
                {
                  label: 'Is Null',
                  value: 'is_null',
                },
                {
                  label: 'Is Not Null',
                  value: 'is_not_null',
                },
              ],
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'Value to compare against',
              },
            },
            {
              name: 'multipleValues',
              type: 'array',
              fields: [
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
              ],
              admin: {
                condition: (data, siblingData) => ['in', 'not_in'].includes(siblingData?.operator),
                description: 'Add multiple values for "In List" or "Not In List" operators',
              },
            },
          ],
        },
        {
          name: 'sla',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'hours',
              type: 'number',
              required: false,
              min: 1,
              admin: {
                condition: (data, siblingData) => siblingData?.enabled === true,
              },
            },
            {
              name: 'businessHours',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: (data, siblingData) => siblingData?.enabled === true,
                description: 'Only count business hours (9 AM - 5 PM, Mon-Fri)',
              },
            },
            {
              name: 'escalationAction',
              type: 'select',
              required: false,
              options: [
                {
                  label: 'Send Reminder',
                  value: 'reminder',
                },
                {
                  label: 'Auto-approve',
                  value: 'auto_approve',
                },
                {
                  label: 'Escalate to Manager',
                  value: 'escalate_manager',
                },
                {
                  label: 'Escalate to Director',
                  value: 'escalate_director',
                },
                {
                  label: 'Send Notification',
                  value: 'notification',
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.enabled === true,
              },
            },
          ],
        },
        {
          name: 'nextSteps',
          type: 'array',
          fields: [
            {
              name: 'condition',
              type: 'select',
              required: true,
              options: [
                {
                  label: 'Approved',
                  value: 'approved',
                },
                {
                  label: 'Rejected',
                  value: 'rejected',
                },
                {
                  label: 'Returned for Revision',
                  value: 'revision',
                },
                {
                  label: 'Requested Changes',
                  value: 'changes',
                },
                {
                  label: 'Conditionally Approved',
                  value: 'conditional',
                },
                {
                  label: 'Always',
                  value: 'always',
                },
                {
                  label: 'If SLA Expired',
                  value: 'sla_expired',
                },
                {
                  label: 'If Conditions Met',
                  value: 'conditions_met',
                },
              ],
            },
            {
              name: 'nextStepNumber',
              type: 'number',
              required: true,
              admin: {
                description: 'Step number to go to next',
              },
            },
            {
              name: 'additionalConditions',
              type: 'array',
              fields: [
                {
                  name: 'field',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'operator',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Equals', value: 'eq' },
                    { label: 'Not Equals', value: 'ne' },
                    { label: 'Greater Than', value: 'gt' },
                    { label: 'Less Than', value: 'lt' },
                  ],
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.condition === 'conditions_met',
              },
            },
          ],
        },
        {
          name: 'isRequired',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allowComments',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'allowAttachments',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'requireComments',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            condition: (data, siblingData) => siblingData?.allowComments === true,
          },
        },
        {
          name: 'autoApproveIf',
          type: 'group',
          fields: [
            {
              name: 'enabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'condition',
              type: 'select',
              required: false,
              options: [
                {
                  label: 'Same User Created',
                  value: 'same_creator',
                },
                {
                  label: 'Manager Level',
                  value: 'manager_level',
                },
                {
                  label: 'Low Amount',
                  value: 'low_amount',
                },
                {
                  label: 'Routine Document',
                  value: 'routine',
                },
              ],
              admin: {
                condition: (data, siblingData) => siblingData?.enabled === true,
              },
            },
          ],
        },
        {
          name: 'notifications',
          type: 'group',
          fields: [
            {
              name: 'email',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'sms',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'slack',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'teams',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'customWebhook',
              type: 'text',
              required: false,
              admin: {
                description: 'Custom webhook URL for notifications',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Auto-number steps
        if (data.steps && Array.isArray(data.steps)) {
          data.steps = data.steps.map((step, index) => ({
            ...step,
            stepNumber: index + 1,
          }));
        }
        return data;
      },
    ],
  },
}; 