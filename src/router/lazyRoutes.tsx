import React, { lazy, Suspense } from 'react';

import routeData from '../data/routeData.json';

import type { RouteObject } from 'react-router-dom';

type RouteConfig = {
  readonly path: string;
  readonly element: string;
  readonly import: string;
};

// Fallback component to show while loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-pulse">
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mx-auto mb-4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto"></div>
    </div>
  </div>
);

// Wrap the lazy-loaded component with Suspense
const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

// Static import map to avoid webpack dynamic import warnings
const componentImports = {
  // Home pages
  '../pages/Home/Home': () => import('../pages/Home/Home'),
  '../pages/IndexTwo': () => import('../pages/IndexTwo'),

  // Main pages
  '../pages/AboutUs/AboutUs': () => import('../pages/AboutUs/AboutUs'),
  '../pages/ContactUs/ContactUs': () => import('../pages/ContactUs/ContactUs'),
  '../pages/InstructorsPage': () => import('../pages/InstructorsPage'),
  '../pages/PricingPage': () => import('../pages/PricingPage'),
  '../pages/FeaturesPage/FeaturesPage': () => import('../pages/FeaturesPage/FeaturesPage'),
  '../pages/FaqsPage': () => import('../pages/FaqsPage'),
  '../pages/FavoritesPage': () => import('../pages/FavoritesPage'),

  // Auth pages
  '../pages/auth/ForgotPassword': () => import('../pages/auth/ForgotPassword'),
  '../pages/auth/Signup': () => import('../pages/auth/Signup'),
  '../pages/auth/Login': () => import('../pages/auth/Login'),

  // Course pages
  '../pages/courses/GridPage': () => import('../pages/courses/GridPage'),
  '../pages/courses/ListPage': () => import('../pages/courses/ListPage'),
  '../pages/courses/CoursesSearch': () => import('../pages/courses/CoursesSearch'),
  '../pages/courses/CourseDetail': () => import('../pages/courses/CourseDetail'),
  '../pages/courses/CourseDetailTwo': () => import('../pages/courses/CourseDetailTwo'),
  '../pages/courses/CourseReviewPage': () => import('../pages/courses/CourseReviewPage'),
  '../pages/courses/CourseProgressPage': () => import('../pages/courses/CourseProgressPage'),
  '../pages/courses/YoutubeListing': () => import('../pages/courses/YoutubeListing'),
  '../pages/courses/VideoListing': () => import('../pages/courses/VideoListing'),

  // Blog pages
  '../pages/blog/Blogs': () => import('../pages/blog/Blogs'),
  '../pages/blog/BlogDetail': () => import('../pages/blog/BlogDetail'),
  '../pages/blog/BlogSidebar': () => import('../pages/blog/BlogSidebar'),

  // Special pages
  '../pages/special/ErrorPage': () => import('../pages/special/ErrorPage'),
  '../pages/special/ComingSoonPage': () => import('../pages/special/ComingSoonPage'),
  '../pages/special/MaintenancePage': () => import('../pages/special/MaintenancePage'),

  // Utility pages
  '../pages/utility/PrivacyPage': () => import('../pages/utility/PrivacyPage'),
  '../pages/utility/TermsPage': () => import('../pages/utility/TermsPage'),
};

// Safe component loader with fallback
const loadComponent = (importPath: string, elementName: string) => {
  const importFn = componentImports[importPath as keyof typeof componentImports];

  if (!importFn) {
    console.warn(`No import function found for path: ${importPath}`);
    // Fallback to error page
    return lazy(() =>
      import('../pages/special/ErrorPage').then((module) => ({
        default: module.ErrorPage
      }))
    );
  }

  return lazy(() =>
    importFn()
      .then((module) => ({
        default: module[elementName as keyof typeof module] || module.default
      }))
      .catch((error) => {
        console.error(`Failed to load component ${elementName} from ${importPath}:`, error);
        return import('../pages/special/ErrorPage').then((module) => ({
          default: module.ErrorPage
        }));
      })
  );
};

// Generate routes dynamically from JSON data
export const lazyRoutes: RouteObject[] = (routeData as readonly RouteConfig[]).map((route) => {
  const Component = loadComponent(route.import, route.element);

  return {
    path: route.path,
    element: withSuspense(Component)
  };
});