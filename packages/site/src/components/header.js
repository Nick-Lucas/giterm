import React from 'react'

import { GitHub, Download } from 'react-feather'

import './header.css'
import { AppIcon } from './AppIcon'

export const Header = () => (
  <header className="header-container">
    <AppIcon className="header-logo" />
    <div className="header-item header-cull">Giterm</div>
    {/* <Link className="header-logo" to="/">
      <img src={GitermIcon} />
    </Link> */}

    <div className="flex-fill" />

    <a
      className="header-item header-link"
      href="https://github.com/Nick-Lucas/giterm">
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
