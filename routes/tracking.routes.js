import express from "express";

import {
  updateLocation,
  getLocation,
  deleteLocation,
} from "../controllers/tracking.controller.js";

const router = express.Router();

// Update Live Location
router.post("/update-location", updateLocation);

// Get Current Location by Order ID
router.get("/location/:orderId", getLocation);

// Delete Tracking
router.delete("/location/:employeeId", deleteLocation);

export default router;