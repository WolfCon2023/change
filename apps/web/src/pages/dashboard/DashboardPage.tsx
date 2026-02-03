import { Building2, ClipboardList, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserRole, WorkflowPhase } from '@change/shared';

// Phase 1 workflow steps
const workflowSteps = [
  {
    phase: WorkflowPhase.INTAKE,
    title: 'Business Profile',
    description: 'Complete your business information',
    icon: Building2,
    href: '/business-profile',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    phase: WorkflowPhase.ENROLLMENT,
    title: 'Program Enrollment',
    description: 'Enroll in a C.H.A.N.G.E. cohort',
    icon: GraduationCap,
    href: '/enrollment',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    phase: WorkflowPhase.FORMATION,
    title: 'Formation Wizard',
    description: 'Complete SOS & EIN tasks',
    icon: ClipboardList,
    href: '/formation',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    phase: WorkflowPhase.DOCUMENTS,
    title: 'Documents',
    description: 'Generate business documents',
    icon: FileText,
    href: '/documents',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
];

export function DashboardPage() {
  const { user } = useAuthStore();

  const isAdvisor = user?.role && (
    user.role === UserRole.ADVISOR ||
    user.role === UserRole.PROGRAM_ADMIN ||
    user.role === UserRole.SYSTEM_ADMIN
  );

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdvisor
            ? 'Here is an overview of your clients and their progress.'
            : 'Continue your business formation journey.'}
        </p>
      </div>

      {/* Quick stats for clients */}
      {!isAdvisor && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Phase</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Intake</div>
              <p className="text-xs text-muted-foreground">Business profile setup</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Completion</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No pending tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Generated documents</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow steps for clients */}
      {!isAdvisor && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Formation Journey</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={step.phase} className="relative overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${step.bgColor}`}>
                        <Icon className={`h-6 w-6 ${step.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            STEP {index + 1}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{step.description}</CardDescription>
                    <Link to={step.href}>
                      <Button variant="outline" className="w-full group">
                        {index === 0 ? 'Get Started' : 'View'}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Advisor dashboard summary */}
      {isAdvisor && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                No recent activity to display
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
