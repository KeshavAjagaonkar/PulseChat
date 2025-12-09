import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";

// @desc    Send a new message
// @route   POST /api/message
const sendMessage = async (req, res) => {
  const { content, chatId, replyTo, file } = req.body;

  // Allow either content or file (or both)
  if ((!content && !file) || !chatId) {
    console.log("ERROR: Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content || "",
    chat: chatId,
    replyTo: replyTo || null,
  };

  // Add file if provided
  if (file && file.url) {
    newMessage.file = {
      url: file.url,
      downloadUrl: file.downloadUrl || file.url, // Use downloadUrl if available
      type: file.type,
      name: file.name,
      size: file.size,
    };
  }

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await message.populate("replyTo", "content sender");

    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Deep populate the sender of the message we are replying to
    message = await User.populate(message, {
      path: "replyTo.sender",
      select: "name"
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat")
      .populate({
        path: "replyTo",
        select: "content sender",
        populate: { path: "sender", select: "name" }
      });

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if the user requesting delete is the one who sent it
    if (message.sender.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error("You can't delete other people's messages");
    }

    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: "Message Removed", _id: req.params.id });

  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
}

// @desc    Update message status (delivered/read)
// @route   PUT /api/message/status/:id
const updateMessageStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['delivered', 'read'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Mark multiple messages as read
// @route   PUT /api/message/read
const markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds, readerId } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: "Invalid messageIds" });
    }

    // Update all messages to read status and add reader to readBy array
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        sender: { $ne: readerId }, // Don't update own messages
        status: { $ne: 'read' } // Only update if not already read
      },
      {
        $set: { status: 'read' },
        $addToSet: { readBy: readerId }
      }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

export { sendMessage, allMessages, deleteMessage, updateMessageStatus, markMessagesAsRead };