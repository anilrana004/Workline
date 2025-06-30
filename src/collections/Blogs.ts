import { CollectionConfig } from 'payload/types';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { WorkflowConditionEvaluator } from '../services/WorkflowConditionEvaluator';
import { DatabaseWorkflow } from '../services/types';

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        {
          label: 'Draft',
          value: 'draft',
        },
        {
          label: 'Pending Review',
          value: 'pending_review',
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
          label: 'Published',
          value: 'published',
        },
      ],
    },
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: 'workflows',
      required: false,
    },
    {
      name: 'workflowStatus',
      type: 'group',
      fields: [
        {
          name: 'currentStep',
          type: 'number',
          defaultValue: 0,
        },
        {
          name: 'isCompleted',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'lastUpdated',
          type: 'date',
        },
      ],
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        // Workflow logic
        try {
          const workflowEngine = new WorkflowEngine();
          const conditionEvaluator = new WorkflowConditionEvaluator();

          // Check if document has a workflow assigned
          if (doc.workflow) {
            console.log(`Processing workflow for blogs document: ${doc.id}`);

            // Get workflow details
            const workflowData = await req.payload.findByID({
              collection: 'workflows',
              id: doc.workflow,
            });

            if (!workflowData || !workflowData.isActive) {
              console.log('Workflow not found or inactive');
              return;
            }

            // Cast workflow data to expected interface
            const workflow = workflowData as DatabaseWorkflow;

            // Determine current step
            const currentStepNumber = doc.workflowStatus?.currentStep || 0;
            const currentStep = workflow.steps?.find((step: any) => step.stepNumber === currentStepNumber);

            if (!currentStep) {
              console.log('No current step found, starting workflow');
              // Start workflow
              await workflowEngine.startWorkflow(doc, workflow, req);
              return;
            }

            // Check if conditions are met for current step
            const conditionsMet = await conditionEvaluator.evaluateConditions(
              currentStep.conditions,
              doc
            );

            if (!conditionsMet) {
              console.log('Conditions not met for current step');
              return;
            }

            // Process current step
            await workflowEngine.processStep(doc, workflow, currentStep, req);

            // Check for next step
            const nextStep = await workflowEngine.determineNextStep(
              doc,
              workflow,
              currentStep,
              'approved',
              req
            );

            if (nextStep) {
              await workflowEngine.moveToNextStep(doc, workflow, nextStep, req);
            } else {
              // Workflow completed
              await workflowEngine.completeWorkflow(doc, workflow, 'approved', req);
            }

          } else if (operation === 'create') {
            // Check if any workflow should be automatically assigned
            const applicableWorkflows = await req.payload.find({
              collection: 'workflows',
              where: {
                and: [
                  {
                    isActive: {
                      equals: true,
                    },
                  },
                  {
                    applicableCollections: {
                      contains: 'blogs',
                    },
                  },
                ],
              },
            });

            for (const workflow of applicableWorkflows.docs) {
              const shouldAssign = await conditionEvaluator.evaluateWorkflowAssignment(
                workflow,
                doc
              );

              if (shouldAssign) {
                console.log(`Auto-assigning workflow: ${workflow.name}`);
                await req.payload.update({
                  collection: 'blogs',
                  id: doc.id,
                  data: {
                    workflow: workflow.id,
                    workflowStatus: {
                      currentStep: 1,
                      isCompleted: false,
                      lastUpdated: new Date(),
                    },
                  },
                });
                break; // Only assign one workflow
              }
            }
          }
        } catch (error) {
          console.error('Workflow processing error:', error);
        }
      },
    ],
  },
}; 