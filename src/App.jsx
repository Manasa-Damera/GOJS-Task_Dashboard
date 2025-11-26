import { BrowserRouter as Router , Routes,Route } from 'react-router-dom';
import Diagram from "./Components/Diagram";
import Welcome from './Components/Welcome';
import Saved from './Components/Saved';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome/>}/>
        <Route path="/create" element={<Diagram />} />
        <Route path="/flows" element={<Saved/>} />
        <Route path="/flows/:id" element={<Diagram/>}/>
      </Routes>
    </Router>

  );
}

export default App;
