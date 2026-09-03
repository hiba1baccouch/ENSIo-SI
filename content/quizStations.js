/**
 * ═══════════════════════════════════════════════════════════════════
 *  EDIT THE QUIZ HERE — this file is the source of truth.
 *  Change a question, answer, hint, or image path, then push to GitHub.
 *  Every player on Vercel will get these values after deploy.
 *
 *  Photos live in:  public/stations/
 *  Example path:    '/stations/1-zoom.jpg'
 * ═══════════════════════════════════════════════════════════════════
 */

export const quizStations = [
  {
    id: 1,
    name: 'ZOOM',
    game_type: 'zoom',
    hint_text: 'The next checkpoint is where hundreds of students can gather to listen to a single voice.',
    points_reward: 100,
    config: {
      image: '/stations/1-zoom.jpg',
      question: 'Where was this photo taken on the ENISo campus?',
      category: 'Observation & Recognition',
      options: [
        { id: 'a', text: 'Main Amphitheater', correct: true },
        { id: 'b', text: 'Library Entrance', correct: false },
        { id: 'c', text: 'Cafeteria Wing', correct: false },
        { id: 'd', text: 'Robotics Laboratory', correct: false },
      ],
      max_attempts: 3,
    },
  },
  {
    id: 2,
    name: 'MEMORY GLITCH',
    game_type: 'memory_glitch',
    hint_text: 'You have just seen your next destination. Now, find it inside the campus.',
    points_reward: 100,
    config: {
      image: '/stations/2-memory.jpg',
      display_time: 12,
      questions: [
        { id: 'q1', text: 'What color was the wall in the photo?', options: ['Red', 'Blue', 'Green', 'Yellow'], correct: 0 },
        { id: 'q2', text: 'How many windows were visible?', options: ['2', '0', '4', '5'], correct: 2 },
        { id: 'q3', text: 'What was written on the sign?', options: ['ENISo', 'Exit', 'Welcome', 'Library'], correct: 0 },
        { id: 'q4', text: 'How many chairs were visible?', options: ['4', '5', '2', '1'], correct: 3 },
        { id: 'q5', text: 'What object was placed on the table?', options: ['Book', 'Sticker', 'Plant', 'Cup'], correct: 2 },
      ],
      required_correct: 4,
      max_retries: 2,
    },
  },
  {
    id: 3,
    name: 'FIND THE DIFFERENCE',
    game_type: 'find_difference',
    hint_text: 'Head to where the ground meets the open sky and students gather between classes.',
    points_reward: 100,
    config: {
      image_original: '/stations/3-original.png',
      image_modified: '/stations/3-modified.png',
      // Number of actual differences between the two images
      answer_count: 4,
      max_attempts: 3,
    },
  },
  {
    id: 4,
    name: 'DIGITAL ESCAPE',
    game_type: 'digital_escape',
    hint_text: 'Your next checkpoint is located where important campus decisions are made.',
    points_reward: 100,
    config: {
      puzzles: [
        {
          id: 'p1',
          type: 'logical_sequence',
          title: 'Logical Sequence',
          prompt: 'What is the next number in the sequence: 2, 6, 12, 20, 30, ?',
          answer: '42',
          hint: 'Observe the difference between consecutive numbers (+4, +6, +8, +10...).',
        },
        {
          id: 'p2',
          type: 'visual_pattern',
          title: 'Visual Pattern',
          prompt: 'Complete the sequence: ▲●▲▲●●▲▲▲●●●?',
          answer: '▲▲▲▲',
          options: ['▲▲▲▲', '●●●●', '▲●▲●', '●▲●▲'],
          hint: 'Count the number of repetitions in increasing groups.',
        },
        {
          id: 'p3',
          type: 'scrambled_word',
          title: 'Unscramble the Letters',
          prompt: 'Unscramble the letters: NOIITNRGAET KEWE',
          answer: 'INTEGRATION WEEK',
          hint: 'It is the official name of this event.',
        },
      ],
    },
  },
  {
    id: 5,
    name: 'THE MAP IS LYING',
    game_type: 'map_lying',
    hint_text: 'The map showed you what was false. Now, go discover what is true, it could be near you.',
    points_reward: 100,
    config: {
      map_image: '/stations/5-map.png',
      question: 'How many wrong structures are shown on this campus map?',
      answer_count: 1,
      max_attempts: 5,
    },
  },
  {
    id: 6,
    name: 'HIDDEN MESSAGE',
    game_type: 'hidden_message',
    hint_text: 'The secret codeword guides you to the Research and Innovation Laboratories.',
    points_reward: 100,
    config: {
      image: '/stations/6-hidden.jpg',
      question: 'Enter the hidden secret codeword found at this campus station:',
      final_word: 'Engineering',
      max_attempts: 3,
    },
  },
  {
    id: 7,
    name: 'ENISo EMOJI CODE',
    game_type: 'emoji_code',
    hint_text: 'Congratulations! Proceed to the central gathering point for the grand closing ceremony.',
    points_reward: 100,
    config: {
      rounds: [
        {
          id: 'r1',
          emojis: '🪜 + 🚪 + 2️⃣',
          difficulty: 'easy',
          answer: '2nd Floor Staircase',
          options: ['2nd Floor Staircase', 'Main Elevator', 'Emergency Exit', 'Amphitheater Entrance'],
          type: 'multiple_choice',
        },
        {
          id: 'r2',
          emojis: '🏫 + 📐 + ✏️ + 🎓',
          difficulty: 'easy',
          answer: 'Engineering School',
          options: ['Engineering School', 'Art Museum', 'Hospital', 'Stadium'],
          type: 'multiple_choice',
        },
        {
          id: 'r3',
          emojis: '☕ + 📚 + 🤫 + 🪑',
          difficulty: 'medium',
          answer: 'Library',
          options: ['Cafeteria', 'Library', 'Lab Room', 'Administration'],
          type: 'multiple_choice',
        },
        {
          id: 'r4',
          emojis: '💻 + 🧑‍💻 + 🔌 + 🖥️',
          difficulty: 'medium',
          answer: 'Computing Center',
          options: ['Computing Center', 'Cybercafe', 'Amphitheater', 'Clubs Office'],
          type: 'multiple_choice',
        },
      ],
      required_correct: 3,
    },
  },
]
