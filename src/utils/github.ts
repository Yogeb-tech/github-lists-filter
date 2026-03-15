import type { GithubList } from "@/types/types";
import { createLogger } from "@/utils/logger";
import { Octokit } from "@octokit/rest";
import { browser } from "wxt/browser";

// Global Instance
let githubInstance: GitHubService | null = null;
const logger = createLogger("github.ts");

export class GitHubService {
  private octokit: Octokit;
  private token: string;

  constructor(token: string) {
    this.token = token;
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getStarredRepos() {
    try {
      const response =
        await this.octokit.rest.activity.listReposStarredByAuthenticatedUser({
          per_page: 30,
        });
      return response.data;
    } catch (error) {
      logger.error("Error fetching starred repos:", error);
      throw error;
    }
  }

  async getUserLists(): Promise<GithubList[]> {
    logger.debug("Github: Fetching lists");
    try {
      const query = `
      query {
        viewer {
          lists(first: 32) {
            nodes {
              id
              name
              description
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

      const response = await this.octokit.graphql<{
        viewer: { lists: { nodes: any[] } };
      }>(query);

      return response.viewer.lists.nodes.map(
        (node): GithubList => ({
          id: node.id, // ✅ include ID
          name: node.name,
          description: node.description,
          createdAt: node.createdAt,
          updatedAt: node.updatedAt,
          items: {
            totalCount: node.items.totalCount,
          },
          isPrivate: false,
          slug: node.name.toLowerCase().replace(/\s+/g, "-"),
        }),
      );
    } catch (error) {
      logger.error("Error fetching user lists:", error);
      throw error;
    }
  }

  async getListRepos(listId: string): Promise<string[]> {
    logger.debug(`Github: Fetching repos for list ID "${listId}"`);
    try {
      const query = `
      query($listId: ID!) {
        node(id: $listId) {
          ... on UserList {
            items(first: 100) {
              nodes {
                ... on Repository {
                  nameWithOwner
                }
              }
            }
          }
        }
      }
    `;

      const response = await this.octokit.graphql<{
        node: {
          items: {
            nodes: { nameWithOwner: string }[];
          };
        };
      }>(query, { listId });

      const repos = response.node.items.nodes.map((node) => node.nameWithOwner);
      logger.debug(`Found ${repos.length} repos in list`);
      return repos;
    } catch (error) {
      logger.error(`Error fetching repos for list:`, error);
      return [];
    }
  }

  async getUser(): Promise<{ login: string }> {
    logger.debug("Github: Fetching username");
    const response = await this.octokit.users.getAuthenticated();
    return response.data;
  }

  public getOctokit(): Octokit {
    logger.debug("Github: Fetching Octokit");
    return this.octokit;
  }
}

// Factory function to create the service with a token from storage
export async function getGitHubService(): Promise<GitHubService | null> {
  if (githubInstance) {
    return githubInstance;
  }

  logger.debug("createGitHubService: Attempting to get token from storage");

  const result = await browser.storage.sync.get(["githubToken"]);
  logger.debug("createGitHubService: Storage result:", result);

  const githubToken = result.githubToken;

  if (!githubToken || typeof githubToken !== "string") {
    logger.warn("No GitHub token found in storage");
    return null;
  }

  logger.debug("GitHub token found, creating service");
  githubInstance = new GitHubService(githubToken);
  return githubInstance;
}

export function clearGithubInstance() {
  githubInstance = null;
}
