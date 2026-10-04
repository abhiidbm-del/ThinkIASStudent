export interface SyllabusItem {
  fileLink: string;
  fileName: string;
  description: string;
}

export interface SyllabusPayload {
  [key: string]: SyllabusItem;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}