// ==UserScript==
// @name         OSRS Wiki F2P Helper
// @namespace    https://blakegearin.com
// @version      0.1.0
// @description  Customize GitHub's new global navigation buttons for improved accessibility
// @author       Blake Gearin
// @match        *://oldschool.runescape.wiki/*
// @grant        none
// @license      MIT
// @icon         https://oldschool.runescape.wiki/images/Free-to-play_icon.png
// @supportURL   https://github.com/blakegearin/osrs_wiki_f2p_helper/issues
// ==/UserScript==

(function () {
  'use strict'

  const SILENT = 0
  const QUIET = 1
  const INFO = 2
  const DEBUG = 3
  const VERBOSE = 4
  const TRACE = 5

  const CURRENT_LOG_LEVEL = SILENT

  const USERSCRIPT_NAME = 'OSRS Wiki F2P Helper'

  function log (level, message, variable = -1) {
    if (CURRENT_LOG_LEVEL < level) return

    console.log(`${USERSCRIPT_NAME}: ${message}`)
    if (variable !== -1) console.log(variable)
  }

  // function logError (message, variable = null) {
  //   console.error(`${USERSCRIPT_NAME}: ${message}`)
  //   if (variable) console.log(variable)
  // }

  log(QUIET, 'Starting')

  function maybeInsertMembersIcon () {
    const infoboxTable = document.querySelector('table.infobox')

    const membersTableHeader = infoboxTable.querySelector('th a[title="Members"]')
    const membersTableRow = membersTableHeader.parentElement.parentElement
    const isMembers = membersTableRow.querySelector('td').innerText

    let iconType = ''
    let innerHtml = ''

    const userscriptIconId = USERSCRIPT_NAME.toLowerCase().replaceAll(' ', '_') + '_icon'
    const existingIcon = document.getElementById(userscriptIconId)

    observer.disconnect()

    switch (isMembers) {
      case 'Yes':
        log(DEBUG, 'isMembers is Yes')
        iconType = 'members'

        if (existingIcon?.classList.contains(`${iconType}-icon`)) {
          log(DEBUG, `Early exit because ${iconType} icon already exists`)

          startObserving(observer)
          return
        }

        innerHtml = `
          <a
            href="/w/Members"
            title="Members"
          >
            <img
              alt="Member icon.png"
              src="/images/Member_icon.png?1de0c"
              decoding="async"
              style="height: .8em; vertical-align: inherit;"
            >
          </a>
        `
        break
      case 'No':
        log(DEBUG, 'isMembers is No')
        iconType = 'F2P'

        if (existingIcon?.classList.contains(`${iconType}-icon`)) {
          log(DEBUG, `Early exit because ${iconType} icon already exists`)

          startObserving(observer)
          return
        }

        innerHtml = `
          <a
            href="/w/Free-to-play"
            title="Free-to-play"
          >
            <img
              alt="Free-to-play icon.png"
              src="/images/Free-to-play_icon.png?628ce"
              decoding="async"
              style="height: .8em; vertical-align: inherit;"
            >
          </a>
        `
        break
      default:
        log(DEBUG, 'isMembers is not Yes or No')

        if (existingIcon !== null) existingIcon.remove()

        startObserving(observer)
        return
    }

    const newIcon = existingIcon === null ? document.createElement('span') : existingIcon

    newIcon.id = userscriptIconId
    newIcon.className = `${iconType}-icon`
    newIcon.innerHTML = innerHtml

    const pageHeading = document.querySelector('h1#firstHeading')

    // Before
    const firstChild = pageHeading.firstChild
    pageHeading.insertBefore(newIcon, firstChild)

    // After
    // newIcon.style.marginLeft = '2px'
    // pageHeading.appendChild(newIcon)

    startObserving(observer)

    log(INFO, `Added ${iconType} icon`)
  }

  const mutationCallback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        log(TRACE, 'childList mutation detected')
        maybeInsertMembersIcon(observer)
      }
    }
  }

  const observer = new MutationObserver(mutationCallback)

  function startObserving (observer) {
    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    )
  }

  startObserving(observer)
})()
