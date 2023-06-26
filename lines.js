 const snark = [
    "Remember, the longer you procrastinate, the shorter the deadline gets.",
    "I can see you're having a great time, but the task isn't going to finish itself.",
    "I'm not saying you're easily distracted, but a squirrel just ran past you and you didn't even notice the task.",
    "I hope your distractions are as important as the task you're supposed to be working on.",
    "I'm not saying you're lazy, but even the coffee mug on your desk is giving you a judging look.",
    "I know you love to multitask, but let's focus on the task at hand for now.",
    "I believe in you! You can do this, once you're done with your distraction marathon.",
    "Let's channel that distraction energy into finishing the task, shall we?",
    "I don't want to alarm you, but I think your distractions are plotting against you to make you miss the deadline.",
    "I'm sure your distractions are fun and all, but the feeling of finishing a task is even better.",
    "I didn't know procrastination was an Olympic sport.",
    "I see your attention span is shorter than a goldfish's.",
    "Looks like the task is winning the staring contest with you.",
    "I guess time management isn't your strong suit.",
    "I'm starting to think you're allergic to productivity.",
    "I don't mean to interrupt your break from doing nothing, but...",
    "Your distractions are multiplying like rabbits.",
    "At this rate, you'll finish the task just in time for the apocalypse.",
    "I hope your distractions are paying you well for their entertainment value.",
    "Are you aiming for a personal best in procrastination?",
    "Hey, don't worry about that task you're supposed to be doing. Procrastination is the new productivity, right?",

    "Why focus on getting your work done when there are so many cat videos on the internet to watch?",

    "You know what they say: nothing beats the feeling of cramming an entire week's worth of work into one night!",

    "Why finish that task when you can start another one and never finish that one either?",

    "Don't worry about getting things done, just focus on scrolling through social media. It's practically the same thing.",

    "I know you're supposed to be working, but have you considered spending the next hour organizing your sock drawer instead?",

    "Why work now when you can wait until the last possible moment and then panic your way through it?",

    "Remember, the more you procrastinate, the more satisfying it will be when you finally finish the task 5 minutes before it's due.",

    "Why be productive when you can just daydream about winning the lottery and never having to work again?",

    "Don't worry about finishing that task, it's not like anyone is depending on you or anything.",

]

const normal = [
    "Focus on the outcome and let it motivate you to stay on track.",
"You've got this, keep pushing forward!",
"Don't let distractions derail you from achieving your goal.",
"The finish line is within reach, keep going!",
"Success requires discipline, so stay focused and committed.",
"Small progress is still progress, keep moving forward.",
"Stay strong and persevere, the end result will be worth it.",
"Believe in yourself and your ability to complete the task.",
"Don't give up now, the reward for your hard work is coming.",
"Stay motivated and dedicated to finishing strong",
"You've got this! Keep pushing through.",
  "Remember why you started this task in the first place.",
  "Take a deep breath and refocus your attention.",
  "You're making progress, don't give up now.",
  "One step at a time, you can do it!",
  "Don't let distractions get the best of you.",
  "Keep your eyes on the prize.",
  "You're capable of accomplishing great things.",
  "Believe in yourself and your abilities.",
  "Keep working hard and stay committed.",
  "You're not alone in this, I'm here to support you.",
  "Keep going, even when it gets tough.",
  "Every small step counts towards the bigger picture.",
  "Stay motivated and determined to finish.",
  "Don't let your mind wander, stay focused.",
  "Keep reminding yourself of the end goal.",
  "You've overcome challenges before, you can do it again.",
  "Keep pushing yourself, you're capable of greatness.",
  "You're doing great, keep up the good work!",
  "You have the strength and determination to see this through.",
  "Take a break if you need to, but don't give up on the task.",
  "Keep reminding yourself of the satisfaction you'll feel when you complete the task.",
  "Visualize yourself achieving your goal, it can help keep you motivated.",
  "Keep your end goal in mind and let it drive you forward.",
  "Trust in yourself and your abilities, you can do this!",
  "Don't let distractions derail you, stay on track.",
  "Keep a positive mindset, it can make all the difference.",
  "Remember that every obstacle is an opportunity to grow and learn.",
  "Take things one step at a time and don't overwhelm yourself.",
  "Celebrate each accomplishment, no matter how small.",
  "You're capable of overcoming any obstacle in your way.",
  "Stay focused on your task, the distractions can wait.",
  "Keep reminding yourself of the benefits of completing the task.",
  "Don't be too hard on yourself, progress takes time.",
  "Stay consistent and keep working towards your goal.",
  "Keep a clear vision of what you want to achieve, it can help keep you motivated.",
  "Believe in yourself and your potential, you're capable of great things.",
  "Take pride in the effort you're putting in, it's worth it.",
  "Keep pushing."

]


function randomBlockerMessage(type) {
    let array = normal;
    if (type === 'snarky') {
        array = snark
    }
    const index = Math.floor(Math.random() * array.length);

    return array[index]

}
