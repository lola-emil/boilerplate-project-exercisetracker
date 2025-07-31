const express = require('express')
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express()
const cors = require('cors')
require('dotenv').config()

mongoose.connect('mongodb://localhost:27017/exercisetracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});


const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res) => {
  const user = new User({ username: req.body.username });
  const saved = await user.save();
  res.json({ username: saved.username, _id: saved._id });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find({}, '_id username');
  res.json(users);
});



app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  const exercise = new Exercise({
    userId: user._id,
    description,
    duration: parseInt(duration),
    date: date ? new Date(date) : new Date()
  });

  const saved = await exercise.save();
  res.json({
    _id: user._id,
    username: user.username,
    date: saved.date.toDateString(),
    duration: saved.duration,
    description: saved.description
  });
});


app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const user = await User.findById(req.params._id);
  if (!user) return res.json({ error: 'User not found' });

  let query = { userId: user._id };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  let exercises = Exercise.find(query).select('description duration date');

  if (limit) {
    exercises = exercises.limit(parseInt(limit));
  }

  const logs = await exercises.exec();


  let kuan = logs.map(e => {
    return {
      description: e.description,
      duration: e.duration,
      date: new Date(e.date).toDateString()
    }
  })

  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: kuan
  });
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
