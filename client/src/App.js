import React, { Component } from 'react';
import styled from 'styled-components'
import Gamepad from 'react-gamepad'
import { capitalize, lowerCase, map, omitBy } from 'lodash';

import logo from './logo.svg';
import './App.css';

const roomSrc = 'https://www.webrtc-experiment.com/screen/?s=8hzap5374s';

const Container = styled.div`
  height: 100%;
`;

const GamepadText = styled.div`
  flex: 0 0 100%;
  margin-top: 20px;
  font-weight: bold;
`;

const Stream = styled.iframe`
  flex: 0 0 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const GameContainer = styled.div`
  margin: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
`;

const GameButton = styled.div`
  border-radius: 100%;
  text-align: center;
  line-height: 80px;
  width: 80px;
  height: 80px;
  margin: auto;
  background-color: ${({ pressed, toAssign }) => {
    if (toAssign) {
      return 'blue';
    }
    if (pressed) {
      return 'green';
    }
    return 'gray';
  }};
`;

const ExitButton = styled.button`
  border-radius: 100%;
  text-align: center;
  line-height: 80px;
  width: 80px;
  height: 80px;
  color: white;
  background-color: red;
  font-weight: bold;
`;

const PlayerBlock = styled.div`
  border-radius: 100%;
  text-align: center;
  line-height: 80px;
  width: 80px;
  height: 80px;
  color: white;
  background-color: ${({ selected }) => selected ? 'gray' : 'green'};
`;

const ButtonText = styled.span`
  line-height: normal;
  color: white;
  display: inline-block;
  vertical-align: middle;
  font-weight: bold;
  margin: auto;
