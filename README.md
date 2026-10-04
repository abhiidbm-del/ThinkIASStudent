# ThinkCivil Student Portal

The student-facing Angular application for ThinkCivil IAS Academy. It provides public program discovery and authenticated learning workflows for students preparing for civil services examinations.

## Features

- Public homepage, program catalog, program FAQs, careers, and integrated program pages
- Account registration, login, password recovery, and authenticated session handling
- Student dashboard, profile, study materials, meetings, and notifications
- Prelims and mains test series, demo tests, live tests, fullscreen test-taking, and proctoring support
- Test results, result details, answer writing, evaluation, quizzes, and module tests
- Role-protected administration views for student management, questions, syllabus, tags, and exam monitoring
- Lazy-loaded Angular routes with authentication and role guards
- Angular Material, Bootstrap, Swiper, Chart.js, Firebase, and PDF support

## Technology

- Angular 19
- TypeScript 5.7
- Angular Router, Reactive Forms, HTTP client, and Angular Material
- RxJS, Bootstrap 5, Bootstrap Icons, AOS, Swiper, Chart.js, and Moment
- Karma and Jasmine for unit tests

## Requirements

- Node.js compatible with Angular 19
- npm
- A running ThinkCivil backend; see the workspace README for backend setup and environment variables

## Installation

From this directory:

```bash
npm install
```

Configure the API URL and other client settings in `src/environment/` for the target environment. Do not commit credentials or private Firebase configuration.

## Development

```bash
npm start
```

Open `http://localhost:4200/`. The development server reloads the application when source files change.

## Build and test

```bash
npm run build
npm test
```

The production build is written to `dist/thinkcivil-frontend/`. Use `npm run watch` for a development watch build.

## Project structure

```text
src/app/
	core/       Guards, interceptors, models, and shared services
	modules/    Feature areas such as auth, homepage, dashboard, tests, results, and mains
	shared/     Reusable components, pipes, translations, and services
```

Routes are defined in `src/app/app.routes.ts`. Authenticated and role-specific routes use `authGuard` and `roleGuard`; test-taking routes may also use `TestGuard`.

## Related applications

- `../admin-portal`: Angular administration portal for managing ThinkCivil content and operations
- `../bytestech.online`: Express and MongoDB backend API used by both portals

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server |
| `npm run build` | Create a production build |
| `npm run watch` | Build continuously in development mode |
| `npm test` | Run unit tests |
| `npm run ng -- generate component name` | Generate an Angular component |

For Angular CLI documentation, see the [Angular CLI guide](https://angular.dev/tools/cli).
