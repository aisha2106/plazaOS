import { useCallback, useEffect, useRef, useState } from 'react'
import { Lottie } from 'lottie-react'
import { Text } from '../components'
import { markIntroSeen } from './introSession'

const ANIMATION_PATH = '/animations/intro.json'
const ANIMATION_SPEED = 0.8
const LEAVE_TRANSITION_MS = 300

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const hasFinished = useRef(false)

  // The splash advances entirely on its own once the animation finishes —
  // no button, no gesture. It never navigates itself: onFinish just lets the
  // caller reveal whatever route is underneath.
  const finish = useCallback(() => {
    if (hasFinished.current) return
    hasFinished.current = true
    markIntroSeen()
    setIsLeaving(true)
    setTimeout(onFinish, LEAVE_TRANSITION_MS)
  }, [onFinish])

  // lottie-react silently refuses to autoplay under prefers-reduced-motion
  // (it recommends offering a control instead of starting motion for the
  // user) — with completion driven entirely by the animation's own
  // `complete` event, that would otherwise never fire and strand the user
  // on the splash forever. Advance immediately instead, same as the login
  // page's own reduced-motion handling.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
    }
  }, [finish])

  // Fetched and parsed here, rather than handed to <Lottie src="..."> as a
  // path: lottie-web's own XHR loader throws internally (an uncaught
  // InvalidStateError from a browser API restriction) when a dev-server SPA
  // fallback serves HTML for a missing file instead of a real 404. Parsing it
  // ourselves turns that into a plain, catchable rejection — and since
  // there's nothing to play in that case, that's also when we advance
  // instead of stalling on a blank screen forever.
  useEffect(() => {
    let cancelled = false
    fetch(ANIMATION_PATH)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('animation request failed'))))
      .then((data) => {
        if (!cancelled) setAnimationData(data)
      })
      .catch(() => {
        if (!cancelled) finish()
      })
    return () => {
      cancelled = true
    }
  }, [finish])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#16161F] transition-opacity duration-300 ${
        isLeaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl" />
          {animationData && (
            <Lottie
              src={animationData}
              autoplay
              loop={false}
              speed={ANIMATION_SPEED}
              className="h-96 w-96 md:h-[clamp(320px,52vh,560px)] md:w-[clamp(320px,52vh,560px)]"
              subscriptions={{ complete: finish }}
            />
          )}
        </div>
        <Text variant="h2" className="text-white">
          Everything organized
        </Text>
      </div>
    </div>
  )
}
