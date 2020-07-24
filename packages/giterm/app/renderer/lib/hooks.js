import { useEffect, useRef } from 'react'

export function useValueEffect(value, onEffect) {
  const ref = useRef(value)
  useEffect(() => {
    if (ref.current !== value) {
      ref.current = value
      onEffect()
    }
  }, [onEffect, value])
}
