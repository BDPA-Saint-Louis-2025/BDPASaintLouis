import LoginScreen from './LoginScreen/LoginScreen';
import SignUpForm from './SignUpForm/SignUpForm';
import Dashboard from './Dashboard/Dashboard';
import Navbar from './Navbar/Navbar Authed'; 
//For now, you'll have to change this between Navbar Guests vs Navbar Authed for the view you want 
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return ( // Need to have return so your able to see what you have created when you run the app
      <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path='/Dashboard' element ={<Dashboard/>}/>
        <Route path='/SignUpForm' element ={<SignUpForm/>}/>
        <Route index element = {<LoginScreen />}/>

      </Routes>
      </BrowserRouter>
  );
}

export default App;
