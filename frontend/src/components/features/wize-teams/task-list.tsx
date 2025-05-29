import React, { useState } from 'react';
import { ITask, TaskStatus, TaskPriority } from '../../../api/wize-teams.types';

interface TaskListProps {
  tasks: ITask[];
  isLoading: boolean;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading }) => {
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  
  const toggleTaskExpansion = (taskId: number) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
    }
  };
  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-4 text-neutral-400">
        No tasks available yet
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 mt-4">
      {tasks.map((task) => (
        <div 
          key={task.id}
          className="flex flex-col py-3 border-b border-neutral-700 hover:bg-neutral-800 cursor-pointer"
          onClick={() => toggleTaskExpansion(task.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {task.status === TaskStatus.Done ? (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : task.status === TaskStatus.Failed ? (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-green-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="text-sm font-medium">{task.title}</span>
              <span className={`text-xs px-1 rounded ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            <div className={`text-xs flex items-center gap-1 ${getStatusColor(task.status)}`}>
              <span className={`w-2 h-2 rounded-full ${getStatusIndicatorColor(task.status)}`}></span>
              {getStatusText(task.status)}
            </div>
          </div>
          
          <div className="text-xs text-neutral-400 ml-4 mt-1">{task.description}</div>
          
          {expandedTaskId === task.id && (
            <div className="mt-2 ml-4 p-2 bg-neutral-800 rounded text-xs">
              {task.result && (
                <>
                  <div className="font-medium mb-1">Result:</div>
                  <pre className="whitespace-pre-wrap overflow-auto max-h-60">
                    {typeof task.result === 'string' ? task.result : JSON.stringify(task.result, null, 2)}
                  </pre>
                </>
              )}
              
              {task.details && (
                <>
                  <div className="font-medium mb-1 mt-2">Details:</div>
                  <div className="whitespace-pre-wrap">{task.details}</div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper functions for status display
const getStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Done:
      return 'text-blue-500';
    case TaskStatus.Pending:
      return 'text-green-500';
    case TaskStatus.Failed:
      return 'text-red-500';
    default:
      return 'text-neutral-400';
  }
};

const getStatusIndicatorColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Done:
      return 'bg-blue-500';
    case TaskStatus.Pending:
      return 'bg-green-500';
    case TaskStatus.Failed:
      return 'bg-red-500';
    default:
      return 'bg-neutral-400';
  }
};

const getStatusText = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Done:
      return 'Complete';
    case TaskStatus.Pending:
      return 'In Progress';
    case TaskStatus.Failed:
      return 'Failed';
    default:
      return status;
  }
};

const getPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case TaskPriority.High:
      return 'bg-red-900 text-red-300';
    case TaskPriority.Medium:
      return 'bg-yellow-900 text-yellow-300';
    case TaskPriority.Low:
      return 'bg-blue-900 text-blue-300';
    default:
      return 'bg-neutral-800 text-neutral-300';
  }
};

export default TaskList;
