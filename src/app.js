import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/participants", (req, res) => {
  const { name } = req.body;

  database
    .collection("participants")
    .findOne(name)
    .then(() => res.sendStatus(201))
    .catch((err) => res.status(500).send(err.message));

  const findName = participants.filter((n) => n.name === name);
  if (findName.length != 0) return res.status(409).send("Usuário já existe!");

  database
    .collection("participants")
    .insertOne({ name: name, lastStatus: Date.now() })
    .then(() => res.sendStatus(201))
    .catch((err) => res.status(500).send(err.message));

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

  res.sendStatus(201);
});

app.get("/participants", (req, res) => {
  database
    .collection("participants")
    .find()
    .toArray()
    .then((participants) => res.send(participants))
    .catch((err) => res.status(500).send(err.message));
});

app.post("/messages", (req, res) => {});

app.get("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

const PORT = 5000;
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`));
