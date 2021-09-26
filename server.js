const express = require("express");
const logger = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3000;

const db = require("./models");

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/workout", { useNewUrlParser: true });

app.get("/exercise", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/exercise.html"))
});

app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/stats.html"))
});

app.get("/api/workouts", (req, res) => {
  db.Workout.find({})
  .then(dbWorkout => {
    res.json(dbWorkout);
  })
  .catch(err => {
    res.json(err);
  });
});

app.post("/api/workouts", ({body}, res) => {
  db.Workout.create(body)
    .then(dbWorkout => {
      res.json(dbWorkout);
      console.log("Workout created");
    })
    .catch(err => {
      res.json(err);
    });
});

app.put("/api/workouts/:id", ({body, params}, res) => {
  console.log(body, params);
  db.Workout.findByIdAndUpdate({ _id: params.id }, { $push: { exercises: body } }, { new: true })
    .then(dbWorkout => {
      res.json(dbWorkout);
    })
    .catch(err => {
      res.json(err);
    });
  });

app.get("/api/workouts/range", (req, res) => {

  db.Workout.aggregate(
    [
      {
        $addFields: {
          totalDuration: { $sum: "$exercises.duration"},
          dateDifference: {
            $subtract: [new Date(), "$day"],
          },
        }
      },
    ],
  )
  //Sort and then limit
  .then(dbWorkout => {
    res.json(dbWorkout);
  })
  .catch(err => {
    res.json(err);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
