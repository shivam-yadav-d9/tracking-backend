import mongoose from "mongoose";

const LiveLocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    orderId: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    speed: {
      type: Number,
      default: 0,
    },

    heading: {
      type: Number,
      default: 0,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// GeoSpatial Index
LiveLocationSchema.index({
  location: "2dsphere",
});

const LiveLocation = mongoose.model("LiveLocation", LiveLocationSchema);

export default LiveLocation;