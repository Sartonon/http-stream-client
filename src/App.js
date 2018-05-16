import React, { Component } from 'react';
import http from 'stream-http';
import axios from 'axios';
import './App.css';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

class App extends Component {
  state = {
    messages: [],
    username: "",
    usernameConfirmed: false,
    message: "",
    color: 0,
  };

  componentWillUnmount() {
    this.messagesRequest.abort();
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.usernameConfirmed && this.state.usernameConfirmed) {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }

    if (this.state.messages.length > 10) {
      this.setState({ messages: [] });
    }
  }

  getPastMessages = async () => {
    const { data } = await axios.get("http://httpstream.sartonon.fi/api/pastMessages");
    this.setState({ messages: data });
  };

  getMessages = async () => {
    try {
      this.messagesRequest = http.get('http://httpstream.sartonon.fi/api/messages', res => {
        console.log("Connection Opened");
        res.on('data', buf => {
          if (buf.toString() !== "Connection open") {
            try {
              console.log(buf.toString());
              this.handleMessage(JSON.parse(buf.toString()));
            } catch (err) {
              console.log(err);
            }
          }
        });
      
        res.on('end', () => {
          console.log("End connection");
          try {
            this.getMessages();
          } catch (err) {
            console.log("Reconnecting failed: ", err);
          }
        });

        res.on('error', () => {
          console.log("Connection error");
          try {
            this.getMessages();
          } catch (err) {
            console.log("Reconnecting failed: ", err);
          }
        });
      })
    } catch (err) {
      console.log("error in request: ", err);
      this.getMessages();
    }
  };

  sendMessage = (e) => {
    e.preventDefault();
    axios.post("http://httpstream.sartonon.fi/api/messages", {
      name: this.state.username,
      message: this.state.message,
      color: this.state.color,
    });
    this.setState({ message: "" });
  };

  handleMessage = data => {
    this.setState({ messages: [ ...this.state.messages, data ] });
    setTimeout(() => {
      const objDiv = document.getElementById("chatwindow");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }, 200);
  };

  changeUsername = (e) => {
    this.setState({ username: e.target.value })
  };

  confirmUsername = () => {
    this.setState({
      usernameConfirmed: true,
      color: `rgb(${getRandomInt(255)}, ${getRandomInt(255)}, ${getRandomInt(255)})`,
    });
    // this.getPastMessages();

    try {
      this.getMessages();
    } catch (err) {
      console.log(err);
    }
  };

  handleMessageChange = (e) => {
    this.setState({ message: e.target.value });
  };

  startSending = () => {
    if (this.messageInterval) clearInterval(this.messageInterval);
    this.messageInterval = setInterval(() => {
      axios.post("http://httpstream.sartonon.fi/api/messages", {
        name: 'Santeri',
        message: 'Moikka!',
        color: 'green',
      });
    }, this.state.interval || 1000);
  };

  renderMessages = () => {
    return this.state.messages.map((message, i) => {
      return (
        <div className="Message-wrapper" key={i}>
          <div className="Message-block" key={i} style={{ float: message.name === this.state.username ? "right" : "left" }}>
            <div className="Message-name" style={{ color: message.color }}>{message.name}</div>
            <div className="Message-content">{message.message}</div>
          </div>
        </div>
      );
    });
  };

  render() {
    const { usernameConfirmed } = this.state;

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Chat</h1>
          <button onClick={this.startSending}>Laheta</button>
          <input onChange={e => this.setState({ interval: e.target.value })} />
        </header>
        {!usernameConfirmed ?
          <div className="Login-div">
            <p style={{ fontWeight: "bold", fontSize: "16px" }}>Anna käyttäjänimi</p>
            <input className="Login-input" value={this.state.username} onChange={this.changeUsername} type="text" />
            <div className="Ok-button" onClick={this.confirmUsername}>Ok</div>
          </div> :
          <div className="Chat-window">
            <div id="chatwindow" className="Message-div">
              {this.renderMessages()}
            </div>
            <form onSubmit={this.sendMessage}>
              <div className="Chat-input">
                <input className="Chat-inputfield" onChange={this.handleMessageChange} value={this.state.message} type="text" />
                <div className="Send-button" onClick={this.sendMessage}>Lähetä</div>
              </div>
            </form>
          </div>
        }
      </div>
    );
  }
}

export default App;