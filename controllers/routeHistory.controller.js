import RouteHistory from "../models/RouteHistory.js";

// Moves shorter than this are GPS jitter — saved, but not added to the distance
const MIN_STEP_METERS = 15;
// Faster than this between two points is a bad fix — the point is skipped
const MAX_SPEED_MPS = 70; // ~250 km/h

// "YYYY-MM-DD" in India time
export const istDate = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// metres, haversine
const distanceMeters = (a, b) => {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Add one point to the employee's route for today.
 * Called from POST /api/tracking/update-location.
 */
export const recordPoint = async ({
  employeeId,
  employeeName,
  role,
  orderId,
  latitude,
  longitude,
  speed = 0,
  heading = 0,
  at = new Date(),
}) => {
  const point = {
    latitude: Number(latitude),
    longitude: Number(longitude),
    orderId: orderId ? String(orderId) : null,
    speed: Number(speed) || 0,
    heading: Number(heading) || 0,
    at,
  };
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return;

  const date = istDate(at);

  // Last point of today, to add the distance travelled since then
  const prev = await RouteHistory.findOne(
    { employeeId, date },
    { points: { $slice: -1 } }
  ).lean();
  const last = prev?.points?.[0];

  let step = 0;
  if (last) {
    step = distanceMeters(last, point);
    const seconds = Math.max(1, (at - new Date(last.at)) / 1000);
    if (step / seconds > MAX_SPEED_MPS) return; // impossible jump — bad fix
  }

  const set = { lastAt: at };
  if (employeeName) set.employeeName = String(employeeName);
  if (role) set.role = String(role);

  await RouteHistory.updateOne(
    { employeeId, date },
    {
      $push: { points: point },
      $inc: { distanceMeters: step >= MIN_STEP_METERS ? step : 0 },
      $set: set,
      $setOnInsert: { startedAt: at },
    },
    { upsert: true }
  );
};

const summary = {
  _id: 0,
  employeeId: 1,
  employeeName: 1,
  role: 1,
  date: 1,
  distanceMeters: 1,
  startedAt: 1,
  lastAt: 1,
  pointCount: { $size: "$points" },
};

/**
 * One day's route for an employee
 * GET /api/tracking/history/:employeeId?date=YYYY-MM-DD   (default: today)
 */
export const getRouteHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const date = DATE_RE.test(req.query.date || "") ? req.query.date : istDate();

    const route = await RouteHistory.findOne(
      { employeeId, date },
      { _id: 0, __v: 0 }
    ).lean();

    // No route that day is not an error — the screen shows "nothing saved"
    return res.status(200).json({
      success: true,
      data: route || {
        employeeId,
        date,
        points: [],
        distanceMeters: 0,
        startedAt: null,
        lastAt: null,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Days that have a saved route for an employee, newest first
 * GET /api/tracking/history/:employeeId/days?limit=30
 */
export const getRouteDays = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 120);

    const days = await RouteHistory.aggregate([
      { $match: { employeeId } },
      { $sort: { date: -1 } },
      { $limit: limit },
      { $project: summary },
    ]);

    return res.status(200).json({ success: true, data: days });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Everyone who has a route on a day (for managers / admin)
 * GET /api/tracking/history?date=YYYY-MM-DD&role=fitter|delivery
 */
export const getRoutesByDate = async (req, res) => {
  try {
    const date = DATE_RE.test(req.query.date || "") ? req.query.date : istDate();
    const match = { date };
    if (req.query.role) match.role = String(req.query.role);

    const routes = await RouteHistory.aggregate([
      { $match: match },
      { $sort: { lastAt: -1 } },
      { $project: summary },
    ]);

    return res.status(200).json({ success: true, data: routes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
