function evaluate(diceString) {
	var MAXCOUNT, count, expectedCount, explodingSize, explodingThreshold, hasModifier, html, individual,
		matchExplodingThreshold, matchSuccessThreshold, modifier, modifierMagnitude, modifierSign, optionsPresent,
		probabilityReroll, rerollCount, result, resultIndex, results, size, successThreshold, successes, sum, tendence,
		values, verbose;
	MAXCOUNT = 100;
	values = diceString.match(/([0-9]+)d([0-9]+)([\-\+][0-9]+)?\s?([0-9txiv]+)?/i);
	if (values === null) {
		return '<b>Dice: Invalid input</b>';
	}
	if (values[1] > MAXCOUNT) {
		return '<b>Dice: Limit of ' + MAXCOUNT + ' dice exceeded</b>';
	}

	count = parseInt(values[1], 10);
	size = parseInt(values[2], 10);
	hasModifier = values[3] !== void 0;
	modifier = values[3] && parseInt(values[3], 10);
	if (!hasModifier) {
		modifier = 0;
	}
	modifierSign = values[3] && values[3].charAt(0);
	modifierMagnitude = values[3] && values[3].slice(1);

	html = '<b>Dice: ' + count + 'd' + size + (hasModifier ? modifierSign + modifierMagnitude : '') + '<br />';

	// Parse options
	optionsPresent = false;
	individual = false;
	successThreshold = void 0;
	explodingSize = void 0; // This represents the number of results that will trigger a reroll
	explodingThreshold = void 0;
	verbose = false;
	if (values[4]) {
		optionsPresent = true;
		individual = /i/i.test(values[4]);
		matchSuccessThreshold = values[4].match(/t([0-9]+)/i);
		successThreshold = matchSuccessThreshold ? parseInt(matchSuccessThreshold[1], 10) : void 0;
		matchExplodingThreshold = values[4].match(/x([0-9]+)?/i);
		explodingSize = matchExplodingThreshold ? (parseInt(matchExplodingThreshold[1], 10) || 0) + 1 : void 0;
		explodingThreshold = matchExplodingThreshold ? (individual ? size : count * size) - explodingSize + 1 : void 0;
		verbose = /v/i.test(values[4]);
	}
	if (explodingThreshold !== void 0) {
		if (individual) {
			if (explodingThreshold <= 1) {
				return '<b>Dice: With the given paramaters your result is infinite.</b>';
			}
			probabilityReroll = explodingSize / size;
			tendence = count / (1 - probabilityReroll);
			if (tendence > MAXCOUNT) {
				return '<b>Dice: Due to exploding dice this input will statistically exceed the limit of ' + MAXCOUNT + ' dice rolls</b>';
			}
		} else {
			expectedCount = 2 * (explodingSize + modifier) / (size - 1);
			if (expectedCount > MAXCOUNT) {
				return '<b>Dice: Due to exploding dice this input will statistically exceed the limit of ' + MAXCOUNT + ' dice rolls</b>';
			}
		}
	}

	// Add the option settings to the HTML
	if (optionsPresent) {
		if (verbose) {
			html += 'Options:' + (successThreshold !== void 0 ? (individual ? ' Each roll must be greater or equal to ' + successThreshold + ' to count as a success.' : ' The sum of the rolls must be greater or equal to ' + successThreshold + ' to count as a success.') : individual ? ' The dice are considered individually.' : ' The sum of the dice is considered.') + (explodingThreshold !== void 0 ? (individual ? ' Each roll over ' + explodingThreshold + ' triggers an extra roll.' : ' If the sum of the rolls is greater or equal to ' + explodingThreshold + ' it triggers a new roll.') : '') + '<br />';
		} else {
			html += 'Options:' + (individual ? ' Individual.' : ' Sum.') + (successThreshold !== void 0 ? ' Threshold: ' + successThreshold + '.' : '') + (explodingThreshold !== void 0 ? ' Explodes: ' + explodingThreshold + '.' : '') + '<br />';
		}
	}
	results = [];
	resultIndex = void 0;
	result = void 0;
	if (individual) {
		successes = 0;
		rerollCount = 0;
		while (count > 0) {
			count--;
			result = Math.ceil(Math.random() * size);
			results.push(result);
			if (successThreshold && result + modifier >= successThreshold) {
				successes++;
			}
			if (explodingThreshold !== void 0 && result >= explodingThreshold) {
				rerollCount++;
			}
		}
		html += results.join(',');
		if (hasModifier) {
			html += ' ' + modifierSign + ' ' + modifierMagnitude;
			resultIndex = 0;
			while (resultIndex < results.length) {
				results[resultIndex] += modifier;
				resultIndex++;
			}
			html += ' = ' + results.join(',');
		}
		while (rerollCount) {
			count = rerollCount;
			rerollCount = 0;
			results.length = 0; // Empty the array
			while (count > 0) {
				count--;
				result = Math.ceil(Math.random() * size);
				results.push(result);
				if (successThreshold && result + modifier >= successThreshold) {
					successes++;
				}
				if (explodingThreshold !== void 0 && result >= explodingThreshold) {
					rerollCount++;
				}
			}
			html += '<br />' + results.join(',');
			if (hasModifier) {
				html += ' ' + modifierSign + ' ' + modifierMagnitude;
				resultIndex = 0;
				while (resultIndex < results.length) {
					results[resultIndex] += modifier;
					resultIndex++;
				}
				html += ' = ' + results.join(',');
			}
		}
		if (successThreshold !== void 0) {
			html += ' (' + successes + ' ' + (successes === 1 ? 'success' : 'successes') + '!)';
		}
	} else {
		sum = 0;
		while (count > 0) {
			count--;
			result = Math.ceil(Math.random() * size);
			sum += result;
			html += result + (count !== 0 ? '+' : '');
		}
		if (hasModifier) {
			html += ' ' + modifierSign + ' ' + modifierMagnitude;
			sum += modifier;
		}
		if (explodingThreshold !== void 0) {
			while (sum >= explodingThreshold) {
				html += ' = ' + sum;
				result = Math.ceil(Math.random() * size);
				sum += result;
				explodingThreshold += size;
				html += '<br /> +' + result;
			}
		}
		html += ' = ' + sum;
		if (successThreshold !== void 0) {
			html += sum >= successThreshold ? ' (Success!)' : ' (Fail)';
		}
	}
	html += '</b>';
	return html;
}

module.exports = evaluate;
