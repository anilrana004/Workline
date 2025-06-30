import { buildConfig } from 'payload/config';
import { webpackBundler } from '@payloadcms/bundler-webpack';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { slateEditor } from '@payloadcms/richtext-slate';
import path from 'path';
import { Users } from './collections/Users';
import { Blogs } from './collections/Blogs';
import { Contracts } from './collections/Contracts';
import { Workflows } from './collections/Workflows';
import { WorkflowLogs } from './collections/WorkflowLogs';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    components: {
      // Add custom admin components here
    },
  },
  editor: slateEditor({}),
  collections: [Users, Blogs, Contracts, Workflows, WorkflowLogs],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/workflow-payload-cms',
  }),
  // Remove plugins for now - workflow logic is handled in collection hooks
}); 