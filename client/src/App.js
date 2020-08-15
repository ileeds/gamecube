import React, { Component } from 'react';
import styled from 'styled-components'
import { capitalize, lowerCase, map } from 'lodash';

import logo from './logo.svg';
import './App.css';

const Container = styled.div`
  margin: 20px;
  display: flex;
  justify-content: space-between;
`;

const GameButton = styled.div`
  border-radius: 100%;
  text-align: center;
  line-height: 80px;
  width: 80px;
  height: 80px;
  background-color: ${({ pressed }) => pressed ? "green" : "gray" };
`;

const PlayerBlock = styled.div`
  border-radius: 100%;
  text-align: center;
  line-height: 80px;
  width: 80px;
  height: 80px;
  background-color: ${({ selected }) => selected ? "gray" : "green" };
`;

const ButtonText = styled.span`
  line-height: normal;
  display: inline-block;
  vertical-align: middle;
`;

const defaultState = {
  players: null,
  myPlayer: null,
  responseToPost: '',
  pressed: {
    a: false,
    b: false,
    arrowup: false,
    arrowdown: false,
    arrowleft: false,
    arrowright: false,
  },
};

class App extends Component {
  state = defaultState;
  
  componentDidMount() {
    this.getPlayers().then(res => this.setState({ players: res.players }))
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener('beforeunload', this.handleLeave);
  };

  getPlayers = async () => {
    const response = await fetch('/api/players');
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    
    return body;
  };

  handleKeyDown = async e => {
    const key = lowerCase(e.key).replace(/\s/g, '');
    console.log(key)
    
    if (this.state.pressed[key] !== undefined && !this.state.pressed[key]) {
      this.setState({ pressed: {
        ...this.state.pressed,
        [key]: true,
      }});
  
      const response = await fetch('/api/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          press: true,
          player: this.state.myPlayer,
        }),
      });
      const body = await response.text();
      
      this.setState({ responseToPost: body });
    }
  };

  handleKeyUp = async e => {
    const key = lowerCase(e.key).replace(/\s/g, '');

    if (this.state.pressed[key] !== undefined) {
      this.setState({ pressed: {
        ...this.state.pressed,
        [key]: false,
      }});
  
      const response = await fetch('/api/input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: key,
          press: false,
          player: this.state.myPlayer,
        }),
      });
      const body = await response.text();
      
      this.setState({ responseToPost: body });
    }
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
        }),
      });
      this.setState(defaultState);
      this.getPlayers().then(res => this.setState({ players: res.players }))
    }
  }

  selectPlayer = async key => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player: key,
      }),
    });
    const body = await response.json();
    console.log(body.players);

    if (body.success) {
      this.setState({ myPlayer: key });
    }

    this.setState({ players: body.players });
  }

  renderBody() {
    if (this.state.myPlayer) {
      return (
        <>
          <button onClick={this.handleLeave}>EXIT</button>
          {map(this.state.pressed, (val, key) => {
            return (
              <GameButton key={key} pressed={val}>
                <ButtonText>{capitalize(key.replace(/arrow/g, ''))}</ButtonText>
              </GameButton>
            );
          })}
        </>
      );
    } else {
      return map(this.state.players, (val, key) => {
        return (
          <PlayerBlock key={key} selected={val} onClick={() => this.selectPlayer(key)}>
            <ButtonText>{`Player ${key}`}</ButtonText>
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
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
        </header>
        <Container>
          {this.renderBody()}
        </Container>
      </div>
    );
  }
}

export default App;