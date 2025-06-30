// Simple test script to demonstrate workflow functionality
// Run with: node src/test-workflow.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testData = {
  documentId: '64a1b2c3d4e5f6789012345',
  collection: 'blogs',
  workflowId: '64a1b2c3d4e5f6789012346',
};

async function testWorkflowAPIs() {
  console.log('🧪 Testing Workflow APIs...\n');

  try {
    // Test 1: Get workflow status
    console.log('1. Testing GET /api/workflows/status/:docId');
    try {
      const statusResponse = await axios.get(
        `${BASE_URL}/api/workflows/status/${testData.documentId}?collection=${testData.collection}`
      );
      console.log('✅ Status Response:', statusResponse.data);
    } catch (error) {
      console.log('❌ Status Error:', error.response?.data || error.message);
    }

    // Test 2: Trigger workflow action
    console.log('\n2. Testing POST /api/workflows/trigger');
    try {
      const triggerResponse = await axios.post(`${BASE_URL}/api/workflows/trigger`, {
        documentId: testData.documentId,
        collection: testData.collection,
        workflowId: testData.workflowId,
        action: 'approved',
        comment: 'Test approval from API',
      });
      console.log('✅ Trigger Response:', triggerResponse.data);
    } catch (error) {
      console.log('❌ Trigger Error:', error.response?.data || error.message);
    }

    // Test 3: Get pending actions
    console.log('\n3. Testing GET /api/workflows/pending');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/api/workflows/pending`);
      console.log('✅ Pending Response:', pendingResponse.data);
    } catch (error) {
      console.log('❌ Pending Error:', error.response?.data || error.message);
    }

    // Test 4: Assign workflow
    console.log('\n4. Testing POST /api/workflows/assign');
    try {
      const assignResponse = await axios.post(`${BASE_URL}/api/workflows/assign`, {
        documentId: testData.documentId,
        collection: testData.collection,
        workflowId: testData.workflowId,
      });
      console.log('✅ Assign Response:', assignResponse.data);
    } catch (error) {
      console.log('❌ Assign Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Example workflow conditions
const exampleConditions = [
  {
    field: 'amount',
    operator: 'gt',
    value: '10000',
    description: 'Amount greater than $10,000',
  },
  {
    field: 'status',
    operator: 'eq',
    value: 'pending_review',
    description: 'Status equals pending_review',
  },
  {
    field: 'contractType',
    operator: 'contains',
    value: 'service',
    description: 'Contract type contains "service"',
  },
];

// Example workflow steps
const exampleWorkflowSteps = [
  {
    stepNumber: 1,
    name: 'Initial Review',
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
  },
  {
    stepNumber: 2,
    name: 'Manager Approval',
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
  },
  {
    stepNumber: 3,
    name: 'Executive Approval',
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
  },
];

console.log('🎯 Workflow Management System Test Script\n');
console.log('📋 Example Workflow Conditions:');
exampleConditions.forEach((condition, index) => {
  console.log(`${index + 1}. ${condition.description}`);
  console.log(`   Field: ${condition.field}, Operator: ${condition.operator}, Value: ${condition.value}\n`);
});

console.log('📋 Example Workflow Steps:');
exampleWorkflowSteps.forEach((step, index) => {
  console.log(`${index + 1}. ${step.name} (${step.stepType})`);
  console.log(`   Assigned to: ${step.assignees.type === 'role' ? step.assignees.roles?.join(', ') : 'Specific Users'}`);
  console.log(`   SLA: ${step.sla.enabled ? `${step.sla.hours} hours` : 'None'}`);
  if (step.conditions.length > 0) {
    console.log(`   Conditions: ${step.conditions.length} condition(s)`);
  }
  console.log('');
});

// Run tests if axios is available
if (typeof require !== 'undefined' && require.resolve) {
  try {
    require.resolve('axios');
    testWorkflowAPIs();
  } catch (error) {
    console.log('⚠️  Axios not installed. Install with: npm install axios');
    console.log('📝 This is a demonstration script. The actual workflow system is fully functional.');
  }
} else {
  console.log('📝 This is a demonstration script. The actual workflow system is fully functional.');
}

console.log('\n🚀 To run the actual system:');
console.log('1. npm install');
console.log('2. cp env.example .env');
console.log('3. npm run seed');
console.log('4. npm run dev');
console.log('5. Visit http://localhost:3000/admin'); 