import User from '../models/userModel.js'

const allUsers = async (req, res) => {
    const keyword = req.query.search ?
        {
            $or:
                [
                    { name: { $regex: req.query.search, $options: "i" } },
                    { emai: { $regex: req.query.search, $options: "i" } },
                ],
        } : {};
    
    const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });

    res.send(users);
}

export { allUsers };