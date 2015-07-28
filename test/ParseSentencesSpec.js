/* global getSubInstance */
"use strict";

describe("Sub._parseSentences works as expected ", function() {
  var Sub = getSubInstance();

  var testCases = [
    {
      description: "Splits on spaces",
      in: "A multiword test",
      out: ["A&nbsp;", "multiword&nbsp;", "test"]
    },
    {
      description: "A single word is valid",
      in: "Oneword",
      out: ["Oneword"]
    },
    {
      description: "A single character is valid",
      in: "A",
      out: ["A"]
    },
    {
      description: "Splits on tabs",
      in: "Even\ttabs\twork",
      out: ["Even&nbsp;", "tabs&nbsp;", "work"]
    },
    {
      description: "Handles common punctuation ,.;:?!\" and parentheses apropriately",
      in: "Ok; we are \"here\": in Wilkes-Barre!?, finally.",
      out: ["Ok", ";&nbsp;", "we&nbsp;", "are&nbsp;", "\"", "here", "\"", ":&nbsp;", "in&nbsp;", "Wilkes-Barre", "!", "?", ",&nbsp;", "finally", "."],
    },
    {
      description: "Handles uncommon characters +/[]*{}() apropriately",
      in: "{5+[4*(6/3)]}=13",
      out: ["{", "5", "+", "[", "4", "*", "(", "6", "/", "3", ")", "]", "}", "=", "13"]
    },
    {
      description: "The characters -#$%^&_`~' do not break up words",
      in: "I am #1 with $5x10^6 in sales of `test-word_units, a 50% increase over A&M's",
      out: ["I&nbsp;", "am&nbsp;", "#1&nbsp;", "with&nbsp;", "$5x10^6&nbsp;", "in&nbsp;", "sales&nbsp;", "of&nbsp;", "`test-word_units", ",&nbsp;", "a&nbsp;", "50%&nbsp;", "increase&nbsp;", "over&nbsp;", "A&M's"]
    }
  ];

  testCases.forEach(function(testCase) {
    it(testCase.description, function() {
      expect(Sub._parseSentences([testCase.in])).toEqual([testCase.out]);
    });
  });
});