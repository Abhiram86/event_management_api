import pool from "../config/db.js";

export async function getEvents(req, res) {
  const { sortBy } = req.query;
  try {
    const events = await pool.query(
      "SELECT * FROM events WHERE starts_at > NOW();"
    );
    let sortedEvents = events.rows;

    if (sortBy) {
      sortedEvents = sortedEvents.sort((a, b) => {
        if (sortBy === "asc") {
          return new Date(a.starts_at) - new Date(b.starts_at);
        } else if (sortBy === "desc") {
          return new Date(b.starts_at) - new Date(a.starts_at);
        } else if (sortBy === "location") {
          return a.location.localeCompare(b.location);
        } else {
          return res.status(400).json({ error: `Invalid sortBy: ${sortBy}` });
        }
      });
      return res.status(200).json({
        events: sortedEvents,
      });
    }

    return res.status(200).json({
      events: sortedEvents,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getEvent(req, res) {
  const event_id = req.params.event_id;
  const fetchUsers = req.query.users;
  try {
    const resp = await pool.query("SELECT * FROM events WHERE id = $1;", [
      event_id,
    ]);

    if (resp.rows.length === 0) {
      return res.status(404).json({ error: "Event Not Found" });
    }

    const countResp = await pool.query(
      "SELECT COUNT(*) FROM booking WHERE event_id = $1;",
      [event_id]
    );

    resp.rows[0].booked = parseInt(countResp.rows[0].count);

    const remaining = parseInt(resp.rows[0].capacity) - resp.rows[0].booked;
    resp.rows[0].remaining = remaining;

    const percentCapacity = (resp.rows[0].booked / resp.rows[0].capacity) * 100;
    resp.rows[0].percentCapacity = percentCapacity;

    const users = [];

    if (fetchUsers) {
      const resp = await pool.query(
        `SELECT u.id, u.name, u.email
         FROM booking b
         JOIN users u ON b.user_id = u.id
         WHERE b.event_id = $1
        `,
        [event_id]
      );
      resp.rows.forEach((row) => {
        // console.log(row);
        users.push({
          id: row.id,
          name: row.name,
          email: row.email,
        });
      });
    }

    if (fetchUsers) {
      resp.rows[0].users = users;
    }
    return res.status(200).json(resp.rows[0]);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function newEvent(req, res) {
  const { title, starts_at, location, capacity } = req.body;
  if (!title || !starts_at || !location || !capacity) {
    return res.status(400).json({ error: "Bad Request" });
  }

  if (new Date(starts_at) < new Date()) {
    return res.status(400).json({ error: "Cannot create event in the past" });
  }

  if (parseInt(capacity) <= 0) {
    return res.status(400).json({ error: "Capacity must be greater than 0" });
  }

  try {
    await pool.query(
      "INSERT INTO events (title, starts_at, location, capacity) VALUES ($1, $2, $3, $4);",
      [title, starts_at, location, parseInt(capacity)]
    );
    return res.status(200).send("ok");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function joinEvent(req, res) {
  const { event_id } = req.params;
  const { user_id } = req.body;
  if (!user_id || !event_id) {
    return res.status(400).json({ error: "Bad Request" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventResp = await client.query(
      "SELECT capacity, starts_at FROM events WHERE id = $1 FOR UPDATE;",
      [event_id]
    );

    if (eventResp.rows.length === 0) {
      return res.status(404).json({ error: "Event Not Found" });
    }

    const existing = await client.query(
      "SELECT * FROM booking WHERE user_id = $1 AND event_id = $2;",
      [user_id, event_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Already Booked" });
    }

    const { capacity, starts_at } = eventResp.rows[0];

    if (new Date(starts_at) < new Date()) {
      return res.status(409).json({ error: "Cannot Join for past event" });
    }

    const countResp = await client.query(
      "SELECT COUNT(*) FROM booking WHERE event_id = $1;",
      [event_id]
    );

    if (parseInt(countResp.rows[0].count) >= capacity) {
      return res.status(409).json({ error: "Event is full" });
    }

    await client.query(
      "INSERT INTO booking (user_id, event_id) VALUES ($1, $2);",
      [user_id, event_id]
    );

    await client.query("COMMIT");
    res.status(200).send("ok");
  } catch (error) {
    console.error(error);
    client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ error: "Already Booked" });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}

export async function cancelBooking(req, res) {
  const { event_id } = req.params;
  const { user_id } = req.body;
  if (!user_id || !event_id) {
    return res.status(400).json({ error: "Bad Request" });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM booking WHERE user_id = $1 AND event_id = $2;",
      [user_id, event_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Booking Not Found" });
    }

    await pool.query(
      "DELETE FROM booking WHERE user_id = $1 AND event_id = $2;",
      [user_id, event_id]
    );

    res.status(200).send("ok");
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
