import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import FindARoom from './pages/FindARoom'

function App() {

  return (
    <BrowserRouter>
      <div>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/find-a-room" element={<FindARoom />}></Route>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
