import React from 'react'
import { Link } from 'gatsby'

import { GitHub, Download } from 'react-feather'

import './header.css'
import GitermIcon from '../images/icon.svg'

export const Header = () => (
  <header className="header-container">
    <div className="header-item ">Giterm</div>
    {/* <Link className="header-logo" to="/">
      <img src={GitermIcon} />
    </Link> */}

    <div className="flex-fill" />

    <a className="header-item header-link" href="https://github.com/Nick-Lucas/giterm">
      <GitHub size="1rem" /> GitHub
    </a>
    <a
      className="header-item header-link"
      href="https://github.com/Nick-Lucas/giterm/releases/latest">
      <Download size="1rem" /> Download
    </a>
  </header>
)

Header.propTypes = {}