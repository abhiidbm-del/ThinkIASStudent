export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  type?: string;
}

export interface MenuItem {
  name: string;
  path: string;
  icon: string;
  children?: MenuItem[];
}

export interface AuthResponse {
  token: string;
  user: User;
  menuItems: MenuItem[];
}

export interface SyllabusItem {
  fileLink?: string;
  fileName?: string;
  description?: string;
  [key: string]: any; // For nested folders
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}
