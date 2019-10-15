const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const mongodb = require('mongodb');
require('dotenv').config();
const mongoose = require('mongoose');
const cors = require('cors');

const {ObjectID} = mongodb;

const salt = bcrypt.genSaltSync(10);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

mongoose.connect(`mongodb+srv://${process.env.URI}`, {
  useNewUrlParser: true,
  useCreateIndex: true
});

const User = mongoose.model('User', {
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  entries: {
    type: Number,
    default: 0
  }
})

const port = 3000;


app.get('/', (req, res) => {
  let data = User.find()
  data
    .then(response => {
      if (response !== []) {
        res.json(response);
      } else {
        res.json('Did not find any documents');
      }
    })
    .catch((err) => res.json('Error'));
});

app.get('/profile/:id', (req, res) => {
  const { id } = req.params;
  User.findOne({
    _id: new ObjectID(id)
  }, (err, data) => {
    if (err) {
    } else if (data !== null) {
      res.json(data);
    } else {
      res.json('User not found');
    }
  });
});

app.post('/signin', (req, res) => {
  let password = req.body.password;
  User.findOne({
    email: req.body.email
  })
    .then(response => {
      if (response !== null) {
        bcrypt.compare(password, response.password, (err, data) => {
          if (data) {
            res.json(response)
          } else {
            res.json('Failed')
          }
        })
      } else {
        res.json('User does not exist');
      }
    })
    .catch((err) => console.log(err))
});

app.post('/register', (req, res) => {
  let { name, email, entries, password } = req.body;
  password  = bcrypt.hashSync(password, salt);

  const user = new User({
      name,
      email,
      password,
      entries
  });
  user.save();
  res.json(user)
});

app.put('/image/:id', (req, res) => {
  const { id } = req.params;
  User.updateOne({
    _id: new ObjectID(id)
  }, {
    $inc: {
      entries: 1
    }
  })
    .then(response => {
      if (response.n !== 0) {
        User.findOne({
          _id: new ObjectID(id)
        })
          .then(response => {
            res.json(response.entries);
          })
          .catch((err) => res.json(err));
      } else {
        res.json('Could not find the user');
      }
    })
    .catch((err) => res.json('Could not find user'))
});

app.listen(port, () => {
  console.log('Listening on 3000');
})
/*

  / --> res = this is working
  /signin --> POST = success/fail
  /register --> POST = return {user} object that was saved in database
  /profile/:userid --> GET = get {user} object from database
  /image --> PUT --> return updated {user} object

 */
