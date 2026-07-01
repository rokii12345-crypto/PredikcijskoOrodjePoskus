import type { CostItem, FundingSource, Investor, Project, Task } from "@/types";
import houseTemplate from "@/data/templates/houseTemplate.si.json";
import demoCostItems from "@/data/templates/demoCostItems.si.json";

type CreateDemoProjectResult = {
  project: Project;
  investors: Investor[];
  fundingSources: FundingSource[];
  tasks: Task[];
  costItems: CostItem[];
};

export function createDemoProject(ownerUserId: string, startDate: string): CreateDemoProjectResult {
  const projectId = crypto.randomUUID();
  const now = new Date().toISOString();

  const project: Project = {
    id: projectId,
    ownerUserId,
    name: "Moja hiša",
    projectType: "house_new_build",
    startDate,
    schedulingMode: "forward",
    currency: "EUR",
    contingencyPercent: houseTemplate.defaultContingencyPercent ?? 10,
    createdAt: now,
    updatedAt: now
  };

  const investors: Investor[] = [
    {
      id: crypto.randomUUID(),
      projectId,
      name: "Investitor 1",
      sharePercent: 50
    },
    {
      id: crypto.randomUUID(),
      projectId,
      name: "Investitor 2",
      sharePercent: 50
    }
  ];

  const fundingSources: FundingSource[] = [
    {
      id: crypto.randomUUID(),
      projectId,
      name: "Lastna sredstva",
      type: "own_funds",
      availableAmount: 70000,
      availableFrom: startDate
    },
    {
      id: crypto.randomUUID(),
      projectId,
      name: "Stanovanjski kredit",
      type: "loan",
      availableAmount: 280000,
      availableFrom: startDate,
      note: "V MVP uporabnik ročno popravi datum, od kdaj je kredit na voljo."
    },
    {
      id: crypto.randomUUID(),
      projectId,
      name: "Rezerva",
      type: "reserve",
      availableAmount: 30000,
      availableFrom: startDate
    }
  ];

  const tasks: Task[] = houseTemplate.tasks.map((task) => ({
    id: crypto.randomUUID(),
    projectId,
    parentCode: task.parentCode,
    code: task.code,
    name: task.name,
    type: task.type as Task["type"],
    durationDays: task.durationDays,
    dependencies: (task.dependencies ?? []) as Task["dependencies"],
    progressPercent: 0,
    status: "planned",
    defaultFundingSourceType: task.defaultFundingSourceType as Task["defaultFundingSourceType"],
    sortOrder: task.sortOrder,
    optionalKey: task.optionalKey,
    included: true
  }));

  const costItems: CostItem[] = demoCostItems.map((item) => ({
    id: crypto.randomUUID(),
    projectId,
    taskCode: item.taskCode,
    name: item.name,
    status: item.status as CostItem["status"],
    estimatedAmount: item.estimatedAmount,
    amountIncludesVat: true,
    defaultFundingSourceType: item.defaultFundingSourceType as CostItem["defaultFundingSourceType"],
    paymentRuleCode: item.paymentRuleCode
  }));

  return {
    project,
    investors,
    fundingSources,
    tasks,
    costItems
  };
}
