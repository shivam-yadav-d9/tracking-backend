import mongoose from "mongoose";

// Route history: one document per employee per day (IST). The app sends a
// location every 15 minutes and each one is pushed into `points` (oldest
// first, ~96 a day at most). Nothing is overwritten.
const PointSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    orderId: { type: String, default: null }, // job / order being worked on
    speed: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const RouteHistorySchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    employeeName: { type: String, default: "" },
    role: { type: String, default: "" }, // "fitter" | "delivery"

    // "YYYY-MM-DD" in India time
    date: { type: String, required: true },

    points: { type: [PointSchema], default: [] },

    // Straight-line distance between the saved points (the app shows the road distance)
    distanceMeters: { type: Number, default: 0 },

    startedAt: { type: Date },
    lastAt: { type: Date },
  },
  { timestamps: true }
);

RouteHistorySchema.index({ employeeId: 1, date: -1 }, { unique: true });
RouteHistorySchema.index({ date: -1, role: 1 });

const RouteHistory = mongoose.model("RouteHistory", RouteHistorySchema);

export default RouteHistory;
