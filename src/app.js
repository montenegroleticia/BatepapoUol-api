import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

let db;
const mongoClient = new MongoClient("mongodb://localhost:27017/");
mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err));

const participants = [];
const messages = [];
const now = new Date();
const hours = now.getHours().toString().padStart(2, "0");
const minutes = now.getMinutes().toString().padStart(2, "0");
const seconds = now.getSeconds().toString().padStart(2, "0");
const timeString = `${hours}:${minutes}:${seconds}`;

app.post("/participants", (req, res) => {
  const { name } = req.body;

  const findName = participants.filter((n) => n.name === name);
  if (findName.length != 0) return res.status(409).send("Usuário já existe!");

  participants.push({ name: name, lastStatus: Date.now() });
  messages.push({
    from: name,
    to: "Todos",
    text: "entra na sala...",
    type: "status",
    time: timeString,
  });
  res.sendStatus(201);
});

app.get("/participants", (req, res) => {
  res.send(participants);
});

app.post("/messages", (req, res) => {});

app.get("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

const PORT = 5000;
app.listen(PORT, () => console.log(`Rodando servidor na porta ${PORT}`));
