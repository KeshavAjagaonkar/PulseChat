import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generatToken = (res,userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRETE, { expiresIn: '30d' });
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        sameSite: 'strict', // Prevents CSRF attacks
        maxAge: 30 * 24 * 60 * 60 * 1000,
    })
}



export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const userExist = await User.findOne({ email });
        if (userExist) {
            return res.status(400).json({ message: "User already exist" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name,
            email: email,
            password:hashedPassword
        });

        if (user) {
            generatToken(res, user._id);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic:user.pic,
                message: "User created successfully"
                
            });
        } else {
            res.status(400).json({ message: "invalid user data" });
        }
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
}


export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
           generatToken(res, user._id);
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                pic:user.pic,
                message: "login successful"
            });
        }
        else {
            res.status(400).json({ message: "Invalid Email or password" })
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};