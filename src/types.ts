interface UserListsResponse {
  user: {
    lists: {
      nodes: Array<{
        name: string;
        description: string | null;
        isPrivate: boolean;
        slug: string;
        createdAt: string;
        updatedAt: string;
        items: { totalCount: number };
      }>;
    };
  };
}