`;

const defaultState = {
  players: null,
  myPlayer: null,
  responseToPost: '',
  pressed: {
    a: false,
    b: false,
    x: false,
    y: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
    z: false,
    l: false,
    r: false,
    enter: false,
  },
  keyMappings: {
    a: 'a',
    b: 'b',
    x: 'x',
    y: 'y',
    arrowup: 'arrowup',
    arrowdown: 'arrowdown',
    arrowleft: 'arrowleft',
    arrowright: 'arrowright',
    z: 'z',
    l: 'l',
    r: 'r',
    enter: 'enter'
  },
  toAssign: null,
  gamepad: false,
};

class App extends Component {
  state = defaultState;

  componentDidMount() {
    this.getPlayers().then(res => this.setState({ players: res.players }));

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);

    window.addEventListener('beforeunload', this.handleLeave);
  }

  getPlayers = async () => {
    const response = await fetch('/api/players');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);

    return body;
  };

  connectHandler = () => {
    this.setState({ gamepad: true });
  }
 
  disconnectHandler = () => {
    this.setState({ gamepad: false });
  }
 
  buttonChangeHandler = async (buttonName, down) => {
    const key = (name => {
      switch(name) {
        case 'B':
          return 'a';
        case 'X':
          return 'b';
        case 'A':
          return 'x';
        case 'RB':
          return 'r';
        case 'LB':
          return 'l';
        case 'Start':
          return 'enter';
        case 'RT':
          return 'z';
        default:
          return name;
      }
    })(buttonName);
    if (down) {
      await this.onKeyDown(key);
    } else {
      await this.onKeyUp(key);
    }
  }
 
  axisChangeHandler = async (axisName, value, previousValue) => {
    const key = ((name, val, prev) => {
      switch(name) {
        case 'LeftStickX':
          if (val > 0) {
            return 'arrowright';
          } else if (val < 0) {
            return 'arrowleft';
          }
          return prev > 0 ? 'arrowright' : 'arrowleft';
        case 'LeftStickY':
          if (val > 0) {
            return 'arrowup';
          } else if (val < 0) {
            return 'arrowdown';
          }
          return prev > 0 ? 'arrowup' : 'arrowdown';
        default:
          return name;
      }
    })(axisName, value, previousValue);
    value === 0 ? await this.onKeyUp(key) : await this.onKeyDown(key, value);
  }

  onKeyDown = async (keyInput, axisValue = null) => {
    const key = lowerCase(keyInput).replace(/\s/g, '');
    if (this.state.toAssign && !(key in this.state.keyMappings)) {
      const newKeyMappings = omitBy(this.state.keyMappings, val => {
        return val === this.state.toAssign;
      });
      this.setState({
        keyMappings: {
          ...newKeyMappings,
          [key]: this.state.toAssign,
        },
        toAssign: null,
      });
      return;
    }

    if (key in this.state.keyMappings) {
      const triggered = this.state.keyMappings[key];

      if (!this.state.pressed[triggered]) {
        this.setState({
          pressed: {
            ...this.state.pressed,
            [triggered]: true,
          }
        });

        const response = await fetch('/api/input', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: triggered,
            press: true,
            player: this.state.myPlayer,
            axisValue: axisValue,
          })
        });
        const body = await response.text();

        this.setState({ responseToPost: body });
      }
    }
  }

  onKeyUp = async (keyInput) => {
    const key = lowerCase(keyInput).replace(/\s/g, '');
    if (key in this.state.keyMappings) {
      const triggered = this.state.keyMappings[key];

      this.setState({
        pressed: {
          ...this.state.pressed,
          [triggered]: false,
        }
      });

      const response = await fetch('/api/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: triggered,
          press: false,
          player: this.state.myPlayer,
        })
      });
      const body = await response.text();

      this.setState({ responseToPost: body });
    }
  }

  handleKeyDown = async e => {
    if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
      e.preventDefault();
    }
    
    await this.onKeyDown(e.key);
  };

  handleKeyUp = async e => {
    await this.onKeyUp(e.key);
  };

  handleLeave = async e => {
    if (this.state.myPlayer) {
      await fetch('/api/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: this.state.myPlayer,
        })
      });
      this.setState({ ...defaultState });
      this.getPlayers().then(res => this.setState({ players: res.players }));
    }
  };

  selectPlayer = async key => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player: key,
      })
    });
    const body = await response.json();

    if (body.success) {
      this.setState({ myPlayer: key });
    }

    this.setState({ players: body.players });
  };

  handleReassign = (e, key) => {
    e.stopPropagation();
    this.setState({ toAssign: this.state.keyMappings[key] });
  };

  clearReassign = () => {
    this.setState({ toAssign: null });
  };

  getCleanName = text => {
    return capitalize(text.replace(/arrow/g, ''));
  };

  getButtonText = key => {
    const reassigned = this.state.keyMappings[key];
    const keyName = this.getCleanName(key);
    if (reassigned !== key) {
      return `${this.getCleanName(reassigned)} (${keyName})`;
    }
    return keyName;
  };

  renderBody() {
    if (this.state.myPlayer) {
      return (
        <>
          <Stream
            width="100%"
            height="525"
            src={roomSrc}
            frameborder="0"
            allowfullscreen
          />
          <ButtonContainer>
            <ExitButton onClick={this.handleLeave}>EXIT</ExitButton>
            {map(this.state.keyMappings, (val, key) => {
              return (
                <GameButton
                  key={key}
                  pressed={this.state.pressed[val]}
                  toAssign={val === this.state.toAssign}
                  onClick={e => this.handleReassign(e, key)}
                >
                  <ButtonText>{this.getButtonText(key)}</ButtonText>
                </GameButton>
              );
            })}
          </ButtonContainer>
        </>
      );
    } else {
      return map(this.state.players, (val, key) => {
        return (
          <PlayerBlock
            key={key}
            selected={val}
            onClick={() => this.selectPlayer(key)}
          >
            <ButtonText>{`Player ${parseInt(key) + 1}`}</ButtonText>
          </PlayerBlock>
        );
      });
    }
  }

  render() {
    console.log(this.state);

    if (!this.state.players) {
      return null;
    }

    return (
      <Container className="App" onClick={this.clearReassign}>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <Gamepad
          onConnect={this.connectHandler}
          onDisconnect={this.disconnectHandler}
          onButtonChange={this.buttonChangeHandler}
          onAxisChange={this.axisChangeHandler}
          stickThreshold={0.5}
        >
          <></>
        </Gamepad>
        <GameContainer>
          {this.renderBody()}
          {this.state.gamepad && <GamepadText>Gamepad Detected</GamepadText>}
        </GameContainer>
      </Container>
    );
  }
}

export default App;
