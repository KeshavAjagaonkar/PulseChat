import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    // File attachment fields
    file: {
      url: { type: String },
      downloadUrl: { type: String },
      type: { type: String, enum: ['image', 'video', 'document', null] },
      name: { type: String },
      size: { type: Number },
    },
    // Message status tracking
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    },
    // Track who has read the message (for group chats)
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;