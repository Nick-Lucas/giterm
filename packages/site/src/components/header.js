import React from 'react'
import { Link } from 'gatsby'

import { GitHub, Download, Heart } from 'react-feather'

import './header.css'
import GitermIcon from '../images/icon.svg'

export const Header = () => (
  <header className="header-container">
    <div className="header-item ">Giterm</div>
    <div className="header-item header-cull"><Heart className="icon-space" size="1rem" fill="red" stroke="red" /> Git</div>
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
