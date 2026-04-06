export const streamOffers = async (
  onChunk: (offer: any) => void
) => {
  const offers = [
    {
      id: "1",
      title: "Play Space Runner",
      reward: 0.05,
    },
    {
      id: "2",
      title: "Win 3 Matches",
      reward: 0.08,
    },
    {
      id: "3",
      title: "Reach Level 10",
      reward: 0.1,
    },
  ];

  for (let i = 0; i < offers.length; i++) {
    await new Promise((res) => setTimeout(res, 800)); // simulate stream delay

    onChunk(offers[i]); // push one offer at a time
  }
};