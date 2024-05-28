import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import FindARoom from './pages/FindARoom'
import Room from './pages/Room'

function App() {

  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/find-a-room" element={<FindARoom />}></Route>
          <Route path="/room/:roomId" element = {<Room />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
