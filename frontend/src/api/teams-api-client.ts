import type { AxiosInstance } from "axios";
import axios from "axios";
// @ts-ignore
import { getSessionToken } from "./session-token";
import { displayErrorToast } from "../utils/custom-toast-handlers";
import {
  ITeam,
  ITeamSession,
  IMessageRecord,
  ITeamSessionFrame,
  TeamChatStreamHandler,
  IAIAgentsSession,
  FileWithUrl,
  IInquiry
} from "./wize-teams.types";
import WIZE_TEAMS_CONFIG from "#/config/teams-config";

// Additional types not covered in wize-teams.types.ts

export interface IAIAgent {
  id: string;
  type: string;
  [key: string]: any;
}

export interface IModel {
  id: string;
  name: string;
  provider: string;
  [key: string]: any;
}

export interface IFunction {
  name: string;
  description: string;
  parameters: any;
  [key: string]: any;
}

export const defaultPage = { skip: 0, limit: 30 };

export class TeamsApiClient {
  private httpClient: AxiosInstance;
  private readonly backendBaseUrl: string = WIZE_TEAMS_CONFIG.API_BASE_URL;

  constructor() {
    this.httpClient = axios.create({
      baseURL: this.backendBaseUrl,
    });
  }

  private setToken(): void {
    const session_token = getSessionToken();
    if (!session_token) {
      displayErrorToast("rf Authentication token is missing. Please sign in again.");
      throw "no token error";
    }

    this.httpClient.interceptors.request.use(config => {
      config.headers.set("Authorization", `Bearer ${session_token}`);
      return config;
    });

    this.httpClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.data?.code === "auth/insufficient-rights") {
          console.error("Authentication error: insufficient rights");
          return;
        }

        throw error;
      },
    );
  }

  public async startNewSession(
    message: string,
    teamId: string,
    imageUrls?: string[],
    files?: FileWithUrl[],
  ): Promise<{ teamSession: ITeamSession; messages: IMessageRecord[] }> {
    this.setToken();
    // Using the no-wait endpoint explicitly
    const { data } = await this.httpClient.post(`/team-run-no-wait/${teamId}`, {
      message,
      imageUrls,
      files,
    });
    return data;
  }

  public async continueSession(
    teamId: string,
    sessionId: string,
    message: string,
  ): Promise<{ teamSession: ITeamSession; messages: IMessageRecord[] }> {
    this.setToken();
    const { data } = await this.httpClient.post(`/team-continue-no-wait/${teamId}/${sessionId}`, {
      message,
    });
    return data;
  }

  public async stopTeamChat(teamSessionId: string): Promise<ITeamSession> {
    this.setToken();
    const { data } = await this.httpClient.post(`/teams/sessions/${teamSessionId}/stop`);
    return data;
  }

  public async getTeamSession(id: string): Promise<ITeamSession> {
    this.setToken();
    const { data } = await this.httpClient.get(`/team-run-results/${id}`);
    return data.teamSession;
  }

  public async getSessionMessages(
    sessionId: string,
    userId: string,
    skip = 0,
    limit = 500,
  ): Promise<{ messages: IMessageRecord[]; totalCount: number }> {
    this.setToken();

    const { data, headers } = await this.httpClient.get(`/sessions/${sessionId}/messages`, {
      params: {
        userId,
        skip,
        limit,
      },
    });
    return { messages: data, totalCount: Number.parseInt(headers["x-total-count"]) };
  }

  /**
   * Get debug messages for a session
   * @param sessionId The ID of the session
   * @param skip Number of messages to skip
   * @param limit Maximum number of messages to return
   * @returns Object containing debug messages and total count
   */
  public async getSessionDebugMessages(
    sessionId: string,
    skip = 0,
    limit = 500,
  ): Promise<{ messages: IMessageRecord[]; totalCount: number }> {
    this.setToken();

    const { data, headers } = await this.httpClient.get(`/sessions/${sessionId}/messages/debug`, {
      params: {
        skip,
        limit,
      },
    });
    return { messages: data, totalCount: Number.parseInt(headers["x-total-count"]) };
  }

  /**
   * Get inquiries for a session
   * @param sessionId The ID of the session
   * @returns Array of inquiries
   */
  public async getInquiriesBySessionId(sessionId: string): Promise<IInquiry[]> {
    this.setToken();
    const { data } = await this.httpClient.get(`/inquiries/session/${sessionId}`);
    return data;
  }

  /**
   * Update an inquiry response
   * @param inquiryId The ID of the inquiry
   * @param responseContent The response content
   * @returns The updated inquiry
   */
  public async updateInquiryResponse(inquiryId: string, responseContent: string): Promise<IInquiry> {
    this.setToken();
    const { data } = await this.httpClient.put(`/inquiries/${inquiryId}/response`, {
      response: responseContent,
    });
    return data;
  }
}
