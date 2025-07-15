import express from "express";
import {
  getEvents,
  getEvent,
  cancelBooking,
  joinEvent,
  newEvent,
} from "../controllers/event.js";

const eventsRouter = express.Router();

eventsRouter.get("/", getEvents);
eventsRouter.get("/:event_id", getEvent);
eventsRouter.post("/", newEvent);
eventsRouter.post("/:event_id", joinEvent);
eventsRouter.delete("/cancel/:event_id", cancelBooking);

export default eventsRouter;
