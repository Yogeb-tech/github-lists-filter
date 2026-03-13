export interface GithubList {
  name: string;
  description: string | null;
  isPrivate: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
  items: {
    totalCount: number;
  };
}

export interface UserListsResponse {
  viewer: {
    lists: {
      nodes: Array<{
        name: string;
        description: string | null;
        createdAt: string;
        updatedAt: string;
        items: {
          totalCount: number;
        };
      }>;
    };
  };
}

export interface ProjectLogger {
  debug(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}
