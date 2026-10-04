import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { PageNotFoundComponent } from './shared/components/page-not-found/page-not-found.component';
import { ResourcesViewComponent } from './shared/components/resources-view/resources-view.component';
import { TestGuard } from './core/guards/test.guard';
import { FreeQuizComponent } from './modules/free-quiz/free-quiz.component';
import { ProgramBatchesComponent } from './modules/homepage/program/program-batches/program-batches.component';

export const routes: Routes = [
  {path:'program-faqs',loadComponent:()=>import('./modules/homepage/program-faqs/program-faqs.component').then(m=>m.ProgramFaqsComponent)},
  {path:'terms',loadComponent:()=>import('./shared/components/legal-policy/legal-policy.component').then(m=>m.LegalPolicyComponent),data:{policy:'terms'}},
  {path:'payment-policies',loadComponent:()=>import('./shared/components/legal-policy/legal-policy.component').then(m=>m.LegalPolicyComponent),data:{policy:'payments'}},
  {path:'programs',loadComponent:()=>import('./modules/homepage/program-catalog/program-catalog.component').then(m=>m.ProgramCatalogComponent)},
  {path: 'prelims-test-series', loadComponent: () => import('./shared/components/test-series-schedule/test-series-schedule.component').then(m => m.TestSeriesScheduleComponent), canActivate: [authGuard, roleGuard], data: {role: 'student', kind: 'pre'}},
  {path: 'mains-test-series', loadComponent: () => import('./shared/components/test-series-schedule/test-series-schedule.component').then(m => m.TestSeriesScheduleComponent), canActivate: [authGuard, roleGuard], data: {role: 'student', kind: 'mains'}},
  {
    path: '',
    loadComponent: () => import('./modules/homepage/homepage.component').then(m => m.HomepageComponent)
  },
  { 
    path: 'landing-page', 
    loadComponent: () => import('./modules/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  { 
    path: 'homepage', 
    redirectTo: '',
    pathMatch: 'full'
  },
  { 
    path: 'integrated-program', 
    loadComponent: () => import('./modules/homepage/integrated-program/integrated-program.component').then(m => m.IntegratedProgramComponent)
  },
  { 
    path: 'login', 
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent),
    
  },
  { 
    path: 'register', 
    loadComponent: () => import('./modules/auth/register/register.component').then(m => m.RegisterComponent)
  },
  { 
    path: 'forgot-password', 
    loadComponent: () => import('./modules/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'prelims-tests', 
    loadComponent: () => import('./modules/tests/live-tests/live-tests.component').then(m => m.LiveTestsComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'manage-tests', 
    loadComponent: () => import('./modules/tests/live-tests/live-tests.component').then(m => m.LiveTestsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'take-test/:id', 
    loadComponent: () => import('./modules/tests/take-test/take-test.component').then(m => m.TakeTestComponent),
    canActivate: [authGuard, roleGuard, TestGuard], // Add test-specific guards
    data: { role: 'student', requiresFullscreen: true }
  },
  { 
    path: 'prelims-results', 
    loadComponent: () => import('./modules/results/results/results.component').then(m => m.ResultsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  { 
    path: 'admin-results', 
    loadComponent: () => import('./modules/results/admin-results/admin-results.component').then(m => m.AdminResultsComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'result-detail/:id', 
    loadComponent: () => import('./modules/results/result-detail/result-detail.component').then(m => m.ResultDetailComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'students-list', 
    loadComponent: () => import('./modules/admin/students-list/students-list.component').then(m => m.StudentsListComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  // {
  //   path: 'exam-monitoring',
  //   loadComponent: () => import('./modules/admin/exam-monitoring/exam-monitoring.component').then(m => m.ExamMonitoringComponent),
  //   canActivate: [authGuard, roleGuard],
  //   data: { role: 'admin' }
  // },
    { path: 'view/:type', component: ResourcesViewComponent }, 
    { 
    path: 'syllabus-master', 
    loadComponent: () => import('./modules/admin/syllabus-master/syllabus-master.component').then(m => m.SyllabusMasterComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' }
  },
  { 
  path: 'tag-master', 
  loadComponent: () => import('./modules/admin/tag-master/tag-master.component').then(m => m.TagMasterComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'questions-master', 
  loadComponent: () => import('./modules/admin/questions-master/questions-master.component').then(m => m.QuestionsMasterComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'admin' }
  },
  {
  path: 'pre-materials', 
  loadComponent: () => import('./modules/materials/materials.component').then(m => m.MaterialsComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'student' }
  },
  {path: 'pre-session', loadComponent: () => import('./modules/meeting/meeting.component').then(m => m.MeetingComponent), canActivate: [authGuard, roleGuard], data: { role: 'student', audience: 'pre' }},
  {path: 'mains-session', loadComponent: () => import('./modules/meeting/meeting.component').then(m => m.MeetingComponent), canActivate: [authGuard, roleGuard], data: { role: 'student', audience: 'mains' }},
  {path: 'support-tickets', loadComponent: () => import('./modules/support/support-tickets.component').then(m => m.SupportTicketsComponent), canActivate: [authGuard]},
  {
  path: 'my-profile', 
  loadComponent: () => import('./modules/dashboard/my-profile/my-profile.component').then(m => m.MyProfileComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'student' }
  },
      { path: 'free-quiz', component: FreeQuizComponent }, 
          { 
    path: 'demo-tests', 
    loadComponent: () => import('./modules/tests/demo-test/demo-test.component').then(m => m.DemoTestComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' }
  },
  { 
    path: 'take-demo-test/:id', 
    loadComponent: () => import('./modules/tests/demo-test/take-demo-test/take-demo-test.component').then(m => m.TakeDemoTestComponent),
    canActivate: [authGuard, roleGuard, TestGuard],
    data: { role: 'student', requiresFullscreen: true }
  },
  { 
    path: 'demo-results/:id', 
    loadComponent: () => import('./modules/results/result-detail/result-detail.component').then(m => m.ResultDetailComponent),
    canActivate: [authGuard],
    data: { testType: 'demo' }
  },

  {
  path: 'careers-page', 
  loadComponent: () => import('./modules/homepage/careers-page/careers-page.component').then(m => m.CareersPageComponent),
  // canActivate: [authGuard, roleGuard],
  // data: { role: 'student' }
  },

    { path: 'program/:id', component: ProgramBatchesComponent },

    {
  path: 'student-answer-writing', 
  loadComponent: () => import('./modules/mains/student-answer-writing/student-answer-writing.component').then(m => m.StudentAnswerWritingComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'student' }
  },

  // app.routes.ts
{
  path: 'module-test/:id/:name',
  loadComponent: () => import('./modules/homepage/studymaterial-slider/module-test/module-test.component').then(m => m.ModuleTestComponent),
  title: 'Module Test'
},

{
  path: 'live-test', 
  loadComponent: () => import('./modules/mains/live-test/live-test.component').then(m => m.LiveTestComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'student' }
  },

  {
  path: 'mains-results', 
  loadComponent: () => import('./modules/mains/daw-evaluation/daw-evaluation.component').then(m => m.DawEvaluationComponent),
  canActivate: [authGuard, roleGuard],
  data: { role: 'student' }
  },

  { path: '**', component: PageNotFoundComponent }
];
