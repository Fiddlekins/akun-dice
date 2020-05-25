'use strict';

function evaluate(inputString) {
	var values = inputString.match(/([0-9]+)d([0-9]+)([\-\+][0-9]+)?\s?([0-9sfxiv,-]+)?/i);

	if (values === null) {
		return '**Dice: Invalid input**';
	}
	if (values[1] > this._MAXCOUNT) {
		return '**Dice: Limit of ' + this._MAXCOUNT + ' dice exceeded**';
	}

	var count = parseInt(values[1], 10);
	var size = parseInt(values[2], 10);
	var hasModifier = values[3] !== undefined;
	var modifier = values[3] && parseInt(values[3], 10);
	if (!hasModifier) {
		modifier = 0;
	}
	var modifierSign = values[3] && values[3].charAt(0);
	var modifierMagnitude = values[3] && values[3].slice(1);

	var output = '**Dice: ' + count + 'd' + size + (hasModifier ? modifierSign + modifierMagnitude : '') + '**\n';

	// Parse options
	var optionsPresent = false;
	var individual = false;
	var successThreshold;
	var successBonusThreshold;
	var successBonusCount; // The absolute number of successes that a bonus success will count as
	var failThreshold;
	var failBonusThreshold;
	var failBonusCount; // The absolute number of fails that a 'bonus' fail will count as
	var explodingSize; // This represents the number of results that will trigger a reroll
	var explodingThreshold;
	var verbose = false;

	if (values[4]) {
		optionsPresent = true;

		individual = /i/i.test(values[4]);

		var matchSuccessThreshold = values[4].match(/s(-?[0-9]+)(,-?[0-9]+)?(,-?[0-9]+)?/i);
		if (matchSuccessThreshold) {
			successThreshold = parseInt(matchSuccessThreshold[1], 10);
			if (matchSuccessThreshold[2]) {
				successBonusThreshold = parseInt(matchSuccessThreshold[2].slice(1), 10);
				successBonusCount = matchSuccessThreshold[3] ? parseInt(matchSuccessThreshold[3].slice(1), 10) : 2;
			}
		}

		var matchFailThreshold = values[4].match(/f(-?[0-9]+)(,-?[0-9]+)?(,-?[0-9]+)?/i);
		if (matchFailThreshold) {
			failThreshold = parseInt(matchFailThreshold[1], 10);
			if (matchFailThreshold[2]) {
				failBonusThreshold = parseInt(matchFailThreshold[2].slice(1), 10);
				failBonusCount = matchFailThreshold[3] ? parseInt(matchFailThreshold[3].slice(1), 10) : 2;
			}
		}

		var matchExplodingThreshold = values[4].match(/x(-?[0-9]+)?/i);
		explodingSize = matchExplodingThreshold ? (parseInt(matchExplodingThreshold[1], 10) || 0) + 1 : undefined;
		explodingThreshold = matchExplodingThreshold ? (individual ? size : count * size) - explodingSize + 1 : undefined;

		verbose = /v/i.test(values[4]);
	}

	if (explodingThreshold !== undefined) {
		if (individual) {
			if (explodingThreshold <= 1) {
				return '**Dice: With the given parameters your result is infinite.**';
			}
			var probabilityReroll = explodingSize / size;
			var tendence = count / (1 - probabilityReroll);
			if (tendence > this._MAXCOUNT) {
				return '**Dice: Due to exploding dice this input will statistically exceed the limit of ' + this._MAXCOUNT + ' dice rolls**';
			}
		} else {
			var expectedCount = 2 * (explodingSize + modifier) / (size - 1);

			if (expectedCount > this._MAXCOUNT) {
				return '**Dice: Due to exploding dice this input will statistically exceed the limit of ' + this._MAXCOUNT + ' dice rolls**';
			}
		}
	}

	// Add the option settings to the output
	if (optionsPresent) {
		if (verbose) {
			output += 'Options:';
			if (successThreshold !== undefined) {
				if (individual) {
					output += ' Each roll must be greater or equal to ' + successThreshold + ' to count as a success.';
					if (successBonusThreshold !== undefined) {
						output += ' Rolls that are greater equal to ' + successBonusThreshold + ' count as ' + successBonusCount + ' success' + (successBonusCount === 1 ? '' : 'es') + '.';
					}
				} else {
					output += ' The sum of the rolls must be greater or equal to ' + successThreshold + ' to count as a success.';
					if (successBonusThreshold !== undefined) {
						output += ' A sum greater equal to ' + successBonusThreshold + ' counts as a critical success.';
					}
				}
				if (failThreshold !== undefined) {
					if (individual) {
						output += ' Each roll less or equal to ' + failThreshold + ' negates a success.';
						if (failBonusThreshold !== undefined) {
							output += ' Rolls that are less or equal to ' + failBonusThreshold + ' negate ' + failBonusCount + ' success' + (failBonusCount === 1 ? '' : 'es') + '.';
						}
					} else if (failBonusThreshold !== undefined) {
						output += ' A sum less or equal to ' + failBonusThreshold + ' counts as a critical fail.';
					}
				}
			} else {
				if (individual) {
					output += ' The dice are considered individually.';
				} else {
					output += ' The sum of the dice is considered.';
				}
			}
			if (explodingThreshold !== undefined) {
				if (individual) {
					output += ' Each roll over ' + explodingThreshold + ' triggers an extra roll.';
				} else {
					output += ' If the sum of the rolls is greater or equal to ' + explodingThreshold + ' it triggers a new roll.';
				}
			}
			output += '\n';
		} else {
			output += 'Options:';
			output += individual ? ' Individual.' : ' Sum.';
			if (successThreshold !== undefined) {
				output += ' Success: ' + successThreshold;
				if (successBonusThreshold !== undefined) {
					output += ',' + successBonusThreshold;
					if (individual && successBonusCount !== undefined) {
						output += ',' + successBonusCount;
					}
				}
				output += '.';
				if (failThreshold !== undefined) {
					output += ' Fail: ' + failThreshold;
					if (failBonusThreshold !== undefined) {
						output += ',' + failBonusThreshold;
						if (individual && failBonusCount !== undefined) {
							output += ',' + failBonusCount;
						}
					}
					output += '.';
				}
			}
			if (explodingThreshold !== undefined) {
				output += ' Explodes: ' + explodingThreshold + '.';
			}
			output += '\n';
		}
	}

	var results = [];
	var resultIndex;
	var result;
	if (individual) {
		var successes = 0;
		var rerollCount = 0;

		while (count > 0) {
			count--;
			result = Math.ceil(Math.random() * size);
			results.push(result);
			if (explodingThreshold !== undefined && result >= explodingThreshold) {
				rerollCount++;
			}
			result += modifier;
			if (successThreshold) {
				if (result >= successBonusThreshold) {
					successes += successBonusCount;
				} else if (result >= successThreshold) {
					successes++;
				}
			}
			if (failThreshold) {
				if (result <= failBonusThreshold) {
					successes -= failBonusCount;
				} else if (result <= failThreshold) {
					successes--;
				}
			}
		}

		output += results.join(',');
		if (hasModifier) {
			output += ' ' + modifierSign + ' ' + modifierMagnitude;
			for (resultIndex = 0; resultIndex < results.length; resultIndex++) {
				results[resultIndex] += modifier;
			}
			output += ' = ' + results.join(',');
		}

		while (rerollCount) {
			count = rerollCount;
			rerollCount = 0;
			results.length = 0; // Empty the array
			while (count > 0) {
				count--;
				result = Math.ceil(Math.random() * size);
				results.push(result);
				if (explodingThreshold !== undefined && result >= explodingThreshold) {
					rerollCount++;
				}
				result += modifier;
				if (successThreshold) {
					if (result >= successBonusThreshold) {
						successes += successBonusCount;
					} else if (result >= successThreshold) {
						successes++;
					}
				}
				if (failThreshold) {
					if (result <= failBonusThreshold) {
						successes -= failBonusCount;
					} else if (result <= failThreshold) {
						successes--;
					}
				}
			}

			output += '\n' + results.join(',');
			if (hasModifier) {
				output += ' ' + modifierSign + ' ' + modifierMagnitude;
				for (resultIndex = 0; resultIndex < results.length; resultIndex++) {
					results[resultIndex] += modifier;
				}
				output += ' = ' + results.join(',');
			}
		}

		if (successThreshold !== undefined) {
			output += ' (' + successes + ' ' + (successes === 1 ? 'success' : 'successes') + '!)';
		}
	} else {
		var sum = 0;

		while (count > 0) {
			count--;
			result = Math.ceil(Math.random() * size);
			sum += result;
			output += result + (count !== 0 ? '+' : '');
		}

		if (hasModifier) {
			output += ' ' + modifierSign + ' ' + modifierMagnitude;
			sum += modifier;
		}

		if (explodingThreshold !== undefined) {
			while (sum >= explodingThreshold) {
				output += ' = ' + sum;
				result = Math.ceil(Math.random() * size);
				sum += result;
				explodingThreshold += size;
				output += '\n +' + result;
			}
		}

		output += ' = ' + sum;

		if (successThreshold !== undefined) {
			if (sum >= successBonusThreshold) {
				output += ' (Critical Success!)';
			} else if (sum >= successThreshold) {
				output += ' (Success!)';
			} else if (failThreshold !== undefined) {
				if (sum <= failBonusThreshold) {
					output += ' (Critical Fail!)';
				} else {
					output += ' (Fail)';
				}
			} else {
				output += ' (Fail)';
			}
		}
	}

	return output;
}

module.exports = evaluate;
