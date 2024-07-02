const { validateChronology } = require("../index");

const correctTimestamps = [
  new Date("2024-06-19T14:00:09Z"),
  new Date("2024-06-19T14:00:08Z"),
  new Date("2024-06-19T14:00:07Z"),
  new Date("2024-06-19T14:00:06Z"),
  new Date("2024-06-19T14:00:05Z"),
  new Date("2024-06-19T14:00:04Z"),
  new Date("2024-06-19T14:00:03Z"),
  new Date("2024-06-19T13:59:00Z"),
  new Date("2024-06-19T13:58:00Z"),
  new Date("2024-05-19T14:00:09Z"),
];

const incorrectTimestamps = [
  new Date("2024-06-19T14:00:09Z"),
  new Date("2024-06-19T14:00:09Z"),
  new Date("2024-06-19T14:00:09Z"),
  new Date("2024-06-19T14:00:07Z"), // Article #4 is older than Article #5
  new Date("2024-06-19T14:00:08Z"),
  new Date("2024-06-18T14:00:00Z"),
  new Date("2024-06-18T14:00:00Z"),
  new Date("2024-06-18T14:00:00Z"),
  new Date("2024-06-18T14:00:00Z"),
  new Date("2024-06-18T14:00:00Z"),
];

test("validateChronology returns true for properly sorted timestamps", () => {
  expect(validateChronology(correctTimestamps)).toBe(true);
});

test("validateChronology returns false for incorrectly sorted timestamps", () => {
  expect(validateChronology(incorrectTimestamps)).toBe(false);
});

test("validateChronology identifies and logs the correct article numbers for the first out-of-order timestamp", () => {
  const consoleSpy = jest.spyOn(console, "log");
  validateChronology(incorrectTimestamps);
  expect(consoleSpy).toHaveBeenCalledWith("Article #4 is older than Article #5");
  consoleSpy.mockRestore();
});