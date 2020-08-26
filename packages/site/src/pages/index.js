import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'

import Layout from '../components/layout'
import { SEO } from '../components/seo'
import Img from 'gatsby-image'

import TextLoop from 'react-text-loop'
import './index.css'
import { Particles } from '../components/particles'
import { Heart } from 'react-feather'

const IndexPage = () => {
  const appImage = useStaticQuery(graphql`
    query {
      placeholderImage: file(relativePath: { eq: "app.png" }) {
        childImageSharp {
          fluid(maxWidth: 3000) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return (
    <Layout>
      <SEO />

      <div className="body">
        <Particles className="home-particles" />

        <div className="home-content">
          <pre className="text">
            <span>
              Giterm <Heart size="0.6em" fill="red" stroke="red" />{' '}
            </span>
            <TextLoop
              interval={2000}
              adjustingSpeed={300}
              springConfig={{ stiffness: 200, damping: 20 }}>
              <span>Terminal</span>
              <span>GUI</span>
              <span>Git</span>
            </TextLoop>
          </pre>

          <Img
            className="home-appimage"
            imgStyle={{ objectFit: 'contain' }}
            objectFit="contain"
            objectPosition="50% 100%"
            fluid={appImage.placeholderImage.childImageSharp.fluid}
          />
        </div>
      </div>
    </Layout>
  )
}

export default IndexPage
