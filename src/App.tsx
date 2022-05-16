import React from 'react';
import logo from './logo.svg';
import './App.css';

import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

listen('tauri://file-drop', event => {
  console.log(event)
  let files = (event.payload as string[]);
  if (files.length > 0)
    invoke('load_csv', { invokeMessage: files[0] })
})

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
