/**
 * Knowledge Base Page
 * Comprehensive user guide and training manual for the Admin Portal
 */

import { useState, useMemo } from 'react';
import {
  Book,
  Search,
  ChevronRight,
  Users,
  Shield,
  UserCog,
  Key,
  FileText,
  ClipboardCheck,
  LayoutDashboard,
  UserCheck,
  Compass,
  ClipboardList,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  Printer,
  BookOpen,
  ArrowUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Table of Contents structure
const tableOfContents = [
  { id: 'introduction', title: 'Introduction', icon: Book },
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
  { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
  { id: 'user-management', title: 'User Management', icon: Users },
  { id: 'role-management', title: 'Role Management', icon: Shield },
  { id: 'group-management', title: 'Group Management', icon: UserCog },
  { id: 'advisor-assignments', title: 'Advisor Assignments', icon: UserCheck },
  { id: 'access-requests', title: 'Access Requests', icon: ClipboardCheck },
  { id: 'api-keys', title: 'API Key Management', icon: Key },
  { id: 'audit-logs', title: 'Audit Logs', icon: FileText },
  { id: 'access-reviews', title: 'Access Reviews', icon: ClipboardCheck },
  { id: 'review-campaigns', title: 'Access Review Campaigns', icon: ClipboardList },
  { id: 'security-gaps', title: 'Security Gap Analysis', icon: ShieldAlert },
  { id: 'governance', title: 'Governance', icon: Compass },
  { id: 'compliance', title: 'Compliance Framework Reference', icon: Shield },
  { id: 'glossary', title: 'Glossary', icon: HelpCircle },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: AlertTriangle },
];

// Compliance framework data
const complianceFrameworks = [
  {
    name: 'SOC 2',
    fullName: 'Service Organization Control 2',
    controls: [
      { id: 'CC6.1', description: 'Logical access security', feature: 'User management, MFA' },
      { id: 'CC6.2', description: 'Authorization and access', feature: 'Access requests, Groups' },
      { id: 'CC6.3', description: 'Removal of access', feature: 'User deactivation, Access reviews' },
      { id: 'CC6.6', description: 'System boundaries', feature: 'API key management' },
      { id: 'CC7.2', description: 'Monitoring anomalies', feature: 'Audit logs' },
    ],
  },
  {
    name: 'ISO 27001',
    fullName: 'Information Security Management',
    controls: [
      { id: 'A.9.2.1', description: 'User registration', feature: 'User management' },
      { id: 'A.9.2.3', description: 'Privileged access', feature: 'Role management' },
      { id: 'A.9.2.5', description: 'Access rights review', feature: 'Access review campaigns' },
      { id: 'A.9.4.2', description: 'Secure log-on', feature: 'MFA, password policies' },
      { id: 'A.12.4.2', description: 'Log protection', feature: 'Audit log retention' },
    ],
  },
  {
    name: 'NIST 800-53',
    fullName: 'Security and Privacy Controls',
    controls: [
      { id: 'AC-2', description: 'Account management', feature: 'User lifecycle management' },
      { id: 'AC-5', description: 'Separation of duties', feature: 'Role-based permissions' },
      { id: 'AC-6', description: 'Least privilege', feature: 'Granular permission model' },
      { id: 'IA-2', description: 'Identification and authentication', feature: 'MFA' },
      { id: 'AU-2', description: 'Audit events', feature: 'Comprehensive audit logging' },
    ],
  },
  {
    name: 'PCI-DSS',
    fullName: 'Payment Card Industry Data Security Standard',
    controls: [
      { id: '7.1', description: 'Limit access by job', feature: 'RBAC' },
      { id: '7.1.2', description: 'Privileged access', feature: 'Admin role tracking' },
      { id: '8.1', description: 'User identification', feature: 'Unique user IDs' },
      { id: '8.3', description: 'Multi-factor authentication', feature: 'MFA support' },
      { id: '10.2', description: 'Audit trails', feature: 'Audit logging' },
    ],
  },
];

// Glossary terms
const glossaryTerms = [
  { term: 'API Key', definition: 'A credential used for programmatic access to the platform' },
  { term: 'Access Request', definition: 'A formal request for additional permissions' },
  { term: 'Access Review', definition: 'A process to validate user access is appropriate' },
  { term: 'Access Review Campaign', definition: 'A comprehensive review covering multiple users and their access' },
  { term: 'Audit Log', definition: 'A record of all security-relevant activities' },
  { term: 'Group', definition: 'A collection of users with shared role assignments' },
  { term: 'IAM', definition: 'Identity and Access Management' },
  { term: 'MFA', definition: 'Multi-Factor Authentication - requires two forms of verification' },
  { term: 'Permission', definition: 'A specific capability granted to a user or role' },
  { term: 'RBAC', definition: 'Role-Based Access Control - permissions assigned through roles' },
  { term: 'Role', definition: 'A named collection of permissions' },
  { term: 'Subject', definition: 'A user being reviewed in an access review campaign' },
  { term: 'Tenant', definition: 'An isolated organizational unit within the platform' },
];

// Back to TOC button component
function BackToTOC() {
  const scrollToTop = () => {
    const tocElement = document.getElementById('table-of-contents');
    if (tocElement) {
      tocElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline mt-4 transition-colors"
    >
      <ArrowUp className="h-4 w-4" />
      Back to Table of Contents
    </button>
  );
}

export function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('introduction');
  const [activeTab, setActiveTab] = useState('guide');

  const scrollToSection = (sectionId: string) => {
    // Determine which tab the section belongs to
    const complianceSection = sectionId === 'compliance';
    const glossarySection = sectionId === 'glossary' || sectionId === 'troubleshooting';
    
    // Switch to appropriate tab first
    if (complianceSection) {
      setActiveTab('compliance');
    } else if (glossarySection) {
      setActiveTab('glossary');
    } else {
      setActiveTab('guide');
    }

    // Update active section state
    setActiveSection(sectionId);

    // Scroll to element after a brief delay to allow tab switch
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add a highlight effect
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2000);
      }
    }, 100);
  };

  const filteredToc = useMemo(() => {
    if (!searchQuery.trim()) return tableOfContents;
    const query = searchQuery.toLowerCase();
    return tableOfContents.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Book className="h-7 w-7 text-blue-600" />
            Knowledge Base
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive user guide and training manual for the Admin Portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Guide
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">17</div>
            <div className="text-sm text-gray-600">Sections</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">4</div>
            <div className="text-sm text-gray-600">Compliance Frameworks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">13</div>
            <div className="text-sm text-gray-600">Glossary Terms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">v1.0</div>
            <div className="text-sm text-gray-600">Documentation Version</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents Sidebar */}
        <div className="lg:col-span-1" id="table-of-contents">
          <Card className="sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Table of Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="max-h-[600px] overflow-y-auto">
                {filteredToc.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                      <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList>
              <TabsTrigger value="guide">User Guide</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="glossary">Glossary</TabsTrigger>
            </TabsList>

            {/* User Guide Tab */}
            <TabsContent value="guide" className="space-y-6 mt-6">
              {/* Introduction Section */}
              <Card id="introduction" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Book className="h-5 w-5 text-blue-600" />
                    Introduction
                  </CardTitle>
                  <CardDescription>
                    About the CHANGE Platform Admin Portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The CHANGE Platform Admin Portal is a comprehensive Identity and Access Management (IAM) 
                    solution designed for enterprise environments. It provides centralized control over user 
                    identities, access permissions, security compliance, and audit trails.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Key Capabilities</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Identity Management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Access Control (RBAC)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Group Management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Access Reviews
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Compliance Management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Audit Logging
                      </li>
                    </ul>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-4">User Roles Overview</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Role</th>
                          <th className="border p-2 text-left">Access Level</th>
                          <th className="border p-2 text-left">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-medium">IT Admin</td>
                          <td className="border p-2">Full Platform</td>
                          <td className="border p-2">Complete access across all tenants</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Advisor</td>
                          <td className="border p-2">Assigned Tenants</td>
                          <td className="border p-2">Access to specifically assigned tenants</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Manager</td>
                          <td className="border p-2">Own Tenant</td>
                          <td className="border p-2">Full access within their tenant</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Customer</td>
                          <td className="border p-2">Own Tenant</td>
                          <td className="border p-2">Limited access based on assigned roles</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Getting Started Section */}
              <Card id="getting-started" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    First steps for using the Admin Portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Accessing the Admin Portal</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Navigate to the platform URL</li>
                    <li>Enter your email address and password</li>
                    <li>If MFA is enabled, enter the verification code from your authenticator app</li>
                    <li>You will be directed to the Admin Dashboard</li>
                  </ol>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      First-Time Setup Checklist
                    </h4>
                    <ul className="space-y-2 text-sm text-yellow-800">
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Create initial roles with appropriate permissions
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Set up user groups based on organizational structure
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Create user accounts and assign to groups
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Enable MFA for all administrative users
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Configure API keys for system integrations
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Set up an access review campaign
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" /> Review the Security Gap Analysis
                      </li>
                    </ul>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Dashboard Section */}
              <Card id="dashboard" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutDashboard className="h-5 w-5 text-purple-600" />
                    Dashboard
                  </CardTitle>
                  <CardDescription>
                    Real-time overview of your IAM environment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    The Dashboard provides a real-time overview of your IAM environment's health and status.
                  </p>

                  <h4 className="font-semibold text-gray-900">Key Metrics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Metric</th>
                          <th className="border p-2 text-left">Description</th>
                          <th className="border p-2 text-left">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-medium">Total Users</td>
                          <td className="border p-2">Count of all user accounts</td>
                          <td className="border p-2">Informational</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Active Users</td>
                          <td className="border p-2">Users who have logged in recently</td>
                          <td className="border p-2">Close to total</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">MFA Coverage</td>
                          <td className="border p-2">Percentage of users with MFA enabled</td>
                          <td className="border p-2 text-green-600 font-semibold">100%</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Locked Accounts</td>
                          <td className="border p-2">Users currently locked out</td>
                          <td className="border p-2 text-green-600 font-semibold">0</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Pending Requests</td>
                          <td className="border p-2">Access requests awaiting approval</td>
                          <td className="border p-2">Review daily</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      Dashboard Best Practices
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      <li>Review the dashboard at the start of each workday</li>
                      <li>Address any MFA coverage gaps immediately</li>
                      <li>Investigate locked accounts for potential security issues</li>
                      <li>Process pending access requests promptly</li>
                    </ul>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* User Management Section */}
              <Card id="user-management" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Create, modify, and manage user accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Creating a New User</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li><strong>Click</strong> the "+ New User" button in the top right</li>
                    <li><strong>Fill in</strong> the required fields:
                      <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                        <li>Email (required) - Must be a valid email address</li>
                        <li>First Name (required)</li>
                        <li>Last Name (required)</li>
                        <li>Password (required) - Min 8 chars, uppercase, lowercase, number, special char</li>
                      </ul>
                    </li>
                    <li><strong>Configure</strong> optional settings: Role, Groups, MFA</li>
                    <li><strong>Click</strong> "Create User"</li>
                    <li>User receives a welcome email with login instructions</li>
                  </ol>

                  <h4 className="font-semibold text-gray-900 mt-6">Managing MFA</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h5 className="font-semibold text-green-900 mb-2">Enabling MFA</h5>
                      <ol className="list-decimal list-inside text-sm text-green-800 space-y-1">
                        <li>Edit the user</li>
                        <li>Toggle "MFA Enabled" to On</li>
                        <li>Save changes</li>
                        <li>User prompted on next login</li>
                      </ol>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-900 mb-2">Disabling MFA (Emergency)</h5>
                      <ol className="list-decimal list-inside text-sm text-red-800 space-y-1">
                        <li>Edit the user</li>
                        <li>Toggle "MFA Enabled" to Off</li>
                        <li>Save changes</li>
                        <li>Document the reason</li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Compliance Note
                    </h4>
                    <p className="text-sm text-yellow-800">
                      MFA should be enabled for all users per SOC2 CC6.1, ISO 27001 A.9.4.2, and NIST 800-53 IA-2.
                    </p>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Deactivating a User</h4>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      When an employee leaves or no longer needs access:
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Find the user in the list</li>
                      <li>Click "Edit"</li>
                      <li>Toggle "Active" to Off</li>
                      <li>Save changes</li>
                    </ol>
                    <p className="text-sm text-gray-600 mt-2 italic">
                      Best Practice: Never delete user accounts. Deactivate them to preserve audit trail integrity.
                    </p>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Role Management Section */}
              <Card id="role-management" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Role Management
                  </CardTitle>
                  <CardDescription>
                    Define and manage permission roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Roles define sets of permissions that can be assigned to users or groups. 
                    The platform uses Role-Based Access Control (RBAC) to ensure users have only the permissions they need.
                  </p>

                  <h4 className="font-semibold text-gray-900">Permission Categories</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Category</th>
                          <th className="border p-2 text-left">Available Actions</th>
                          <th className="border p-2 text-left">Example</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-medium">IAM_USER</td>
                          <td className="border p-2">READ, WRITE, DELETE</td>
                          <td className="border p-2 text-gray-600">IAM_USER_WRITE allows creating/editing users</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_ROLE</td>
                          <td className="border p-2">READ, WRITE, DELETE</td>
                          <td className="border p-2 text-gray-600">IAM_ROLE_READ allows viewing roles</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_GROUP</td>
                          <td className="border p-2">READ, WRITE, DELETE</td>
                          <td className="border p-2 text-gray-600">IAM_GROUP_WRITE allows managing groups</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_ACCESS_REQUEST</td>
                          <td className="border p-2">READ, WRITE, APPROVE</td>
                          <td className="border p-2 text-gray-600">IAM_ACCESS_REQUEST_APPROVE for approving</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_ACCESS_REVIEW</td>
                          <td className="border p-2">READ, WRITE, DECIDE</td>
                          <td className="border p-2 text-gray-600">IAM_ACCESS_REVIEW_DECIDE for review decisions</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_API_KEY</td>
                          <td className="border p-2">READ, WRITE, DELETE</td>
                          <td className="border p-2 text-gray-600">IAM_API_KEY_WRITE allows creating keys</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">IAM_AUDIT</td>
                          <td className="border p-2">READ</td>
                          <td className="border p-2 text-gray-600">IAM_AUDIT_READ allows viewing audit logs</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Best Practices for Role Design</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Least Privilege</h5>
                      <p className="text-sm text-gray-600">Grant only necessary permissions. Don't give WRITE when READ is sufficient.</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Separation of Duties</h5>
                      <p className="text-sm text-gray-600">Split conflicting permissions. Separate "request" and "approve" permissions.</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Role Hierarchy</h5>
                      <p className="text-sm text-gray-600">Build roles from simple to complex: Basic → Power User → Admin</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900 mb-2">Clear Naming</h5>
                      <p className="text-sm text-gray-600">Use descriptive names like "Access Request Approver" not "Role 1"</p>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Group Management Section */}
              <Card id="group-management" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-cyan-600" />
                    Group Management
                  </CardTitle>
                  <CardDescription>
                    Organize users and assign roles collectively
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Groups allow you to organize users and assign roles collectively, simplifying access management for teams and departments.
                  </p>

                  <h4 className="font-semibold text-gray-900">Creating a New Group</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Click "+ New Group"</li>
                    <li>Enter group details: Name (required), Description</li>
                    <li>Assign roles to the group - all members will inherit these</li>
                    <li>Add members by searching for users</li>
                    <li>Click "Create Group"</li>
                  </ol>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      Best Practices
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      <li>Mirror your organizational structure with groups</li>
                      <li>Use descriptive names like "Finance - Accounts Payable"</li>
                      <li>Document the purpose in the description field</li>
                      <li>Audit group membership quarterly</li>
                      <li>Prefer group-based role assignment over direct assignment</li>
                    </ul>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Access Requests Section */}
              <Card id="access-requests" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    Access Requests
                  </CardTitle>
                  <CardDescription>
                    Formal workflow for requesting and approving access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Access Request Workflow</h4>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">Request Submitted</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge variant="outline">Pending Approval</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge variant="outline">Review by Manager</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge className="bg-green-100 text-green-800">Approved/Rejected</Badge>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Approving/Rejecting Requests</h4>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Requires:</strong> IAM_ACCESS_REQUEST_APPROVE permission
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                      <li>Navigate to Access Requests</li>
                      <li>Click on a pending request to view details</li>
                      <li>Review: who is requesting, what they're requesting, their justification</li>
                      <li>Click <strong>Approve</strong> to grant access or <strong>Reject</strong> to deny</li>
                      <li>Add notes explaining your decision</li>
                      <li>The requester is notified of the decision</li>
                    </ol>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* API Keys Section */}
              <Card id="api-keys" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-yellow-600" />
                    API Key Management
                  </CardTitle>
                  <CardDescription>
                    Manage programmatic access credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Creating an API Key</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Click "+ New API Key"</li>
                    <li>Configure the key:
                      <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                        <li>Name (required) - Purpose of this key</li>
                        <li>Expiration - When the key should expire</li>
                        <li>Permissions - What the key can access</li>
                      </ul>
                    </li>
                    <li>Click "Create Key"</li>
                    <li><strong className="text-red-600">IMPORTANT:</strong> Copy the key value immediately - it's only shown once!</li>
                  </ol>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-red-900 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Security Warning
                    </h4>
                    <p className="text-sm text-red-800">
                      Revoking a key will immediately break any integrations using it. 
                      Always create and test a new key before revoking the old one.
                    </p>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Best Practices</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <p className="font-medium text-gray-900">Set Expiration</p>
                      <p className="text-sm text-gray-600">Always set an expiration date</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-medium text-gray-900">Rotate Regularly</p>
                      <p className="text-sm text-gray-600">Rotate keys every 90 days</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-medium text-gray-900">Least Privilege</p>
                      <p className="text-sm text-gray-600">Grant only necessary permissions</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-medium text-gray-900">Secure Storage</p>
                      <p className="text-sm text-gray-600">Use secrets managers, not code repos</p>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Audit Logs Section */}
              <Card id="audit-logs" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    Audit Logs
                  </CardTitle>
                  <CardDescription>
                    Comprehensive record of all IAM activities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">
                    Audit Logs provide a comprehensive, tamper-evident record of all IAM activities 
                    for security monitoring, compliance, and forensic investigation.
                  </p>

                  <h4 className="font-semibold text-gray-900">Key Events to Monitor</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Event</th>
                          <th className="border p-2 text-left">Description</th>
                          <th className="border p-2 text-left">Why It Matters</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-mono text-xs">USER_CREATED</td>
                          <td className="border p-2">New user account</td>
                          <td className="border p-2 text-gray-600">Detect unauthorized accounts</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-mono text-xs">USER_DELETED</td>
                          <td className="border p-2">Account removal</td>
                          <td className="border p-2 text-gray-600">Data destruction risk</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-mono text-xs">ROLE_ASSIGNED</td>
                          <td className="border p-2">Permission change</td>
                          <td className="border p-2 text-gray-600">Privilege escalation</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-mono text-xs">LOGIN_FAILED</td>
                          <td className="border p-2">Failed authentication</td>
                          <td className="border p-2 text-gray-600">Brute force attacks</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-mono text-xs">MFA_DISABLED</td>
                          <td className="border p-2">MFA turned off</td>
                          <td className="border p-2 text-gray-600">Security degradation</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-mono text-xs">API_KEY_CREATED</td>
                          <td className="border p-2">New API key</td>
                          <td className="border p-2 text-gray-600">Unauthorized access risk</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Audit Log Retention</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">7 Years</p>
                      <p className="text-sm text-gray-600">Production</p>
                    </div>
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-600">1 Year</p>
                      <p className="text-sm text-gray-600">Non-Production</p>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Access Reviews Section */}
              <Card id="access-reviews" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-indigo-600" />
                    Access Reviews
                  </CardTitle>
                  <CardDescription>
                    Periodic validation of user access levels
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Types of Access Reviews</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900">Periodic</h5>
                      <p className="text-sm text-gray-600">Regular scheduled reviews - Quarterly</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900">Event-Driven</h5>
                      <p className="text-sm text-gray-600">Triggered by changes - As needed</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900">Certification</h5>
                      <p className="text-sm text-gray-600">Full access certification - Annually</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold text-gray-900">Dormant Account</h5>
                      <p className="text-sm text-gray-600">Inactive user review - Monthly</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Review Decisions</h4>
                  <div className="flex flex-wrap gap-4">
                    <Badge className="bg-green-100 text-green-800 text-sm py-1 px-3">
                      Keep - Access is appropriate
                    </Badge>
                    <Badge className="bg-red-100 text-red-800 text-sm py-1 px-3">
                      Remove - Access should be revoked
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800 text-sm py-1 px-3">
                      Modify - Access level should change
                    </Badge>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Review Campaigns Section */}
              <Card id="review-campaigns">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-pink-600" />
                    Access Review Campaigns
                  </CardTitle>
                  <CardDescription>
                    Comprehensive framework for reviewing user access at scale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Campaign Workflow</h4>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="outline">Draft</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge variant="outline">In Review</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge variant="outline">Submitted</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge variant="outline">Approved</Badge>
                    <ChevronRight className="h-4 w-4" />
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Creating a Campaign</h4>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-gray-900">Step 1: Basic Information</h5>
                      <p className="text-sm text-gray-600">Name, Description, System Name, Environment, Business Unit</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-gray-900">Step 2: Review Configuration</h5>
                      <p className="text-sm text-gray-600">Review Type, Period, Reviewer assignment</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-gray-900">Step 3: Add Subjects</h5>
                      <p className="text-sm text-gray-600">Manual add or Bulk select users to review</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-gray-900">Step 4: Configure Access Items</h5>
                      <p className="text-sm text-gray-600">Applications, Roles, Privilege levels, Data classifications</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h5 className="font-medium text-gray-900">Step 5: Set Workflow</h5>
                      <p className="text-sm text-gray-600">Due Date, Approval settings</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Bulk Decision Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium text-blue-900">Approve Standard</p>
                      <p className="text-sm text-blue-700">Approve all standard privilege access</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium text-blue-900">Approve All</p>
                      <p className="text-sm text-blue-700">Approve everything visible</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="font-medium text-blue-900">Approve Selected</p>
                      <p className="text-sm text-blue-700">Approve only checked items</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Group Certification</h4>
                  <p className="text-gray-700">
                    The Groups tab allows you to certify group memberships and permissions:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li><strong>Membership Review:</strong> Verify all members should be in the group</li>
                    <li><strong>Permissions Review:</strong> Verify the group's roles are appropriate</li>
                    <li>A group is fully certified when both aspects are validated</li>
                  </ul>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Security Gaps Section */}
              <Card id="security-gaps" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                    Security Gap Analysis
                  </CardTitle>
                  <CardDescription>
                    Automated security assessment and remediation guidance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Security Score</h4>
                  <p className="text-gray-700">
                    The Security Score (0-100) provides an at-a-glance assessment of your IAM security posture.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-600">80-100</div>
                      <div className="text-sm text-gray-600">Good</div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-600">60-79</div>
                      <div className="text-sm text-gray-600">Fair</div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-orange-600">40-59</div>
                      <div className="text-sm text-gray-600">Needs Attention</div>
                    </div>
                    <div className="border rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-red-600">0-39</div>
                      <div className="text-sm text-gray-600">Critical</div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Gap Categories</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-2 text-left">Category</th>
                          <th className="border p-2 text-left">What It Checks</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-2 font-medium">Authentication</td>
                          <td className="border p-2">MFA coverage, password policies</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Access Management</td>
                          <td className="border p-2">Inactive users, group membership</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Privilege Management</td>
                          <td className="border p-2">Admin access levels, separation of duties</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">API Security</td>
                          <td className="border p-2">Key expiration, rotation</td>
                        </tr>
                        <tr>
                          <td className="border p-2 font-medium">Compliance</td>
                          <td className="border p-2">Access review frequency</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-gray-900 mt-6">Common Gaps and Remediation</h4>
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h5 className="font-semibold text-red-900">Users Without MFA</h5>
                      <p className="text-sm text-red-800 mb-2">Severity: Critical | Accounts vulnerable to credential theft</p>
                      <p className="text-sm text-red-700"><strong>Fix:</strong> Navigate to Users → Edit each user → Enable MFA</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h5 className="font-semibold text-orange-900">Excessive Administrative Access</h5>
                      <p className="text-sm text-orange-800 mb-2">Severity: High | Broad admin access increases breach impact</p>
                      <p className="text-sm text-orange-700"><strong>Fix:</strong> Review admin users → Create granular roles → Reassign</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h5 className="font-semibold text-yellow-900">No Recent Access Reviews</h5>
                      <p className="text-sm text-yellow-800 mb-2">Severity: High | Users may have unnecessary access</p>
                      <p className="text-sm text-yellow-700"><strong>Fix:</strong> Create new Access Review Campaign → Complete within 30 days</p>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              {/* Governance Section */}
              <Card id="governance" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-teal-600" />
                    Governance
                  </CardTitle>
                  <CardDescription>
                    IAM alignment with process improvement methodologies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <h4 className="font-semibold text-gray-900">DMAIC Framework</h4>
                  <p className="text-gray-700 mb-4">
                    DMAIC (Define, Measure, Analyze, Improve, Control) applied to IAM:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <Badge className="bg-blue-100 text-blue-800">D</Badge>
                      <div>
                        <p className="font-medium text-gray-900">Define</p>
                        <p className="text-sm text-gray-600">Role definitions, Permission catalog, Access policies</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <Badge className="bg-green-100 text-green-800">M</Badge>
                      <div>
                        <p className="font-medium text-gray-900">Measure</p>
                        <p className="text-sm text-gray-600">User activity, MFA coverage, Access patterns</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <Badge className="bg-yellow-100 text-yellow-800">A</Badge>
                      <div>
                        <p className="font-medium text-gray-900">Analyze</p>
                        <p className="text-sm text-gray-600">Security gap analysis, Inactive users, Role drift</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <Badge className="bg-orange-100 text-orange-800">I</Badge>
                      <div>
                        <p className="font-medium text-gray-900">Improve</p>
                        <p className="text-sm text-gray-600">Access request workflow, Policy updates, MFA enforcement</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 border rounded-lg p-3">
                      <Badge className="bg-purple-100 text-purple-800">C</Badge>
                      <div>
                        <p className="font-medium text-gray-900">Control</p>
                        <p className="text-sm text-gray-600">Access reviews, Continuous monitoring, API key rotation</p>
                      </div>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-6 mt-6">
              <Card id="compliance" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Compliance Framework Mapping
                  </CardTitle>
                  <CardDescription>
                    Shows which platform features address compliance requirements for SOC2, ISO 27001, NIST 800-53, and PCI-DSS
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {complianceFrameworks.map((framework) => (
                      <div key={framework.name} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b">
                          <h4 className="font-semibold text-gray-900">{framework.name}</h4>
                          <p className="text-sm text-gray-600">{framework.fullName}</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="border-b p-3 text-left font-medium">Control ID</th>
                                <th className="border-b p-3 text-left font-medium">Description</th>
                                <th className="border-b p-3 text-left font-medium">Platform Feature</th>
                              </tr>
                            </thead>
                            <tbody>
                              {framework.controls.map((control) => (
                                <tr key={control.id} className="hover:bg-gray-50">
                                  <td className="border-b p-3 font-mono text-blue-600">{control.id}</td>
                                  <td className="border-b p-3">{control.description}</td>
                                  <td className="border-b p-3 text-gray-600">{control.feature}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Validation Checklist</CardTitle>
                  <CardDescription>
                    Use this checklist to validate your IAM configuration meets compliance requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">All users have MFA enabled</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.1, ISO 27001 A.9.4.2, NIST IA-2, PCI-DSS 8.3</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Access reviews conducted quarterly</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.3, ISO 27001 A.9.2.5, NIST AC-2, PCI-DSS 7.1.2</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Separation of duties enforced</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.3, ISO 27001 A.6.1.2, NIST AC-5, PCI-DSS 6.4</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">API keys have expiration dates</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.6, ISO 27001 A.10.1.1, NIST IA-5</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Audit logs retained for 7 years</p>
                        <p className="text-sm text-gray-600">SOC2 CC7.2, ISO 27001 A.12.4.2, NIST AU-2, PCI-DSS 10.2</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Inactive accounts disabled</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.2, ISO 27001 A.9.2.6, NIST AC-2</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 border rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Least privilege access implemented</p>
                        <p className="text-sm text-gray-600">SOC2 CC6.3, ISO 27001 A.9.2.3, NIST AC-6, PCI-DSS 7.1</p>
                      </div>
                    </div>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Glossary Tab */}
            <TabsContent value="glossary" className="space-y-6 mt-6">
              <Card id="glossary" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                    Glossary of Terms
                  </CardTitle>
                  <CardDescription>
                    Definitions of key terms used throughout the Admin Portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {glossaryTerms.map((item) => (
                      <div key={item.term} className="border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900">{item.term}</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>

              <Card id="troubleshooting" className="transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Troubleshooting
                  </CardTitle>
                  <CardDescription>
                    Common issues and solutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">Cannot Log In</h4>
                    <p className="text-sm text-gray-600 mb-2">Login fails with "Invalid credentials"</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Verify email is correct</li>
                      <li>Reset password using "Forgot Password"</li>
                      <li>Check if account is locked (contact admin)</li>
                      <li>Verify MFA code is current (wait for new code)</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">Access Denied</h4>
                    <p className="text-sm text-gray-600 mb-2">"You don't have permission" error</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Check your role assignments</li>
                      <li>Contact your manager to request access</li>
                      <li>Submit an access request through the portal</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">MFA Not Working</h4>
                    <p className="text-sm text-gray-600 mb-2">MFA codes are rejected</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Verify device time is synchronized</li>
                      <li>Wait for a new code (don't reuse old codes)</li>
                      <li>Contact admin to reset MFA</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900">Page Not Loading</h4>
                    <p className="text-sm text-gray-600 mb-2">Blank page or continuous loading</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      <li>Refresh the browser</li>
                      <li>Clear browser cache</li>
                      <li>Try a different browser</li>
                      <li>Check internet connection</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                      <Info className="h-4 w-4" />
                      Getting Help
                    </h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                      <li><strong>Documentation:</strong> Review this knowledge base</li>
                      <li><strong>Support:</strong> Contact your IT administrator</li>
                      <li><strong>Security Issues:</strong> Report immediately to security team</li>
                    </ul>
                  </div>
                  <BackToTOC />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
            <div>
              <strong>CHANGE Platform Admin Portal User Guide</strong> - Version 1.0
            </div>
            <div>
              Last Updated: February 2026
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
