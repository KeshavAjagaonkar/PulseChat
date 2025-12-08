import User from '../models/userModel.js'

const allUsers = async (req, res) => {
    const keyword = req.query.search ?
        {
            $or:
                [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { email: { $regex: req.query.search, $options: "i" } },
                ],
        } : {};

    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

    res.send(users);
}

// Update user profile
const updateProfile = async (req, res) => {
    try {
        const { name, pic, status } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update fields if provided
        if (name) user.name = name;
        if (pic) user.pic = pic;
        if (status !== undefined) user.status = status;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            pic: updatedUser.pic,
            status: updatedUser.status || "",
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
}

// Get current user profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error getting profile:", error);
        res.status(500).json({ message: "Failed to get profile" });
    }
}

export { allUsers, updateProfile, getProfile };