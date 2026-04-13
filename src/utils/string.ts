const DEVICE_EMOJIS = [
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

/** Generates a random session name: emoji + two random words */
export function randomName(): string {
  const emoji = DEVICE_EMOJIS[Math.floor(Math.random() * DEVICE_EMOJIS.length)];
  const w1 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  const w2 = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  return `${emoji} ${w1} ${w2}`;
}
