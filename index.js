const fs = require('fs')

const CONFIG = {
  members: {
    ignore: false,
    cssFilename: 'members.css',
    linkColor: {
      key: 'members-color',
      value: {
        light: '#ae2a5b',
        dark: '#d3a1a1',
        browntown: '#b5718d'
      }
    },
    categories: [
      "Members' items",
      "Members' account builds"
    ]
  },
  free_to_play: {
    ignore: false,
    cssFilename: 'f2p.css',
    linkColor: {
      key: 'f2p-color',
      value: {
        light: '#439339',
        dark: '#8cd4e6',
        browntown: '#95b77e'
      }
    },
    categories: [
      'Free-to-play',
      'Free-to-play account builds',
      'Free-to-play items',
      'Free-to-play quests'
    ]
  }
}

const WIKI_URL = 'https://oldschool.runescape.wiki'

async function fetchCategoryMembersBatch (allTitles, cmtitle, cmcontinue = null) {
  const params = {
    format: 'json',
    action: 'query',
    cmlimit: 500,
    list: 'categorymembers',
    cmprop: 'title',
    cmtitle
  }

  if (cmcontinue) params.cmcontinue = cmcontinue

  let apiUrl = WIKI_URL + '/api.php?origin=*'
  Object.keys(params).forEach((key) => { apiUrl += `&${key}=${params[key]}` })

  try {
    const response = await fetch(apiUrl)
    const data = await response.json()

    allTitles.push(...data.query.categorymembers.map((page) => page.title))

    if (data.continue) await fetchCategoryMembersBatch(allTitles, cmtitle, data.continue.cmcontinue)
  } catch (error) {
    console.log(error)
  }

  return allTitles
}

async function getPageTitlesFromCategory (categoryName) {
  const cmtitle = `Category:${categoryName}`
  const allTitles = [cmtitle]

  await fetchCategoryMembersBatch(allTitles, cmtitle)

  return allTitles
}

async function generatePageTitleSelectorsFromCategory (categoryName) {
  const pageTitles = await getPageTitlesFromCategory(categoryName)

  function escapePageTitle (pageTitle) {
    return encodeURIComponent(pageTitle)
      .replaceAll(/'/g, '%27')
      .replaceAll('%20', '_')
      .replaceAll('%2F', '/')
      .replaceAll('%2C', ',')
      .replaceAll('%3A', ':')
  }

  return pageTitles.map(
    (pageTitle) => `a[href="/w/${escapePageTitle(pageTitle)}"]`
  )
}

// async function generateCssRulesForCategory (linkColorVariableName, categoryName) {
//   const pageTitleSelectors = await generatePageTitleSelectorsFromCategory(categoryName)

//   const escapedCategoryName = categoryName.replaceAll(' ', '_')

//   const categoryLink = `${WIKI_URL}/w/Category:${escapedCategoryName}`

//   return `
// /* Category: ${categoryName} */
// /* Link: "${categoryLink}" */
// ${pageTitleSelectors.join(',\n')}
// {
//   color: var(--${linkColorVariableName});
// }`
// }

async function generateCssRulesForCategory (linkColorVariableName, categoryName) {
  const pageTitleSelectors = await generatePageTitleSelectorsFromCategory(categoryName)
  const escapedCategoryName = categoryName.replaceAll(' ', '_')
  const categoryLink = `${WIKI_URL}/w/Category:${escapedCategoryName}`

  const cssRules = []
  const totalBatches = Math.ceil(pageTitleSelectors.length / 1000)
  let batchNumber = 1

  for (let i = 0; i < pageTitleSelectors.length; i += 1000) {
    const batchSelectors = pageTitleSelectors.slice(i, i + 1000)

    const batchCss = `
/* Category: ${categoryName} */
/* Link: "${categoryLink}" */
/* Batch: ${batchNumber} of ${totalBatches} */
${batchSelectors.join(',\n')}
{
  color: var(--${linkColorVariableName});
}`

    cssRules.push(batchCss)
    batchNumber++
  }

  return cssRules.join('\n')
}

async function generateCssRulesForCategories ({ linkColor, categories }) {
  const linkColorVariableName = linkColor.key

  const cssRulesPromises = categories.map(
    async (categoryName) => { return generateCssRulesForCategory(linkColorVariableName, categoryName) }
  )

  return await Promise.all(cssRulesPromises)
}

function generateCssVariables (linkColors) {
  const lightVariables = []
  const darkVariables = []
  const browntownVariables = []

  linkColors.forEach((linkColor) => {
    const linkColorVariableName = linkColor.key

    lightVariables.push(`--${linkColorVariableName}: ${linkColor.value.light};`)
    darkVariables.push(`--${linkColorVariableName}: ${linkColor.value.dark};`)
    browntownVariables.push(`--${linkColorVariableName}: ${linkColor.value.browntown};`)
  })

  return `body.wgl-theme-light
{
  ${lightVariables.join('\n  ')}
}

body.wgl-theme-dark
{
  ${darkVariables.join('\n  ')}
}

body.wgl-theme-browntown
{
  ${browntownVariables.join('\n  ')}
}`
}

function generateCssFile (cssFilename, cssContent) {
  fs.writeFile(
    `output/${cssFilename}`,
    cssContent,
    (error) => {
      if (error) {
        console.error('Error writing CSS file:', error)
      } else {
        console.log(`Successfully created CSS file: ${cssFilename}`)
      }
    }
  )
}

async function generateCssObjectForConfigValue ({ ignore, linkColor, categories }) {
  if (ignore) return {}

  const variables = generateCssVariables([linkColor])
  const rules = await generateCssRulesForCategories({ linkColor, categories })

  return {
    variables,
    rules
  }
}

async function generateCssFiles () {
  const cssContents = []

  const values = Object.values(CONFIG)

  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    const cssObject = await generateCssObjectForConfigValue(value)
    cssContents.push(cssObject)

    const cssContent = [
      cssObject.variables,
      cssObject.rules.join('\n')
    ].join('\n')

    generateCssFile(value.cssFilename, cssContent)
  }

  const allVariables = generateCssVariables(
    values.map((value) => value.linkColor)
  )
  const allRules = cssContents.map((cssContent) => cssContent.rules.join('\n')).join('\n')

  const allCssContent = [
    allVariables,
    allRules
  ].join('\n')

  generateCssFile('all.css', allCssContent)
}

generateCssFiles()
