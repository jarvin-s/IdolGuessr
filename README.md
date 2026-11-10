![IdolGuessr logo](public/images/idolguessr-logo.webp)

**IdolGuessr** is a web game where K-pop fans test their knowledge. The main game asks you to name an idol from a pixelated photo. Each round starts heavily pixelated, and the picture clears as you guess.

There are five ways to play:

- **Daily** is one shared idol each day. You get six guesses, and you can look back at past days.
- **Infinite** keeps going. Build a streak, filter by group or generation, and pick a difficulty.
- **Hangul** shows an idol's name in Korean. Type the English stage name.
- **Challenge** is a set of idols you can send to someone else.
- **Unshuffled** is a scrambled song. Hear each piece, drag it into place, and play the daily song or keep going on infinite.

Sign in to save your progress, set a nickname, and show up on the leaderboard.

## Installation

Requires [Node.js](https://nodejs.org/) and npm.

```bash
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-production-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
```

Local development uses the test project. A production build uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # lint
```

## Contributing

1. Fork the repository and create a branch from `dev`.
2. Install dependencies and run the app with the commands above.
3. Keep changes focused, and run `npm run lint` before you open a pull request.
4. Describe what changed and how to test it in the pull request.

## License

IdolGuessr is released under the [MIT License](LICENSE).

Copyright (c) 2026 Jarvin
