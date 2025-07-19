import { Link, useMatch, useResolvedPath } from "react-router-dom";
import './Navbar.css';
import BDPALogo from './BDPA Logo.png';

function Navbar() {
  return (
    <nav className="navbar">
      <header className="BDPA-name"> 
        <img src={BDPALogo} className="BDPA-logo" alt="beans"/>
        <h1>BDPA Drive</h1>
      </header>
      <ul>
        <li> <CustomLink to="/">Login</CustomLink> </li>
        <li> <CustomLink to="/SignUpForm">Signup</CustomLink> </li>
      </ul>
    </nav>    
  );
}

export default Navbar;

function CustomLink({to, children, ...props}) {
  const resolvedPath = useResolvedPath(to)
  const isActive = useMatch({ path : resolvedPath.pathname, end: true})
  return (
    
    <li className = {isActive ? "active" : ""}> 
      <Link to={to} {...props}>{children}</Link> 
    </li>
  )
}