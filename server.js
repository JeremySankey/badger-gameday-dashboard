const express = require("express");
const cors = require("cors");

// ✅ Import node-fetch correctly for CommonJS
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;
const API_KEY = "v0BF6akoWFRaG4MRyM5nf3yveHyVJXMo0F0IZU83MpV38GYMKPv2bQhdoUgU2ysT";

app.use(cors());

// ✅ FOOTBALL API
app.get("/api/schedule", async (req, res) => {
  const team = "Wisconsin";
  const year = req.query.year || "2025";
  let sport = req.query.sport?.toLowerCase() || "football";

  if (!["football", "basketball"].includes(sport)) {
    sport = "football";
  }

  try {
    const url = `https://api.collegefootballdata.com/games?year=${year}&team=${team}&sport=${sport}`;
    console.log(`🔍 Fetching ${sport.toUpperCase()} data for ${year}`);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching schedule:", error.message);
    res.status(500).send("Something went wrong");
  }
});

// ✅ BASKETBALL (ESPN Unofficial API)
app.get("/api/basketball", async (req, res) => {
  const espnTeamId = 275;
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams/${espnTeamId}/schedule`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data.events);
  } catch (error) {
    console.error("Error fetching basketball schedule:", error.message);
    res.status(500).send("Something went wrong with basketball");
  }
});

// ✅ NEWS FEED ROUTE
const RSSParser = require('rss-parser');
const rssParser = new RSSParser();

const newsFeeds = [
  "https://badgerextra.com/search/?f=rss&t=article&c=sports*&s=start_time&sd=desc"
];

const cheerio = require("cheerio");

app.get("/api/news", async (req, res) => {
  const allArticles = [];

  // ✅ 1. RSS Parsing
  for (const feedUrl of newsFeeds) {
    try {
      const feed = await rssParser.parseURL(feedUrl);
      feed.items.slice(0, 5).forEach(item => {
        allArticles.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate || "N/A",
          source: "BadgerExtra"
        });
      });
    } catch (error) {
      console.warn(`⚠️ Skipped RSS feed: ${feedUrl} — ${error.message}`);
    }
  }

  // ✅ 2. BadgerExtra HTML Scraper
  try {
    const url = "https://www.badgerextra.com/sports/";
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    $(".teaser").slice(0, 5).each((_, el) => {
      const title = $(el).find(".teaser__headline").text().trim();
      const link = "https://www.badgerextra.com" + $(el).find("a").attr("href");
      const pubDate = $(el).find("time").attr("datetime") || "N/A";

      if (title && link) {
        allArticles.push({ title, link, pubDate, source: "BadgerExtra" });
      }
    });
  } catch (error) {
    console.warn("⚠️ Could not scrape BadgerExtra:", error.message);
  }

  // ✅ 3. Bucky’s 5th Quarter Scraper
  try {
  const response = await fetch("https://www.buckys5thquarter.com");
  const html = await response.text();
  const $ = cheerio.load(html);

  const articlePromises = [];

  $("h2.c-entry-box--compact__title").slice(0, 5).each((_, el) => {
    const title = $(el).text().trim();
    const link = $(el).find("a").attr("href");

    if (title && link) {
      articlePromises.push(
        (async () => {
          try {
            const articleRes = await fetch(link);
            const articleHtml = await articleRes.text();
            const $$ = cheerio.load(articleHtml);
            const timeTag = $$("time").attr("datetime");
            const pubDate = timeTag || new Date().toISOString();

            return {
              title,
              link,
              pubDate,
              source: "Bucky's 5th Quarter",
            };
          } catch (innerErr) {
            console.warn(`⚠️ Could not fetch full article: ${link}`);
            return {
              title,
              link,
              pubDate: new Date().toISOString(),
              source: "Bucky's 5th Quarter",
            };
          }
        })()
      );
    }
  });

  const b5qArticles = await Promise.all(articlePromises);
  allArticles.push(...b5qArticles);
} catch (error) {
  console.warn("⚠️ Could not scrape Bucky’s 5th Quarter:", error.message);
}

  // ✅ 4. 247Sports Wisconsin Scraper
  try {
    const response = await fetch("https://247sports.com/college/wisconsin/");
    const html = await response.text();
    const $ = cheerio.load(html);

    $("li.article-list-item").slice(0, 5).each((_, el) => {
      const title = $(el).find("a").text().trim();
      const link = $(el).find("a").attr("href");
      if (title && link) {
        allArticles.push({
          title,
          link: link.startsWith("http") ? link : `https://247sports.com${link}`,
          pubDate: "N/A",
          source: "247Sports Wisconsin"
        });
      }
    });
   } catch (error) {
    console.warn("⚠️ Could not scrape 247Sports:", error.message);
  }

  // ✅ END of your /api/news scraping logic should be here
allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
res.json(allArticles); 
});

// ✅ ✅ ✅ Only now start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});