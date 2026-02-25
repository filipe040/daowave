import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email-service";
import { safeLog } from "@/lib/security";

const QUEUE_NAME = "email";

export const emailQueue = new Queue(QUEUE_NAME, {
    connection: redis as any,
    defaultJobOptions: {
        attempts: 5,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
    },
});

export const initEmailWorker = () => {
    const worker = new Worker(
        QUEUE_NAME,
        async (job: Job) => {
            const { to, templateId, payload, emailLogId } = job.data;

            try {
                safeLog.info("Processing email job", { jobId: job.id, to, templateId });

                // This actually calls Resend API (bypassing the queue enqueue)
                // We need a lower-level function in EmailService that strictly SENDS 
                // without queueing to prevent infinite loops.
                const result = await EmailService.processTemplateSend(
                    to,
                    templateId,
                    payload,
                    emailLogId
                );

                if (!result.success) {
                    throw new Error(result.error || "Unknown send error");
                }

                return result;
            } catch (error: any) {
                safeLog.error("Email job failed", { jobId: job.id, error: error.message });
                throw error;
            }
        },
        {
            connection: redis as any,
            concurrency: 5,
        }
    );

    worker.on("completed", async (job) => {
        safeLog.info("Email job completed", { jobId: job.id });
        if (job.data.emailLogId) {
            await prisma.emailJobLog.update({
                where: { id: job.data.emailLogId },
                data: { status: "SENT", sentAt: new Date() }
            });
        }
    });

    worker.on("failed", async (job, err) => {
        safeLog.error("Email job hopelessly failed", { jobId: job?.id, err: err.message });
        if (job?.data?.emailLogId) {
            await prisma.emailJobLog.update({
                where: { id: job.data.emailLogId },
                data: { status: "FAILED", error: err.message }
            });
        }
    });

    return worker;
};
