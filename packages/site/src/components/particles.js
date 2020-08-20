import React from 'react'
import TSParticles from 'react-tsparticles'

export const Particles = (props) => (
  <TSParticles
    {...props}
    style={{ zIndex: -100, pointerEvents: 'none' }}
    options={{
      background: {
        color: {
          value: 'transparent',
        },
      },
      fpsLimit: 60,
      interactivity: {
        detectsOn: 'canvas',
        events: {
          // onClick: {
          //   enable: true,
          //   mode: 'push',
          // },
          // onHover: {
          //   enable: true,
          //   mode: 'repulse',
          // },
          // onDiv: {
          //   enable: true,
          //   mode: 'repulse',
          //   type: 'rectangle',
          //   ids: ['particle-repulse']
          // },
          resize: true,
        },
        modes: {
          bubble: {
            distance: 400,
            duration: 2,
            opacity: 0.8,
            size: 40,
          },
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 5000,
            duration: 5,
          },
        },
      },
      particles: {
        color: {
          value: [
            '#058ED9',
            '#880044',
            '#875053',
            '#129490',
            '#E5A823',
            '#0055A2',
            '#96C5F7',
          ],
        },
        links: {
          color: '#ffffff',
          distance: 100,
          enable: true,
          opacity: 0.3,
          width: 1,
        },
        collisions: {
          enable: true,
        },
        move: {
          direction: 'none',
          enable: true,
          outMode: 'bounce',
          random: false,
          speed: 2,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            value_area: 500,
          },
          value: 30,
        },
        opacity: {
          value: 0.3,
        },
        shape: {
          type: 'circle',
        },
        size: {
          random: false,
          value: 4,
        },
      },
      detectRetina: true,
    }}
  />
)
