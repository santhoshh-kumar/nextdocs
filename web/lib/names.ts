const ADJECTIVES = [
  'Anonymous',
  'Brave',
  'Calm',
  'Eager',
  'Fancy',
  'Giant',
  'Happy',
  'Jolly',
  'Kind',
  'Lively',
  'Misty',
  'Proud',
  'Quick',
  'Rapid',
  'Shiny',
  'Tidy',
  'Vivid',
  'Wild',
  'Zesty',
];

const ANIMALS = [
  'Badger',
  'Bear',
  'Bird',
  'Cat',
  'Dog',
  'Eagle',
  'Fox',
  'Goat',
  'Hawk',
  'Lion',
  'Llama',
  'Mouse',
  'Owl',
  'Panda',
  'Rabbit',
  'Shark',
  'Sheep',
  'Tiger',
  'Wolf',
  'Zebra',
];

export function getRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective} ${animal}`;
}
