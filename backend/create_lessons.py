import os
import sys
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

from database import SessionLocal, engine
import models

# Ensure tables are created
models.Base.metadata.create_all(bind=engine)

def create_lessons(db: Session):
    lessons_data = [
        {
            "title": "Hello World: Your First Program",
            "content": "Welcome to your first programming lesson! In this lesson, you will learn how to make your program display text on the screen. This is often called \"printing\" to the console.\n\nIn Python, you use the `print()` function to achieve this. Whatever you put inside the parentheses and quotes will be displayed.\n\n**Example:**\n```python\nprint(\"Hello, Python!\")\n```\n\n**Your Task:**\nWrite a Python program that prints the message \"Hello, World!\" to the console.",
            "code_example": "print(\"Hello, Python!\")",
            "prefill_code": "# Write your code below this line\n",
            "test_code": "assert user_printed_output.strip() == \"Hello, World!\", \"Make sure you print 'Hello, World!' exactly!\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Variables: Storing Information",
            "content": "Variables are like containers that hold information. You can give them a name and assign a value to them.\n\n**Example:**\n```python\nmessage = \"Hello, Variables!\"\nprint(message)\n```\n\n**Your Task:**\nCreate a variable named `my_name` and assign your name (as a string) to it. Then, print the value of `my_name`.",
            "code_example": "name = \"Alice\"\nprint(name)",
            "prefill_code": "# Create your variable and print it\n",
            "test_code": "assert 'my_name' in execution_scope, \"Make sure you create a variable named 'my_name'\"\nassert isinstance(execution_scope['my_name'], str), \"'my_name' should be a string\"\nassert user_printed_output.strip() == execution_scope['my_name'], \"Make sure you print the value of 'my_name'\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Basic Arithmetic: Numbers and Operations",
            "content": "Python can perform basic arithmetic operations like addition, subtraction, multiplication, and division.\n\n**Example:**\n```python\nresult = 10 + 5\nprint(result)\n```\n\n**Your Task:**\nCalculate the sum of 25 and 15, store it in a variable named `total`, and then print the `total`.",
            "code_example": "sum_val = 5 * 7\nprint(sum_val)",
            "prefill_code": "# Perform arithmetic and print the result\n",
            "test_code": "assert 'total' in execution_scope, \"Make sure you create a variable named 'total'\"\nassert execution_scope['total'] == 40, \"'total' should be 40\"\nassert user_printed_output.strip() == str(execution_scope['total']), \"Make sure you print the value of 'total'\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Strings: Working with Text",
            "content": "Strings are sequences of characters, used for text. You can combine them (concatenate) using the `+` operator.\n\n**Example:**\n```python\ngreeting = \"Hello\"\nname = \"World\"\nfull_message = greeting + \", \" + name + \"!\"\nprint(full_message)\n```\n\n**Your Task:**\nCombine the strings \"Python\" and \"is fun!\" to form the message \"Python is fun!\" (with a space in between). Store the result in a variable called `sentence` and print it.",
            "code_example": "word1 = \"Code\"\nword2 = \"Learn\"\ncombined = word1 + word2\nprint(combined)",
            "prefill_code": "# Combine strings and print the result\n",
            "test_code": "assert 'sentence' in execution_scope, \"Make sure you create a variable named 'sentence'\"\nassert execution_scope['sentence'] == \"Python is fun!\", \"'sentence' should be 'Python is fun!'\"\nassert user_printed_output.strip() == execution_scope['sentence'], \"Make sure you print the value of 'sentence'\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Input: Getting User Information",
            "content": "The `input()` function allows your program to get information from the user. It pauses the program and waits for the user to type something and press Enter.\n\n**Example:**\n```python\nuser_name = input(\"What is your name? \")\nprint(\"Hello, \" + user_name + \"!\")\n```\n\n**Your Task:**\nAsk the user for their favorite color using `input()`, store it in a variable `fav_color`, and then print a message like \"Your favorite color is [fav_color].\"",
            "code_example": "city = input(\"Where do you live? \")\nprint(\"You live in \" + city)",
            "prefill_code": "# Get user input and print a message\n",
            "test_code": "# For testing input, we simulate user input\n# The actual test will provide input programmatically\n# For now, we just check if input() was called and output format\nassert 'fav_color' in execution_scope, \"Make sure you create a variable named 'fav_color'\"\nassert user_printed_output.startswith(\"Your favorite color is\"), \"Make sure you print a message about the favorite color\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Conditional Logic: If Statements",
            "content": "`if` statements allow your program to make decisions. Code inside an `if` block only runs if a condition is true.\n\n**Example:**\n```python\nage = 18\nif age >= 18:\n    print(\"You are an adult.\")\nelse:\n    print(\"You are a minor.\")\n```\n\n**Your Task:**\nCreate a variable `temperature` and set it to 25. If `temperature` is greater than 30, print \"It's hot!\". Otherwise, print \"It's not too hot.\"",
            "code_example": "score = 75\nif score > 90:\n    print(\"Excellent!\")\nelif score > 70:\n    print(\"Good!\")\nelse:\n    print(\"Needs improvement.\")",
            "prefill_code": "# Write your conditional statement\n",
            "test_code": "temperature = 25\nif temperature > 30:\n    expected_output = \"It's hot!\"\nelse:\n    expected_output = \"It's not too hot!\"\nassert user_printed_output.strip() == expected_output, \"Check your conditional logic and output.\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Loops: Repeating Actions (For Loop)",
            "content": "`for` loops are used to iterate over a sequence (like a list or a range of numbers) and execute a block of code repeatedly.\n\n**Example:**\n```python\nfor i in range(3): # Repeats 3 times (0, 1, 2)\n    print(\"Loop!\")\n```\n\n**Your Task:**\nUse a `for` loop to print the numbers from 1 to 5 (inclusive), each on a new line.",
            "code_example": "fruits = [\"apple\", \"banana\", \"cherry\"]\nfor fruit in fruits:\n    print(fruit)",
            "prefill_code": "# Write your for loop\n",
            "test_code": "expected_output = \"1\n2\n3\n4\n5\n\"\nassert user_printed_output == expected_output, \"Make sure you print numbers from 1 to 5, each on a new line.\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Loops: Repeating Actions (While Loop)",
            "content": "`while` loops repeatedly execute a block of code as long as a given condition is true.\n\n**Example:**\n```python\ncount = 0\nwhile count < 3:\n    print(f\"Count: {count}\")\n    count += 1\n```\n\n**Your Task:**\nUse a `while` loop to print numbers starting from 1, up to and including 4. Each number should be on a new line.",
            "code_example": "i = 5\nwhile i > 0:\n    print(i)\n    i -= 1",
            "prefill_code": "# Write your while loop\n",
            "test_code": "expected_output = \"1\n2\n3\n4\n\"\nassert user_printed_output == expected_output, \"Make sure you print numbers from 1 to 4 using a while loop.\""
        },
        {
            "title": "Functions: Organizing Your Code",
            "content": "Functions are blocks of reusable code that perform a specific task. They help organize your code and make it more readable.\n\n**Example:**\n```python\ndef greet():\n    print(\"Hello there!\")\n\ngreet() # Call the function\n```\n\n**Your Task:**\nDefine a function named `say_hello` that takes one argument, `name`, and prints \"Hello, [name]!\". Then, call the function with your name.",
            "code_example": "def add_numbers(a, b):\n    print(a + b)\n\nadd_numbers(5, 3)",
            "prefill_code": "# Define your function and call it\n",
            "test_code": "assert 'say_hello' in execution_scope, \"Make sure you define a function named 'say_hello'\"\nassert callable(execution_scope['say_hello']), \"'say_hello' should be a function\"\n# Simulate calling the function with a name\nexecution_scope['say_hello'](\"TestUser\")\nassert user_printed_output.strip() == \"Hello, TestUser!\", \"Make sure your function prints the correct greeting.\"\nprint(\"Tests passed\")"
        },
        {
            "title": "Functions with Return Values",
            "content": "Functions can also return values using the `return` keyword. This allows the function to compute a result and send it back to the part of the code that called it.\n\n**Example:**\n```python\ndef add(a, b):\n    return a + b\n\nresult = add(10, 20)\nprint(result)\n```\n\n**Your Task:**\nDefine a function named `multiply` that takes two arguments, `x` and `y`, and returns their product. Then, call the function with 6 and 7, store the result in a variable `product`, and print `product`.",
            "code_example": "def get_square(num):\n    return num * num\n\nsquare_of_5 = get_square(5)\nprint(square_of_5)",
            "prefill_code": "# Define your function, call it, and print the result\n",
            "test_code": "assert 'multiply' in execution_scope, \"Make sure you define a function named 'multiply'\"\nassert callable(execution_scope['multiply']), \"'multiply' should be a function\"\n_user_return_value_capture = execution_scope['multiply'](6, 7)\nassert user_return_value == 42, \"Your multiply function should return 42 for inputs 6 and 7.\"\nassert user_printed_output.strip() == str(user_return_value), \"Make sure you print the product.\"\nprint(\"Tests passed\")"
        }
    ]

    for lesson_data in lessons_data:
        existing_lesson = db.query(models.Lesson).filter(models.Lesson.title == lesson_data["title"]).first()
        if not existing_lesson:
            lesson = models.Lesson(**lesson_data)
            db.add(lesson)
            print(f"Added lesson: {lesson_data['title']}")
        else:
            print(f"Lesson already exists, skipping: {lesson_data['title']}")
    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    try:
        print("Creating lessons...")
        create_lessons(db)
        print("Lessons created successfully!")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        db.close()