export const MOCK_QUESTIONS = [
  {
    id: 1,
    title: "How does useEffect dependency array work exactly?",
    content: "I'm confused about when exactly useEffect re-runs. Does it do a shallow comparison or deep comparison of the dependencies? I have an object in my state that I'm passing to the dependency array, but it seems to be triggering infinite loops.",
    author: "AlexDev",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    createdAt: "2 hours ago",
    likes: 24,
    tags: ["react", "javascript", "hooks"],
    answers: 3
  },
  {
    id: 2,
    title: "Best practices for state management in 2024?",
    content: "Is Redux still the go-to for large applications or should I be looking at Zustand or Jotai? Context API seems fine for small things but I'm worried about performance in a larger dashboard app.",
    author: "FrontendWizard",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Wizard",
    createdAt: "5 hours ago",
    likes: 45,
    tags: ["react", "state-management", "redux"],
    answers: 12
  },
  {
    id: 3,
    title: "Difference between grid and flexbox",
    content: "When should I absolutely use CSS Grid over Flexbox? I feel like I can do almost everything with Flexbox, but I know Grid is more powerful for 2D layouts. Examples would be appreciated!",
    author: "CSSNewbie",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CSS",
    createdAt: "1 day ago",
    likes: 12,
    tags: ["css", "layout", "frontend"],
    answers: 5
  }
];

export const MOCK_ANSWERS = [
  {
    id: 101,
    questionId: 1,
    content: "React uses `Object.is` for comparison in the dependency array. This means it's a shallow comparison for primitives, but for objects and arrays, it checks reference equality. If you create a new object on every render (e.g., inside the component body), the reference changes, causing the effect to run again. You should use `useMemo` for objects or `useCallback` for functions if you need them in the dependency array.",
    author: "SeniorDevSarah",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    createdAt: "1 hour ago",
    likes: 15,
    isAccepted: true
  },
  {
    id: 102,
    questionId: 1,
    content: "Just remove the object from the dependency array and use `JSON.stringify(obj)` instead. It's a quick hack but it works for simple objects.",
    author: "HackerJoe",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joe",
    createdAt: "45 mins ago",
    likes: -2,
    isAccepted: false
  }
];
