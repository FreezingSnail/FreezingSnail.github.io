export default [
  {
    slug: "maze-runner",
    title: "Maze Runner",
    year: "2019",
    genre: "Maze crawler",
    version: "v1.0.0",
    summary: "Ride the maze and recover the five missing pieces of a unicycle.",
    description:
      "A tile-by-tile maze crawler about hunting down a disassembled unicycle. Stairs change floors, one-way gates shove you along, and switch buttons toggle closed gates so the route keeps rearranging itself.",
    cover: "/img/games/maze-runner-shot.png",
    coverAlt: "Maze Runner title screen with a maze and unicycle parts",
    file: {
      name: "maze-rider.hex",
      url: "https://github.com/FreezingSnail/Maze-Rider/releases/download/v1.0.0/MazeRider.hex",
    },
    release: "https://github.com/FreezingSnail/Maze-Rider/releases/tag/v1.0.0",
    source: "https://github.com/FreezingSnail/Maze-Rider",
    features: [
      "Five unicycle parts hidden across the maze",
      "Stairs, one-way gates, and switch-controlled gates",
      "Level select and an in-game pause screen",
    ],
    controls: [
      ["D-pad", "Move in that direction"],
      ["A", "Select / pause"],
      ["B", "Leave pause"],
      ["A + B", "Return to level select"],
    ],
  },
  {
    slug: "all-your-ardu",
    title: "All Your Ardu",
    year: "2024",
    genre: "Shmup",
    version: "v1.4.1",
    summary: "A vertical shooter with ten stages, two bosses, and Zero Wing energy.",
    description:
      "A meme-jam vertical shmup with sub-ship formations, a power-up stash, and tracker music. Ten stages build to two bosses, with four power-ups that restore health and change how you fight.",
    cover: "/img/games/all-your-ardu-shot.png",
    coverAlt: "All Your Ardu title screen with a pixel-art space ship",
    file: {
      name: "all-your-ardu.hex",
      url: "https://github.com/FreezingSnail/AllYourArdu/releases/download/v1.4.1/AllYourArdu.hex",
    },
    release: "https://github.com/FreezingSnail/AllYourArdu/releases/tag/v1.4.1",
    source: "https://github.com/FreezingSnail/AllYourArdu",
    features: [
      "10 levels with bosses at 5 and 10",
      "4 power-ups and a switchable sub-ship formation",
      "Tracker music and a secret menu cheat",
    ],
    controls: [
      ["D-pad", "Move"],
      ["A", "Shoot"],
      ["B", "Change sub-ship formation"],
      ["\u2190 + \u2192", "Activate left-most power-up"],
    ],
  },
  {
    slug: "jelliboi",
    title: "JelliBoi",
    year: "2018",
    genre: "Lifecycle sim",
    version: "1.1",
    summary: "Live a jellyfish life: larva, polyp, strobilate, adult medusa.",
    description:
      "A small game about the strange life cycle of a jellyfish. Drift to the seafloor as a larva, anchor and catch food as a polyp, strobilate, then swim as a medusa while dodging fish and hunting pellets.",
    cover: "/img/games/jelliboi-shot.png",
    coverAlt: "Animated JelliBoi title screen with drifting jellyfish",
    file: {
      name: "jelliboi.hex",
      url: "https://github.com/FreezingSnail/JelliBoi/releases/download/1.1/JelliBoi.hex",
    },
    release: "https://github.com/FreezingSnail/JelliBoi/releases/tag/1.1",
    source: "https://github.com/FreezingSnail/JelliBoi",
    features: [
      "Four lifecycle stages with different movement",
      "Food, small fish, and predators that change by stage",
      "High-score saving through EEPROM",
    ],
    controls: [
      ["D-pad", "Move / steer"],
      ["A", "Advance help screens"],
      ["B", "Swim as a medusa"],
    ],
  },
];
