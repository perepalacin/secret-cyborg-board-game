import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import FindARoom from './pages/FindARoom'
import Room from './pages/Room'
import '@fontsource-variable/work-sans';


function App() {

  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/find-a-room" element={<FindARoom />}></Route>
          <Route path="/room/:roomId" element = {<Room />}></Route>
        </Routes>
    </BrowserRouter>
  )
}

export default App
