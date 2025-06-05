import { TeamsApiClient } from './teams-api-client';
import { getSessionToken } from './session-token';
import {
  ITeamSession,
  IMessageRecord,
  ITeamSessionFrame,
  TeamChatStreamHandler,
  ITask,
  RunStatus,
  FunctionsType,
  IInquiry
} from './wize-teams.types';

// Mapping type for task results
export interface TeamSessionResults {
  results: ITask[];
  status: RunStatus;
  completed: boolean;
  toolTypeCalled?: FunctionsType;
}

// Create an instance of the TeamsApiClient
const teamsApiClient = new TeamsApiClient();

// API functions wrapper
export const wizeTeamsService = {
  /**
   * Create a new team session
   * @param teamId The ID of the team to create a session for
   * @param message The initial message to send to the team
   * @returns The ID of the created session
   */
  async createTeamSession(teamId: string, message: string): Promise<string> {
    try {
      const response = await teamsApiClient.startNewSession(message, teamId);

      // The response should include the team session ID
      return response.teamSession.id;
    } catch (error) {
      console.error('Error creating team session:', error);
      throw error;
    }
  },

  /**
   * Continue an existing session with a new user message
   * @param teamId The ID of the team
   * @param sessionId The ID of the session to continue
   * @param message The message to send to the team
   */
  async continueSession(teamId: string, sessionId: string, message: string): Promise<void> {
    try {
      await teamsApiClient.continueSession(teamId, sessionId, message);
    } catch (error) {
      console.error('Error continuing team session:', error);
      throw error;
    }
  },

  // Get the full team session data
  getTeamSession: async (teamSessionId: string): Promise<ITeamSession> => {
    try {
      return await teamsApiClient.getTeamSession(teamSessionId);
    } catch (error) {
      console.error('Error getting team session:', error);
      throw error;
    }
  },

  // Get results from a team session
  getTeamSessionResults: async (teamSessionId: string): Promise<ITeamSession> => {
    try {
      // Just return the full team session directly
      return await teamsApiClient.getTeamSession(teamSessionId);
    } catch (error) {
      console.error('Error getting team session results:', error);
      throw error;
    }
  },

  // Get session messages - API call removed as requested
  getSessionMessages: async (sessionId: string): Promise<{ messages: IMessageRecord[]; totalCount: number }> => {
    try {
      const { messages, totalCount } = await teamsApiClient.getSessionMessages(sessionId, 'user');
      return { messages, totalCount };
    } catch (error) {
      console.error('Error getting session messages:', error);
      return { messages: [], totalCount: 0 };
    }
  },
  
  // Get debug messages for a session
  getSessionDebugMessages: async (sessionId: string): Promise<{ messages: IMessageRecord[]; totalCount: number }> => {
    try {
      const { messages, totalCount } = await teamsApiClient.getSessionDebugMessages(sessionId);
      return { messages, totalCount };
    } catch (error) {
      console.error('Error getting session debug messages:', error);
      return { messages: [], totalCount: 0 };
    }
  },

  // Get inquiries for a session
  getSessionInquiries: async (sessionId: string): Promise<IInquiry[]> => {
    try {
      return await teamsApiClient.getInquiriesBySessionId(sessionId);
    } catch (error) {
      console.error('Error getting session inquiries:', error);
      throw error;
    }
  },

  // Update an inquiry response
  updateInquiryResponse: async (inquiryId: string, response: string): Promise<IInquiry> => {
    try {
      return await teamsApiClient.updateInquiryResponse(inquiryId, response);
    } catch (error) {
      console.error('Error updating inquiry response:', error);
      throw error;
    }
  },

  // Continue session after user reply to inquiry
  continueSessionAfterUserReply: async (inquiryId: string, message: string): Promise<void> => {
    try {
      await teamsApiClient.updateInquiryResponse(inquiryId, message);
      console.log('Inquiry response updated. Session will continue shortly.');
    } catch (error) {
      console.error('Error continuing session after user reply:', error);
      throw error;
    }
  },



  // Stop a team session
  stopSession: async (sessionId: string): Promise<void> => {
    try {
      await teamsApiClient.stopTeamChat(sessionId);
    } catch (error) {
      console.error('Error stopping team session:', error);
      throw error;
    }
  }
};

export default wizeTeamsService;
