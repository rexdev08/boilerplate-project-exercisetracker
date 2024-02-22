const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

//DB connection
mongoose.connect(process.env.DB).then((data, err) => {
  if (err) {
    return console.error(err);
  }

  console.log("DB connection established!!");
});

//DB Schemas and Models

const excerciseSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    count: { type: Number, default: 0 },
    log: {
      type: [excerciseSchema],
    },
  },
  { versionKey: false }
);
const userModel = mongoose.model("user", userSchema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// creacion de usuarios
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  if (!username) {
    res.send("you have to provide a username!!");
  }

  userModel.create({ username }).then((doc) => {
    res.json({ username: doc.username, _id: doc._id });
  });
});

//creacion de ejecio
app.post("/api/users/:_id/exercises", (req, res) => {
  let { description, duration } = req.body;

  let exerciseData = {
    date: req.body.date
      ? new Date(req.body.date).toDateString()
      : new Date(Date.now()).toDateString(),
    description,
    duration: parseInt(duration),
  };
  userModel
    .findByIdAndUpdate(
      { _id: req.params["_id"] },
      { $push: { log: exerciseData }, $inc: { count: 1 } },
      { new: true }
    )
    .then((documentoActualizado) => {
      const { username } = documentoActualizado;

      const { description, duration } =
        documentoActualizado.log[documentoActualizado.log.length - 1];

      const excerciseObj = {
        username,
        description,
        duration: parseInt(duration),
        date: documentoActualizado.log[documentoActualizado.log.length - 1]
          .date,
        _id: req.params["_id"],
      };

      return res.json(excerciseObj);
    })
    .catch((error) => {
      return res.send("excerices");
    });
});

//get user's logs

app.get("/api/users/:_id/logs", (req, res) => {
  userModel
    .findById(req.params["_id"])
    .select("-__v")
    .then((doc) => res.json(doc))
    .catch((err) => res.send("logs"));
});

//get user's info

app.get("/api/users", (req, res) => {
  userModel
    .find()
    .select("-count -log")
    .then((doc) => {
      return res.json(doc);
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
