interface SearchBarProps {
  query: string
  onChange: (q: string) => void
  placeholder?: string
  id: string
}

export function SearchBar({ query, onChange, placeholder = 'ค้นหา...', id }: SearchBarProps) {
  return (
    <div className="search-bar" role="search">
      <label htmlFor={id} className="search-bar__label">
        <span className="search-bar__icon" aria-hidden="true">🔍</span>
      </label>
      <input
        id={id}
        type="search"
        className="search-bar__input"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {query && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onChange('')}
          aria-label="ล้างการค้นหา"
        >
          ✕
        </button>
      )}
    </div>
  )
}
