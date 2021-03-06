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
};

const playerSticks = {
  1: { ...stick },
  2: { ...stick },
  3: { ...stick },
};

const getStickAction = (stick) => {
  return `SET MAIN ${stick.x} ${stick.y}`;
};

const path = '/Users/ianleeds/Library/Application Support/Dolphin/Pipes/pipe'.replace(/ /g, '\\ ');

setInterval(() => {
  _.forEach(players, (date, key) => {
    if (date) {
      const pingDiff = (new Date().getTime() - date.getTime()) / 1000;
      if (pingDiff > 10) {
        players[key] = false;
        resetPlayer(key);
      }
    }
  });
}, 5000);

const resetPlayer = (player) => {
  playerSticks[player] = { ...stick };
  const action = getStickAction(playerSticks[player]);
  exec(`echo '${action}' > ${path}${player}`, (error, _stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
  });
};

app.post('/api/ping', (req, res) => {
  const { player } = req.body;
  players[player] = new Date();
  res.send({ message: 'pong' });
});

app.get('/api/players', (req, res) => {
  res.send({ players });
});

app.post('/api/register', (req, res) => {
  const { player } = req.body;
  let success = false;
  if (!players[player]) {
    players[player] = new Date();
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
  const { key, press, player, axisValue } =  req.body;

  const action = ((k, pr, stick, val) => {
    switch(k) {
      case 'a':
        if (pr) {
          return 'PRESS A';
        }
        return 'RELEASE A';
      case 'b':
        if (pr) {
          return 'PRESS B';
        }
        return 'RELEASE B';
      case 'arrowup':
        if (pr) {
          stick.y = val ? 0.5 - val : 0;
          return getStickAction(stick);
        }
        stick.y = 0.5;
        return getStickAction(stick);
      case 'arrowdown':
        if (pr) {
          stick.y = val ? 0.5 - val : 1;
          return getStickAction(stick);
        }
        stick.y = 0.5;
        return getStickAction(stick);
      case 'arrowleft':
        if (pr) {
          stick.x = val ? 0.5 + val : 0;
          return getStickAction(stick);
        }
        stick.x = 0.5;
        return getStickAction(stick);
      case 'arrowright':
        if (pr) {
          stick.x = val ? 0.5 + val : 1;
          return getStickAction(stick);
        }
        stick.x = 0.5;
        return getStickAction(stick);
      case 'enter':
        if (pr) {
          return 'PRESS START';
        }
        return 'RELEASE START';
      case 'z':
        if (pr) {
          return 'PRESS Z';
        }
        return 'RELEASE Z';
      case 'l':
        if (pr) {
          return 'PRESS L';
        }
        return 'RELEASE L';
      case 'r':
        if (pr) {
          return 'PRESS R';
        }
        return 'RELEASE R';
      default:
        return null;
    }
  })(key, press, playerSticks[player], axisValue);

  if (action) {
    exec(`echo '${action}' > ${path}${player}`, (error, _stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
    });

    console.log(action, player);

    res.send(
      `${key}, ${press}, ${player}`,
    );
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
