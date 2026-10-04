export interface Tag {
  _id: string;
  tag: string;
}

export interface TagResponse {
  success: boolean;
  message: string;
  data?: Tag | Tag[];
}