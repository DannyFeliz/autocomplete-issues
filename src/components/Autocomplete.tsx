import React, { FC, useEffect, useRef, useState } from 'react'
import IssueClosed from "./IssueClosedIcon"
import IssueOpened from "./IssueOpenedIcon"
import Comment from "./CommentIcon"
import { Issue } from '../types'
import { format } from "timeago.js"
import Labels from './Labels'
import "./Autocomplete.scss"
import { useDebouncedCallback } from 'use-debounce'
import { useOnClickOutside } from '../hooks'

const Autocomplete: FC = () => {
  const [searchTerm, setSearchTem] = useState<string>("")
  const [issues, setIssues] = useState<Issue[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focusIndex, setFocusIndex] = useState<number>(-1)
  let searchResultRefs = React.useRef(new Map())
  const MAX_RESULTS = 5;

  enum KEY {
    ENTER = "Enter",
    ARROW_UP = "ArrowUp",
    ARROW_DOWN = "ArrowDown"
  }

  useEffect(() => {
    registerGlobalShortcuts()
  }, [])

  function reset() {
    setIssues([])
    setIsLoading(false)
    setFocusIndex(-1)
    searchResultRefs.current.clear()
  }

  const containerRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(containerRef, () => setIsOpen(false));

  async function searchIssues() {
    if (!searchTerm) {
      reset()
      return
    }
    try {
      console.log(searchResultRefs.current)
      searchResultRefs.current.clear()
      const response = await fetch(`http://localhost:3001/issues?q=${searchTerm}`)
      const issuesResponse: Issue[] = await response.json();
      setIssues(issuesResponse)
      setIsOpen(issuesResponse.length > 0)
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
      setFocusIndex(-1)
    }
  }

  function registerGlobalShortcuts() {
    document.onkeyup = ({ key: pressedKey }) => {
      const isInputFocused = document.activeElement === inputRef.current
      const shouldFocusInput = pressedKey === "/" && !isInputFocused
      if (shouldFocusInput && inputRef.current) {
        inputRef.current.focus()
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


    if (pressedKey === KEY.ENTER) {
      window.location.href = issues[focusIndex].html_url
      return
    }

    if (pressedKey === KEY.ARROW_UP) {
      const isFirstResult = (focusIndex - 1) === -1;
      if (isFirstResult) {
        inputRef.current?.focus()
        setFocusIndex(focusIndex - 1)
        return
      }

      if (searchResultRefs.current.get(issues[focusIndex - 1])) {
        searchResultRefs.current.get(issues[focusIndex - 1]).focus()
        setFocusIndex(focusIndex - 1)
        return
      }
    }

    if (pressedKey === KEY.ARROW_DOWN) {
      if (searchResultRefs.current.get(issues[focusIndex + 1])) {
        searchResultRefs.current.get(issues[focusIndex + 1]).focus()
        setFocusIndex(focusIndex + 1)
      }
    }
  }

  const debouncedSearch = useDebouncedCallback(() => searchIssues(), 0)

  function handleSearchChange(search: string) {
    setSearchTem(search)
    setIssues([])
    setIsLoading(true)
    debouncedSearch()
  }

  return (
    <div className="autocomplete-container" ref={containerRef}>
      <input
        className="form-control"
        type="search"
        placeholder="Search..."
        onChange={(event) => handleSearchChange(event.target.value)}
        ref={inputRef}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => handleKeyUp(e)}
        tabIndex={1}
      />

      <div className={`search-container ${!isOpen ? 'hidden' : ''}`}>
        {isLoading && (<div className="search-result">
          Is loading...
        </div>)
        }

        {issues.map((issue: Issue, index: number) => (
          <div tabIndex={index + 2} className="search-result" key={issue.id} ref={el => searchResultRefs.current.set(issue, el)} onKeyDown={(e) => handleKeyUp(e)}>
            <div>
              <div className="search-result__header-icon">
                {
                  issue.state === 'open' ? <IssueOpened /> : <IssueClosed />
                }
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
        ))
        }
      </div>
    </div>
  )
}

export default Autocomplete

