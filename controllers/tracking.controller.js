import LiveLocation from "../models/LiveLocation.js";
import { recordPoint } from "./routeHistory.controller.js";

/**
 * Update Delivery/Fitter Location
 * POST /api/tracking/update-location
 * body: { employeeId, latitude, longitude, orderId?, employeeName?, role?, speed?, heading? }
 *
 * Every update is pushed into today's route history (the app sends one every 15 min) (GET /api/tracking/history/...).
 * With an orderId it is also the live location customers follow for that order.
 */
export const updateLocation = async (req, res) => {
    try {
        const {
            employeeId,
            orderId,
            latitude,
            longitude,
            speed = 0,
            heading = 0,
            employeeName,
            role,
        } = req.body;

        // Basic validation
        if (!employeeId || latitude == null || longitude == null) {
            return res.status(400).json({
                success: false,
                message: "employeeId, latitude and longitude are required."
            });
        }

        // Route history — a failure here must not stop the live update
        try {
            await recordPoint({
                employeeId: String(employeeId),
                employeeName,
                role,
                orderId,
                latitude,
                longitude,
                speed,
                heading,
            });
        } catch (historyError) {
            console.error("Route history save failed:", historyError);
        }

        // No order: history only
        if (!orderId) {
            return res.status(200).json({
                success: true,
                message: "Location saved to route history",
                data: null,
            });
        }

        // Update existing document or create a new one
        const location = await LiveLocation.findOneAndUpdate(
            { employeeId },
            {
                employeeId,
                orderId,
                location: {
                    type: "Point",
                    coordinates: [longitude, latitude], // [lng, lat]
                },
                speed,
                heading,
                updatedAt: new Date(),
            },
            {
                new: true,
                upsert: true,
            }
        );

        // Socket.IO
        const io = req.app.get("io");

        if (io) {
            io.to(`order_${orderId}`).emit("location-update", {
                employeeId,
                orderId,
                latitude,
                longitude,
                speed,
                heading,
                updatedAt: location.updatedAt,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Location Updated Successfully",
            data: location,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


/**
 * Get Current Location
 * GET /api/tracking/location/:orderId
 */
export const getLocation = async (req, res) => {

    try {

        const { orderId } = req.params;

        const location = await LiveLocation.findOne({ orderId });

        if (!location) {
            return res.status(404).json({
                success: false,
                message: "Location not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: location
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};


/**
 * Delete Tracking
 * DELETE /api/tracking/location/:employeeId
 */
export const deleteLocation = async (req, res) => {

    try {

        const { employeeId } = req.params;

        await LiveLocation.findOneAndDelete({
            employeeId,
        });

        return res.status(200).json({
            success: true,
            message: "Tracking Removed"
        });

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

};