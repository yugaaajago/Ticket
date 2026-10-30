import NetworkBg from './NetworkBg.jsx'
import Cat from './Cat.jsx'

export default function Background() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <NetworkBg />
      </div>
      <Cat />
    </>
  )
}
