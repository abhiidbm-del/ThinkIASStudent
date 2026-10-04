// src/app/shared/interfaces/directory.interface.ts
export interface DirectoryItem {
  _id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  fullPath: string;
  parent: string | null;
  fileLink?: string;        // For files only
  description?: string;     // For files only
  fileType?: string;        // For files only
  children?: DirectoryItem[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface CreateFileRequest {
  name: string;
  parentId?: string | null;
  fileLink: string;
  description?: string;
}

export interface UpdateFileRequest {
  name?: string;
  fileLink?: string;
  description?: string;
}

export interface RenameRequest {
  newName: string;
}

export interface DirectoryTreeResponse {
  message: string;
  items: DirectoryItem[];
}

export interface DirectoryResponse {
  message: string;
  item: DirectoryItem;
}

export interface SearchResponse {
  message: string;
  files: DirectoryItem[];
}