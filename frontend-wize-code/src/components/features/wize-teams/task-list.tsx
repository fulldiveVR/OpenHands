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
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col space-y-2 mt-4">
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
        <div className="animate-pulse bg-neutral-800 h-8 rounded-md w-full"></div>
      </div>
    );
  }

  // if (tasks.length === 0) {
  //   return (
  //     <div className="text-center py-4 text-neutral-400">
  //       No tasks available yet
  //     </div>
  //   );
  // }

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
              <span className="text-sm font-medium">{task.title}</span>
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
