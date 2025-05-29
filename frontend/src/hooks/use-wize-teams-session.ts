import { useState, useEffect, useCallback, useRef } from 'react';
import wizeTeamsService from '../api/wize-teams-client';
import { ITask, IMessageRecord, RunStatus, FunctionsType, IInquiry, TaskStatus } from '../api/wize-teams.types';
import { WIZE_TEAMS_CONFIG } from '../config/teams-config';

interface UseWizeTeamsSessionProps {
  teamId: string;
}

interface UseWizeTeamsSessionResult {
  startSession: (message: string) => Promise<void>;
  continueSession: (sessionId: string, message: string) => Promise<void>;
  continueSessionAfterUserReply: (inquiryId: string, message: string) => Promise<void>;
  sessionId: string | null;
  tasks: ITask[];
  messages: IMessageRecord[];
  sessionResult: any;
  pendingInquiry: IInquiry | null;
  isLoading: boolean;
  isCompleted: boolean;
  isAwaitingUserInput: boolean;
  error: Error | null;
}

// Use the polling interval from config
const POLLING_INTERVAL = WIZE_TEAMS_CONFIG.POLLING_INTERVAL;

export const useWizeTeamsSession = ({ teamId }: UseWizeTeamsSessionProps): UseWizeTeamsSessionResult => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [messages, setMessages] = useState<IMessageRecord[]>([]);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [pendingInquiry, setPendingInquiry] = useState<IInquiry | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAwaitingUserInput, setIsAwaitingUserInput] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Use a ref to keep track of the polling timer for cleanup
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to start a new session
  const startSession = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsCompleted(false);
      setTasks([]);
      setMessages([]);
      
      // Create a new team session using the real service
      const newSessionId = await wizeTeamsService.createTeamSession(teamId, message);
      setSessionId(newSessionId);
      
      // Start polling for results
      const timer = setInterval(() => {
        fetchSessionData(newSessionId);
      }, POLLING_INTERVAL);
      
      setPollingTimer(timer);
      pollingTimerRef.current = timer;
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [teamId]);
  
  // Function to continue an existing session
  const continueSession = useCallback(async (sid: string, message: string) => {
    try {
      setIsLoading(true);
      
      // Continue the team session
      await wizeTeamsService.continueSession(teamId, sid, message);
      
      // If there's no polling timer active, start one
      if (!pollingTimerRef.current) {
        const timer = setInterval(() => {
          fetchSessionData(sid);
        }, POLLING_INTERVAL);
        
        setPollingTimer(timer);
        pollingTimerRef.current = timer;
      }
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [teamId]);

  // Function to fetch session data (tasks and messages)
  const fetchSessionData = useCallback(async (sid: string) => {
    try {
      // Get the team session results
      const results = await wizeTeamsService.getTeamSessionResults(sid);
      
      // Update the tasks
      setTasks(results.results);
      
      // Store the session result
      if (results.status === RunStatus.Complete) {
        console.log('Session is complete, preparing results');
        
        // Get full session information to access teamSession.result
        const teamSession = await wizeTeamsService.getTeamSession(sid);
        console.log('Full teamSession:', teamSession);
        
        // Create result object
        const finalResults: Record<string, any> = {};
        
        // Check if result field exists in teamSession
        if (teamSession && teamSession.result) {
          console.log('Found result in teamSession:', teamSession.result);
          finalResults.result = teamSession.result;
          finalResults.summary = "Task completed successfully";
          finalResults.completedAt = new Date().toISOString();
          
          console.log('Final session result:', finalResults);
          setSessionResult(finalResults);
        } else {
          // If no result in teamSession, use the last message
          console.log('No result in teamSession, using last message');
          const sessionMessages = await wizeTeamsService.getSessionMessages(sid);
          if (sessionMessages && sessionMessages.length > 0) {
            const lastMessage = sessionMessages[sessionMessages.length - 1];
            if (lastMessage && (lastMessage.message || lastMessage.content)) {
              finalResults.result = {
                specification: lastMessage.message || lastMessage.content
              };
              finalResults.summary = "Specification generated successfully";
              finalResults.completedAt = new Date().toISOString();
              
              console.log('Final session result from message:', finalResults);
              setSessionResult(finalResults);
            }
          }
        }
      }
      
      // Check if the session is completed
      if (results.completed || results.status === RunStatus.Complete) {
        setIsCompleted(true);
        setIsAwaitingUserInput(false);
        
        // Clear the polling timer if the session is completed
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          setPollingTimer(null);
          pollingTimerRef.current = null;
        }
      }
      
      // Check if the session is awaiting user input
      if (results.status === RunStatus.AwaitingToolResult) {
        // Проверяем, вызван ли инструмент ASK_USER
        const isAskUserTool = results.toolTypeCalled === FunctionsType.ASK_USER;
        
        // Получаем запросы для сессии
        const inquiries = await wizeTeamsService.getSessionInquiries(sid);
        
        // Ищем запрос, который требует ответа пользователя
        // Запрос должен быть типа ASK_USER и не иметь ответа
        const pendingInquiry = inquiries.find(inquiry => 
          (inquiry.toolType === FunctionsType.ASK_USER || isAskUserTool) && !inquiry.response
        );
        
        if (pendingInquiry) {
          // Нашли запрос, требующий ответа пользователя
          setPendingInquiry(pendingInquiry);
          setIsAwaitingUserInput(true);
          console.log('Awaiting user input for inquiry:', pendingInquiry);
        } else {
          // Запросов, требующих ответа пользователя, нет
          setPendingInquiry(null);
          setIsAwaitingUserInput(false);
        }
      } else {
        // Сессия не ожидает результата инструмента
        setPendingInquiry(null);
        setIsAwaitingUserInput(false);
      }
      
      // Get the session messages
      const sessionMessages = await wizeTeamsService.getSessionMessages(sid);
      setMessages(sessionMessages);
      
      // Set loading to false once we have the data
      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, []);

  // Function to continue a session after user reply to inquiry
  const continueSessionAfterUserReply = useCallback(async (inquiryId: string, message: string) => {
    try {
      setIsLoading(true);
      
      // Update the inquiry response
      await wizeTeamsService.continueSessionAfterUserReply(inquiryId, message);
      
      // Clear the pending inquiry
      setPendingInquiry(null);
      setIsAwaitingUserInput(false);
      
      // If there's no polling timer active, start one
      if (!pollingTimerRef.current && sessionId) {
        const timer = setInterval(() => {
          fetchSessionData(sessionId);
        }, POLLING_INTERVAL);
        
        setPollingTimer(timer);
        pollingTimerRef.current = timer;
      }
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [sessionId, fetchSessionData]);

  return {
    startSession,
    continueSession,
    continueSessionAfterUserReply,
    sessionId,
    tasks,
    messages,
    sessionResult,
    pendingInquiry,
    isLoading,
    isCompleted,
    isAwaitingUserInput,
    error
  };
};

export default useWizeTeamsSession;
