import payload from 'payload';
import { config } from 'dotenv';

// Load environment variables
config();

const seed = async () => {
  // Initialize Payload
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
    local: true,
  });

  console.log('🌱 Starting database seeding...');

  try {
    // Create users
    console.log('Creating users...');
    
    const adminUser = await payload.create({
      collection: 'users',
      data: {
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        name: 'Admin User',
        role: 'admin',
        department: 'IT',
        isActive: true,
      },
    });

    const reviewerUser = await payload.create({
      collection: 'users',
      data: {
        email: process.env.REVIEWER_EMAIL || 'reviewer@example.com',
        password: process.env.REVIEWER_PASSWORD || 'reviewer123',
        name: 'Reviewer User',
        role: 'reviewer',
        department: 'Content',
        isActive: true,
      },
    });

    const managerUser = await payload.create({
      collection: 'users',
      data: {
        email: 'manager@example.com',
        password: 'manager123',
        name: 'Manager User',
        role: 'manager',
        department: 'Management',
        isActive: true,
      },
    });

    const authorUser = await payload.create({
      collection: 'users',
      data: {
        email: 'author@example.com',
        password: 'author123',
        name: 'Author User',
        role: 'user',
        department: 'Content',
        isActive: true,
      },
    });

    console.log('✅ Users created successfully');

    // Create workflows
    console.log('Creating workflows...');

    // Blog approval workflow
    const blogWorkflow = await payload.create({
      collection: 'workflows',
      data: {
        name: 'Blog Publication Workflow',
        description: 'Standard workflow for blog post publication',
        isActive: true,
        applicableCollections: ['blogs'],
        steps: [
          {
            stepNumber: 1,
            name: 'Content Review',
            description: 'Review content for quality and accuracy',
            stepType: 'review',
            assignees: {
              type: 'role',
              roles: ['reviewer'],
            },
            conditions: [],
            sla: {
              enabled: true,
              hours: 24,
            },
            nextSteps: [
              {
                condition: 'approved',
                nextStepNumber: 2,
              },
              {
                condition: 'rejected',
                nextStepNumber: 1, // Back to same step
              },
            ],
            isRequired: true,
            allowComments: true,
          },
          {
            stepNumber: 2,
            name: 'Manager Approval',
            description: 'Final approval from manager',
            stepType: 'approval',
            assignees: {
              type: 'role',
              roles: ['manager'],
            },
            conditions: [],
            sla: {
              enabled: true,
              hours: 48,
            },
            nextSteps: [
              {
                condition: 'approved',
                nextStepNumber: 3,
              },
              {
                condition: 'rejected',
                nextStepNumber: 1, // Back to content review
              },
            ],
            isRequired: true,
            allowComments: true,
          },
          {
            stepNumber: 3,
            name: 'Admin Sign-off',
            description: 'Final sign-off from admin',
            stepType: 'signoff',
            assignees: {
              type: 'role',
              roles: ['admin'],
            },
            conditions: [],
            sla: {
              enabled: true,
              hours: 72,
            },
            nextSteps: [],
            isRequired: true,
            allowComments: true,
          },
        ],
        createdBy: adminUser.id,
      },
    });

    // Contract approval workflow
    const contractWorkflow = await payload.create({
      collection: 'workflows',
      data: {
        name: 'Contract Approval Workflow',
        description: 'Workflow for contract approval based on amount',
        isActive: true,
        applicableCollections: ['contracts'],
        steps: [
          {
            stepNumber: 1,
            name: 'Initial Review',
            description: 'Initial contract review',
            stepType: 'review',
            assignees: {
              type: 'role',
              roles: ['reviewer'],
            },
            conditions: [],
            sla: {
              enabled: true,
              hours: 24,
            },
            nextSteps: [
              {
                condition: 'approved',
                nextStepNumber: 2,
              },
              {
                condition: 'rejected',
                nextStepNumber: 1,
              },
            ],
            isRequired: true,
            allowComments: true,
          },
          {
            stepNumber: 2,
            name: 'Manager Approval',
            description: 'Manager approval for contracts under $10,000',
            stepType: 'approval',
            assignees: {
              type: 'role',
              roles: ['manager'],
            },
            conditions: [
              {
                field: 'amount',
                operator: 'lte',
                value: '10000',
              },
            ],
            sla: {
              enabled: true,
              hours: 48,
            },
            nextSteps: [
              {
                condition: 'approved',
                nextStepNumber: 4, // Skip to final step
              },
              {
                condition: 'rejected',
                nextStepNumber: 1,
              },
            ],
            isRequired: true,
            allowComments: true,
          },
          {
            stepNumber: 3,
            name: 'Executive Approval',
            description: 'Executive approval for contracts over $10,000',
            stepType: 'approval',
            assignees: {
              type: 'role',
              roles: ['admin'],
            },
            conditions: [
              {
                field: 'amount',
                operator: 'gt',
                value: '10000',
              },
            ],
            sla: {
              enabled: true,
              hours: 72,
            },
            nextSteps: [
              {
                condition: 'approved',
                nextStepNumber: 4,
              },
              {
                condition: 'rejected',
                nextStepNumber: 1,
              },
            ],
            isRequired: true,
            allowComments: true,
          },
          {
            stepNumber: 4,
            name: 'Legal Review',
            description: 'Final legal review and sign-off',
            stepType: 'signoff',
            assignees: {
              type: 'role',
              roles: ['admin'],
            },
            conditions: [],
            sla: {
              enabled: true,
              hours: 96,
            },
            nextSteps: [],
            isRequired: true,
            allowComments: true,
          },
        ],
        createdBy: adminUser.id,
      },
    });

    console.log('✅ Workflows created successfully');

    // Create sample blogs
    console.log('Creating sample blogs...');

    const blog1 = await payload.create({
      collection: 'blogs',
      data: {
        title: 'Getting Started with Payload CMS',
        content: [
          {
            children: [
              {
                text: 'Payload CMS is a powerful headless CMS built with Node.js and TypeScript. It provides a great developer experience with a flexible admin interface.',
              },
            ],
          },
        ],
        author: authorUser.id,
        status: 'draft',
        workflow: blogWorkflow.id,
        workflowStatus: {
          currentStep: 1,
          isCompleted: false,
          lastUpdated: new Date(),
        },
      },
    });

    const blog2 = await payload.create({
      collection: 'blogs',
      data: {
        title: 'Advanced Workflow Management',
        content: [
          {
            children: [
              {
                text: 'Learn how to implement complex workflow systems in Payload CMS with dynamic conditions and branching logic.',
              },
            ],
          },
        ],
        author: authorUser.id,
        status: 'pending_review',
        workflow: blogWorkflow.id,
        workflowStatus: {
          currentStep: 2,
          isCompleted: false,
          lastUpdated: new Date(),
        },
      },
    });

    console.log('✅ Blogs created successfully');

    // Create sample contracts
    console.log('Creating sample contracts...');

    const contract1 = await payload.create({
      collection: 'contracts',
      data: {
        title: 'Website Development Contract',
        description: 'Contract for website development services',
        amount: 5000,
        client: 'ABC Company',
        contractType: 'service',
        status: 'draft',
        workflow: contractWorkflow.id,
        workflowStatus: {
          currentStep: 1,
          isCompleted: false,
          lastUpdated: new Date(),
        },
        createdBy: authorUser.id,
      },
    });

    const contract2 = await payload.create({
      collection: 'contracts',
      data: {
        title: 'Enterprise Software License',
        description: 'Enterprise software licensing agreement',
        amount: 25000,
        client: 'XYZ Corporation',
        contractType: 'license',
        status: 'pending_review',
        workflow: contractWorkflow.id,
        workflowStatus: {
          currentStep: 3,
          isCompleted: false,
          lastUpdated: new Date(),
        },
        createdBy: authorUser.id,
      },
    });

    console.log('✅ Contracts created successfully');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample Data Created:');
    console.log('- 4 Users (Admin, Reviewer, Manager, Author)');
    console.log('- 2 Workflows (Blog Publication, Contract Approval)');
    console.log('- 2 Blogs (with workflows assigned)');
    console.log('- 2 Contracts (with workflows assigned)');
    console.log('\n🔑 Login Credentials:');
    console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@example.com'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`Reviewer: ${process.env.REVIEWER_EMAIL || 'reviewer@example.com'} / ${process.env.REVIEWER_PASSWORD || 'reviewer123'}`);
    console.log('Manager: manager@example.com / manager123');
    console.log('Author: author@example.com / author123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }

  process.exit(0);
};

seed(); 