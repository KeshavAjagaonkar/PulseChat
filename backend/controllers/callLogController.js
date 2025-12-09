import CallLog from "../models/callLogModel.js";

// Create a new call log
export const createCallLog = async (req, res) => {
    try {
        const { calleeId, callType, duration, status } = req.body;
        const callerId = req.user._id; // The authenticated user is the caller

        const callLog = await CallLog.create({
            caller: callerId,
            callee: calleeId,
            callType,
            duration,
            status,
        });

        res.status(201).json(callLog);
    } catch (error) {
        console.error("Error creating call log:", error);
        res.status(500).json({ message: "Failed to create call log" });
    }
};

// Get call logs for current user
export const getCallLogs = async (req, res) => {
    try {
        const userId = req.user._id;

        const callLogs = await CallLog.find({
            $or: [{ caller: userId }, { callee: userId }],
        })
            .populate("caller", "name pic email")
            .populate("callee", "name pic email")
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(callLogs);
    } catch (error) {
        console.error("Error fetching call logs:", error);
        res.status(500).json({ message: "Failed to fetch call logs" });
    }
};

// Delete a call log
export const deleteCallLog = async (req, res) => {
    try {
        const callLog = await CallLog.findById(req.params.id);

        if (!callLog) {
            return res.status(404).json({ message: "Call log not found" });
        }

        // Check if user is part of this call
        if (
            callLog.caller.toString() !== req.user._id.toString() &&
            callLog.callee.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        await CallLog.findByIdAndDelete(req.params.id);
        res.json({ message: "Call log deleted" });
    } catch (error) {
        console.error("Error deleting call log:", error);
        res.status(500).json({ message: "Failed to delete call log" });
    }
};
