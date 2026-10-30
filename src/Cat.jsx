// Kucing duduk (gambar orisinal) dengan animasi: ekor, kedip, telinga, napas
export default function Cat() {
  return (
    <div className="cat" aria-hidden="true">
      <svg viewBox="0 0 170 190" width="100%" height="100%">
        <g className="cat-tail">
          <path d="M118 158 C 156 160, 166 118, 142 100" fill="none" stroke="#b8a1f5" strokeWidth="15" strokeLinecap="round" />
          <path d="M142 100 C 138 96, 136 94, 134 93" fill="none" stroke="#f5f3ff" strokeWidth="15" strokeLinecap="round" />
        </g>

        <ellipse cx="82" cy="140" rx="44" ry="42" fill="#c4b5fd" />
        <ellipse cx="82" cy="150" rx="25" ry="29" fill="#f5f3ff" />
        <ellipse cx="62" cy="178" rx="15" ry="8" fill="#f5f3ff" stroke="#b8a1f5" strokeWidth="2" />
        <ellipse cx="102" cy="178" rx="15" ry="8" fill="#f5f3ff" stroke="#b8a1f5" strokeWidth="2" />

        <g className="cat-head">
          <g className="cat-ear-l">
            <polygon points="48,60 50,26 78,48" fill="#c4b5fd" />
            <polygon points="54,52 54,36 68,47" fill="#f0abfc" />
          </g>
          <polygon points="116,60 114,26 86,48" fill="#c4b5fd" />
          <polygon points="110,52 110,36 96,47" fill="#f0abfc" />

          <circle cx="82" cy="80" r="37" fill="#c4b5fd" />
          <ellipse cx="82" cy="92" rx="20" ry="15" fill="#f5f3ff" />

          <g className="cat-eyes">
            <ellipse cx="67" cy="78" rx="5.5" ry="7.5" fill="#2e1065" />
            <ellipse cx="97" cy="78" rx="5.5" ry="7.5" fill="#2e1065" />
            <circle cx="69" cy="75" r="1.8" fill="#fff" />
            <circle cx="99" cy="75" r="1.8" fill="#fff" />
          </g>

          <circle cx="53" cy="92" r="6" fill="#f9a8d4" opacity="0.55" />
          <circle cx="111" cy="92" r="6" fill="#f9a8d4" opacity="0.55" />

          <path d="M78 89 L86 89 L82 94 Z" fill="#f472b6" />
          <path d="M82 94 q-5 7 -11 3 M82 94 q5 7 11 3" fill="none" stroke="#5b21b6" strokeWidth="1.6" strokeLinecap="round" />

          <g stroke="#7c3aed" strokeWidth="1.2" strokeLinecap="round" opacity="0.6">
            <path d="M58 92 L36 88 M58 96 L37 100" />
            <path d="M106 92 L128 88 M106 96 L127 100" />
          </g>
        </g>
      </svg>
    </div>
  )
}
