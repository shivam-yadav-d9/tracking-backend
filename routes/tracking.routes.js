import express from "express";

import {
  updateLocation,
  getLocation,
  deleteLocation,
} from "../controllers/tracking.controller.js";
import {
  getRouteHistory,
  getRouteDays,
  getRoutesByDate,
} from "../controllers/routeHistory.controller.js";

const router = express.Router();

// Update Live Location (also saved to the route history)
router.post("/update-location", updateLocation);

// Get Current Location by Order ID
router.get("/location/:orderId", getLocation);

// Delete Tracking
router.delete("/location/:employeeId", deleteLocation);

// Route History
router.get("/history", getRoutesByDate); // ?date=&role=
router.get("/history/:employeeId/days", getRouteDays); // ?limit=
router.get("/history/:employeeId", getRouteHistory); // ?date=

export default router;
