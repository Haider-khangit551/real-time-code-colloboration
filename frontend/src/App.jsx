import React, { useEffect } from 'react'
import './App.css'
import io from "socket.io-client"
import { useState } from 'react'
import Editor from '@monaco-editor/react'

const socket = io("http://localhost:8080")

const App = () => {

  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState('// START CODE HERE...');
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");


  useEffect(() => {

    socket.on("userJoined", (users) => {
      setUsers(users)
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode)
    })

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 6)}... is typing`)
      setTimeout(() => {
        setTyping("")
      }, 2000)
    })

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    })

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate")
    }

  }, [])


  useEffect(() => {

    const handleBeforeUnload = () => {
      socket.emit("leaveRoom")
    }

    window.addEventListener("beforeUnload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeUnload", handleBeforeUnload)
    }

  }, [])


  const joinRoom = () => {
    // console.log(roomId, userName)
    if (roomId && userName) {
      socket.emit("join", { roomId, userName })
      setJoined(true)
    }
  }


  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied to Clipboard");
    setTimeout(() => {
      setCopySuccess("")
    }, 2000);
  }


  const handleCodeChange = (newCode) => {
    setCode(newCode)
    socket.emit("codeChange", { roomId, code: newCode })
    socket.emit("typing", { roomId, userName })
  }


  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value
    setLanguage(newLanguage)
    socket.emit("languageChange", { roomId, language: newLanguage });
  }


  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("")
    setUserName("");
    setCode("")
    setLanguage("javascript");
  }

  if (!joined) {
    return <div className='join-container'>
      <div className="join-form">
        <h1>Join code room</h1>
        <input
          type="text"
          placeholder='Room Id'
          onChange={(e) => setRoomId(e.target.value)}
          value={roomId}
        />
        <input
          type="text"
          placeholder='Enter Your Name'
          onChange={(e) => setUserName(e.target.value)}
          value={userName}
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div >
  }

  return <div className='editor-container'>
    <div className="sidebar">
      <div className="room-info">
        <h2>Code Room: {roomId}</h2>
        <button className='copy-btn' onClick={copyRoomId}>COPY ROOM ID</button>
        {copySuccess && <span className='copy-msg'>{copySuccess}</span>}
      </div>
      <h1>Users in Room: </h1>
      <ul>
        {/* {users.map((user, index) => (
          <li key={index} >{user.slice(0, 8)}...</li>
        ))} */}


        {(users || []).map((user, index) => (
          <li key={index}>{user?.slice(0, 8)}...</li>
        ))}
      </ul>
      <p className='typing-indicator'>{typing}</p>
      <select
        className='language-selector'
        value={language}
        onChange={handleLanguageChange}
      >
        <option value="javascript">Javascript</option>
        <option value="python">Python</option>
        <option value="c++">C++</option>
      </select>
      <button onClick={leaveRoom} className="leave-button">Leave Room</button>
    </div>

    <div className="editor-wrapper">
      <Editor
        height={"100%"}
        // width={"100%"}
        defaultLanguage={language}
        language={language}
        value={code}
        onChange={handleCodeChange}
        theme='vs-dark'
        options={
          {
            minimap: { enabled: false },
            fontSize: 14
          }
        }
      />

    </div>

  </div>


}

export default App
