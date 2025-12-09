import mongoose from "mongoose";

const callLogSchema = mongoose.Schema(
    {
        caller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        callee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        callType: {
            type: String,
            enum: ["audio", "video"],
            required: true,
        },
        duration: {
            type: Number, // Duration in seconds
            default: 0,
        },
        status: {
            type: String,
            enum: ["completed", "missed", "rejected"],
            default: "completed",
        },
        startedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const CallLog = mongoose.model("CallLog", callLogSchema);

export default CallLog;
