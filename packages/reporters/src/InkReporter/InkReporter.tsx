import { formatDuration, hrtimeDiff, hrToSeconds } from "@lage-run/format-hrtime";
import { LogLevel } from "@lage-run/logger";
import type { Reporter, LogEntry } from "@lage-run/logger";
import type { SchedulerRunSummary, TargetStatus } from "@lage-run/scheduler-types";
import React from "react";
import { render, Text, Box, Static, Newline, Spacer } from "ink";
import { hrtime } from "process";
import { getAssignedColor } from './getAssignedColor';
import color from 'color';

interface Task {
  id: string;
  packageName: string;
  scriptName: string;
  start: [number, number];
  duration?: string;
  status: TargetStatus;
}

interface SummaryDescription {
  status: 'unknown' | 'running' | 'complete';
  total: number;
  running: number;
  startTime: [number, number],   
  succeeded: number;
  failed: number;
  skipped: number;
  aborted: number;
  duration?: string;
}

const taskIconColor = (task: Task) => {
  switch (task.status) {
    case "success":
    case "skipped":
      return "green";
    case "failed":
      return "red";
  }

  return "grey";
};

const TaskCompleteIcon = ({ task }: { task: Task }) => {
  const iconColor = taskIconColor(task);
  let iconChar = " ";

  switch (task.status) {
    case "success":
    case "skipped":
      iconChar = "✔";
      break;
    case "failed":
      iconChar = "✖";
      break;
    case "aborted":
      iconChar = "⚠";
      break;
  }

  return <Text color={iconColor}>{iconChar}</Text>;
};

const Space = () => (<Text> </Text>);

const TaskDuration = ({ task }: { task: Task }) => {
  const { start, duration } = task;
  const seconds = duration !== undefined ? duration : formatDuration(hrToSeconds(hrtimeDiff(start, hrtime())));

  return <Text color="gray">{seconds}</Text>;
};

const braille1 = ["⠋", "⠙", "⠸", "⠴", "⠦", "⠇"];

const Spinner = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % braille1.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return <Text color="cyanBright">{braille1[index]}</Text>;
};

const RunningTask = ({ task }: { task: Task }) => {
  const taskColor = getAssignedColor(task.packageName);
  const taskSubColor = color(taskColor, 'hex').darken(0.6).hex();

  return (
    <Box>
        <Spinner />
        <Space/>
        <Box width={8}>
          <TaskDuration task={task} />
        </Box>
        <Space/>
        <Text color={taskSubColor}>{task.scriptName}</Text>
        <Space/>
        <Text bold color={taskColor}>{task.packageName}</Text>      
    </Box>
  );
};

const CompletedTask = ({ task }: { task: Task }) => {
  const taskColor = getAssignedColor(task.packageName);
  const taskSubColor = color(taskColor, 'hex').darken(0.6).hex();

  return (
    <Box>      
      <TaskCompleteIcon task={task} />
      <Space/>
      <Text color={taskSubColor}>{task.scriptName}</Text>
      <Space/>
      <Text color={taskColor}>{task.packageName}</Text> 
      <Space/>
      { task.status === 'skipped' ? <Text>- skipped </Text> : <Text>(<TaskDuration task={task} />)</Text> }
    </Box>
  );
};

const Summary = ({ summary }: { summary?: SummaryDescription }) => {
  const { total = 0, succeeded = 0, failed  = 0, skipped = 0} = summary || {};

  if (!total) {
    return <Text/>;
  }

  return <Text>{`${succeeded+failed+skipped}/${total} complete`}</Text>;
};

interface LogState {
  runningTasks: Task[];
  completedTasks: (Task|undefined)[];
  summary?: SummaryDescription;
}

class Observable<T> {
  public data: T;
  _listeners: ((data: T) => void)[];

  constructor(data: T) {
    this._listeners = [];
    this.data = data;
  }

  addListener(callback: (data: T) => void) {
    this._listeners.push(callback);
  }

  removeListener(callback: (data: T) => void) {
    this._listeners = this._listeners.filter((l) => l !== callback);
  }

  update() {
    this.data = {
      ...this.data
    };
    
    this._listeners.forEach((l) => l(this.data));
  }
}

type ObservableLogState = Observable<LogState>;

const useLogState = (logState: ObservableLogState) => {
  const [state, setState] = React.useState<LogState>(logState.data);

  React.useEffect(() => {
    const onChange = (setState);

    logState.addListener(onChange);

    return () => logState.removeListener(onChange);
  }, []);

  return state;
};

const Divider = () => {
  return <Text color="#333333">────────────────────────────────────────────────────────────</Text>;
};

