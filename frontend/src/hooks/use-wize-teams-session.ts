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
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<IMessageRecord[]>([]);
  const [sessionResult, setSessionResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [pendingInquiry, setPendingInquiry] = useState<IInquiry | null>(null);
  const [isAwaitingUserInput, setIsAwaitingUserInput] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  // Track processed inquiries to avoid duplicates
  const [processedInquiryIds, setProcessedInquiryIds] = useState<Set<string>>(new Set());
  
  // Track previous tasks state to detect status changes
  const previousTasksRef = useRef<ITask[]>([]);

  // Use a ref to keep track of the polling timer for cleanup
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup effect to clear the polling timer when the component unmounts
  useEffect(() => {
    return () => {
      // Clear the polling timer when the component unmounts
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, []);

  // Function to start a new session
  const startSession = useCallback(async (message: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsCompleted(false);
      setTasks([]);
      setMessages([]);
      // Clear processed inquiry IDs for a new session
      setProcessedInquiryIds(new Set());

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

      // Add the user's message to the messages array to preserve it in the chat history
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `user-${Date.now()}`,
          userId: 'user',
          sessionId: sid,
          sender: 'user',
          message: message,
          agentId: '',
          finishReason: '',
          created: new Date(),
          updated: new Date(),
          variables: {}
        }
      ]);

      // Continue the team session
      await wizeTeamsService.continueSession(teamId, sid, message);

      // Immediately fetch session data to update the conversation
      fetchSessionData(sid);

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
      // Get the team session results - now returns the full team session directly
      const teamSession = await wizeTeamsService.getTeamSessionResults(sid);
      console.log('Team session:', teamSession);

      // Update the tasks
      const newTasks = teamSession.backlog || [];
      
      // Check for tasks that changed status to in_progress or done
      const previousTasks = previousTasksRef.current;
      newTasks.forEach(newTask => {
        // Find the corresponding task in the previous state
        const prevTask = previousTasks.find(pt => pt.id === newTask.id);
        
        // If task status changed to in_progress, add a message to the chat
        if (newTask.status === TaskStatus.InProgress && 
            (!prevTask || prevTask.status !== TaskStatus.InProgress)) {
          // Create a message that conforms to IMessageRecord type
          const taskStartedMessage: IMessageRecord = {
            id: `task-${newTask.id}-started-${Date.now()}`,
            userId: teamSession.userId || '',
            sessionId: sid,
            sender: 'system',
            message: `Task started: ${newTask.title}`,
            agentId: '',  // Empty string as it's a system message
            finishReason: '',
            created: new Date(),
            updated: new Date(),
            variables: {},
            type: 'notification'
          };
          
          // Add the message to the chat
          setMessages(prevMessages => [...prevMessages, taskStartedMessage]);
        }
        
        // If task status changed to done (completed), add a message to the chat with the task result
        if (newTask.status === TaskStatus.Done && 
            (!prevTask || prevTask.status !== TaskStatus.Done)) {
          // Format the task result for display
          let formattedResult = '';
          
          // Check if the task has a result
          if (newTask.result) {
            if (typeof newTask.result === 'object') {
              // Format object result as JSON
              formattedResult = JSON.stringify(newTask.result, null, 2);
            } else {
              // Use result as is if it's a string or convert to string otherwise
              formattedResult = String(newTask.result);
            }
          } else {
            formattedResult = 'No detailed result available';
          }
          
          // Create a message that conforms to IMessageRecord type
          const taskCompletedMessage: IMessageRecord = {
            id: `task-${newTask.id}-completed-${Date.now()}`,
            userId: teamSession.userId || '',
            sessionId: sid,
            sender: 'system',
            message: `Task completed: ${newTask.title}\n\n${formattedResult}`,
            agentId: '',  // Empty string as it's a system message
            finishReason: '',
            created: new Date(),
            updated: new Date(),
            variables: {},
            type: 'task-result', // Special type for task results to enable formatting
            content: newTask.result // Store the original result for rendering
          };
          
          // Add the message to the chat
          setMessages(prevMessages => [...prevMessages, taskCompletedMessage]);
        }
      });
      
      // Update the previous tasks reference
      previousTasksRef.current = newTasks;
      
      // Update tasks state
      setTasks(newTasks);

      // Store the session result
      if (teamSession.status === RunStatus.Complete) {
        console.log('Session is complete, preparing results');

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

      // Check if the session is completed or has error
      if (teamSession.status === RunStatus.Complete || teamSession.status === RunStatus.Error) {
        setIsCompleted(true);
        setIsAwaitingUserInput(false);

        // Set error state if status is Error
        if (teamSession.status === RunStatus.Error) {
          setError(new Error(teamSession.stopReason || 'An error occurred during session execution'));
        }

        // Clear the polling timer if the session is completed or has error
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          setPollingTimer(null);
          pollingTimerRef.current = null;
        }
      }

      // Check if the session is awaiting user input
      if (teamSession.status === RunStatus.AwaitingToolResult) {
        // Check if ASK_USER tool is called
        const isAskUserTool = teamSession.toolTypeCalled === FunctionsType.ASK_USER;

        // Get inquiries for the session - need to use sessionId from teamSession, not teamSessionId
        const inquiries = await wizeTeamsService.getSessionInquiries(teamSession.sessionId);

        // Find an inquiry that requires a user response
        // The inquiry should be of type ASK_USER and have no response
        const pendingInquiry = inquiries.find(inquiry =>
          (inquiry.toolType === FunctionsType.ASK_USER || isAskUserTool) && !inquiry.response
        );

        if (pendingInquiry) {
          // Found an inquiry requiring user response
          setPendingInquiry(pendingInquiry);
          setIsAwaitingUserInput(true);
          console.log('Awaiting user input for inquiry:', pendingInquiry);
        } else {
          // No inquiries requiring user response
          setPendingInquiry(null);
          setIsAwaitingUserInput(false);
        }
      } else {
        // Session is not awaiting tool result
        setPendingInquiry(null);
        setIsAwaitingUserInput(false);
      }

      // Check if there's a pending inquiry to add to our local messages as an AI message
      if (teamSession.status === RunStatus.AwaitingToolResult && teamSession.toolTypeCalled === FunctionsType.ASK_USER) {
        try {
          // Get inquiries for the session
          const inquiries = await wizeTeamsService.getSessionInquiries(teamSession.sessionId);
          console.log('Inquiries for session:', inquiries);

          // Find the latest unanswered inquiry
          const latestInquiry = inquiries
            .filter(inquiry => !inquiry.response)
            .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())[0];

          if (latestInquiry) {
            console.log('Latest inquiry:', latestInquiry);
            console.log('Current processed inquiry IDs:', processedInquiryIds);

            // Format the inquiry message
            const inquiryText = typeof latestInquiry.inquiry === 'string'
              ? latestInquiry.inquiry
              : latestInquiry.inquiry?.question ||
                latestInquiry.inquiry?.message ||
                latestInquiry.inquiry?.text ||
                latestInquiry.inquiry?.prompt ||
                latestInquiry.question ||
                'Please provide additional information';

            // Use a ref to track if we're currently processing this inquiry
            // This prevents race conditions with React's batched state updates
            if (!processedInquiryIds.has(latestInquiry.id)) {
              console.log(`Processing new inquiry ${latestInquiry.id}`);

              // Update both messages and processedInquiryIds atomically
              // First, create the new message
              const aiMessage = {
                id: `ai-inquiry-${latestInquiry.id}`,
                userId: 'ai',
                sessionId: sid,
                sender: 'ai',
                message: inquiryText,
                agentId: `Question from ${latestInquiry.agentId || teamSession.currentAgent || ''}`,
                finishReason: '',
                created: new Date(latestInquiry.created),
                updated: new Date(),
                variables: {}
              };

              // Update both states in one render cycle
              const newProcessedIds = new Set(processedInquiryIds);
              newProcessedIds.add(latestInquiry.id);
              setProcessedInquiryIds(newProcessedIds);

              // Check if this message already exists in the messages array
              const messageExists = messages.some(msg =>
                msg.id === aiMessage.id ||
                (msg.sender === 'ai' && msg.message === aiMessage.message)
              );

              if (!messageExists) {
                console.log('Adding new AI inquiry to chat history:', aiMessage);
                setMessages(prevMessages => [...prevMessages, aiMessage]);
              } else {
                console.log('Message already exists in chat history, not adding duplicate');
              }
            } else {
              console.log(`Inquiry ${latestInquiry.id} already processed, not adding to chat history`);
            }
          }
        } catch (error) {
          console.error('Error processing inquiries:', error);
        }
      }

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

      // Add the user's message to the messages array to preserve it in the chat history
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: `user-${Date.now()}`,
          userId: 'user',
          sessionId: sessionId || '',
          sender: 'user',
          message: message,
          agentId: '',
          finishReason: '',
          created: new Date(),
          updated: new Date(),
          variables: {}
        }
      ]);

      // Immediately fetch session data to update the conversation
      if (sessionId) {
        fetchSessionData(sessionId);
      }

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
