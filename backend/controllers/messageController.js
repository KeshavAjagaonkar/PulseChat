import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";

// @desc    Send a new message
// @route   POST /api/message
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  // --- DEBUG LOGS START ---
  console.log("---------------- BACKEND DEBUG ----------------");
  console.log("1. Incoming Request Body:", req.body);
  console.log("2. Content:", content);
  console.log("3. Chat ID:", chatId);
  console.log("4. User (from token):", req.user ? req.user._id : "UNDEFINED - Auth Failed");
  console.log("-----------------------------------------------");
  // --- DEBUG LOGS END ---

  if (!content || !chatId) {
    console.log("ERROR: Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Get all messages for a specific chat
// @route   GET /api/message/:chatId
const allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

export { sendMessage, allMessages };