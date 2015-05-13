/* global getReplaceInstance */
"use strict";

describe("Replace._parseSentences works as expected ", function() {
  var Replace = getReplaceInstance();

  var testCases = [
    {
      description: "Splits on spaces",
      in: "A multiword test",
      out: ["A", "multiword", "test"]
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
      out: ["Even", "tabs", "work"]
    },
    {
      description: "Handles common punctuation ,.;:?!\" and parentheses apropriately",
      in: "Ok; we are \"here\": in Wilkes-Barre!?, finally.",
      out: ["Ok", ";", "we", "are", "\"", "here", "\"", ":", "in", "Wilkes-Barre", "!", "?", ",", "finally", "."],
    },
    {
      description: "Handles uncommon characters +/[]*{}() apropriately",
      in: "{5+[4*(6/3)]}=13",
      out: ["{", "5", "+", "[", "4", "*", "(", "6", "/", "3", ")", "]", "}", "=", "13"]
    },
    {
      description: "The characters -#$%^&_`~' do not break up words",
      in: "I am #1 with $5x10^6 in sales of `test-word_units, a 50% increase over A&M's",
      out: ["I", "am", "#1", "with", "$5x10^6", "in", "sales", "of", "`test-word_units", ",", "a", "50%", "increase", "over", "A&M's"]
    }
  ];

  testCases.forEach(function(testCase) {
    it(testCase.description, function() {
      expect(Replace._parseSentences([testCase.in])).toEqual([testCase.out]);
    });
  });
});