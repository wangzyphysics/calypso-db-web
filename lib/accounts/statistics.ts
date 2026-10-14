import { z } from "zod";
const count = z.number().int().nonnegative();
export const adminStatisticsSchema = z.object({
  mode: z.enum(["live", "demo"]),
  demoAvailable: z.boolean(),
  statusCounts: z.array(z.object({ status: z.string(), count })),
  careerStages: z.array(z.object({ stage: z.string(), count })),
  generatedAt: z.string().datetime(),
  accounts: z.object({ registered: count, test: count, verifiedEmail: count, administrators: count, institutions: count, researchGroups: count, signedInAccounts: count }),
  science: z.object({ materials: count, sourcePhases: count, displayRecords: count, structureRepresentations: count, calculations: count, sources: count, pressureReported: count, pressureMissing: count }),
  contributions: z.object({ batches: count, contributors: count, files: count, bytes: count, publicRecords: count, awaitingWorkflow: count, review: z.array(z.object({ status: z.string(), count })), types: z.array(z.object({ type: z.string(), count })) }),
  registrations: z.array(z.object({ date: z.string(), count })),
  countries: z.array(z.object({ countryCode: z.string(), users: count })),
  countryUnrecognized: count,
  workflowConnected: z.literal(false),
});
export type AdminStatistics = z.infer<typeof adminStatisticsSchema>;
