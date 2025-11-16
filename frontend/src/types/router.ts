/**
 * Router type definitions
 */

import type { ReactNode } from 'react';

// Route configuration
export interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
  meta?: RouteMeta;
}

// Route metadata
export interface RouteMeta {
  title?: string;
  icon?: ReactNode;
  auth?: string[]; // Required permissions
  roles?: string[]; // Required roles
  hidden?: boolean;
  breadcrumb?: boolean;
}

// Navigation item
export interface NavItem {
  title: string;
  path?: string;
  icon?: ReactNode;
  children?: NavItem[];
  info?: ReactNode;
  caption?: string;
  auth?: string[];
  roles?: string[];
  disabled?: boolean;
}

// Navigation group
export interface NavGroup {
  name: string;
  items: NavItem[];
}

// Breadcrumb item
export interface BreadcrumbItem {
  title: string;
  path?: string;
}
