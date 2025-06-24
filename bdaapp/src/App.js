import LoginScreen from './LoginScreen/LoginScreen';
import SignUpForm from './SignUpForm/SignUpForm';
import Dashboard from './Dashboard/Dashboard';
import { BrowserRouter, Routes, Route } from "react-router-dom";
function App() {
  return ( // Need to have return so your able to see what you have created when you run the app
      <BrowserRouter>
      <Routes>
        <Route path='/Dashboard' element ={<Dashboard/>}/>
        <Route index element = {<LoginScreen />}/>

      </Routes>
      </BrowserRouter>
  );
}

export default App;
