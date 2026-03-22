import { prisma } from "../prisma";
import { getEmailQueue } from "../queue/email.queue";
import { safeLog } from "../security";

export class MarketingService {
  /**
   * Dispatch automated email about a new event to all opted-in users
   */
  static async dispatchNewEventCampaign(eventId: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          organization: { select: { name: true } }
        }
      });

      if (!event || event.status !== "PUBLISHED") {
        return { success: false, error: "Event not found or not published" };
      }

      // Find users with marketingOptIn = true
      const users = await prisma.user.findMany({
        where: { marketingOptIn: true },
        select: { email: true, name: true, id: true }
      });

      if (users.length === 0) {
        return { success: true, message: "No users to notify" };
      }

      const queue = getEmailQueue();
      const orgName = event.organization?.name || "GoPass";

      // Enqueue job for each user using Promise.all locally (fine for <10k users usually, 
      // but BullMQ handles large arrays with addBulk nicely, though we'll use add for now
      // for simplicity with our queue setup)
      const jobs = users.map(u => {
        return {
          name: "marketing-event",
          data: {
            to: u.email,
            templateId: "marketing-campaign",
            payload: {
              subject: `Novidade: ${event.title} já está disponível!`,
              title: "Novo Evento Disponível",
              content: `<p>Olá ${u.name || 'GoPasser'},</p>
                        <p>Temos o prazer de anunciar um novo evento na GoPass: <strong>${event.title}</strong>.</p>
                        <p>A ${orgName} acabou de lançar este evento. Garanta já o seu lugar antes que esgote!</p>
                        <br/>
                        <div style="text-align: center;">
                          <a href="${process.env.APP_URL || 'https://tickets.wwave.pt'}/events/${event.slug}" 
                             style="background: #10B981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Ver Evento e Bilhetes
                          </a>
                        </div>`,
            }
          }
        };
      });

      await queue.addBulk(jobs);

      safeLog.info("Marketing events dispatched", { eventId, count: users.length });
      return { success: true, count: users.length };
    } catch (error: any) {
      safeLog.error("Error dispatching marketing event campaign", { eventId, error: error.message });
      return { success: false, error: "Failed to dispatch" };
    }
  }

  /**
   * Dispatch custom manual newsletter to all opted-in users
   */
  static async dispatchCustomCampaign(subject: string, title: string, htmlContent: string) {
    try {
      const users = await prisma.user.findMany({
        where: { marketingOptIn: true },
        select: { email: true, name: true }
      });

      if (users.length === 0) {
        return { success: true, count: 0 };
      }

      const queue = getEmailQueue();
      const jobs = users.map(u => {
        return {
          name: "marketing-custom",
          data: {
            to: u.email,
            templateId: "marketing-campaign",
            payload: {
              subject,
              title,
              content: htmlContent,
            }
          }
        };
      });

      await queue.addBulk(jobs);
      safeLog.info("Custom marketing campaign dispatched", { count: users.length, subject });
      return { success: true, count: users.length };
    } catch (error: any) {
      safeLog.error("Error dispatching custom marketing campaign", { error: error.message });
      return { success: false, error: error.message || "Failed to dispatch" };
    }
  }

  /**
   * Get stats for admin marketing dashboard
   */
  static async getStats() {
    const totalOptedIn = await prisma.user.count({ where: { marketingOptIn: true } });
    return {
      totalOptedIn
    };
  }
}
