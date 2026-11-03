import mongoose from "mongoose";

// Route history: one document per employee per day (IST), with every
// location update of that day in `points` (oldest first).
// At one update a minute that is at most ~1,440 points a day.
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

    // Total distance travelled this day (GPS jitter under MIN_STEP ignored)
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
