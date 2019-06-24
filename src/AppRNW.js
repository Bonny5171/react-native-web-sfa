import React, { Component } from 'react';
import { Text } from 'react-native';
import App from './App';

class AppRNW extends Component {
  state = {
    isLoggedIn: false
  };

  render() {
    return (
        <App isLoggedIn={this.state.isLoggedIn} />
    );
  }
}

export default AppRNW;
