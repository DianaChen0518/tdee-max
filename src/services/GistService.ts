/**
 * Service for interacting with GitHub Gist API for cloud data synchronization.
 */
export interface GistSyncResult {
  success: boolean;
  message: string;
  data?: any;
}

export class GistService {
  private static readonly API_BASE = 'https://api.github.com/gists';
  private static readonly FILENAME = 'tdee-backup.json';

  /**
   * Pushes the current state to a GitHub Gist.
   */
  static async pushToCloud(token: string, gistId: string | null, payload: any): Promise<GistSyncResult> {
    if (!token) return { success: false, message: 'Missing GitHub Token' };

    try {
      const url = gistId ? `${this.API_BASE}/${gistId}` : this.API_BASE;
      const method = gistId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          description: "TDEE Tracker Cloud Backup (Automated)",
          public: false,
          files: {
            [this.FILENAME]: {
              content: JSON.stringify(payload, null, 2)
            }
          }
        })
      });

      if (!res.ok) {
        return { success: false, message: `GitHub API Error: ${res.status} ${res.statusText}` };
      }

      const data = await res.json();
      return { 
        success: true, 
        message: 'Successfully synchronized with GitHub Gist', 
        data: { id: data.id } 
      };
    } catch (error: any) {
      return { success: false, message: `Network Error: ${error.message}` };
    }
  }

  /**
   * Pulls state from a GitHub Gist.
   */
  static async pullFromCloud(token: string, gistId: string): Promise<GistSyncResult> {
    if (!token || !gistId) return { success: false, message: 'Missing credentials' };

    try {
      const res = await fetch(`${this.API_BASE}/${gistId}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        return { success: false, message: `Fetch failed: ${res.status}` };
      }

      const data = await res.json();
      const content = data.files[this.FILENAME]?.content;

      if (!content) {
        return { success: false, message: 'Backup file not found in Gist' };
      }

      return { 
        success: true, 
        message: 'Successfully pulled data from cloud',
        data: JSON.parse(content)
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }
}
