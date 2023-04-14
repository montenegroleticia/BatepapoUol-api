import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

let database;
const mongoClient = new MongoClient(process.env.DATABASE_URL);
mongoClient
  .connect()
  .then(() => (database = mongoClient.db()))
  .catch((err) => console.log(err));

const now = new Date();
const hours = now.getHours().toString().padStart(2, "0");
const minutes = now.getMinutes().toString().padStart(2, "0");
const seconds = now.getSeconds().toString().padStart(2, "0");
const timeString = `${hours}:${minutes}:${seconds}`;

function removeInactiveParticipants() {
  const inactiveTime = 10000;
  const query = { lastStatus: { $lt: Date.now() - inactiveTime } };

  database
    .collection("participants")
    .find(query, { projection: { name: 1 } })
    .toArray()
    .then((participants) => {
      const names = participants.map((p) => p.name);
      return database
        .collection("participants")
        .deleteMany(query)
        .then(() => names);
    })
    .then((names) => {
      const messages = names.map((name) => ({
        from: name,
        to: "Todos",
        text: "sai da sala...",
        type: "status",
        time: timeString,
      }));
      return database.collection("messages").insertMany(messages);
    })
    .catch((err) => {
      res.status(500).send(err.message);
    });
}

app.post("/participants", (req, res) => {
  const { name } = req.body;

  database
    .collection("participants")
    .findOne({ name: name })
    .then((participant) => {
      if (participant) {
        res.status(409).send("Usuário já existe!");
      } else {
        return database
          .collection("participants")
          .insertOne({ name: name, lastStatus: Date.now() })
          .then(() => {
            database
              .collection("messages")
              .insertOne({
                from: name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: timeString,
              })
              .then(() => res.sendStatus(201))
              .catch((err) => res.status(500).send(err.message));
          })
          .catch((err) => res.status(500).send(err.message));
      }
    })
    .catch((err) => res.status(500).send(err.message));
});

app.get("/participants", (req, res) => {
  database
    .collection("participants")
    .find()
    .toArray()
    .then((participants) => res.send(participants))
    .catch((err) => res.status(500).send(err.message));
});

app.post("/messages", (req, res) => {
  const { user } = req.headers;
  const { to, text, type } = req.body;

  database
    .collection("participants")
    .findOne({ name: user })
    .then(() => {
      database
        .collection("messages")
        .insertOne({
          from: user,
          to: to,
          text: text,
          type: type,
          time: timeString,
        })
        .then(() => res.sendStatus(201))
        .catch((err) => res.status(500).send(err.message));
    })
    .catch((err) => res.status(500).send(err.message));
});

app.get("/messages", (req, res) => {
  const { user } = req.headers;
  const { limit } = req.query;

  if (limit && limit < 1) {
    return res.status(422).send("Informe uma página válida!");
  }

  const query = { $or: [{ to: user }, { to: "todos" }], type: "message" };
  const options = { sort: { time: -1 }, limit: limit ? parseInt(limit) : 100 };

  database
    .collection("messages")
    .find(query, options)
    .toArray()
    .then((messages) => res.send(messages.reverse()))
    .catch((err) => res.status(500).send(err.message));
});

app.post("/status", (req, res) => {
  const { user } = req.headers;

  database
    .collection("participants")
    .findOneAndUpdate({ name: user }, { $set: { lastStatus: Date.now() } })
    .then((participant) => {
      if (participant.value) {
        res.sendStatus(200);
      } else {
        res.sendStatus(404);
      }
    })
    .catch((err) => res.status(500).send(err.message));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`));

setInterval(removeInactiveParticipants, 15000);