const GradientText = ({ children }: React.PropsWithChildren) => {
  const gradientBlues = [ '#00b4db', '#0083b0', '#005b96', '#003f7d', '#002763' ];
  const gradientGreens = [ '#00b09b', '#00816a', '#005b4f', '#003f3a', '#00272a' ];
  const gradientReds = [ '#ff5e57', '#ff2d55', '#e00052', '#c5004f', '#a3004c' ];
  const gradientYellows = [ '#feca57', '#ff9f43', '#ff793f', '#ff5f3d', '#ff453b' ];
  const allGradients = [ gradientBlues, gradientGreens, gradientReds, gradientYellows ];
  const gradient = allGradients[Math.floor(Math.random() * allGradients.length)];
  const text = String(children);

  return (
    <Text>
      {text.split('').map((char, index) => {
        const color = gradient[index % gradient.length];

        return <Text key={index} color={color}>{char}</Text>;
      })}
    </Text>
  );
}

const Logo = () => {
  return (
    <>
    <Box>
      <GradientText>Lage v1.2.2</GradientText>
      <Text> - </Text>
      <GradientText>Let's make it!</GradientText>
    </Box>
    <Divider />
    </>
  )
}

const LogReport = ({ log }: { log: ObservableLogState }) => {
  const state = useLogState(log);
  const { runningTasks, completedTasks, summary } = state;

  return (
    <>
      <Static items={completedTasks}>
        {(task, index) => (
          (!task) ? (
            <Box key={index} flexDirection="column">
              <Logo />
            </Box>
          ) : (
            <CompletedTask key={index} task={task} />
          )
        )}
      </Static>
      {completedTasks.length > 1 && <Divider />}
      {!!runningTasks.length && (
      <>
      <Box flexDirection="column">
        {runningTasks.map((task, index) => (
          <RunningTask key={index} task={task} />
        ))}
      </Box>
      <Divider />     
      </>

      )}
      <Summary summary={summary} />
    </>
  );
};

export class InkReporter implements Reporter {
  private logState: ObservableLogState = new Observable<LogState>({
    runningTasks: [],
    completedTasks: [undefined],
    summary: undefined
  });

  constructor(private options: { logLevel?: LogLevel; grouped?: boolean }) {
    options.logLevel = options.logLevel || LogLevel.info;

    render(<LogReport log={this.logState} />);
  }

  public log(entry: LogEntry<any>) {
    const data = entry.data;
    const target = data?.target;
    const status = data?.status;
    const log = this.logState.data;

    if (data?.type === 'scheduler') {
      if (status === 'running') {
        log.summary = {
          status: 'running',          
          startTime: data.startTime,
          total: data.total,
          running: 0,
          succeeded: 0,
          skipped: 0,
          failed: 0,         
          aborted: 0
        };
      } else if (status === 'complete') {
        log.summary = {
          ...log.summary,
          status: 'complete', 
        } as SummaryDescription;                   
      }
      this.logState.update();
    } else if (target && status) {
      const { id, packageName, task: scriptName,  duration } = target;
      const task = {
        id,
        packageName,
        scriptName,
        start: hrtime(),
        duration,
        status 
      };

      // Create a new summary object for immutability, mutate the new copy.
      const summary = log.summary = { ...log.summary } as SummaryDescription;

      if (status === "running") {
        log.runningTasks = [ ...log.runningTasks, task];
        log.summary.running++;
      } else {
        const taskIndex = log.runningTasks.findIndex(t => t.id === id);
        if (taskIndex !== -1) {
          log.runningTasks = log.runningTasks.filter((v, i) => i !== taskIndex);
          log.summary.running--;
        }

        log.completedTasks = [ ...log.completedTasks, task];
        
        switch (status) {
          case "success":
            summary.succeeded++;
            break;
          case "skipped":
            summary.skipped++;
            break;
          case "failure":
            summary.failed++;
            break;
          case "aborted":
            summary.aborted++;
            break;
        }
      }

      this.logState.update();
    }
  }

  public summarize(schedulerRunSummary: SchedulerRunSummary) {
    return;
    const { targetRuns, targetRunByStatus, duration } = schedulerRunSummary;
    const { failed, aborted, skipped, success, pending } = targetRunByStatus;

    process.stdout.write(`
      ${targetRuns.size} targets ran in ${duration}ms
      ${success.length} succeeded
      ${failed.length} failed
      ${aborted.length} aborted
      ${skipped.length} skipped
      ${pending.length} pending
    `);
  }

  public resetLogEntries() {}
}
