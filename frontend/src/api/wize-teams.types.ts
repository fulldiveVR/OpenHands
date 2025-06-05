export enum TaskStatus {
  Pending = "pending",
  Failed = "failed",
  Done = "done",
  InProgress = "in_progress",
  AwaitingUserInput = "awaiting_user_input"
}

export enum TaskPriority {
  High = "high",
  Medium = "medium",
  Low = "low",
}

export interface ITask {
  id: number
  title: string
  description: string
  status: TaskStatus
  dependencies: number[]
  priority: TaskPriority
  details: string
  result: any
  retryCount: number
  delegatedToTeamId?: string
  delegatedSessionId?: string
}

export interface ITeamSession {
  id: string
  sessionId: string
  userId: string
  teamId: string
  status: RunStatus
  messagesCount: number
  result: Record<string, string>
  meta: {
    name: string
  }
  stopReason?: string
  currentAgent: string
  previousAgent: string
  backlog: ITask[]
  delegatedFromTeamSessionId?: string
  created?: Date
  updated?: Date
  toolTypeCalled?: FunctionsType
}

export enum RunStatus {
  Created = "created",
  Active = "active", // covers 'streaming'
  AwaitingToolResult = "awaiting_tool_result",
  AwaitingDelegatedResult = "awaiting_delegated_result",
  Complete = "complete",
  Error = "error",
  Stopped = "stopped",
}

export interface ITeamSessionFrame {
  teamSession?: ITeamSession
  error?: any
  messageDelta?: string
  message?: IMessageRecord
  googleResults?: any[]
  pagesParsingDone?: number
  searchDelta?: string
  tasks?: Array<{ id: string; name: string }>
  agentSession?: IAIAgentsSession
  taskUpdate?: {
    id: string
    name?: string
    googleQueries?: string[]
    searchDelta?: string
    pagesParsingDone?: number
  }
  google?: any[]
}

export type TeamChatStreamHandler = (frame: ITeamSessionFrame) => void

export interface FileWithUrl extends File {
  uid: string
  url: string
  filename: string
  content: string
  loading: boolean
  mimeType: string
  fileType: "image" | "file"
}

export interface IFunction {
  uiName: string;
  type: FunctionsType;
  name: string;
  description: string;
  handlingType: HandlingType;
  webhook?: string;
  ctxKnowledgeId?: string;
  required: [string, ...string[]];
  parameters: ConfirmationPrepareProperties;
  [key: string]: any;
}

export interface ITeamMeta {
  name: string
  description: string
  icon: string
}

export enum TerminationType {
  MaxMessageTermination = "MaxMessageTermination",
  TextMentionTermination = "TextMentionTermination",
}

export interface MaxMessageTerminationConfig {
  type: TerminationType.MaxMessageTermination
  maxMessages: number
}

export interface TextMentionTerminationConfig {
  type: TerminationType.TextMentionTermination
  text: string
}

export type TerminationConfig = MaxMessageTerminationConfig | TextMentionTerminationConfig

export interface IAIAgentModel {
  id: string
  temperature: number
}

export interface IAIAgentLibrary {
  id: string
}

export interface ITeamPermission {
  team: string
  permission: string // PermissionLevel
}

export interface ITeamVariable {
  inputs: string[]
  outputs: string[]
  default: string
}

export interface ITeam {
  id: string
  userId: string
  meta: ITeamMeta
  taskDecomposer: string
  taskOrchestrator: string
  participants: string[]
  subordinatedTeams: string[]
  terminationCondition: TextMentionTerminationConfig
  model: IAIAgentModel
  created: Date
  updated: Date
  variables: {
    [var_name: string]: ITeamVariable
  }
  inputs: string[]
  outputs: string[]
  owner?: {
    id: string
    type: string
  }
  teamPermissions?: ITeamPermission[]
}

export interface ITeamChatStoreState {
  messages: IMessageRecord[]
  isBusy: boolean
  isContinueGeneration: boolean
  isChatSettingsModalShown: boolean
  inputFileList: FileWithUrl[]
  promptIsImproving: boolean
  isInitInProcess: boolean
  prompt: string
  team: ITeam | null
  teamSessions: ITeamSession[]
  currentTeamSession: ITeamSession | null
  teams: ITeam[]
  teamsTotalCount: number
  sessionsTotalCount: number
  isDebugOn: boolean
}

export interface IMessageRecord {
  id: string
  userId: string
  sessionId: string
  sender: string
  message: string
  agentId: string
  finishReason: string
  created: Date
  updated: Date
  type?: string
  variables: Record<string, string>
  google?: any[]
  tasks?: Array<any> // IChatTask
  sessionVariables?: any
  functionCall?: any
  pagesParsingDone?: number
  tmpDebugRequest?: any
  content?: any
  error?: string
}

export interface IAIAgentsSession {
  id: string
  [key: string]: any
}

// Properties for function parameters
export type ConfirmationPrepareProperties = {
  [key: string]: {
    type: "string" | "number" | "boolean" | "object" | "array" | "integer"
    description: string
  }
}

// Functions types for tool calls
export enum FunctionsType {
  ASK_USER = "ask-user",
  WEBHOOK_TRIGGER = "webhook-trigger",
  UNKNOWN = "unknown",
  CREATE_AGENT = "create-agent",
  GET_AGENT_DATA = "get-agent-data",
  VALIDATE_AGENT_CONFIG = "validate-agent-config",
  VALIDATE_RUN_AGENT_CONFIG = "validate-run-agent-config",
  ADD_TASKS = "add-tasks",
  Default = "default"
}

// Handling types for functions
export enum HandlingType {
  SYNC = "sync",
  ASYNC = "async",
  FIRE_AND_FORGET = "fire-and-forget",
}

// Interface for user inquiries
export interface IInquiry {
  id: string;
  userId: string;
  inquiry: any;
  response: any;
  sessionId: string;
  agentId: string;
  toolName: string;
  toolType: FunctionsType;
  created: Date;
  updated: Date;
  // Backward compatibility fields
  question?: string;
  status?: "pending" | "answered";
}
