const Problem = require("../models/Problem");

exports.getProblems = async (req, res) => {
  try {
    const problems = await Problem.find().select("title difficulty constraints category examples");
    res.json(problems);
  } catch (error) {
    console.error("Get Problems Error:", error);
    res.status(500).json({ message: "Server error occurred while fetching problems." });
  }
};

exports.getProblemById = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ message: "Problem not found." });
    }
    res.json(problem);
  } catch (error) {
    console.error("Get Problem ID Error:", error);
    res.status(500).json({ message: "Server error occurred while fetching problem." });
  }
};

// Seed utility logic
exports.seedProblems = async () => {
  try {
    const count = await Problem.countDocuments();
    if (count > 0) {
      console.log("Problems already seeded, skipping...");
      return;
    }

    const defaultProblems = [
      {
        title: "Two Sum",
        description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
        difficulty: "Easy",
        constraints: [
          "2 <= nums.length <= 10^4",
          "-10^9 <= nums[i] <= 10^9",
          "-10^9 <= target <= 10^9",
          "Only one valid answer exists."
        ],
        examples: [
          {
            input: "nums = [2,7,11,15], target = 9",
            output: "[0,1]",
            explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
          },
          {
            input: "nums = [3,2,4], target = 6",
            output: "[1,2]",
            explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
          }
        ],
        testCases: [
          { input: "[2,7,11,15]\n9", output: "[0,1]", isPublic: true },
          { input: "[3,2,4]\n6", output: "[1,2]", isPublic: true },
          { input: "[3,3]\n6", output: "[0,1]", isPublic: false },
          { input: "[1,5,9,12,15]\n21", output: "[2,3]", isPublic: false },
          { input: "[-3,4,3,90]\n0", output: "[0,2]", isPublic: false }
        ],
        codeTemplates: {
          javascript: `function twoSum(nums, target) {\n    // Write your code here\n    \n}`,
          python: `def twoSum(nums, target):\n    # Write your code here\n    pass`,
          cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};`,
          java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`
        }
      },
      {
        title: "Valid Parentheses",
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
        difficulty: "Easy",
        constraints: [
          "1 <= s.length <= 10^4",
          "s consists of parentheses only: '()[]{}'"
        ],
        examples: [
          {
            input: 's = "()"',
            output: "true",
            explanation: "Standard matching pair."
          },
          {
            input: 's = "()[]{}"',
            output: "true",
            explanation: "All matching sets open and close in order."
          },
          {
            input: 's = "(]"',
            output: "false",
            explanation: "Closing bracket does not match open bracket."
          }
        ],
        testCases: [
          { input: '"()"', output: "true", isPublic: true },
          { input: '"()[]{}"', output: "true", isPublic: true },
          { input: '"(]"', output: "false", isPublic: true },
          { input: '"([)]"', output: "false", isPublic: false },
          { input: '"{[]}"', output: "true", isPublic: false },
          { input: '"["', output: "false", isPublic: false }
        ],
        codeTemplates: {
          javascript: `function isValid(s) {\n    // Write your code here\n    \n}`,
          python: `def isValid(s):\n    # Write your code here\n    pass`,
          cpp: `class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};`,
          java: `class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}`
        }
      },
      {
        title: "Reverse String",
        description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with \`O(1)\` extra memory.`,
        difficulty: "Easy",
        constraints: [
          "1 <= s.length <= 10^5",
          "s[i] is a printable ascii character."
        ],
        examples: [
          {
            input: 's = ["h","e","l","l","o"]',
            output: '["o","l","l","e","h"]'
          },
          {
            input: 's = ["H","a","n","n","a","h"]',
            output: '["h","a","n","n","a","H"]'
          }
        ],
        testCases: [
          { input: '["h","e","l","l","o"]', output: '["o","l","l","e","h"]', isPublic: true },
          { input: '["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]', isPublic: true },
          { input: '["a"]', output: '["a"]', isPublic: false },
          { input: '["a","b"]', output: '["b","a"]', isPublic: false }
        ],
        codeTemplates: {
          javascript: `function reverseString(s) {\n    // Write your code here\n    \n}`,
          python: `def reverseString(s):\n    # Write your code here\n    pass`,
          cpp: `class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        \n    }\n};`,
          java: `class Solution {\n    public void reverseString(char[] s) {\n        \n    }\n}`
        }
      },
      {
        title: "FizzBuzz",
        description: `Given an integer \`n\`, return *a string array \`answer\` (1-indexed) where*:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by \`3\` and \`5\`.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by \`3\`.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by \`5\`.
- \`answer[i] == i\` (as a string) if none of the above conditions are true.`,
        difficulty: "Easy",
        constraints: [
          "1 <= n <= 10^4"
        ],
        examples: [
          {
            input: "n = 3",
            output: '["1","2","Fizz"]'
          },
          {
            input: "n = 5",
            output: '["1","2","Fizz","4","Buzz"]'
          }
        ],
        testCases: [
          { input: "3", output: '["1","2","Fizz"]', isPublic: true },
          { input: "5", output: '["1","2","Fizz","4","Buzz"]', isPublic: true },
          { input: "15", output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isPublic: false },
          { input: "1", output: '["1"]', isPublic: false }
        ],
        codeTemplates: {
          javascript: `function fizzBuzz(n) {\n    // Write your code here\n    \n}`,
          python: `def fizzBuzz(n):\n    # Write your code here\n    pass`,
          cpp: `class Solution {\npublic:\n    vector<string> fizzBuzz(int n) {\n        \n    }\n};`,
          java: `class Solution {\n    public List<String> fizzBuzz(int n) {\n        \n    }\n}`
        }
      }
    ];

    await Problem.insertMany(defaultProblems);
    console.log("Problems seeded successfully!");
  } catch (error) {
    console.error("Error seeding problems:", error);
  }
};
