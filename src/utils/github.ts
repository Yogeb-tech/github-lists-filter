// ~/lib/github.ts
import { graphql } from "@hk/github-graphql/gql";
import { Octokit } from "octokit";

export class GitHubService {
  private octokit: Octokit;
  private token: string;

  constructor(token: string) {
    this.token = token;
    // Initialize the main Octokit client - handles both REST and GraphQL [citation:5]
    this.octokit = new Octokit({
      auth: token,
      // Optional: Set a custom user agent for your extension [citation:3][citation:5]
      userAgent: "my-github-lists-extension/v1.0.0",
    });
  }

  // REST API example - simple and straightforward [citation:2]
  async getStarredRepos(username: string) {
    try {
      // Using the REST API via octokit.rest [citation:3][citation:7]
      const response = await this.octokit.rest.activity.listReposStarredByUser({
        username,
        per_page: 30,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching starred repos:", error);
      throw error;
    }
  }

  async getUserLists(username: string) {
    try {
      const query = `
      query($login: String!) {
        user(login: $login) {
          lists(first: 10) {
            nodes {
              name
              description
              isPrivate
              slug
              createdAt
              updatedAt
              items {
                totalCount
              }
            }
          }
        }
      }
    `;

      const response = (await graphql(query)) as UserListsResponse;

      return response.user.lists.nodes;
    } catch (error) {
      console.error("Error fetching user lists:", error);
      throw error;
    }
  }
}

// Factory function to create the service with a token from storage
export async function createGitHubService(): Promise<GitHubService | null> {
  const result = await browser.storage.sync.get(["githubToken"]);
  const githubToken = result.githubToken; // This is a string or undefined

  if (!githubToken || typeof githubToken !== "string") {
    console.warn("No GitHub token found");
    return null;
  }

  return new GitHubService(githubToken);
}
