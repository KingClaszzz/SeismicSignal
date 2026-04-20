export interface Project {
  id: string | number;
  name: string;
  description: string;
  category?: string;
  url?: string;
  imageUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  forumUrl?: string;
  tags?: string[];
  featured?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  upvotes?: number;
  downvotes?: number;
  netScore?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
