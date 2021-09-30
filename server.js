const express = require("express");
const logger = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const PORT = process.env.PORT || 3001;

const db = require("./models");

const app = express();

app.use(logger("dev"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));

//Connect to mongoose
mongoose.connect(
  //change to connection to Atlas
  process.env.MONGODB_URI || 'mongodb://localhost/whispering-coast-55644',
  //process.env.MONGODB_URI || 'mongodb://localhost/workout',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  }
);

//Return the exercise html page
app.get("/exercise", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/exercise.html"))
});

//Return the stats html page
app.get("/stats", (req, res) => {
  res.sendFile(path.join(__dirname + "/public/stats.html"))
});

//Create a new workout
app.post("/api/workouts", ({body}, res) => {
  db.Workout.create(body)
    .then(dbWorkout => {
      res.json(dbWorkout);
      console.log("Workout created");
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

//Find a workout using the id and push the workout data to it
app.put("/api/workouts/:id", ({body, params}, res) => {
  db.Workout.findByIdAndUpdate(params.id, { $push: {exercises: body} }, { new: true })
    .then(dbWorkout => {
      res.json(dbWorkout);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

//Get all the workouts data
app.get("/api/workouts", (req, res) => {
  db.Workout.find({})
  .then(dbWorkout => {
    res.json(dbWorkout);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

//Sum duration and look at last 7 days descending
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
  .sort({day: -1})
  .limit(7)
  .then(dbWorkout => {
    res.json(dbWorkout);
  })
  .catch(err => {
    res.status(500).json(err);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});
