import React, { FC, useEffect, useRef, useState } from 'react'
import IssueClosed from "./IssueClosedIcon"
import IssueOpened from "./IssueOpenedIcon"
import Comment from "./CommentIcon"
import { FiltersProps, Issue } from '../types'
import { format } from "timeago.js"
import Labels from './Labels'
import "./Autocomplete.scss"
import { useDebouncedCallback } from 'use-debounce'
import { useOnClickOutside } from '../hooks'
import Filters from './Filters'

const Autocomplete: FC = () => {
  const [searchTerm, setSearchTem] = useState<string>("")
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [shouldShowResults, setShouldShowResults] = useState<boolean>(false)
  const [focusIndex, setFocusIndex] = useState<number>(-1)

  const inputSearchRef = useRef<HTMLInputElement>(null)
  let searchResultRefs = React.useRef(new Map())

  const [filters, setFilters] = useState({
    limit: 3,
    state: "open",
    labels: ""
  })

  enum KEY {
    ENTER = "Enter",
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown"
  }

  useEffect(() => {
    registerGlobalShortcuts()
  }, [])

  useEffect(() => {
    setIsLoading(false)
    lazySearch()
  }, [filters])

  function resetState() {
    setIsLoading(false)
    setFocusIndex(-1)
    searchResultRefs.current.clear()
  }

  function buildSearchQuery(): string {
    let query = `q=${searchTerm}`

    if (filters.labels) {
      query += filters.labels.split(",").filter(Boolean).map(label => `label:"${label}"`).join(" ")
    }

    if (filters.state) {
      query += `&state=${filters.state}`
    }

    if (filters.limit) {
      query += `&per_page=${filters.limit}`
    }

    return query;
  }

  useOnClickOutside(inputSearchRef, () => {
    setShouldShowResults(false)
    setFocusIndex(-1)
  })

  async function searchIssues() {
    if (!searchTerm) {
      return
    }
    try {
      searchResultRefs.current.clear()

      // const response = await fetch(`http://localhost:3001/issues?q=${searchTerm}`)
      const response = await fetch(`http://localhost:3002/issues?${buildSearchQuery()}`)
      let issuesResponse: Issue[] = await response.json()
      setIssues(issuesResponse)
      setShouldShowResults(issuesResponse.length > 0)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
      setFocusIndex(-1)
    }
  }

  function registerGlobalShortcuts() {
    document.onkeyup = ({ key: pressedKey }) => {
      const isInputFocused = document.activeElement === inputSearchRef.current
      const shouldFocusInput = pressedKey === "/" && !isInputFocused
      if (shouldFocusInput && inputSearchRef.current) {
        inputSearchRef.current.focus()
      }
    }
  }

  function handleKeyUp(event: any) {
    if (!issues.length) {
      return
    }

    const { key: pressedKey } = event
    if (Object.values(KEY).includes(pressedKey)) {
      event.preventDefault()
    }


    if (pressedKey === KEY.ENTER && getSearchResultRef(focusIndex)) {
      window.location.href = issues[focusIndex].html_url
      return
    }

    if (pressedKey === KEY.ARROW_UP) {
      const isFirstResult = (focusIndex - 1) === -1
      if (isFirstResult) {
        inputSearchRef.current?.focus()
        setFocusIndex(focusIndex - 1)
        return
      }

      if (getSearchResultRef(focusIndex - 1)) {
        getSearchResultRef(focusIndex - 1).focus()
        setFocusIndex(focusIndex - 1)
        return
      }
    }

    if (pressedKey === KEY.ARROW_DOWN) {
      if (getSearchResultRef(focusIndex + 1)) {
        getSearchResultRef(focusIndex + 1).focus()
        setFocusIndex(focusIndex + 1)
      }
    }
  }

  function getSearchResultRef(index: number): HTMLDivElement {
    return searchResultRefs.current.get(issues[index])
  }

  const lazySearch = useDebouncedCallback(() => searchIssues(), 350)

  function handleSearchChange(search: string) {
    setSearchTem(search)
    setIssues([])
    if (!search) {
      resetState()
      return
    }

    setIsLoading(true)
    lazySearch()
  }

  return (
    <>
      <Filters {...filters} filterUpdater={setFilters} />
      <div className="autocomplete-container" ref={inputSearchRef}>
        <input
          className="form-control"
          type="search"
          placeholder="Search..."
          onChange={(event) => handleSearchChange(event.target.value)}
          ref={inputSearchRef}
          onFocus={() => setShouldShowResults(true)}
          onKeyDown={(e) => handleKeyUp(e)}
          tabIndex={1}
        />

        <div className={`search-container ${!shouldShowResults ? 'hidden' : ''}`}>
          {isLoading && (<div className="search-result-card">
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </div>
          )}

          {issues.map((issue: Issue, index: number) => (
            <div tabIndex={index + 2} className="search-result" key={issue.id} ref={el => searchResultRefs.current.set(issue, el)} onKeyDown={(e) => handleKeyUp(e)}>
              <div>
                <div className="search-result__header-icon">
                  {issue.state === 'open' ? <IssueOpened /> : <IssueClosed />}
                </div>
              </div>
              <div className="right-side">
                <div className="search-result__header">
                  <div className="search-result__header-title">
                    <a href={issue.html_url} target="_blank">{issue.title}</a>
                  </div>
                  <div className="search-result__header-meta">
                    {issue.comments > 0 && (
                      <span>
                        <a href={`${issue.html_url}#partial-timeline`}>
                          <span>{issue.comments}</span>
                          <Comment />
                        </a>
                      </span>
                    )}
                  </div>
                </div>
                <div className="search-result__meta">
                  #{issue.number} opened {format(issue.created_at)} by{" "}
                  <a href={`http://github.com/${issue.user.login}`}>{issue.user.login}</a>{" "}
             — Updated {format(issue.updated_at)}
                </div>
                <div className="search-result__labels">
                  <Labels labels={issue.labels || []}></Labels>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Autocomplete

