# Python String Operations

## String Reversal

Reversing a string in Python is simple using slicing. The `[::-1]` syntax creates a reversed copy.

```python
def reverse_string(s):
    return s[::-1]

# Example
text = "hello"
print(reverse_string(text))  # "olleh"
```

You can also use the built-in `reversed()` function combined with `join()`:

```python
def reverse_string_v2(s):
    return ''.join(reversed(s))
```

## String Search and Replace

Use the `replace()` method to substitute substrings. It returns a new string and does not modify the original.

```python
text = "Hello World"
result = text.replace("World", "Python")
print(result)  # "Hello Python"

# Replace all occurrences
sentence = "cat and cat and cat"
print(sentence.replace("cat", "dog"))  # "dog and dog and dog"
```

## String Splitting and Joining

Split a string into a list using `split()`, and join a list back into a string using `join()`.

```python
# Split by delimiter
csv_line = "apple,banana,cherry"
fruits = csv_line.split(",")
print(fruits)  # ["apple", "banana", "cherry"]

# Join list into string
words = ["Hello", "World"]
sentence = " ".join(words)
print(sentence)  # "Hello World"
```

## String Formatting

Python offers multiple ways to format strings. f-strings (Python 3.6+) are the most readable.

```python
name = "Alice"
age = 30

# f-string (recommended)
print(f"My name is {name} and I am {age} years old.")

# format() method
print("My name is {} and I am {} years old.".format(name, age))

# % formatting (old style)
print("My name is %s and I am %d years old." % (name, age))
```

## String Case Conversion

Python strings have built-in methods for case manipulation.

```python
text = "Hello World"

print(text.upper())      # "HELLO WORLD"
print(text.lower())      # "hello world"
print(text.title())      # "Hello World"
print(text.swapcase())   # "hELLO wORLD"
```

## Checking String Content

Use boolean methods to inspect what a string contains.

```python
print("hello123".isalnum())   # True  - only letters and numbers
print("hello".isalpha())      # True  - only letters
print("123".isdigit())        # True  - only digits
print("  ".isspace())         # True  - only whitespace
print("Hello".startswith("He"))  # True
print("Hello".endswith("lo"))    # True
```

## String Stripping and Padding

Remove whitespace or pad strings to a fixed width.

```python
# Strip whitespace
text = "  hello world  "
print(text.strip())    # "hello world"
print(text.lstrip())   # "hello world  "
print(text.rstrip())   # "  hello world"

# Padding
print("42".zfill(5))        # "00042"
print("hi".ljust(10, "-"))  # "hi--------"
print("hi".rjust(10, "-"))  # "--------hi"
```
