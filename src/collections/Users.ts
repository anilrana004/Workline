import { CollectionConfig } from 'payload/types';

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
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
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
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
          label: 'User',
          value: 'user',
        },
      ],
    },
    {
      name: 'department',
      type: 'select',
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
        {
          label: 'Quality Assurance',
          value: 'qa',
        },
        {
          label: 'Compliance',
          value: 'compliance',
        },
        {
          label: 'Security',
          value: 'security',
        },
        {
          label: 'Facilities',
          value: 'facilities',
        },
        {
          label: 'Procurement',
          value: 'procurement',
        },
        {
          label: 'Other',
          value: 'other',
        },
      ],
    },
    {
      name: 'subDepartment',
      type: 'select',
      required: false,
      admin: {
        description: 'Specific team or sub-department within the main department',
      },
      options: [
        // Engineering sub-departments
        { label: 'Frontend Development', value: 'frontend' },
        { label: 'Backend Development', value: 'backend' },
        { label: 'Full Stack Development', value: 'fullstack' },
        { label: 'DevOps', value: 'devops' },
        { label: 'QA Engineering', value: 'qa_engineering' },
        { label: 'Mobile Development', value: 'mobile' },
        { label: 'Data Engineering', value: 'data_engineering' },
        { label: 'Machine Learning', value: 'ml' },
        { label: 'Security Engineering', value: 'security_engineering' },
        { label: 'Infrastructure', value: 'infrastructure' },
        
        // Marketing sub-departments
        { label: 'Digital Marketing', value: 'digital_marketing' },
        { label: 'Content Marketing', value: 'content_marketing' },
        { label: 'Social Media', value: 'social_media' },
        { label: 'SEO/SEM', value: 'seo_sem' },
        { label: 'Brand Marketing', value: 'brand_marketing' },
        { label: 'Product Marketing', value: 'product_marketing' },
        { label: 'Event Marketing', value: 'event_marketing' },
        { label: 'Email Marketing', value: 'email_marketing' },
        { label: 'Marketing Analytics', value: 'marketing_analytics' },
        
        // Sales sub-departments
        { label: 'Inside Sales', value: 'inside_sales' },
        { label: 'Outside Sales', value: 'outside_sales' },
        { label: 'Enterprise Sales', value: 'enterprise_sales' },
        { label: 'SMB Sales', value: 'smb_sales' },
        { label: 'Sales Development', value: 'sales_development' },
        { label: 'Account Management', value: 'account_management' },
        { label: 'Channel Sales', value: 'channel_sales' },
        { label: 'Sales Operations', value: 'sales_operations' },
        { label: 'Sales Enablement', value: 'sales_enablement' },
        
        // Finance sub-departments
        { label: 'Accounting', value: 'accounting' },
        { label: 'Financial Planning', value: 'financial_planning' },
        { label: 'Treasury', value: 'treasury' },
        { label: 'Tax', value: 'tax' },
        { label: 'Audit', value: 'audit' },
        { label: 'Investor Relations', value: 'investor_relations' },
        { label: 'Financial Analysis', value: 'financial_analysis' },
        { label: 'Accounts Payable', value: 'accounts_payable' },
        { label: 'Accounts Receivable', value: 'accounts_receivable' },
        
        // HR sub-departments
        { label: 'Recruitment', value: 'recruitment' },
        { label: 'Talent Management', value: 'talent_management' },
        { label: 'Learning & Development', value: 'learning_development' },
        { label: 'Compensation & Benefits', value: 'compensation_benefits' },
        { label: 'Employee Relations', value: 'employee_relations' },
        { label: 'HR Operations', value: 'hr_operations' },
        { label: 'Diversity & Inclusion', value: 'diversity_inclusion' },
        { label: 'HR Analytics', value: 'hr_analytics' },
        
        // Legal sub-departments
        { label: 'Corporate Law', value: 'corporate_law' },
        { label: 'Contract Management', value: 'contract_management' },
        { label: 'Compliance', value: 'compliance' },
        { label: 'Intellectual Property', value: 'intellectual_property' },
        { label: 'Employment Law', value: 'employment_law' },
        { label: 'Litigation', value: 'litigation' },
        { label: 'Regulatory Affairs', value: 'regulatory_affairs' },
        
        // IT sub-departments
        { label: 'IT Support', value: 'it_support' },
        { label: 'System Administration', value: 'system_admin' },
        { label: 'Network Engineering', value: 'network_engineering' },
        { label: 'Database Administration', value: 'database_admin' },
        { label: 'IT Security', value: 'it_security' },
        { label: 'IT Operations', value: 'it_operations' },
        { label: 'IT Project Management', value: 'it_project_management' },
        { label: 'IT Architecture', value: 'it_architecture' },
        
        // Operations sub-departments
        { label: 'Business Operations', value: 'business_operations' },
        { label: 'Process Improvement', value: 'process_improvement' },
        { label: 'Supply Chain', value: 'supply_chain' },
        { label: 'Logistics', value: 'logistics' },
        { label: 'Facilities Management', value: 'facilities_management' },
        { label: 'Vendor Management', value: 'vendor_management' },
        { label: 'Quality Management', value: 'quality_management' },
        
        // Product sub-departments
        { label: 'Product Management', value: 'product_management' },
        { label: 'Product Strategy', value: 'product_strategy' },
        { label: 'Product Analytics', value: 'product_analytics' },
        { label: 'Product Operations', value: 'product_operations' },
        { label: 'Product Marketing', value: 'product_marketing' },
        { label: 'User Research', value: 'user_research' },
        
        // Design sub-departments
        { label: 'UI/UX Design', value: 'ui_ux_design' },
        { label: 'Graphic Design', value: 'graphic_design' },
        { label: 'Visual Design', value: 'visual_design' },
        { label: 'Interaction Design', value: 'interaction_design' },
        { label: 'Design Systems', value: 'design_systems' },
        { label: 'Brand Design', value: 'brand_design' },
        
        // Customer Support sub-departments
        { label: 'Technical Support', value: 'technical_support' },
        { label: 'Customer Success', value: 'customer_success' },
        { label: 'Customer Experience', value: 'customer_experience' },
        { label: 'Support Operations', value: 'support_operations' },
        { label: 'Training', value: 'training' },
        { label: 'Documentation', value: 'documentation' },
        
        // R&D sub-departments
        { label: 'Research', value: 'research' },
        { label: 'Development', value: 'development' },
        { label: 'Innovation', value: 'innovation' },
        { label: 'Prototyping', value: 'prototyping' },
        { label: 'Technology Research', value: 'technology_research' },
        
        // QA sub-departments
        { label: 'Quality Assurance', value: 'quality_assurance' },
        { label: 'Quality Control', value: 'quality_control' },
        { label: 'Testing', value: 'testing' },
        { label: 'Automation Testing', value: 'automation_testing' },
        { label: 'Performance Testing', value: 'performance_testing' },
        { label: 'Security Testing', value: 'security_testing' },
        
        // Compliance sub-departments
        { label: 'Regulatory Compliance', value: 'regulatory_compliance' },
        { label: 'Policy Management', value: 'policy_management' },
        { label: 'Risk Management', value: 'risk_management' },
        { label: 'Audit Compliance', value: 'audit_compliance' },
        { label: 'Data Privacy', value: 'data_privacy' },
        
        // Security sub-departments
        { label: 'Information Security', value: 'information_security' },
        { label: 'Cybersecurity', value: 'cybersecurity' },
        { label: 'Physical Security', value: 'physical_security' },
        { label: 'Security Operations', value: 'security_operations' },
        { label: 'Threat Intelligence', value: 'threat_intelligence' },
        { label: 'Incident Response', value: 'incident_response' },
        
        // Facilities sub-departments
        { label: 'Facility Management', value: 'facility_management' },
        { label: 'Maintenance', value: 'maintenance' },
        { label: 'Space Planning', value: 'space_planning' },
        { label: 'Environmental Health & Safety', value: 'ehs' },
        
        // Procurement sub-departments
        { label: 'Strategic Sourcing', value: 'strategic_sourcing' },
        { label: 'Vendor Management', value: 'vendor_management_procurement' },
        { label: 'Contract Management', value: 'contract_management_procurement' },
        { label: 'Procurement Operations', value: 'procurement_operations' },
        { label: 'Supplier Relations', value: 'supplier_relations' },
        
        // Other sub-departments
        { label: 'General', value: 'general' },
        { label: 'Administration', value: 'administration' },
        { label: 'Executive Office', value: 'executive_office' },
        { label: 'Special Projects', value: 'special_projects' },
      ],
    },
    {
      name: 'jobTitle',
      type: 'text',
      required: false,
    },
    {
      name: 'manager',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Direct manager or supervisor',
      },
    },
    {
      name: 'approvalLimit',
      type: 'number',
      required: false,
      admin: {
        description: 'Maximum amount this user can approve (in currency units)',
      },
    },
    {
      name: 'workflowPermissions',
      type: 'select',
      hasMany: true,
      required: false,
      options: [
        {
          label: 'Can Create Workflows',
          value: 'create_workflows',
        },
        {
          label: 'Can Edit Workflows',
          value: 'edit_workflows',
        },
        {
          label: 'Can Delete Workflows',
          value: 'delete_workflows',
        },
        {
          label: 'Can Assign Workflows',
          value: 'assign_workflows',
        },
        {
          label: 'Can View Analytics',
          value: 'view_analytics',
        },
        {
          label: 'Can Export Data',
          value: 'export_data',
        },
        {
          label: 'Can Manage SLA',
          value: 'manage_sla',
        },
        {
          label: 'Can Escalate Issues',
          value: 'escalate_issues',
        },
      ],
    },
    {
      name: 'notificationPreferences',
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
          name: 'slackChannel',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData) => siblingData?.slack === true,
            description: 'Slack channel for notifications',
          },
        },
        {
          name: 'teamsChannel',
          type: 'text',
          required: false,
          admin: {
            condition: (data, siblingData) => siblingData?.teams === true,
            description: 'Teams channel for notifications',
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'lastLogin',
      type: 'date',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'timezone',
      type: 'select',
      required: false,
      defaultValue: 'UTC',
      options: [
        { label: 'UTC', value: 'UTC' },
        { label: 'EST (UTC-5)', value: 'America/New_York' },
        { label: 'CST (UTC-6)', value: 'America/Chicago' },
        { label: 'MST (UTC-7)', value: 'America/Denver' },
        { label: 'PST (UTC-8)', value: 'America/Los_Angeles' },
        { label: 'GMT (UTC+0)', value: 'Europe/London' },
        { label: 'CET (UTC+1)', value: 'Europe/Paris' },
        { label: 'IST (UTC+5:30)', value: 'Asia/Kolkata' },
        { label: 'JST (UTC+9)', value: 'Asia/Tokyo' },
        { label: 'AEST (UTC+10)', value: 'Australia/Sydney' },
      ],
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
      admin: {
        description: 'Custom tags for workflow assignment',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // Update last login on authentication
        if (req.user?.id === data.id) {
          data.lastLogin = new Date();
        }
        return data;
      },
    ],
  },
}; 