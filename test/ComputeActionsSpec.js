/* global getSubInstance */
"use strict";

describe("Sub._computeActionsToChange ", function() {
	var Sub = getSubInstance();

	var testCases = [
	{
		description: "Keep costs 0",
		from: ["very"],
		to: ["very"],
		out: {
			from: ["very"],
			to: ["very"],
			sub:[],
			remove: [],
			insert: [],
			keep: [
			{ fromWord: "very",  toWord: "very",  fromIndex: 0, toIndex: 0 }],
			cost: 0
		}
	},
	{
		description: "Subment costs 1",
		from: ["very"],
		to: ["quick"],
		out: {
			from: ["very"],
			to: ["quick"],
			sub:[
			{ fromWord: "very", toWord: "quick", fromIndex: 0, toIndex: 0 } ],
			remove: [],
			insert: [],
			keep: [],
			cost: 1
		}
	},
	{
		description: "Insert costs 1",
		from: [],
		to: ["cool"],
		out: {
			from: [],
			to: ["cool"],
			sub:[],
			remove: [],
			insert: [
			{ toWord: "cool", toIndex: 0 } ],
			keep: [],
			cost: 1
		}
	},
	{
		description: "Remove costs 1",
		from: ["cool"],
		to: [],
		out: {
			from: ["cool"],
			to: [],
			sub:[],
			remove: [
			{ fromWord: "cool", fromIndex: 0 } ],
			insert: [],
			keep: [],
			cost: 1
		}
	},
	{
		description: "Simple substitution",
		from: ["The", "very", "brown", "fox", "is", "very", "cool"],
		to: ["The", "quick", "brown", "fox", "is", "very", "cool"],
		out: {
			from: ["The", "very", "brown", "fox", "is", "very", "cool"],
			to: ["The", "quick", "brown", "fox", "is", "very", "cool"],
			sub:[
			{ fromWord: "very", toWord: "quick", fromIndex: 1, toIndex: 1 } ],
			remove: [],
			insert: [],
			keep: [
			{ fromWord: "The",   toWord: "The",   fromIndex: 0, toIndex: 0 },
			{ fromWord: "brown", toWord: "brown", fromIndex: 2, toIndex: 2 },
			{ fromWord: "fox",   toWord: "fox",   fromIndex: 3, toIndex: 3 },
			{ fromWord: "is",    toWord: "is",    fromIndex: 4, toIndex: 4 },
			{ fromWord: "very",  toWord: "very",  fromIndex: 5, toIndex: 5 },
			{ fromWord: "cool",  toWord: "cool",  fromIndex: 6, toIndex: 6 } ],
			cost: 1
		}
	},
	{
		description: "Avoids bad solutions using a lookahead",
		from: ["The", "quick", "brown", "fox", "is", "very", "cool"],
		to: ["The", "very", "brown", "fox", "is", "very", "cool"],
		out: {
			from: ["The", "quick", "brown", "fox", "is", "very", "cool"],
			to: ["The", "very", "brown", "fox", "is", "very", "cool"],
			sub:[
			{ fromWord: "quick", toWord: "very", fromIndex: 1, toIndex: 1 } ],
			remove: [],
			insert: [],
			keep: [
			{ fromWord: "The",   toWord: "The",   fromIndex: 0, toIndex: 0 },
			{ fromWord: "brown", toWord: "brown", fromIndex: 2, toIndex: 2 },
			{ fromWord: "fox",   toWord: "fox",   fromIndex: 3, toIndex: 3 },
			{ fromWord: "is",    toWord: "is",    fromIndex: 4, toIndex: 4 },
			{ fromWord: "very",  toWord: "very",  fromIndex: 5, toIndex: 5 },
			{ fromWord: "cool",  toWord: "cool",  fromIndex: 6, toIndex: 6 } ],
			cost: 1
		}
	},
	{
		description: "Accurately counts complex example",
		from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."],
		to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"],
		out: {
			from: ["The", "quick", "brown", "fox", "is", "very", "cool", ",", "supposedly", "."],
			to: ["The", "brown", "color", "is", "very", "very", "pretty", ",", "no", "?"],
			sub:[
			{ fromWord: "fox",        toWord: "color", fromIndex: 3, toIndex: 2 },
			{ fromWord: "cool",       toWord: "very",  fromIndex: 6, toIndex: 5 },
			{ fromWord: "supposedly", toWord: "no",    fromIndex: 8, toIndex: 8 },
			{ fromWord: ".",          toWord: "?",     fromIndex: 9, toIndex: 9 } ],
			remove: [
			{ fromWord: "quick", fromIndex: 1 } ],
			insert: [
			{ toWord: "pretty", toIndex: 6 } ],
			keep: [
			{ fromWord: "The",   toWord: "The",   fromIndex: 0, toIndex: 0 },
			{ fromWord: "brown", toWord: "brown", fromIndex: 2, toIndex: 1 },
			{ fromWord: "is",    toWord: "is",    fromIndex: 4, toIndex: 3 },
			{ fromWord: "very",  toWord: "very",  fromIndex: 5, toIndex: 4 },
			{ fromWord: ",",     toWord: ",",     fromIndex: 7, toIndex: 7 } ],
			cost: 6
		}
	} ];

	testCases.forEach(function(testCase) {
		it(testCase.description, function() {
			expect(Sub._computeActionsToChange(testCase.from,
				testCase.to)).toEqual(testCase.out);
		});
	});
});
