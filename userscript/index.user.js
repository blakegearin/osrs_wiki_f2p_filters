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

  const CURRENT_LOG_LEVEL = QUIET

  const USERSCRIPT_NAME = 'OSRS Wiki F2P Helper'
  const PARAMETERIZED_USERSCRIPT_NAME = USERSCRIPT_NAME.toLowerCase().replaceAll(' ', '_')

  function log (level, message, variable = -1) {
    if (CURRENT_LOG_LEVEL < level) return

    console.log(`${USERSCRIPT_NAME}: ${message}`)
    if (variable !== -1) console.log(variable)
  }

  function logError (message, variable = null) {
    console.error(`${USERSCRIPT_NAME}: ${message}`)
    if (variable) console.log(variable)
  }

  log(QUIET, 'Starting')

  const STAR_ICON_SVG = (color = 'currentColor') => `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.19844,0,0,1.19844,-2.39688,-1.25597)"><path d="M12,1.1L14.474,8.712L22.026,8.712L15.878,13.186L18.165,21.022L12,16.362L5.835,21.022L8.122,13.186L2,8.712L9.552,8.712L12,1.1Z" fill="${color}"/></g></svg>`

  function getFromLocalStorage (key) {
    try {
      const prefixedKey = `${PARAMETERIZED_USERSCRIPT_NAME}_${key}`
      return localStorage.getItem(prefixedKey)
    } catch (error) {
      logError(`Error retrieving data to Local Storage: ${error}`)
      return null
    }
  }

  function setToLocalStorage (key, value) {
    try {
      const prefixedKey = `${PARAMETERIZED_USERSCRIPT_NAME}_${key}`
      localStorage.setItem(prefixedKey, value)
    } catch (error) {
      logError(`Error storing data to Local Storage: ${error}`)
    }
  }

  function maybeInsertPageTitleIcon () {
    log(DEBUG, 'maybeInsertPageTitleIcon')

    let iconPosition = getFromLocalStorage('pageTitleIconPosition')
    log(DEBUG, 'iconPosition', iconPosition)

    if (iconPosition === null) {
      const defaultIconPosition = 'before'

      setToLocalStorage('pageTitleIconPosition', defaultIconPosition)
      iconPosition = defaultIconPosition
    }

    if (iconPosition === 'none') {
      log(DEBUG, 'Early exit due to iconPosition')
      return
    }

    const infoboxTable = document.querySelector('table.infobox')
    log(VERBOSE, 'infoboxTable', infoboxTable)

    const membersTableHeader = infoboxTable.querySelector('th a[title="Members"]')
    log(VERBOSE, 'membersTableHeader', membersTableHeader)

    const membersTableRow = membersTableHeader.parentElement.parentElement
    log(VERBOSE, 'membersTableRow', membersTableRow)

    const isMembers = membersTableRow.querySelector('td').innerText
    log(VERBOSE, 'isMembers', isMembers)

    let iconType = ''
    let innerHtml = ''

    const userscriptIconId = PARAMETERIZED_USERSCRIPT_NAME + '_icon'
    const existingIcon = document.getElementById(userscriptIconId)
    log(VERBOSE, 'existingIcon', existingIcon)

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

    if (iconPosition === 'before') {
      const firstChild = pageHeading.firstChild
      pageHeading.insertBefore(newIcon, firstChild)
    } else if (iconPosition === 'after') {
      newIcon.style.marginLeft = '2px'
      pageHeading.appendChild(newIcon)
    }

    startObserving(observer)

    log(INFO, `Added ${iconType} icon`)
  }

  function maybeInsertMenuContentIcon (observer, togglePopup) {
    log(DEBUG, 'maybeInsertMenuContentIcon')

    const f2pHelperMenuContentIconId = 'pt-f2p-helper'

    if (document.getElementById(f2pHelperMenuContentIconId) !== null) {
      log(DEBUG, 'Early exit because F2P Helper icon already exists')
      return
    }

    const themeMenuContentIcon = document.querySelector('#pt-theme-toggles')
    log(DEBUG, 'themeMenuContentIcon', themeMenuContentIcon)

    if (themeMenuContentIcon === null) return

    const f2pHelperMenuContentIcon = themeMenuContentIcon.cloneNode(true)

    f2pHelperMenuContentIcon.id = f2pHelperMenuContentIconId

    const f2pHelperMenuContentIconLink = f2pHelperMenuContentIcon.querySelector('a')
    f2pHelperMenuContentIconLink.title = 'F2P Helper'

    f2pHelperMenuContentIconLink.style.cssText = `
      background-image: url("data:image/svg+xml,${encodeURIComponent(STAR_ICON_SVG('#cbd9f4'))}");
      width: 15px;
      min-width: 15px;
      height: 14px;
      background-size: 14px;
      display: block;
      background-repeat: no-repeat;
      opacity: 1;
      margin-bottom: -2px;
    `

    observer.disconnect()

    themeMenuContentIcon.insertAdjacentElement('afterend', f2pHelperMenuContentIcon)

    f2pHelperMenuContentIcon.addEventListener('click', togglePopup)

    startObserving(observer)

    log(VERBOSE, 'Added menu content icon')
  }

  function closePopupOnOutsideClick (event) {
    log(INFO, 'closePopupOnOutsideClick')

    const popup = document.querySelector('#wgl-f2p-helper-popup > div')
    const targetElement = event.target

    if (!popup.contains(targetElement)) {
      popup.style.display = 'none'
      document.removeEventListener('click', closePopupOnOutsideClick)
    }
  }

  function maybeInsertPopup (observer) {
    log(DEBUG, 'maybeInsertPopup')

    const f2pHelperPopupId = 'wgl-f2p-helper-popup'

    const togglePopup = (event) => {
      event.preventDefault()
      log(INFO, 'togglePopup')

      const popup = document.querySelector(`#${f2pHelperPopupId} > div`)
      if (popup.style.display === 'none') {
        popup.style.display = 'block'

        // Slight delay to prevent immediate closing of popup
        setTimeout(
          () => document.addEventListener('click', closePopupOnOutsideClick),
          100
        )
      } else {
        popup.style.display = 'none'
      }
    }

    if (document.getElementById(f2pHelperPopupId) !== null) {
      log(DEBUG, 'Early exit because F2P Helper popup already exists')
      return togglePopup
    }

    const f2pHelperPopup = document.createElement('div')
    f2pHelperPopup.id = f2pHelperPopupId
    f2pHelperPopup.className = 'mw-echo-ui-overlay'
    f2pHelperPopup.style.cssText = `
      font-size: 0.875em;
      position: absolute;
      top: 0;
      right: 0;
      left: 0;
      z-index: 101;
    `

    const panelWidth = document.querySelector('#p-personal').offsetWidth || 0

    const iconPosition = getFromLocalStorage('pageTitleIconPosition')
    log(INFO, 'iconPosition', iconPosition)

    f2pHelperPopup.innerHTML = `
      <div
        class="mw-echo-ui-notificationBadgeButtonPopupWidget-popup oo-ui-widget oo-ui-widget-enabled oo-ui-labelElement oo-ui-floatableElement-floatable oo-ui-popupWidget-anchored oo-ui-popupWidget oo-ui-popupWidget-anchored-top"
        style="
          display: none;
          top: 26px;
          left: calc(100% - ${panelWidth}px - 178px);
          position: absolute;
          z-index: 1;
          margin-top: 9px;
          width: 300px;
        "
      >
        <div
          class="oo-ui-popupWidget-popup"
          style="
            background-color: var(--ooui-interface);
            border: 1px solid var(--ooui-interface-border);
            border-radius: 2px;
          "
        >
          <div
            class="oo-ui-popupWidget-head"
            style="box-sizing: border-box; height: 3.1428571em; border-bottom: 1px solid var(--ooui-interface-border); margin: 0;"
          >
            <span
              class="oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement oo-ui-iconElement-icon oo-ui-icon-tray oo-ui-labelElement-invisible oo-ui-iconWidget"
              style="
                float: left;
                height: 100%;
                margin: 0 0 0 1.1428571em;
                opacity: 0.8;
                vertical-align: middle;
                user-select: none;
                clip: auto;
                text-indent: -9999px;
                line-height: 2.5;
                display: inline-block;
                position: static;
                background-size: contain;
                background-position: center center;
                background-repeat: no-repeat;
                min-width: 20px;
                width: 1.42857143em;
                min-height: 20px;
                background-image: url('data:image/svg+xml,${encodeURIComponent(STAR_ICON_SVG('currentColor'))}');
              "
            ></span>
            <span
              class="oo-ui-labelElement-label"
              style="
                margin: 0 0 0 0.4761905em;
                font-size: 1.2em;
                font-weight: bold;
                line-height: 2.5595238em;
              "
            >
              F2P Helper
            </span>
          </div>

          <div
            class="oo-ui-clippableElement-clippable oo-ui-popupWidget-body"
            style="
              height: auto;
              width: 298px;
              max-width: 298px;
              max-height: 477px;
              line-height: 1.42857143em;
            "
          >
            <div class="oo-ui-widget oo-ui-widget-enabled mw-echo-ui-sortedListWidget mw-echo-ui-notificationsListWidget">
              <div
                class="mw-echo-ui-notificationItemWidget-content-message"
                style="padding-right: 0px;"
              >
                <div class="mw-echo-ui-notificationItemWidget-content-message-header-wrapper">
                  <div
                    class="oo-ui-layout oo-ui-panelLayout oo-ui-panelLayout-padded mw-prefs-fieldset-wrapper"
                    style="
                      background-color: var(--body-main);
                      padding: 12px 16px 16px;
                      position: relative;
                    "
                  >
                    <fieldset
                      class="oo-ui-layout oo-ui-labelElement oo-ui-fieldsetLayout"
                      style="
                        position: relative;
                        min-width: 0;
                        margin: 0;
                        border: 0;
                        padding: 0.01px 0 0 0;
                      "
                    >
                      <legend class="oo-ui-fieldsetLayout-header">
                        <span class="oo-ui-labelElement-label">
                          Page title icon position
                        </span>
                      </legend>
                      <div class="oo-ui-fieldsetLayout-group">
                        <div class="oo-ui-widget oo-ui-widget-enabled">
                          <div class="mw-htmlform-field-HTMLRadioField oo-ui-layout oo-ui-fieldLayout oo-ui-fieldLayout-align-top">
                            <div class="oo-ui-fieldLayout-body">
                              <span class="oo-ui-fieldLayout-header">
                                <label class="oo-ui-labelElement-label"></label>
                              </span>
                              <div class="oo-ui-fieldLayout-field">
                                <div
                                  id="f2p-helper-icon-page-title-position"
                                  class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioSelectInputWidget"
                                >
                                  <div class="oo-ui-layout oo-ui-labelElement oo-ui-fieldLayout oo-ui-fieldLayout-align-inline">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioInputWidget">
                                          <input
                                            type="radio"
                                            tabindex="0"
                                            name="f2p-helper-icon-page-title-position"
                                            value="none"
                                            class="oo-ui-inputWidget-input"
                                            ${iconPosition === 'none' ? 'checked' : ''}
                                          />
                                          <span></span>
                                        </span>
                                      </span>
                                      <span class="oo-ui-fieldLayout-header">
                                        <label class="oo-ui-labelElement-label">
                                          None
                                        </label>
                                      </span>
                                    </div>
                                  </div>
                                  <div class="oo-ui-layout oo-ui-labelElement oo-ui-fieldLayout oo-ui-fieldLayout-align-inline">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioInputWidget">
                                          <input
                                            type="radio"
                                            tabindex="0"
                                            name="f2p-helper-icon-page-title-position"
                                            value="before"
                                            class="oo-ui-inputWidget-input"
                                            ${iconPosition === 'before' ? 'checked' : ''}
                                          />
                                          <span></span>
                                        </span>
                                      </span>
                                      <span class="oo-ui-fieldLayout-header">
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
                                        <label class="oo-ui-labelElement-label">
                                          Before
                                        </label>
                                      </span>
                                    </div>
                                  </div>
                                  <div class="oo-ui-layout oo-ui-labelElement oo-ui-fieldLayout oo-ui-fieldLayout-align-inline">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioInputWidget">
                                          <input
                                            type="radio"
                                            tabindex="0"
                                            name="f2p-helper-icon-page-title-position"
                                            value="after"
                                            class="oo-ui-inputWidget-input"
                                            ${iconPosition === 'after' ? 'checked' : ''}
                                          />
                                          <span></span>
                                        </span>
                                      </span>
                                      <span class="oo-ui-fieldLayout-header">
                                        <label class="oo-ui-labelElement-label">
                                          After
                                        </label>
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
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="oo-ui-popupWidget-anchor" style="left: 151px;"></div>
      </div>
    `

    const f2pHelperPopupStyle = document.createElement('style')
    f2pHelperPopupStyle.textContent = `
      .oo-ui-radioInputWidget [type='radio'] + span:before {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 1px solid transparent;
        border-radius: 50%;
      }

      .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header {
        padding-top: 0;
        padding-bottom: 0;
        padding-left: 6px;
      }

      .oo-ui-radioSelectInputWidget .oo-ui-fieldLayout {
        margin-top: 0;
        padding: 4px 0;
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio'] + span {
        cursor: pointer;
        transition: background-color 100ms,border-color 100ms,border-width 100ms;
      }

      .oo-ui-fieldLayout:before, .oo-ui-fieldLayout:after {
        content: ' ';
        display: table;
      }

      .oo-ui-radioInputWidget [type='radio'] + span {
        background-color: #fff;
        position: absolute;
        left: 0;
        box-sizing: border-box;
        width: 1.42857143em;
        height: 1.42857143em;
        border-color: #72777d;
        border-style: solid;
        border-radius: 50%;
        border-width: 1px;
      }

      .oo-ui-radioInputWidget * {
        font: inherit;
        vertical-align: middle;
      }

      .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-top > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header, .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body {
        max-width: 50em;
      }

      .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-field {
        width: 1px;
        vertical-align: top;
      }

      .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header, .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-field {
        display: table-cell;
      }

      .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline {
        word-wrap: break-word;
      }

      .oo-ui-inputWidget:last-child {
        margin-right: 0;
      }

      .oo-ui-widget {
        color: var(--ooui-text);
      }

      .oo-ui-radioInputWidget {
        display: inline-block;
        z-index: 0;
        position: relative;
        line-height: 1.42857143em;
        white-space: nowrap;
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio'] {
        cursor: pointer;
      }

      .oo-ui-radioInputWidget [type='radio'] {
        position: relative;
        max-width: none;
        width: 1.42857143em;
        height: 1.42857143em;
        margin: 0;
        opacity: 0;
        z-index: 1;
      }

      .oo-ui-fieldsetLayout.oo-ui-labelElement > .oo-ui-fieldsetLayout-header > .oo-ui-labelElement-label {
        display: inline-block;
        margin-bottom: 8px;
        font-size: 1.14285714em;
        font-weight: bold;
      }

      .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header {
        vertical-align: middle;
      }

      .oo-ui-labelElement .oo-ui-labelElement-label {
        line-height: 1.42857143em;
      }

      iconElement > .oo-ui-fieldsetLayout-header, .oo-ui-fieldsetLayout.oo-ui-labelElement > .oo-ui-fieldsetLayout-header {
        color: inherit;
        display: inline-table;
        box-sizing: border-box;
        padding: 0;
        white-space: normal;
        float: left;
        width: 100%;
      }

      .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:before, .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after {
        bottom: -10px;
        left: -8px;
        border-bottom-color: #fff;
        border-width: 9px;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after {
        border-bottom-color: var(--ooui-interface);
      }

      .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:before, .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before, .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after {
        border-top: 0;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before {
        bottom: -10px;
        left: -9px;
        border-bottom-color: #7b8590;
        border-width: 10px;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before {
        border-bottom-color: var(--ooui-interface-border);
      }

      .oo-ui-popupWidget-anchor {
        display: none;
      }

      .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor {
        display: block;
        position: absolute;
        background-repeat: no-repeat;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor {
        left: 0;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor {
        top: -9px;
      }

      .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor {
        display: block;
        position: absolute;
        background-repeat: no-repeat;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor {
        top: -9px;
      }

      .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after {
        border-bottom-color: var(--ooui-interface);
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:hover + span {
        border-color: var(--ooui-accent);
      }



      .oo-ui-radioInputWidget [type='radio'] + span:before {
        content: ' ';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 1px solid transparent;
        border-radius: 50%;
    }

      .oo-ui-radioInputWidget [type='radio'] + span {
        background-color: #fff;
        position: absolute;
        left: 0;
        box-sizing: border-box;
        width: 1.42857143em;
        height: 1.42857143em;
        border-color: #72777d;
        border-style: solid;
        border-radius: 50%;
        border-width: 1px;
      }

      .oo-ui-checkboxInputWidget [type='checkbox'] + span, .oo-ui-radioInputWidget [type='radio'] + span {
        background-color: var(--ooui-input);
        border-color: var(--ooui-input-border);
      }

      .oo-ui-radioInputWidget [type='radio']:checked + span, .oo-ui-radioInputWidget [type='radio']:checked:hover + span, .oo-ui-radioInputWidget [type='radio']:checked:focus:hover + span {
        border-width: 6px;
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio'] + span {
        cursor: pointer;
        transition: background-color 100ms,border-color 100ms,border-width 100ms;
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:checked + span {
        border-color: #36c;
      }

      .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:checked + span {
        border-color: var(--ooui-progressive);
      }
    `

    const head = document.getElementsByTagName('head')[0]
    head.appendChild(f2pHelperPopupStyle)

    observer.disconnect()

    const body = document.getElementsByTagName('body')[0]
    log(VERBOSE, 'body', body)

    if (body === null) return togglePopup
    body.appendChild(f2pHelperPopup)

    const radioButtons = document.querySelectorAll('#f2p-helper-icon-page-title-position input[type="radio"]')

    radioButtons.forEach((radioButton) => {
      radioButton.addEventListener(
        'change',
        (event) => {
          log(INFO, 'updatePageTitlePosition')

          setToLocalStorage('pageTitleIconPosition', event.target.value)
        }
      )
    })

    startObserving(observer)
    log(VERBOSE, 'Added popup')

    return togglePopup
  }

  const mutationCallback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        log(TRACE, 'childList mutation detected')
        maybeInsertPageTitleIcon(observer)
        const togglePopup = maybeInsertPopup(observer)
        maybeInsertMenuContentIcon(observer, togglePopup)
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
