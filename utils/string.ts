const DEVICE_EMOJIS = [
  // 256 emojis for unsigned byte range 0 - 255
  ..."🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐽🐸🐵🙈🙉🙊🐒🐔🐧🐦🐤🐣🐥🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🦟🦗🕷🕸🦂🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐡🐠🐟🐬🐳🐋🦈🐊🐅🐆🦓🦍🦧🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐩🦮🐈🐓🦃🦚🦜🦢🦩🕊🐇🦝🦨🦡🦦🦥🐁🐀🐿🦔🐾🐉🐲🌵🎄🌲🌳🌴🌱🌿🍀🎍🎋🍃👣🍂🍁🍄🐚🌾💐🌷🌹🥀🌺🌸🌼🌻🌞🌝🍏🍎🍐🍊🍋🍌🍉🍇🍓🍈🥭🍍🥥🥝🍅🥑🥦🥬🥒🌶🌽🥕🧄🧅🥔🍠🥐🥯🍞🥖🥨🧀🥚🍳🧈🥞🧇🥓🥩🍗🍖🦴🌭🍔🍟🍕🥪🥙🧆🌮🌯🥗🥘🥫🍝🍜🍲🍛🍣🍱🥟🦪🍤🍙🍚🍘🍥🥠🥮🍢🍡🍧🍨🍦🥧🧁🍰🎂🍮🍭🍬🍫🍿🍩🍪🌰🥜👀👂👃👄👅👆👇👈👉👊👋👌👍👎👏👐👑👒👓🎯🎰🎱🎲🎳👾👯👺👻👽🏂🏃🏄",
];

const WORD_LIST = [
  "apple", "brave", "cloud", "dance", "eagle", "flame", "globe", "heart",
  "ivory", "jewel", "karma", "lunar", "magic", "noble", "ocean", "pearl",
  "quest", "rider", "solar", "tiger", "ultra", "vivid", "whale", "xenon",
  "youth", "zebra", "amber", "blaze", "coral", "dream", "ember", "frost",
  "grace", "haven", "ionic", "jolly", "knack", "light", "maple", "nexus",
  "oasis", "prime", "quake", "reign", "sonic", "torch", "unity", "vault",
  "windy", "pixel", "yacht", "zesty", "alpha", "berry", "crane", "delta",
  "epoch", "fable", "grain", "hover", "index", "joker", "kite", "lotus",
];

// Generate a random name for the session, using a single random emoji and 2 random words
export function randomName() {
  const randomEmoji =
    DEVICE_EMOJIS[Math.floor(Math.random() * DEVICE_EMOJIS.length)];
  const randomWord1 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  const randomWord2 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

  return `${randomEmoji} ${randomWord1} ${randomWord2}`;
}
