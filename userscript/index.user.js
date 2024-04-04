// ==UserScript==
// @name         OSRS Wiki F2P Helper
// @namespace    https://github.com/blakegearin/osrs_wiki_f2p_helper
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

  const DEFAULTS = {
    pageTitle: {
      icon: {
        enabled: true,
        before: true,
        after: false
      },
      style: {
        enabled: false,
        uppercase: false,
        strikethrough: true
      },
      color: {
        enabled: false,
        f2p: false,
        members: true
      }
    }
  }

  const SILENT = 0
  const QUIET = 1
  const INFO = 2
  const DEBUG = 3
  const VERBOSE = 4
  const TRACE = 5

  const CURRENT_LOG_LEVEL = QUIET

  const USERSCRIPT_NAME = 'OSRS Wiki F2P Helper'
  const PARAMETERIZED_USERSCRIPT_NAME = USERSCRIPT_NAME.toLowerCase().replaceAll(' ', '_')
  const STAR_ICON_SVG = (color = 'currentColor') => `<svg width="100%" height="100%" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"><g transform="matrix(1.19844,0,0,1.19844,-2.39688,-1.25597)"><path d="M12,1.1L14.474,8.712L22.026,8.712L15.878,13.186L18.165,21.022L12,16.362L5.835,21.022L8.122,13.186L2,8.712L9.552,8.712L12,1.1Z" fill="${color}"/></g></svg>`

  function log (level, message, variable = -1) {
    if (CURRENT_LOG_LEVEL < level) return

    console.log(`${USERSCRIPT_NAME}: ${message}`)
    if (variable !== -1) console.log(variable)
  }

  function logError (message, variable = null) {
    console.error(`${USERSCRIPT_NAME}: ${message}`)
    if (variable) console.log(variable)
  }

  log(QUIET, 'Running')

  function getFromLocalStorage (key, defaultValue = null) {
    try {
      const prefixedKey = `${PARAMETERIZED_USERSCRIPT_NAME}_${key}`
      const rawItem = localStorage.getItem(prefixedKey)

      if (rawItem === 'true') {
        return true
      } else if (rawItem === 'false') {
        return false
      } else if (defaultValue !== null) {
        setToLocalStorage(key, defaultValue)
        return defaultValue
      } else {
        return null
      }
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

  function getMembersValue () {
    log(DEBUG, 'getMembersValue')

    const infoboxTable = document.querySelector('table.infobox')
    log(VERBOSE, 'infoboxTable', infoboxTable)

    if (infoboxTable === null) {
      log(DEBUG, 'Early exit due to infoboxTable not existing')
      return
    }

    const membersTableHeader = infoboxTable.querySelector('th a[title="Members"]')
    log(VERBOSE, 'membersTableHeader', membersTableHeader)

    if (membersTableHeader === null) {
      log(DEBUG, 'Early exit due to membersTableHeader not existing')
      return
    }

    const membersTableRow = membersTableHeader.parentElement.parentElement
    log(VERBOSE, 'membersTableRow', membersTableRow)

    const membersValue = membersTableRow.querySelector('td').innerText
    log(VERBOSE, 'membersValues', membersValue)

    return membersValue
  }

  function maybeInsertPageTitleIcon (observer, membersValue) {
    log(DEBUG, 'maybeInsertPageTitleIcon')

    const pageTitleIconEnabled = getFromLocalStorage('pageTitleIconEnabled', DEFAULTS.pageTitle.icon.enabled)
    log(INFO, 'pageTitleIconEnabled', pageTitleIconEnabled)

    const pageTitleIconBefore = getFromLocalStorage('pageTitleIconBefore', DEFAULTS.pageTitle.icon.before)
    log(INFO, 'pageTitleIconBefore', pageTitleIconBefore)

    const pageTitleIconAfter = getFromLocalStorage('pageTitleIconAfter', DEFAULTS.pageTitle.icon.after)
    log(INFO, 'pageTitleIconAfter', pageTitleIconAfter)

    let iconType = ''
    let innerHtml = ''

    switch (membersValue) {
      case 'Yes':
        log(DEBUG, 'membersValue is Yes')

        iconType = 'members'
        innerHtml =
          `<a
            href="/w/Members"
            title="Members"
          >
            <img
              alt="Member icon.png"
              src="/images/Member_icon.png?1de0c"
              decoding="async"
              style="height: .8em; vertical-align: inherit;"
            >
          </a>`
        break
      case 'No':
        log(DEBUG, 'membersValue is No')

        iconType = 'F2P'
        innerHtml =
          `<a
            href="/w/Free-to-play"
            title="Free-to-play"
          >
            <img
              alt="Free-to-play icon.png"
              src="/images/Free-to-play_icon.png?628ce"
              decoding="async"
              style="height: .8em; vertical-align: inherit;"
            >
          </a>`
        break
    }

    const pageHeading = document.querySelector('h1#firstHeading')

    observer.disconnect()

    let existingIconSelector = `.${iconType}-icon.before`
    if (pageTitleIconEnabled && pageTitleIconBefore) {
      if (document.querySelector(existingIconSelector)) {
        log(VERBOSE, `Early exit because ${existingIconSelector} icon already exists`)
      } else {
        const newIcon = document.createElement('span')

        newIcon.classList.add(...existingIconSelector.split('.').filter(Boolean))
        newIcon.style.textDecoration = 'none'
        newIcon.innerHTML = innerHtml

        newIcon.style.marginRight = '8px'

        const firstChild = pageHeading.firstChild
        pageHeading.insertBefore(newIcon, firstChild)

        // Extra newlines and spaces make strikethrough look weird
        pageHeading.innerHTML = pageHeading.innerHTML.replaceAll(/(<\/span>|<img[^>]*>|<a[^>]*>)\s*/g, '$1')
      }
    } else {
      document.querySelector(existingIconSelector)?.remove()
    }

    existingIconSelector = `.${iconType}-icon.after`
    if (pageTitleIconEnabled && pageTitleIconAfter) {
      if (document.querySelector(existingIconSelector)) {
        log(VERBOSE, `Early exit because ${existingIconSelector} icon already exists`)
      } else {
        const newIcon = document.createElement('span')

        newIcon.classList.add(...existingIconSelector.split('.').filter(Boolean))
        newIcon.style.textDecoration = 'none'
        newIcon.innerHTML = innerHtml

        newIcon.style.marginLeft = '8px'

        pageHeading.appendChild(newIcon)

        // Extra newlines and spaces make strikethrough look weird
        pageHeading.innerHTML = pageHeading.innerHTML.replaceAll(/(<\/span>|<img[^>]*>|<a[^>]*>)\s*/g, '$1')
      }
    } else {
      document.querySelector(existingIconSelector)?.remove()
    }

    startObserving(observer)

    log(INFO, `Added ${iconType} icon`)
  }

  function maybeUpdatePageTitleStyle (observer, membersValue) {
    log(DEBUG, 'maybeInsertPageTitleIcon')

    const pageTitleStyleEnabled = getFromLocalStorage('pageTitleStyleEnabled', DEFAULTS.pageTitle.style.enabled)
    log(INFO, 'pageTitleStyleEnabled', pageTitleStyleEnabled)

    const styleUppercase = getFromLocalStorage('pageTitleStyleUppercase', DEFAULTS.pageTitle.style.uppercase)
    log(INFO, 'styleUppercase', styleUppercase)

    const styleStrikethrough = getFromLocalStorage('pageTitleStyleStrikethrough', DEFAULTS.pageTitle.style.strikethrough)
    log(INFO, 'styleStrikethrough', styleStrikethrough)

    const pageTitleStyle = {
      uppercase: styleUppercase,
      strikethrough: styleStrikethrough
    }
    log(DEBUG, 'pageTitleStyle', pageTitleStyle)

    const pageTitleColorEnabled = getFromLocalStorage('pageTitleColorEnabled', DEFAULTS.pageTitle.color.enabled)
    log(INFO, 'pageTitleColorEnabledP', pageTitleColorEnabled)

    const pageTitleColorF2P = getFromLocalStorage('pageTitleColorF2P', DEFAULTS.pageTitle.color.f2p)
    log(INFO, 'pageTitleColorF2P', pageTitleColorF2P)

    const pageTitleColorMembers = getFromLocalStorage('pageTitleColorMembers', DEFAULTS.pageTitle.color.members)
    log(INFO, 'pageTitleColorMembers', pageTitleColorMembers)

    const pageTitle = document.querySelector('.mw-page-title-main') || document.querySelector('.mw-first-heading')
    log(VERBOSE, 'pageTitle', pageTitle)

    observer.disconnect()

    switch (membersValue) {
      case 'Yes':
        log(DEBUG, 'membersValue is Yes')

        pageTitle.style.textDecoration = (pageTitleStyleEnabled && pageTitleStyle.strikethrough) ? 'line-through' : 'none'
        pageTitle.style.textTransform = (pageTitleStyleEnabled && pageTitleStyle.uppercase) ? 'uppercase' : 'none'

        pageTitle.style.color = (pageTitleColorEnabled && pageTitleColorMembers) ? 'var(--member-link-color, var(--text-color))' : 'initial'

        break
      case 'No':
        log(DEBUG, 'membersValue is No')

        pageTitle.style.color = (pageTitleColorEnabled && pageTitleColorF2P) ? 'var(--f2p-link-color, var(--text-color))' : 'initial'

        break
      default:
        log(DEBUG, 'membersValue is not Yes or No')

        startObserving(observer)
        return
    }

    startObserving(observer)

    log(INFO, 'Updated page title style')
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
    log(DEBUG, 'closePopupOnOutsideClick')

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

    const pageTitleIconEnabled = getFromLocalStorage('pageTitleIconEnabled')
    log(INFO, 'pageTitleIconEnabled', pageTitleIconEnabled)

    const iconPosition = getFromLocalStorage('pageTitleIconPosition')
    log(INFO, 'iconPosition', iconPosition)

    const pageTitleIconBefore = getFromLocalStorage('pageTitleIconBefore')
    log(INFO, 'pageTitleIconBefore', pageTitleIconBefore)

    const pageTitleIconAfter = getFromLocalStorage('pageTitleIconAfter')
    log(INFO, 'pageTitleIconAfter', pageTitleIconAfter)

    const pageTitleStyleEnabled = getFromLocalStorage('pageTitleStyleEnabled')
    log(INFO, 'pageTitleStyleEnabled', pageTitleStyleEnabled)

    const pageTitleStyleUppercase = getFromLocalStorage('pageTitleStyleUppercase')
    log(INFO, 'pageTitleStyleUppercase', pageTitleStyleUppercase)

    const pageTitleStyleStrikethrough = getFromLocalStorage('pageTitleStyleStrikethrough')
    log(INFO, 'pageTitleStyleStrikethrough', pageTitleStyleStrikethrough)

    const pageTitleColorEnabled = getFromLocalStorage('pageTitleColorEnabled')
    log(INFO, 'pageTitleColorEnabled', pageTitleColorEnabled)

    const pageTitleColorF2P = getFromLocalStorage('pageTitleColorF2P')
    log(INFO, 'pageTitleColorF2P', pageTitleColorF2P)

    const pageTitleColorMembers = getFromLocalStorage('pageTitleColorMembers')
    log(INFO, 'pageTitleColorMembers', pageTitleColorMembers)

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
          width: 320px;
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
            id="f2p-helper-page"
            class="oo-ui-clippableElement-clippable oo-ui-popupWidget-body"
            style="
              height: auto;
              width: 318px;
              max-width: 318px;
              line-height: 1.42857143em;
            "
          >
            <div class="oo-ui-widget oo-ui-widget-enabled mw-echo-ui-sortedListWidget mw-echo-ui-notificationsListWidget">
              <div class="mw-echo-ui-notificationItemWidget-content-message">
                <div class="mw-echo-ui-notificationItemWidget-content-message-header-wrapper">
                  <div class="oo-ui-layout oo-ui-panelLayout oo-ui-panelLayout-padded mw-prefs-fieldset-wrapper">
                    <fieldset class="oo-ui-layout oo-ui-labelElement oo-ui-fieldsetLayout">
                      <legend class="oo-ui-fieldsetLayout-header">
                        <span class="oo-ui-labelElement-label">
                          Page title icons (F2P & Members)
                        </span>

                        <span class="oo-ui-fieldLayout-field">
                          <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                            <input
                              type="checkbox"
                              tabindex="0"
                              name="pageTitleIconEnabled"
                              class="oo-ui-inputWidget-input"
                              ${pageTitleIconEnabled ? 'checked' : ''}
                            >
                            <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                          </span>
                        </span>
                      </legend>

                      <div class="oo-ui-fieldsetLayout-group pageTitleIconEnabled" style="display: ${pageTitleIconEnabled ? 'initial' : 'none'}">
                        <div class="oo-ui-widget oo-ui-widget-enabled">
                          <div class="mw-htmlform-field-HTMLRadioField oo-ui-layout oo-ui-fieldLayout oo-ui-fieldLayout-align-top">
                            <div class="oo-ui-fieldLayout-body">
                              <span class="oo-ui-fieldLayout-header">
                                <label class="oo-ui-labelElement-label"></label>
                              </span>

                              <div class="oo-ui-fieldLayout-field">
                                <div
                                  id="f2p-helper-page-title-icon-position"
                                  class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioSelectInputWidget"
                                >

                                  <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                                          <input
                                            type="checkbox"
                                            tabindex="0"
                                            name="pageTitleIconBefore"
                                            class="oo-ui-inputWidget-input"
                                            ${pageTitleIconBefore ? 'checked' : ''}
                                          />
                                          <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                        </span>
                                      </span>

                                      <span class="oo-ui-fieldLayout-header">
                                        <img
                                          alt="Member icon.png"
                                          src="/images/Member_icon.png?1de0c"
                                          decoding="async"
                                          style="line-height: 1.42857143em; height: .8em; vertical-align: baseline; margin-right: 3px;"
                                        >

                                        <label class="oo-ui-labelElement-label">
                                          Before
                                        </label>
                                      </span>
                                    </div>
                                  </div>

                                  <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                                          <input
                                            type="checkbox"
                                            tabindex="0"
                                            name="pageTitleIconAfter"
                                            class="oo-ui-inputWidget-input"
                                            ${pageTitleIconAfter ? 'checked' : ''}
                                          />
                                          <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                        </span>
                                      </span>

                                      <span class="oo-ui-fieldLayout-header">
                                        <label class="oo-ui-labelElement-label">
                                          After
                                        </label>

                                        <img
                                          alt="Member icon.png"
                                          src="/images/Member_icon.png?1de0c"
                                          decoding="async"
                                          style="line-height: 1.42857143em; height: .8em; vertical-align: baseline; margin-left: 3px;"
                                        >
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

                  <div class="oo-ui-layout oo-ui-panelLayout oo-ui-panelLayout-padded mw-prefs-fieldset-wrapper">
                    <fieldset class="oo-ui-layout oo-ui-labelElement oo-ui-fieldsetLayout">
                      <legend class="oo-ui-fieldsetLayout-header">
                        <span class="oo-ui-labelElement-label">
                          Page title text (Members)
                        </span>

                        <span class="oo-ui-fieldLayout-field">
                          <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                            <input
                              type="checkbox"
                              tabindex="0"
                              name="pageTitleStyleEnabled"
                              class="oo-ui-inputWidget-input"
                              ${pageTitleStyleEnabled ? 'checked' : ''}
                            >
                            <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                          </span>
                      </legend>

                      <div class="oo-ui-fieldsetLayout-group pageTitleStyleEnabled" style="display: ${pageTitleStyleEnabled ? 'initial' : 'none'}">
                        <div class="oo-ui-widget oo-ui-widget-enabled">
                          <div class="mw-htmlform-field-HTMLRadioField oo-ui-layout oo-ui-fieldLayout oo-ui-fieldLayout-align-top">
                            <div class="oo-ui-fieldLayout-body">
                              <span class="oo-ui-fieldLayout-header">
                                <label class="oo-ui-labelElement-label"></label>
                              </span>
                              <div class="oo-ui-fieldLayout-field">
                                <div
                                  id="f2p-helper-page-title-style"
                                  class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioSelectInputWidget"
                                >
                                  <div class="oo-ui-layout oo-ui-labelElement oo-ui-fieldLayout oo-ui-fieldLayout-align-inline">

                                    <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                      <div class="oo-ui-fieldLayout-body">
                                        <span class="oo-ui-fieldLayout-field">
                                          <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                                            <input
                                              type="checkbox"
                                              tabindex="0"
                                              name="pageTitleStyleUppercase"
                                              class="oo-ui-inputWidget-input"
                                              ${pageTitleStyleUppercase ? 'checked' : ''}
                                            />
                                            <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                          </span>
                                        </span>

                                        <span class="oo-ui-fieldLayout-header">
                                          <label class="oo-ui-labelElement-label">
                                            Uppercase
                                          </label>
                                        </span>
                                      </div>
                                    </div>

                                    <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                      <div class="oo-ui-fieldLayout-body">
                                        <span class="oo-ui-fieldLayout-field">
                                          <span
                                            class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget"
                                          >
                                            <input
                                              type="checkbox"
                                              tabindex="0"
                                              name="pageTitleStyleStrikethrough"
                                              value="1"
                                              class="oo-ui-inputWidget-input"
                                              ${pageTitleStyleStrikethrough ? 'checked' : ''}
                                            />
                                            <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                          </span>
                                        </span>

                                        <span class="oo-ui-fieldLayout-header">
                                          <label class="oo-ui-labelElement-label">
                                            Strikethrough
                                          </label>
                                        </span>
                                      </div>
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

                  <div class="oo-ui-layout oo-ui-panelLayout oo-ui-panelLayout-padded mw-prefs-fieldset-wrapper">
                    <fieldset class="oo-ui-layout oo-ui-labelElement oo-ui-fieldsetLayout">
                      <legend class="oo-ui-fieldsetLayout-header">
                        <span class="oo-ui-labelElement-label">
                          Page title color
                        </span>

                        <span class="oo-ui-fieldLayout-field">
                          <span class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget">
                            <input
                              type="checkbox"
                              tabindex="0"
                              name="pageTitleColorEnabled"
                              class="oo-ui-inputWidget-input"
                              ${pageTitleColorEnabled ? 'checked' : ''}
                            >
                            <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                          </span>
                        </span>
                      </legend>

                      <div class="oo-ui-fieldsetLayout-group pageTitleColorEnabled" style="display: ${pageTitleColorEnabled ? 'initial' : 'none'}">
                        <div class="oo-ui-widget oo-ui-widget-enabled">
                          <div class="mw-htmlform-field-HTMLRadioField oo-ui-layout oo-ui-fieldLayout oo-ui-fieldLayout-align-top">
                            <div class="oo-ui-fieldLayout-body">
                              <span class="oo-ui-fieldLayout-header">
                                <label class="oo-ui-labelElement-label"></label>
                              </span>
                              <div class="oo-ui-fieldLayout-field">
                                <div
                                  id="f2p-helper-page-title-color"
                                  class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-radioSelectInputWidget"
                                >

                                <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                  <div class="oo-ui-fieldLayout-body">
                                    <span class="oo-ui-fieldLayout-field">
                                      <span
                                        class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget"
                                      >
                                        <input
                                          type="checkbox"
                                          tabindex="0"
                                          name="pageTitleColorF2P"
                                          value="1"
                                          class="oo-ui-inputWidget-input"
                                          ${pageTitleColorF2P ? 'checked' : ''}
                                        />
                                        <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                      </span>
                                    </span>

                                    <span class="oo-ui-fieldLayout-header">
                                      <label class="oo-ui-labelElement-label">
                                        F2P
                                      </label>
                                    </span>
                                  </div>
                                </div>

                                  <div class="oo-ui-fieldLayout oo-ui-fieldLayout-align-inline oo-ui-labelElement oo-ui-layout">
                                    <div class="oo-ui-fieldLayout-body">
                                      <span class="oo-ui-fieldLayout-field">
                                        <span
                                          class="oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-checkboxInputWidget"
                                        >
                                          <input
                                            type="checkbox"
                                            tabindex="0"
                                            name="pageTitleColorMembers"
                                            value="1"
                                            class="oo-ui-inputWidget-input"
                                            ${pageTitleColorMembers ? 'checked' : ''}
                                          />
                                          <span class="oo-ui-checkboxInputWidget-checkIcon oo-ui-widget oo-ui-widget-enabled oo-ui-iconElement-icon oo-ui-icon-check oo-ui-iconElement oo-ui-labelElement-invisible oo-ui-iconWidget oo-ui-image-invert"></span>
                                        </span>
                                      </span>

                                      <span class="oo-ui-fieldLayout-header">
                                        <label class="oo-ui-labelElement-label">
                                          Members
                                        </label>
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
      #wgl-f2p-helper-popup .oo-ui-fieldsetLayout-header .oo-ui-fieldLayout-field
      {
        float: right !important;
      }

      #wgl-f2p-helper-popup .oo-ui-panelLayout-padded
      {
        padding: 12px 16px 16px;
        padding-bottom: 6px;
      }

      #wgl-f2p-helper-popup .mw-echo-ui-notificationItemWidget-content-message
      {
        padding-right: 0px;
      }

      #wgl-f2p-helper-popup .mw-echo-ui-notificationItemWidget-content-message-header-wrapper > :not(:first-child)
      {
        padding-top: 0px;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldsetLayout
      {
        position: relative;
        min-width: 0;
        margin: 0;
        border: 0;
        padding: 0.01px 0 0 0;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span:before
      {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 1px solid transparent;
        border-radius: 50%;
      }

      #wgl-f2p-helper-popup .oo-ui-radioSelectInputWidget .oo-ui-fieldLayout
      {
        margin-top: 0;
        padding: 4px 0;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio'] + span
      {
        cursor: pointer;
        transition: background-color 100ms,border-color 100ms,border-width 100ms;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout:before,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout:after
      {
        content: ' ';
        display: table;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span
      {
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

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget *
      {
        font: inherit;
        vertical-align: middle;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-top > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body
      {
        max-width: 50em;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-field
      {
        width: 1px;
        vertical-align: top;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline
      {
        word-wrap: break-word;
      }

      #wgl-f2p-helper-popup .oo-ui-inputWidget:last-child
      {
        margin-right: 0;
      }

      #wgl-f2p-helper-popup .oo-ui-widget
      {
        color: var(--ooui-text);
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget
      {
        display: inline-block;
        z-index: 0;
        position: relative;
        line-height: 1.42857143em;
        white-space: nowrap;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']
      {
        cursor: pointer;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio']
      {
        position: relative;
        max-width: none;
        width: 1.42857143em;
        height: 1.42857143em;
        margin: 0;
        opacity: 0;
        z-index: 1;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldsetLayout.oo-ui-labelElement > .oo-ui-fieldsetLayout-header > .oo-ui-labelElement-label
      {
        display: inline-block;
        margin-bottom: 10px;
        font-size: 1.14285714em;
        font-weight: bold;
      }

      #wgl-f2p-helper-popup .oo-ui-labelElement .oo-ui-labelElement-label
      {
        line-height: 1.42857143em;
      }

      #wgl-f2p-helper-popup iconElement > .oo-ui-fieldsetLayout-header,
      #wgl-f2p-helper-popup .oo-ui-fieldsetLayout.oo-ui-labelElement > .oo-ui-fieldsetLayout-header
      {
        color: inherit;
        display: inline-table;
        box-sizing: border-box;
        padding: 0;
        white-space: normal;
        float: left;
        width: 100%;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:before,
      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:after
      {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after
      {
        bottom: -10px;
        left: -8px;
        border-bottom-color: #fff;
        border-width: 9px;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after
      {
        border-bottom-color: var(--ooui-interface);
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:before,
      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor:after
      {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-style: solid;
        border-color: transparent;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before,
      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after
      {
        border-top: 0;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before
      {
        bottom: -10px;
        left: -9px;
        border-bottom-color: #7b8590;
        border-width: 10px;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:before
      {
        border-bottom-color: var(--ooui-interface-border);
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchor
      {
        display: none;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor
      {
        display: block;
        position: absolute;
        background-repeat: no-repeat;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor
      {
        left: 0;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor
      {
        top: -9px;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored .oo-ui-popupWidget-anchor
      {
        display: block;
        position: absolute;
        background-repeat: no-repeat;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor
      {
        top: -9px;
      }

      #wgl-f2p-helper-popup .oo-ui-popupWidget-anchored-top .oo-ui-popupWidget-anchor:after
      {
        border-bottom-color: var(--ooui-interface);
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:hover + span
      {
        border-color: var(--ooui-accent);
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span:before
      {
        content: ' ';
        position: absolute;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 1px solid transparent;
        border-radius: 50%;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span
      {
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

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget [type='checkbox'] + span,
      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span
      {
        background-color: var(--ooui-input);
        border-color: var(--ooui-input-border);
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio']:checked + span,
      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio']:checked:hover + span,
      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio']:checked:focus:hover + span
      {
        border-width: 6px;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio'] + span
      {
        cursor: pointer;
        transition: background-color 100ms,border-color 100ms,border-width 100ms;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:checked + span
      {
        border-color: #36c;
      }

      #wgl-f2p-helper-popup .oo-ui-radioInputWidget.oo-ui-widget-enabled [type='radio']:checked + span
      {
        border-color: var(--ooui-progressive);
      }

      #wgl-f2p-helper-popup .oo-ui-widget-enabled [type='checkbox']
      {
        position: relative;
        max-width: none;
        width: 1.42857143em;
        height: 1.42857143em;
        margin: 0;
        opacity: 0;
        z-index: 1;
      }

      #wgl-f2p-helper-popup .oo-ui-widget-enabled [type='checkbox'] + span
      {
        cursor: pointer;
        transition: background-color 100ms,border-color 100ms,box-shadow 100ms;
      }

      #wgl-f2p-helper-popup .oo-ui-widget-enabled [type='checkbox']:checked:not(:indeterminate) + span
      {
        background-size: 1em 1em;
      }

      #wgl-f2p-helper-popup .oo-ui-image-invert.oo-ui-icon-check,
      #wgl-f2p-helper-popup .mw-ui-icon-check-invert:before
      {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3e%3ctitle%3echeck%3c/title%3e%3cg fill='white'%3e%3cpath d='M7 14.2 2.8 10l-1.4 1.4L7 17 19 5l-1.4-1.4z'/%3e%3c/g%3e%3c/svg%3e");
      }

      #wgl-f2p-helper-popup .oo-ui-iconElement-icon
      {
        background-size: contain;
        background-position: center center;
        background-repeat: no-repeat;
        position: absolute;
        top: 0;
        min-width: 20px;
        width: 1.42857143em;
        min-height: 20px;
        height: 100%;
      }

      #wgl-f2p-helper-popup .oo-ui-iconWidget
      {
        vertical-align: middle;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        clip: auto;
        margin: 0;
        text-indent: -9999px;
        line-height: 2.5;
        display: inline-block;
        position: static;
        top: auto;
        height: 1.42857143em;
      }

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget [type='checkbox'] + span
      {
        background-color: #fff;
        background-size: 0 0;
        box-sizing: border-box;
        position: absolute;
        left: 0;
        width: 1.42857143em;
        height: 1.42857143em;
        border-color: #72777d;
        border-style: solid;
        border-radius: 2px;
        border-width: 1px;
      }

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget [type='checkbox'] + span,
      #wgl-f2p-helper-popup .oo-ui-radioInputWidget [type='radio'] + span
      {
        background-color: var(--ooui-input);
        border-color: var(--ooui-input-border);
      }

      #wgl-f2p-helper-popup .oo-ui-widget-enabled [type='checkbox']:checked + span,
      #wgl-f2p-helper-popup .oo-ui-widget-enabled [type='checkbox']:indeterminate + span
      {
        background-color: var(--ooui-progressive);
        border-color: var(--ooui-progressive);
      }

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget
      {
        display: inline-block;
        z-index: 0;
        position: relative;
        line-height: 1.42857143em;
        white-space: nowrap;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header
      {
        vertical-align: middle;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-field
      {
        display: table-cell;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-labelElement.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header
      {
        padding-top: 0;
        padding-bottom: 0;
        padding-left: 6px;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout:before,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout:after
      {
        content: ' ';
        display: table;
      }

      #wgl-f2p-helper-popup .oo-ui-labelElement .oo-ui-labelElement-label,
      #wgl-f2p-helper-popup .oo-ui-labelElement.oo-ui-labelElement-label
      {
        box-sizing: border-box;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-top > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-header,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-top > .oo-ui-fieldLayout-body > .oo-ui-fieldLayout-field
      {
        display: block;
      }

      #wgl-f2p-helper-popup .oo-ui-layout .oo-ui-fieldLayout-header
      {
        padding-bottom: 4px;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldsetLayout-group
      {
        clear: both;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-labelElement,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline
      {
        margin-top: 2px;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout:first-child,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-labelElement:first-child,
      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline:first-child
      {
        margin-top: 0;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout.oo-ui-fieldLayout-align-inline > .oo-ui-fieldLayout-body
      {
        display: table;
        width: 100%;
      }

      #wgl-f2p-helper-popup .oo-ui-fieldLayout-header
      {
        line-height: 1.3em;
        word-break: break-word;
      }

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget.oo-ui-widget-enabled [type='checkbox']
      {
        cursor: pointer;
      }

      #wgl-f2p-helper-popup .oo-ui-checkboxInputWidget *
      {
        font: inherit;
        vertical-align: middle;
      }
    `

    const head = document.getElementsByTagName('head')[0]

    observer.disconnect()

    head.appendChild(f2pHelperPopupStyle)

    const body = document.getElementsByTagName('body')[0]
    log(VERBOSE, 'body', body)

    if (body === null) return togglePopup
    body.appendChild(f2pHelperPopup)

    const styleCheckboxes = document.querySelectorAll('#f2p-helper-page input[type="checkbox"]')

    styleCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener(
        'change',
        (event) => {
          setToLocalStorage(event.target.name, event.target.checked)

          if (event.target.name.includes('Enabled')) {
            const elementSelector = `.${event.target.name}`
            const element = document.querySelector(elementSelector)

            if (element) {
              element.style.display = event.target.checked ? 'initial' : 'none'
            } else {
              logError(`Element not found: ${elementSelector}`)
            }
          }
        }
      )
    })

    startObserving(observer)
    log(VERBOSE, 'Added popup')

    return togglePopup
  }

  function startObserving (observer) {
    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    )
  }

  const mutationCallback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        log(TRACE, 'childList mutation detected')
        const membersValue = getMembersValue()
        maybeInsertPageTitleIcon(observer, membersValue)
        maybeUpdatePageTitleStyle(observer, membersValue)

        const togglePopup = maybeInsertPopup(observer)
        maybeInsertMenuContentIcon(observer, togglePopup)
      }
    }
  }

  const observer = new MutationObserver(mutationCallback)
  startObserving(observer)
})()
