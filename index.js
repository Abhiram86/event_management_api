import express from "express";
import cors from "cors";
import eventsRouter from "./routes/event.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/events", eventsRouter);

app.get("/", (req, res) => res.send("Hello World!"));

app.listen(3000, () => console.log("Server is running on port 3000"));
