# JavaScript Array Operations

## Array Reversal

Reverse an array in place using `reverse()`, or create a reversed copy using spread + reverse.

```javascript
// Reverses in place (mutates original)
const arr = [1, 2, 3, 4, 5];
arr.reverse();
console.log(arr); // [5, 4, 3, 2, 1]

// Non-mutating reverse (safe copy)
const original = [1, 2, 3];
const reversed = [...original].reverse();
console.log(original); // [1, 2, 3] — unchanged
console.log(reversed); // [3, 2, 1]
```

## Array Sorting

Sort arrays with the `sort()` method. Always provide a comparator for numbers — default sort is alphabetical.

```javascript
// Sort numbers ascending
const nums = [3, 1, 4, 1, 5, 9];
const sorted = [...nums].sort((a, b) => a - b);
console.log(sorted); // [1, 1, 3, 4, 5, 9]

// Sort numbers descending
const desc = [...nums].sort((a, b) => b - a);
console.log(desc); // [9, 5, 4, 3, 1, 1]

// Sort strings alphabetically
const words = ["banana", "apple", "cherry"];
words.sort();
console.log(words); // ["apple", "banana", "cherry"]
```

## Removing Duplicates

Use a Set to remove duplicate values from an array efficiently.

```javascript
// Basic deduplication
const withDupes = [1, 2, 2, 3, 3, 3, 4];
const unique = [...new Set(withDupes)];
console.log(unique); // [1, 2, 3, 4]

// Deduplicate array of strings
const tags = ["js", "python", "js", "react", "python"];
const uniqueTags = [...new Set(tags)];
console.log(uniqueTags); // ["js", "python", "react"]
```

## Array Transformation with Map

Transform every element in an array using `map()`. Returns a new array.

```javascript
// Double every number
const nums = [1, 2, 3, 4, 5];
const doubled = nums.map((n) => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]

// Extract a property from array of objects
const users = [{ name: "Alice" }, { name: "Bob" }];
const names = users.map((u) => u.name);
console.log(names); // ["Alice", "Bob"]
```

## Filtering Arrays

Use `filter()` to keep only elements that match a condition.

```javascript
// Keep only even numbers
const nums = [1, 2, 3, 4, 5, 6];
const evens = nums.filter((n) => n % 2 === 0);
console.log(evens); // [2, 4, 6]

// Filter objects by property
const users = [
  { name: "Alice", active: true },
  { name: "Bob", active: false },
  { name: "Carol", active: true },
];
const activeUsers = users.filter((u) => u.active);
console.log(activeUsers); // Alice and Carol
```

## Reducing Arrays

Use `reduce()` to accumulate array values into a single result.

```javascript
// Sum all numbers
const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((acc, val) => acc + val, 0);
console.log(sum); // 15

// Find maximum value
const max = nums.reduce((acc, val) => Math.max(acc, val), -Infinity);
console.log(max); // 5

// Count occurrences
const fruits = ["apple", "banana", "apple", "cherry", "banana", "apple"];
const counts = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(counts); // { apple: 3, banana: 2, cherry: 1 }
```

## Finding Elements

Search arrays with `find()`, `findIndex()`, and `includes()`.

```javascript
const nums = [10, 20, 30, 40, 50];

// Find first element matching condition
const found = nums.find((n) => n > 25);
console.log(found); // 30

// Find index of first match
const idx = nums.findIndex((n) => n > 25);
console.log(idx); // 2

// Check if value exists
console.log(nums.includes(30)); // true
console.log(nums.includes(99)); // false
```
