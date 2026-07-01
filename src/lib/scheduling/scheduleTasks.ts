import type { Task } from "@/types";
import { addDays, maxDate, minDate } from "./dateUtils";

/**
 * MVP scheduler.
 *
 * Supported:
 * - FS dependencies only
 * - summary tasks take min/max dates from children
 * - milestone has durationDays = 0
 *
 * Not supported yet:
 * - SS / FF dependencies
 * - calendars, weekends, holidays
 * - resource leveling
 * - critical path
 */
export function scheduleTasks(projectStartDate: string, inputTasks: Task[]): Task[] {
  const tasks = inputTasks
    .filter((task) => task.included !== false)
    .map((task) => ({ ...task, dependencies: task.dependencies ?? [] }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const scheduledByCode = new Map<string, Task>();
  const nonSummaryTasks = tasks.filter((task) => task.type !== "summary");

  for (const task of nonSummaryTasks) {
    let startDate = projectStartDate;

    if (task.dependencies.length > 0) {
      const dependencyStartCandidates = task.dependencies.map((dependency) => {
        const predecessor = scheduledByCode.get(dependency.predecessorTaskCode);

        if (!predecessor?.endDate) {
          throw new Error(`Missing or unscheduled predecessor: ${dependency.predecessorTaskCode}`);
        }

        if (dependency.type !== "FS") {
          // MVP fallback: treat unsupported dependency types as FS.
          return addDays(predecessor.endDate, dependency.lagDays ?? 0);
        }

        return addDays(predecessor.endDate, dependency.lagDays ?? 0);
      });

      startDate = maxDate(dependencyStartCandidates);
    }

    const endDate = task.type === "milestone"
      ? startDate
      : addDays(startDate, task.durationDays);

    scheduledByCode.set(task.code, {
      ...task,
      startDate,
      endDate
    });
  }

  const scheduledTasks = tasks.map((task) => {
    if (task.type !== "summary") {
      return scheduledByCode.get(task.code) ?? task;
    }

    const children = tasks
      .filter((child) => child.parentCode === task.code)
      .map((child) => scheduledByCode.get(child.code))
      .filter((child): child is Task => Boolean(child?.startDate && child?.endDate));

    if (children.length === 0) {
      return task;
    }

    return {
      ...task,
      startDate: minDate(children.map((child) => child.startDate!)),
      endDate: maxDate(children.map((child) => child.endDate!))
    };
  });

  return scheduledTasks.sort((a, b) => a.sortOrder - b.sortOrder);
}
