evalDice = (diceString) ->
  MAXCOUNT = 100
  values = diceString.match(/([0-9]+)d([0-9]+)([\-\+][0-9]+)?\s?([0-9txiv]+)?/i)
  if values == null
    return '<b>Dice: Invalid input</b>'
  if values[1] > MAXCOUNT
    return '<b>Dice: Limit of ' + MAXCOUNT + ' dice exceeded</b>'
  count = parseInt(values[1], 10)
  size = parseInt(values[2], 10)
  hasModifier = values[3] != undefined
  modifier = values[3] and parseInt(values[3], 10)
  if !hasModifier
    modifier = 0
  modifierSign = values[3] and values[3].charAt(0)
  modifierMagnitude = values[3] and values[3].slice(1)
  html = '<b>Dice: ' + count + 'd' + size + (if hasModifier then modifierSign + modifierMagnitude else '') + '<br />'
  # Parse options
  optionsPresent = false
  individual = false
  successThreshold = undefined
  explodingSize = undefined
  # This represents the number of results that will trigger a reroll
  explodingThreshold = undefined
  verbose = false
  if values[4]
    optionsPresent = true
    individual = /i/i.test(values[4])
    matchSuccessThreshold = values[4].match(/t([0-9]+)/i)
    successThreshold = if matchSuccessThreshold then parseInt(matchSuccessThreshold[1], 10) else undefined
    matchExplodingThreshold = values[4].match(/x([0-9]+)?/i)
    explodingSize = if matchExplodingThreshold then (parseInt(matchExplodingThreshold[1], 10) or 0) + 1 else undefined
    explodingThreshold = if matchExplodingThreshold then (if individual then size else count * size) - explodingSize + 1 else undefined
    verbose = /v/i.test(values[4])
  if explodingThreshold != undefined
    if individual
      if explodingThreshold <= 1
        return '<b>Dice: With the given paramaters your result is infinite.</b>'
      probabilityReroll = explodingSize / size
      tendence = count / (1 - probabilityReroll)
      if tendence > MAXCOUNT
        return '<b>Dice: Due to exploding dice this input will statistically exceed the limit of ' + MAXCOUNT + ' dice rolls</b>'
    else
      expectedCount = 2 * (explodingSize + modifier) / (size - 1)
      if expectedCount > MAXCOUNT
        return '<b>Dice: Due to exploding dice this input will statistically exceed the limit of ' + MAXCOUNT + ' dice rolls</b>'
  # Add the option settings to the HTML
  if optionsPresent
    if verbose
      html += 'Options:' + (if successThreshold != undefined then (if individual then ' Each roll must be greater or equal to ' + successThreshold + ' to count as a success.' else ' The sum of the rolls must be greater or equal to ' + successThreshold + ' to count as a success.') else if individual then ' The dice are considered individually.' else ' The sum of the dice is considered.') + (if explodingThreshold != undefined then (if individual then ' Each roll over ' + explodingThreshold + ' triggers an extra roll.' else ' If the sum of the rolls is greater or equal to ' + explodingThreshold + ' it triggers a new roll.') else '') + '<br />'
    else
      html += 'Options:' + (if individual then ' Individual.' else ' Sum.') + (if successThreshold != undefined then ' Threshold: ' + successThreshold + '.' else '') + (if explodingThreshold != undefined then ' Explodes: ' + explodingThreshold + '.' else '') + '<br />'
  results = []
  resultIndex = undefined
  result = undefined
  if individual
    successes = 0
    rerollCount = 0
    while count > 0
      count--
      result = Math.ceil(Math.random() * size)
      results.push result
      if successThreshold and result + modifier >= successThreshold
        successes++
      if explodingThreshold != undefined and result >= explodingThreshold
        rerollCount++
    html += results.join(',')
    if hasModifier
      html += ' ' + modifierSign + ' ' + modifierMagnitude
      resultIndex = 0
      while resultIndex < results.length
        results[resultIndex] += modifier
        resultIndex++
      html += ' = ' + results.join(',')
    while rerollCount
      count = rerollCount
      rerollCount = 0
      results.length = 0
      # Empty the array
      while count > 0
        count--
        result = Math.ceil(Math.random() * size)
        results.push result
        if successThreshold and result + modifier >= successThreshold
          successes++
        if explodingThreshold != undefined and result >= explodingThreshold
          rerollCount++
      html += '<br />' + results.join(',')
      if hasModifier
        html += ' ' + modifierSign + ' ' + modifierMagnitude
        resultIndex = 0
        while resultIndex < results.length
          results[resultIndex] += modifier
          resultIndex++
        html += ' = ' + results.join(',')
    if successThreshold != undefined
      html += ' (' + successes + ' ' + (if successes == 1 then 'success' else 'successes') + '!)'
  else
    sum = 0
    while count > 0
      count--
      result = Math.ceil(Math.random() * size)
      sum += result
      html += result + (if count != 0 then '+' else '')
    if hasModifier
      html += ' ' + modifierSign + ' ' + modifierMagnitude
      sum += modifier
    if explodingThreshold != undefined
      while sum >= explodingThreshold
        html += ' = ' + sum
        result = Math.ceil(Math.random() * size)
        sum += result
        explodingThreshold += size
        html += '<br /> +' + result
    html += ' = ' + sum
    if successThreshold != undefined
      html += if sum >= successThreshold then ' (Success!)' else ' (Fail)'
  html += '</b>'
  html
