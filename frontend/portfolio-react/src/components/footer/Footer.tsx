import React from 'react'
import { Link } from 'react-router'
import Logo from '../../images/logo.png'

const Footer = (props) => {
  return (
    <div className="tp-site-footer text-center">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="footer-image">
              <Link className="logo" to="/"><img style={{ width: 100 }} src={Logo} alt="" className="App-Logo" /></Link>
            </div>
          </div>
          <div className="col-12">
            <div className="link-widget">
              <ul>
                <li><Link to="https://www.linkedin.com/in/fernando-vargas-16234254/"><i className="ti-linkedin"></i></Link></li>
              </ul>
            </div>
          </div>
          <div className="col-12">
            <div className="copyright">
              <p>© 2025. All rights reserved by Fernando Vargas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Footer;
