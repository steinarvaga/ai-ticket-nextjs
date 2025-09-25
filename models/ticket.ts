import mongoose, { Schema, models, model } from "mongoose";

const in7Days = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const ticketSchema = new Schema({
  title: String,
  description: String,
  status: { type: String, default: "TODO" },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  priority: String,
  deadline: { type: Date, default: in7Days },
  helpfulNotes: String,
  relatedSkills: [String],
  replyFromModerator: {
    code: String,
    explanation: String,
    repliedAt: { type: Date, default: Date.now },
  },
  createdAt: { type: Date, default: Date.now },
});

const Ticket = models.Ticket || model("Ticket", ticketSchema);

export default Ticket;
