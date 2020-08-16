const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const players = {
  1: false,
  2: false,
  3: false,
};

const stick = {
  x: 0.5,
  y: 0.5,
}

const getStickAction = () => {
  return `SET MAIN ${stick.x} ${stick.y}`;
}

const path = '/Users/ianleeds/Library/Application Support/Dolphin/Pipes/pipe'.replace(/ /g, '\\ ');

app.get('/api/players', (req, res) => {
  res.send({ players });
});

app.post('/api/register', (req, res) => {
  const { player } = req.body;
  let success = false;
  if (!players[player]) {
    players[player] = true;
    success = true;
  }
  res.send({ players, success });
});

app.post('/api/leave', (req, res) => {
  const { player } = req.body;
  players[player] = false;
  res.send({ players });
});

app.post('/api/input', (req, res) => {
  const { key, press, player } =  req.body;

  const action = ((k, p) => {
    switch(k) {
      case 'a':
        if (p) {
          return 'PRESS A';
        }
        return 'RELEASE A';
      case 'b':
        if (p) {
          return 'PRESS B';
        }
        return 'RELEASE B';
      case 'arrowup':
        if (p) {
          stick.y = 0;
          return getStickAction();
        }
        stick.y = 0.5;
        return getStickAction();
      case 'arrowdown':
        if (p) {
          stick.y = 1;
          return getStickAction();
        }
        stick.y = 0.5;
        return getStickAction();
      case 'arrowleft':
        if (p) {
          stick.x = 0;
          return getStickAction();
        }
        stick.x = 0.5;
        return getStickAction();
      case 'arrowright':
        if (p) {
          stick.x = 1;
          return getStickAction();
        }
        stick.x = 0.5;
        return getStickAction();
      case 'enter':
        if (p) {
          return 'PRESS START';
        }
        return 'RELEASE START';
      default:
        return null;
    }
  })(key, press);

  if (action) {
    exec(`echo '${action}' > ${path}${player}`, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(action);
    });

    res.send(
      `${key}, ${press}, ${player}`,
    );
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));