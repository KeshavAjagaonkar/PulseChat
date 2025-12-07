import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

// @desc    Access a chat (Create if not exists, Fetch if exists)
// @route   POST /api/chat
const accessChat = async (req, res) => {
  const { userId } = req.body; // The ID of the user you want to chat with

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  // 1. Check if a 1-on-1 chat already exists with these two users
  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } }, // Me
      { users: { $elemMatch: { $eq: userId } } },       // You
    ],
  })
    .populate("users", "-password") // Get full user details, not just ID
    .populate("latestMessage");

  // Populate the sender info inside the latestMessage
  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  // 2. If chat exists, return it
  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    // 3. If no chat, create a new one
    var chatData = {
      chatName: "sender", // Name doesn't matter for 1-on-1
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData);

      // Return the new chat with full user details
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).send(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
};

// @desc    Fetch all chats for a user
// @route   GET /api/chat
const fetchChats = async (req, res) => {
  try {
    // Find all chats where the current user is a part of the 'users' array
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 }) // Sort by new to old
      .then(async (results) => {
        // Populate sender info inside latestMessage
        results = await User.populate(results, {
            path: "latestMessage.sender",
            select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Create New Group Chat
// @route   POST /api/chat/group
const createGroupChat = async (req, res) => {
  // Check if users array and name are provided
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the fields" });
  }

  // Parse the stringified JSON array from frontend
  var users = JSON.parse(req.body.users);

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  // Add the current user (admin) to the group list
  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    // Fetch back the full group details to send to frontend
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

// @desc    Rename Group
// @route   PUT /api/chat/rename
const renameGroup = async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName: chatName },
    { new: true } // Return the updated object
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
};

// @desc    Add user to Group
// @route   PUT /api/chat/groupadd
const addToGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const added = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { users: userId } }, // Add user ID to array
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
};

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
const removeFromGroup = async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } }, // Remove user ID from array
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(removed);
  }
};

export {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};