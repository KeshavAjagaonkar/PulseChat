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
      downloadUrl: { type: String }, // Separate download URL for documents
      type: { type: String, enum: ['image', 'video', 'document', null] },
      name: { type: String },
      size: { type: Number },
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message; 