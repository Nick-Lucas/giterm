import React from 'react'
import { graphql, Link, useStaticQuery } from 'gatsby'

import Layout from '../components/layout'
import Img from 'gatsby-image'
import SEO from '../components/seo'

import TextLoop from 'react-text-loop'
import './index.css'
import { Particles } from '../components/particles'

const IndexPage = () => {
  const appImage = useStaticQuery(graphql`
    query {
      placeholderImage: file(relativePath: { eq: "app.png" }) {
        childImageSharp {
          fluid(maxWidth: 300) {
            ...GatsbyImageSharpFluid
          }
        }
      }
    }
  `)

  return (
    <Layout>
      <div className="body">
        {/* <Particles className="home-particles" /> */}

        <pre className="text">
          <span>Git for </span>
          <TextLoop interval={2000} adjustingSpeed={300} springConfig={{ stiffness: 100, damping: 15 }}>
            <span>GUI Lovers</span>
            <span>Terminal Lovers</span>
            <span>Git Lovers</span>
            {/* <span>Power Users</span>
            <span>Collaborators</span>
            <span>Visualizers</span> */}
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
    </Layout>
  )
}

export default IndexPage
