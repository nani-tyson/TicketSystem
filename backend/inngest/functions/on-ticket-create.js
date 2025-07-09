import { inngest } from "../client.js";
import Ticket from "../../models/tickets.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      // Step 1: Fetch ticket from DB as plain object
      const plainTicket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject.toObject(); // ✅ .toObject moved inside
      });

      // Step 2: Update status to TODO
      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(plainTicket._id, { status: "TODO" });
      });

      // Step 3: Analyze ticket using AI
      const aiResponse = await analyzeTicket(plainTicket);

      // Step 4: Validate AI response
      if (!aiResponse || typeof aiResponse !== "object") {
        console.error("⚠️ Invalid AI response:", aiResponse);
        throw new NonRetriableError("AI response invalid");
      }

      // Step 5: AI Processing
      const relatedskills = await step.run("ai-processing", async () => {
        let skills = [];
        if (aiResponse) {
          await Ticket.findByIdAndUpdate(plainTicket._id, {
            priority: !["low", "medium", "high"].includes(aiResponse.priority)
              ? "medium"
              : aiResponse.priority,
            helpfulNotes: aiResponse.helpfulNotes,
            status: "IN_PROGRESS",
            relatedSkills: aiResponse.relatedSkills,
          });
          skills = Array.isArray(aiResponse.relatedSkills)
            ? aiResponse.relatedSkills
            : [];
        }
        return skills;
      });

      // Step 6: Assign moderator
      const moderator = await step.run("assign-moderator", async () => {
        const skillsArray = Array.isArray(relatedskills)
          ? relatedskills.filter(Boolean)
          : [];

        let user;
        if (skillsArray.length > 0) {
          user = await User.findOne({
            role: "moderator",
            skills: { $in: skillsArray }, // ✅ safer than $regex
          });
        } else {
          user = await User.findOne({ role: "moderator" });
        }

        if (!user) {
          user = await User.findOne({ role: "admin" });
        }

        await Ticket.findByIdAndUpdate(plainTicket._id, {
          assignedTo: user?._id || null,
        });

        return user;
      });

      // Step 7: Send email notification
      await step.run("send-email-notification", async () => {
        if (moderator?.email) {
          const finalTicket = await Ticket.findById(plainTicket._id);
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket is assigned to you: ${finalTicket.title}`
          );
          console.log(`✅ Email sent to moderator ${moderator.email}`);
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error running the step", err.message);
      return { success: false };
    }
  }
);
