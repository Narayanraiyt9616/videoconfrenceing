/**
 * Playful, friendly Hindi-English roasts.
 * Safe, funny, non-hateful banter tailored for friend groups.
 */

export const ROASTS = {
  mild: [
    "Bhai tera reply speed dekh ke lagta hai message kabootar se bhej raha hai. 😂🕊️",
    "Tumhara Wi-Fi connection aur tumhara career dono ek hi speed pe chal rahe hain. 📶",
    "Tere jokes sunke haanste toh nahi, par taras zaroor aa jata hai. 🥲",
    "Bhai thoda dhyan se bol, kahin tere do brain cells aapas mein na takra jayein. 🧠",
    "Itna confidence late kahan se ho bhai? Meesho pe discount milta hai kya? 🛍️",
    "Tu online toh rehta hai 24 ghante, par kisi ko pata nahi tu karta kya hai. 📱",
    "Teri advice sun ke log wahi karte hain jo tu mana karta hai. 🧭"
  ],
  savage: [
    "Bhai tera fashion sense dekh ke lagta hai kapde aankh band karke lottery se nikaale the. 🤡",
    "Tumhare dimag ka software update aana band ho gaya hai kya? 🤖",
    "Tere excuses sun ke NASA wale bhi gravity ka formula bhool jayein. 🚀",
    "Tu wahi banda hai na jo restaurant mein menu dekh ke sabse pehle paani mangwata hai? 💧",
    "Tumhari shakal dekh ke lagta hai Bhagwan ne prototype banaya tha aur test karna bhool gaye. 🧪",
    "Bhai tu chup hi raha kar, bolte hi tera IQ points share market ki tarah gir jata hai. 📉",
    "Tere photos mein filters itne hote hain ki Aadhaar card wale bhi pehchanne se mana kar dein. 📸"
  ],
  maximum: [
    "Bhai agar bewakoofi Olympic sport hoti, toh tere aage saare gold medals sharma jaate. 🥇",
    "Tera existence proof hai ki nature bhi kabhi kabhi timepass karti hai. 🪐",
    "Bhai tu single isliye nahi hai ki standard high hain, tu single isliye hai kyunki standards exist karte hain! 💀",
    "Tere doston ka sabse bada achievement yeh hai ki unhone abhi tak tujhe kidnap karke jungle mein nahi chhoda. 🌲",
    "Bhai tera attitude iPhone 16 Pro Max jaisa hai, par harkatein Nokia 1100 wali bhi nahi hain. 📵",
    "Agar tu kisi din chup baith gaya, toh duniya mein global peace declare ho jayegi. 🕊️"
  ]
};

export function getRandomRoast(targetName, level = 'mild') {
  const list = ROASTS[level] || ROASTS.mild;
  const template = list[Math.floor(Math.random() * list.length)];
  return `${targetName}: ${template}`;
}
